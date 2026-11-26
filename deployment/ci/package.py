"""Package tracked application source and vetted build outputs, excluding live state."""
import hashlib
import re
import subprocess
import sys
import tarfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]


def build_archive(commit, out):
    if not re.fullmatch(r"[0-9a-f]{40}", commit):
        raise ValueError("Invalid release commit")
    head = subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=ROOT, text=True).strip()
    if head != commit:
        raise ValueError("Build checkout differs from requested commit")

    out.mkdir(mode=0o700)
    marker = out / "RELEASE"
    marker.write_text(commit + "\n")
    files = subprocess.check_output([
        "git", "ls-files", "-z", "--", "manage.py", "requirements.txt",
        "requirements-extra.txt", "accounts", "panel", "mlkino",
    ], cwd=ROOT).decode().split("\0")

    archive = out / "release.tar.gz"
    try:
        with tarfile.open(archive, "w:gz") as tar:
            tar.add(marker, arcname="RELEASE")
            for name in filter(None, files):
                path = ROOT / name
                if name == "mlkino/production_settings.py" or path.name.startswith(("test_", ".")):
                    continue
                if (path.suffix in {".py", ".json", ".webp"} or path.name == "SOURCE-LICENSE"
                        or name in {"requirements.txt", "requirements-extra.txt"}):
                    add_regular(tar, path, name)
            for source, target in (
                ("frontend/build", "frontend/build"),
                ("landing/.next/standalone", "landing/.next/standalone"),
                ("landing/.next/static", "landing/.next/standalone/.next/static"),
                ("landing/public", "landing/.next/standalone/public"),
            ):
                directory = ROOT / source
                if not directory.is_dir():
                    raise ValueError(f"Build output missing: {source}")
                for path in sorted(directory.rglob("*")):
                    relative = path.relative_to(directory)
                    if source == "landing/.next/standalone" and (
                        relative.is_relative_to("public") or relative.is_relative_to(".next/static")
                        or relative.is_relative_to(".next/cache")
                    ):
                        continue
                    if path.is_symlink():
                        raise ValueError(f"Unexpected symlink: {path}")
                    if path.is_file():
                        add_regular(tar, path, f"{target}/{relative}")
            for name in ("manage.py", "frontend/build/index.html", "landing/.next/standalone/server.js"):
                if name not in tar.getnames():
                    raise ValueError(f"Missing release member: {name}")
        with archive.open("rb") as stream:
            digest = hashlib.file_digest(stream, "sha256").hexdigest()
        (out / "SHA256SUMS").write_text(f"{digest}  release.tar.gz\n")
    finally:
        marker.unlink()


def add_regular(tar, path, name):
    if path.is_symlink() or not path.is_file():
        raise ValueError(f"Not a regular file: {path}")
    if any(part.startswith(".env") or part.endswith((".pem", ".key")) for part in Path(name).parts):
        raise ValueError(f"Unexpected credential-like file: {name}")
    tar.add(path, arcname=name, recursive=False)


if __name__ == "__main__":
    build_archive(sys.argv[1], Path(sys.argv[2]))
