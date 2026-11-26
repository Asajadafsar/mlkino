#!/usr/bin/python3 -I
"""Root-installed, narrowly privileged MLKino production release controller."""
import fcntl
import hashlib
import json
import os
import pwd
import re
import shutil
import signal
import stat
import subprocess
import sys
import tarfile
import tempfile
import time
from pathlib import Path, PurePosixPath

BASE = Path("/opt/mlkino")
RELEASES = BASE / "releases"
CURRENT = BASE / "current"
BASELINE = RELEASES / "baseline"
PROC = Path("/proc")
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
    if target == BASELINE / "app":
        trusted_directory(BASELINE)
        if (BASELINE / "app").is_symlink() or not target.is_dir():
            raise RuntimeError(f"Invalid baseline release: {target}")
        return target
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


def release_bytes(path, limit=15_000_000):
    # A retained baseline keeps the service user's ownership. Never let a
    # symlink in that tree turn the root controller into a privileged reader.
    content = run("/usr/sbin/runuser", "-u", "mlkino", "-g", "www-data", "--",
                  "/usr/bin/head", "-c", str(limit + 1), "--", str(path),
                  capture_output=True, timeout=10).stdout
    if len(content) > limit:
        raise ValueError(f"Release file exceeds its size limit: {path}")
    return content


def functional_health(release, origin):
    catalog = json.loads(response("/api/panel/public/catalog/?page_size=1", origin))
    if not isinstance(catalog["data"]["results"], list):
        raise ValueError("Catalog did not return a result list")
    manifest = json.loads(release_bytes(release / "frontend/build/asset-manifest.json"))
    asset = next(item for item in manifest["entrypoints"] if item.endswith(".js"))
    path = PurePosixPath(asset.lstrip("/"))
    if not asset.startswith("static/js/") or ".." in path.parts:
        raise ValueError("Unexpected panel entrypoint")
    marker = release / "frontend/build/mlkino-release.txt"
    if marker.is_file() and response(f"/panel/mlkino-release.txt?commit={release.name}", origin) != release_bytes(marker, limit=1024):
        raise ValueError("Production did not serve the selected release marker")
    panel = response("/panel/", origin)
    expected = release_bytes(release / "frontend/build" / path)
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
    expected = release_bytes(release / "landing/.next/standalone/.next" / asset_path)
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
                if not pid or (PROC / str(pid) / "cwd").resolve(strict=True) != expected.resolve(strict=True):
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
            output.write(release_bytes(previous / config, limit=1_000_000))
        shutil.chown(stage / config, group="www-data")
        (stage / config).chmod(0o640)
        for manifest in ("requirements.txt", "requirements-extra.txt"):
            if (stage / manifest).read_bytes() != release_bytes(previous / manifest, limit=1_000_000):
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


def deployment_lock():
    fd = os.open(BASE / ".deploy.lock", os.O_CREAT | os.O_WRONLY | os.O_NOFOLLOW | os.O_NONBLOCK, 0o600)
    lock = os.fdopen(fd, "a")
    try:
        info = os.fstat(fd)
        if not stat.S_ISREG(info.st_mode) or info.st_uid or info.st_nlink != 1 or info.st_mode & 0o022:
            raise RuntimeError("Deployment lock is not a private root-owned file.")
        fcntl.flock(fd, fcntl.LOCK_EX | fcntl.LOCK_NB)
        return lock
    except BaseException:
        lock.close()
        raise


def preflight_baseline():
    if CURRENT.is_symlink() or not CURRENT.is_dir():
        raise RuntimeError("Baseline migration requires current to be a real directory.")
    if CURRENT.stat().st_dev != RELEASES.stat().st_dev or CURRENT.is_mount():
        raise RuntimeError("Baseline conversion requires an in-filesystem directory rename.")
    if BASELINE.exists() or BASELINE.is_symlink() or PREVIOUS.exists() or PREVIOUS.is_symlink():
        raise RuntimeError("Baseline or rollback pointer already exists; review the current layout.")
    for name in ("frontend/build", "landing/.next/standalone"):
        path = CURRENT / name
        if not path.is_symlink() or path.readlink().is_absolute():
            raise RuntimeError(f"Expected a relative build symlink: {path}")
        if not path.resolve(strict=True).is_relative_to(CURRENT) or not path.is_dir():
            raise RuntimeError(f"Build symlink exits the application directory: {path}")
    for name in ("manage.py", "mlkino/production_settings.py", "requirements.txt",
                 "requirements-extra.txt", "frontend/build/asset-manifest.json",
                 "landing/.next/standalone/server.js"):
        if not (CURRENT / name).is_file():
            raise RuntimeError(f"Baseline file is missing: {name}")
    run("/usr/sbin/nginx", "-t", timeout=20)
    health(CURRENT)


