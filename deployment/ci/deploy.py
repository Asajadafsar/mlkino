#!/usr/bin/python3 -I
"""Root-installed, narrowly privileged MLKino production release controller."""
import fcntl
import hashlib
import json
import os
import re
import shutil
import signal
import subprocess
import sys
import tarfile
import tempfile
import time
from pathlib import Path, PurePosixPath

BASE = Path("/opt/mlkino")
RELEASES = BASE / "releases"
CURRENT = BASE / "current"
PREVIOUS = BASE / "previous"
BACKUPS = Path("/var/backups/mlkino/.ci")
MIGRATE = "/usr/local/libexec/mlkino-migrate"
SERVICES = ("mlkino-backend.service", "mlkino-landing.service")
DOMAIN = "https://mlkino.com"
MAX_ARCHIVE = 256 * 1024 * 1024
MAX_EXTRACTED = 1024 * 1024 * 1024
SHA = re.compile(r"[0-9a-f]{40}")


def run(*args, **kwargs):
    return subprocess.run(args, check=True, **kwargs)


def trusted_directory(path):
    info = path.stat()
    if not path.is_dir() or path.is_symlink() or info.st_uid or info.st_mode & 0o022:
        raise RuntimeError(f"Expected a root-owned, non-writable directory: {path}")


def release_target(link):
    if not link.is_symlink():
        raise RuntimeError(f"Expected a release symlink: {link}")
    target = link.resolve(strict=True)
    if target.parent != RELEASES:
        raise RuntimeError(f"Release outside {RELEASES}: {target}")
    trusted_directory(target)
    return target


def swap(link, target):
    with tempfile.TemporaryDirectory(dir=BASE) as folder:
        temporary = Path(folder) / "link"
        temporary.symlink_to(target)
        temporary.replace(link)


def allowed(name):
    return (
        name in {"RELEASE", "manage.py", "requirements.txt", "requirements-extra.txt"}
        or name.startswith(("accounts/", "panel/", "mlkino/", "frontend/build/",
                            "landing/.next/standalone/"))
    ) and name != "mlkino/production_settings.py"


def unpack(source, destination):
    total = count = 0
    seen = set()
    with tarfile.open(fileobj=source, mode="r|gz") as archive:
        for member in archive:
            count += 1
            total += member.size
            name = PurePosixPath(member.name)
            if (
                count > 70_000 or total > MAX_EXTRACTED or member.size < 0
                or not member.isfile() or not allowed(member.name)
                or name.is_absolute() or ".." in name.parts or name in seen
                or any(part.startswith(".env") or part.endswith((".pem", ".key"))
                       for part in name.parts)
            ):
                raise RuntimeError(f"Refusing invalid archive entry: {member.name!r}")
            seen.add(name)
            path = destination / name
            path.parent.mkdir(parents=True, exist_ok=True)
            with archive.extractfile(member) as original, path.open("xb") as output:
                shutil.copyfileobj(original, output)


def load_release(destination):
    with tempfile.TemporaryFile(dir=BASE) as source:
        remaining = MAX_ARCHIVE
        while chunk := sys.stdin.buffer.read(65536):
            remaining -= len(chunk)
            if remaining < 0:
                raise RuntimeError("Release archive exceeds size limit")
            source.write(chunk)
        source.seek(0)
        unpack(source, destination)

    commit = (destination / "RELEASE").read_text().strip()
    if not SHA.fullmatch(commit):
        raise RuntimeError("Invalid release commit")
    for name in ("manage.py", "frontend/build/index.html",
                 "frontend/build/asset-manifest.json",
                 "landing/.next/standalone/server.js", "landing/.next/standalone/.next/BUILD_ID"):
        if not (destination / name).is_file():
            raise RuntimeError(f"Release is missing {name}")
    (destination / "frontend/build/mlkino-release.txt").write_text(commit + "\n")
    return commit


def migrate(release, *args):
    run(
        "/usr/bin/systemd-run", "--quiet", "--wait", "--pipe", "--collect",
        "--uid=mlkino", "--gid=www-data", f"--working-directory={release}",
        "--property=EnvironmentFile=/etc/mlkino/mlkino.env",
        "--property=ProtectSystem=strict", "--property=ProtectHome=true",
        "--property=PrivateTmp=true", "--property=NoNewPrivileges=true",
        "--property=RuntimeMaxSec=420",
        "--setenv=DJANGO_SETTINGS_MODULE=mlkino.production_settings",
        "--setenv=PYTHONDONTWRITEBYTECODE=1",
        "--setenv=PGOPTIONS=-c lock_timeout=5000 -c statement_timeout=60000",
        "/opt/mlkino/venv/bin/python", *args,
    )


def backup(commit):
    with tempfile.NamedTemporaryFile(dir=BACKUPS, prefix=".pending-", delete=False) as output:
        tmp = Path(output.name)
        try:
            run("/usr/sbin/runuser", "-u", "postgres", "--", "/usr/bin/pg_dump",
                "--format=custom", "--no-password", "--host=/var/run/postgresql",
                "--port=5432", "--dbname=mlkino_db",
                stdout=output, timeout=300)
            output.flush()
            os.fsync(output.fileno())
            run("/usr/bin/pg_restore", "--list", str(tmp), stdout=subprocess.DEVNULL, timeout=30)
            run("/usr/bin/pg_restore", "--file=/dev/null", str(tmp), timeout=300)
            final = BACKUPS / f"pre-{commit}-{time.time_ns()}.dump"
            tmp.rename(final)
            print(f"Verified PostgreSQL backup: {final}", flush=True)
        finally:
            tmp.unlink(missing_ok=True)


