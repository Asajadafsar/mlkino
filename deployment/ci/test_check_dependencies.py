from email.message import Message
from importlib.metadata import PackageNotFoundError
from pathlib import Path
from tempfile import TemporaryDirectory
from types import SimpleNamespace
import unittest

from check_dependencies import validate


class DependencyTests(unittest.TestCase):
    def setUp(self):
        self.release = Path(self.enterContext(TemporaryDirectory()))
        (self.release / "requirements-extra.txt").write_text("# extras\n")
        self.packages = {}

    def add(self, name, version, requires=(), extras=()):
        metadata = Message()
        for extra in extras:
            metadata["Provides-Extra"] = extra
        self.packages[name] = SimpleNamespace(version=version, requires=requires, metadata=metadata)

    def installed(self, name):
        if name not in self.packages:
            raise PackageNotFoundError(name)
        return self.packages[name]

    def check(self, requirements):
        (self.release / "requirements.txt").write_text(requirements)
        return validate(self.release, self.installed)

    def test_compatible_manifest_addition_uses_installed_runtime(self):
        self.add("django", "6.1.2")
        self.add("python-dotenv", "1.2.2")
        baseline = "-r requirements-extra.txt\ndjango==6.1.2\n"
        self.assertEqual(self.check(baseline), [])
        self.assertEqual(self.check(baseline + "python-dotenv==1.2.2\n"), [])

    def test_missing_package_or_wrong_version_fails_closed(self):
        self.assertEqual(self.check("python-dotenv==1.2.2"), ["missing python-dotenv (==1.2.2)"])
        self.add("python-dotenv", "1.2.1")
        self.assertEqual(self.check("python-dotenv==1.2.2"), [
            "python-dotenv requires ==1.2.2, installed 1.2.1",
        ])

    def test_activated_extras_validate_required_transitive_dependencies(self):
        self.add("uvicorn", "0.54.0", ['watchfiles>=1; extra == "standard"'], ["standard"])
        self.assertEqual(self.check("uvicorn"), [])
        self.assertEqual(self.check("uvicorn[standard]"), ["missing watchfiles (>=1)"])
        self.add("watchfiles", "1.2.0")
        self.assertEqual(self.check("uvicorn[standard]"), [])

    def test_invalid_source_and_unapproved_include_are_rejected(self):
        with self.assertRaisesRegex(ValueError, "direct dependency URLs"):
            self.check("python-dotenv @ https://example.invalid/dotenv.whl")
        with self.assertRaisesRegex(ValueError, "unsupported requirement syntax"):
            self.check("-r ../../requirements.txt")
