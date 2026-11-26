"""Validate both releases against the shared production Python environment."""
import re
import sys
from collections import deque
from importlib.metadata import PackageNotFoundError, distribution
from pathlib import Path

from packaging.requirements import Requirement
from packaging.utils import canonicalize_name

MANIFESTS = ("requirements.txt", "requirements-extra.txt")


def read_requirements(release):
    for name in MANIFESTS:
        for number, line in enumerate((release / name).read_text().splitlines(), 1):
            line = re.split(r"\s+#", line.strip(), maxsplit=1)[0]
            if not line or line.startswith("#"):
                continue
            # Both approved manifest files are processed explicitly.
            if name == "requirements.txt" and line.split() == ["-r", "requirements-extra.txt"]:
                continue
            try:
                requirement = Requirement(line)
            except ValueError as error:
                raise ValueError(f"{name}:{number}: unsupported requirement syntax") from error
            if requirement.url:
                raise ValueError(f"{name}:{number}: direct dependency URLs are unsupported")
            yield requirement


def validate(release, installed=distribution):
    pending = deque(read_requirements(release))
    visited = set()
    problems = set()
    while pending:
        requirement = pending.popleft()
        if requirement.marker and not requirement.marker.evaluate({"extra": ""}):
            continue
        try:
            found = installed(requirement.name)
        except PackageNotFoundError:
            problems.add(f"missing {requirement.name} ({requirement.specifier or 'any version'})")
            continue
        if not requirement.specifier.contains(found.version):
            problems.add(f"{requirement.name} requires {requirement.specifier}, installed {found.version}")
        extras = {canonicalize_name(extra) for extra in requirement.extras}
        available = {canonicalize_name(extra) for extra in found.metadata.get_all("Provides-Extra", [])}
        if missing := extras - available:
            problems.add(f"{requirement.name} does not provide extras: {', '.join(sorted(missing))}")
        for extra in {"", *extras}:
            key = (canonicalize_name(requirement.name), extra)
            if key in visited:
                continue
            visited.add(key)
            for raw in found.requires or ():
                dependency = Requirement(raw)
                if dependency.marker and not dependency.marker.evaluate({"extra": extra}):
                    continue
                if dependency.url:
                    problems.add(f"{requirement.name} declares an unsupported direct URL dependency")
                    continue
                dependency.marker = None
                pending.append(dependency)
    return sorted(problems)


def main():
    if len(sys.argv) < 2:
        raise SystemExit("Expected at least one release path.")
    incompatible = False
    for argument in sys.argv[1:]:
        release = Path(argument)
        try:
            problems = validate(release)
        except (OSError, ValueError) as error:
            problems = [str(error)]
        if problems:
            incompatible = True
            for problem in problems:
                print(f"{release}: {problem}", file=sys.stderr)
        else:
            print(f"Installed Python dependencies verified for {release}.", flush=True)
    if incompatible:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
