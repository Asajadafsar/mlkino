from configparser import ConfigParser
from pathlib import Path
import shlex
import unittest


DEPLOYMENT = Path(__file__).resolve().parent


class RunnerHookTests(unittest.TestCase):
    def test_job_start_hook_has_supported_extension_and_matches_installation(self):
        service = ConfigParser(interpolation=None)
        service.read(DEPLOYMENT / "mlkino-runner.service")
        name, installed_path = service["Service"]["Environment"].split("=", 1)
        self.assertEqual(name, "ACTIONS_RUNNER_HOOK_JOB_STARTED")
        self.assertIn(Path(installed_path).suffix, {".sh", ".ps1", ".js"})
        self.assertEqual(installed_path, "/usr/local/libexec/mlkino-runner-job-start.sh")

        install_commands = [
            shlex.split(line) for line in (DEPLOYMENT / "README.md").read_text().splitlines()
            if line.startswith("install ") and "runner-job-start.sh" in line
        ]
        self.assertTrue(install_commands, "Missing hook installation command")
        for command in install_commands:
            self.assertEqual(command[-2:], [
                "$SOURCE/deployment/ci/runner-job-start.sh", installed_path,
            ])