def stop_services():
    run("/usr/bin/systemctl", "stop", *SERVICES, timeout=80)


def convert_baseline(original_uid):
    preflight_baseline()
    BASELINE.mkdir(mode=0o755)
    target = BASELINE / "app"
    try:
        (BASELINE / "original-owner").write_text(f"{original_uid}\n")
        stop_services()
        CURRENT.rename(target)
        swap(CURRENT, target)
        restart()
        health(target)
    except BaseException:
        print("Baseline conversion failed; restoring the original directory layout.", file=sys.stderr, flush=True)
        if target.is_dir():
            stop_services()
            if CURRENT.is_symlink() and CURRENT.resolve(strict=True) == target:
                CURRENT.unlink()
            target.rename(CURRENT)
        (BASELINE / "original-owner").unlink(missing_ok=True)
        BASELINE.rmdir()
        restart()
        health(CURRENT)
        raise


def restore_baseline():
    target = release_target(CURRENT)
    if target != BASELINE / "app":
        raise RuntimeError("Restore requires the baseline to be the active release.")
    original_uid = int((BASELINE / "original-owner").read_text())
    if original_uid not in (0, pwd.getpwnam("mlkino").pw_uid):
        raise RuntimeError("Unexpected original owner in baseline receipt.")
    health(target)
    try:
        stop_services()
        CURRENT.unlink()
        target.rename(CURRENT)
        restart()
        health(CURRENT)
    except BaseException:
        if CURRENT.is_dir() and not CURRENT.is_symlink():
            stop_services()
            CURRENT.rename(target)
        swap(CURRENT, target)
        restart()
        health(target)
        raise
    (BASELINE / "original-owner").unlink()
    BASELINE.rmdir()
    os.chown(BASE, original_uid, -1)
    print("Restored the original directory layout.", flush=True)


def migrate_baseline():
    trusted_directory(BASE.parent)
    info = BASE.lstat()
    mlkino_uid = pwd.getpwnam("mlkino").pw_uid
    if not stat.S_ISDIR(info.st_mode) or info.st_uid not in (0, mlkino_uid) or info.st_mode & 0o7022:
        raise RuntimeError("Unexpected /opt/mlkino ownership or permissions; review before conversion.")
    # Pin the anchor inode while taking ownership; never follow a substituted symlink.
    fd = os.open(BASE, os.O_DIRECTORY | os.O_NOFOLLOW | os.O_RDONLY)
    releases_created = False
    ownership_pinned = False
    try:
        opened = os.fstat(fd)
        if (opened.st_dev, opened.st_ino, opened.st_uid, opened.st_mode) != (
            info.st_dev, info.st_ino, info.st_uid, info.st_mode
        ):
            raise RuntimeError("Application directory changed during preflight.")
        os.fchown(fd, 0, -1)
        ownership_pinned = True
        trusted_directory(BASE)
        with deployment_lock():
            if not RELEASES.exists():
                RELEASES.mkdir(mode=0o755)
                releases_created = True
            trusted_directory(RELEASES)
            convert_baseline(info.st_uid)
    except BaseException:
        if ownership_pinned and CURRENT.is_dir() and not CURRENT.is_symlink() and not BASELINE.exists():
            if releases_created:
                RELEASES.rmdir()
            os.fchown(fd, info.st_uid, -1)
        raise
    finally:
        os.close(fd)
    print("Baseline layout converted and health checks passed.", flush=True)


def main():
    if os.geteuid() != 0 or sys.argv[1:] not in ([], ["--rollback"], ["--migrate-baseline"], ["--restore-baseline-directory"]):
        raise SystemExit("Expected root; the runner may supply release bytes on stdin only.")
    os.umask(0o022)
    signal.signal(signal.SIGTERM, interrupt)
    signal.signal(signal.SIGINT, interrupt)
    if sys.argv[1:] == ["--migrate-baseline"]:
        migrate_baseline()
        return
    for directory in (BASE, RELEASES, BACKUPS):
        trusted_directory(directory)
    with deployment_lock():
        if sys.argv[1:] == ["--restore-baseline-directory"]:
            if PREVIOUS.exists() or PREVIOUS.is_symlink():
                raise RuntimeError("A later deployment has already recorded a rollback target.")
            restore_baseline()
            return
        previous = release_target(CURRENT)
        if sys.argv[1:] == ["--rollback"]:
            target = release_target(PREVIOUS)
            activate(target, previous)
            print(f"Rolled back application to {target.name}. Database was left intact.", flush=True)
        else:
            deploy(previous)


if __name__ == "__main__":
    main()