def response(path, origin=False):
    options = ["--resolve", "mlkino.com:443:127.0.0.1"] if origin else []
    return run(
        "/usr/bin/curl", "--fail", "--silent", "--show-error", "--noproxy", "*",
        "--proto", "=https", "--max-time", "10", "--max-filesize", "15000000",
        "-H", "Cache-Control: no-cache", *options, DOMAIN + path, stdout=subprocess.PIPE,
    ).stdout


def functional_health(release, origin):
    catalog = json.loads(response("/api/panel/public/catalog/?page_size=1", origin))
    if not isinstance(catalog["data"]["results"], list):
        raise ValueError("Catalog did not return a result list")
    manifest = json.loads((release / "frontend/build/asset-manifest.json").read_text())
    asset = next(item for item in manifest["entrypoints"] if item.endswith(".js"))
    path = PurePosixPath(asset.lstrip("/"))
    if not asset.startswith("static/js/") or ".." in path.parts:
        raise ValueError("Unexpected panel entrypoint")
    marker = release / "frontend/build/mlkino-release.txt"
    if marker.is_file() and response(f"/panel/mlkino-release.txt?commit={release.name}", origin) != marker.read_bytes():
        raise ValueError("Production did not serve the selected release marker")
    panel = response("/panel/", origin)
    expected = (release / "frontend/build" / path).read_bytes()
    if asset.encode() not in panel or hashlib.sha256(response(f"/panel/{asset}", origin)).digest() != hashlib.sha256(expected).digest():
        raise ValueError("Panel HTML or JavaScript does not match the selected release")
    landing = response("/", origin)
    match = re.search(rb'(/_next/static/[^"\s<>]+\.js)(?=["?])', landing)
    if not match:
        raise ValueError("Landing HTML is missing a Next.js entrypoint")
    asset_url = match.group(1).decode("ascii")
    asset_path = PurePosixPath(asset_url.removeprefix("/_next/"))
    if ".." in asset_path.parts:
        raise ValueError("Unexpected landing entrypoint")
    expected = (release / "landing/.next/standalone/.next" / asset_path).read_bytes()
    if hashlib.sha256(response(asset_url, origin)).digest() != hashlib.sha256(expected).digest():
        raise ValueError("Landing JavaScript does not match the selected release")


def health(release, public=True):
    error = None
    for _ in range(6):
        try:
            for service in SERVICES:
                pid = int(run("/usr/bin/systemctl", "show", "--property=MainPID", "--value",
                              service, capture_output=True, text=True).stdout)
                expected = release if service == SERVICES[0] else release / "landing/.next/standalone"
                if not pid or Path(f"/proc/{pid}/cwd").resolve(strict=True) != expected:
                    raise ValueError(f"{service} is not running the selected release")
            functional_health(release, origin=True)
            if public:
                functional_health(release, origin=False)
            return
        except (OSError, subprocess.SubprocessError, ValueError, KeyError, StopIteration) as failure:
            error = failure
            time.sleep(3)
    raise RuntimeError(f"Production health checks did not pass: {error}")


def restart():
    run("/usr/bin/systemctl", "restart", *SERVICES, timeout=80)


def activate(candidate, previous):
    swap(PREVIOUS, previous)
    try:
        swap(CURRENT, candidate)
        restart()
        health(candidate)
    except BaseException:
        print("Activation failed; restoring previous application files.", file=sys.stderr, flush=True)
        swap(CURRENT, previous)
        restart()
        health(previous, public=False)
        raise


def deploy(previous):
    with tempfile.TemporaryDirectory(dir=RELEASES, prefix=".staged-") as staging:
        stage = Path(staging)
        stage.chmod(0o755)
        commit = load_release(stage)
        if previous.name == commit:
            health(previous)
            print(f"Production already healthy at {commit}.", flush=True)
            return
        final = RELEASES / commit
        if final.exists() or final.is_symlink():
            raise RuntimeError("This immutable release already exists. Review the prior attempt before reactivation.")
        config = "mlkino/production_settings.py"
        if not (previous / config).is_file():
            raise RuntimeError("Existing production settings file missing")
        with (stage / config).open("xb") as output:
            output.write((previous / config).read_bytes())
        shutil.chown(stage / config, group="www-data")
        (stage / config).chmod(0o640)
        for manifest in ("requirements.txt", "requirements-extra.txt"):
            if (stage / manifest).read_bytes() != (previous / manifest).read_bytes():
                raise RuntimeError("Dependency changes require a separately provisioned venv")
        cache = stage / "landing/.next/standalone/.next/cache"
        cache.mkdir()
        shutil.chown(cache, user="mlkino", group="www-data")
        migrate(stage, "manage.py", "check", "--deploy", "--fail-level", "ERROR")
        migrate(stage, "-I", MIGRATE, "--plan")
        backup(commit)
        migrate(stage, "-I", MIGRATE, "--apply")
        stage.rename(final)
        activate(final, previous)
        print(f"Deployed and verified {commit} at {DOMAIN}", flush=True)


def interrupt(signum, frame):
    raise SystemExit(f"Deployment interrupted ({signum})")


def main():
    if os.geteuid() != 0 or sys.argv[1:] not in ([], ["--rollback"]):
        raise SystemExit("Expected root; the runner may supply release bytes on stdin only.")
    os.umask(0o022)
    signal.signal(signal.SIGTERM, interrupt)
    signal.signal(signal.SIGINT, interrupt)
    for directory in (BASE, RELEASES, BACKUPS):
        trusted_directory(directory)
    with (BASE / ".deploy.lock").open("a") as lock:
        fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        previous = release_target(CURRENT)
        if sys.argv[1:] == ["--rollback"]:
            target = release_target(PREVIOUS)
            activate(target, previous)
            print(f"Rolled back application to {target.name}. Database was left intact.", flush=True)
        else:
            deploy(previous)


if __name__ == "__main__":
    main()
