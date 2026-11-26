import io
import tarfile
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

import deploy


def archive(*entries):
    buffer = io.BytesIO()
    with tarfile.open(fileobj=buffer, mode="w:gz") as output:
        for name, kind in entries:
            entry = tarfile.TarInfo(name)
            entry.type = kind
            if entry.isfile():
                entry.size = 3
                output.addfile(entry, io.BytesIO(b"abc"))
            else:
                entry.linkname = "/etc/shadow"
                output.addfile(entry)
    buffer.seek(0)
    return buffer


class ReleaseTests(unittest.TestCase):
    def test_safe_regular_file(self):
        with tempfile.TemporaryDirectory() as target:
            deploy.unpack(archive(("panel/models.py", tarfile.REGTYPE)), Path(target))
            self.assertEqual((Path(target) / "panel/models.py").read_bytes(), b"abc")

    def test_unsafe_entries(self):
        cases = (
            (("panel/../manage.py", tarfile.REGTYPE),),
            (("panel/models.py", tarfile.SYMTYPE),),
            (("/etc/shadow", tarfile.REGTYPE),),
            (("panel/.env.local", tarfile.REGTYPE),),
            (("mlkino/production_settings.py", tarfile.REGTYPE),),
            (("media/picture.png", tarfile.REGTYPE),),
            (("panel/models.py", tarfile.REGTYPE), ("panel//models.py", tarfile.REGTYPE)),
        )
        for entries in cases:
            with self.subTest(entries=entries), tempfile.TemporaryDirectory() as target:
                with self.assertRaises(RuntimeError):
                    deploy.unpack(archive(*entries), Path(target))

    def test_unhealthy_release_restores_previous_pointer(self):
        old = Path("/opt/mlkino/releases/old")
        new = Path("/opt/mlkino/releases/new")
        with patch.object(deploy, "swap") as swap, patch.object(deploy, "restart") as restart:
            with patch.object(deploy, "health", side_effect=[RuntimeError("unhealthy"), None]) as health:
                with self.assertRaisesRegex(RuntimeError, "unhealthy"):
                    deploy.activate(new, old)
        self.assertEqual(swap.call_count, 3)
        swap.assert_called_with(deploy.CURRENT, old)
        self.assertEqual(restart.call_count, 2)
        health.assert_called_with(old, public=False)


class BaselineTests(unittest.TestCase):
    def setUp(self):
        self.base = Path(self.enterContext(tempfile.TemporaryDirectory())).resolve()
        self.current = self.base / "current"
        self.releases = self.base / "releases"
        self.baseline = self.releases / "baseline"
        self.previous = self.base / "previous"
        self.proc = self.base / "proc"
        self.releases.mkdir()
        self.enterContext(patch.multiple(
            deploy, BASE=self.base, CURRENT=self.current, RELEASES=self.releases,
            BASELINE=self.baseline, PREVIOUS=self.previous, PROC=self.proc,
        ))
        self.landing = self.current / "landing/.next"
        self.frontend = self.current / "frontend"
        self.landing.mkdir(parents=True)
        self.frontend.mkdir()
        (self.landing / "standalone-release").mkdir()
        (self.landing / "standalone").symlink_to("standalone-release")
        (self.frontend / "build-release").mkdir()
        (self.frontend / "build").symlink_to("build-release")
        self.current.chmod(0o750)

    def fake_processes(self):
        for pid, path in [(10, self.current), (20, self.landing / "standalone")]:
            entry = self.proc / str(pid)
            entry.mkdir(parents=True)
            (entry / "cwd").symlink_to(path)

    def test_health_resolves_both_working_directories(self):
        self.fake_processes()
        results = [deploy.subprocess.CompletedProcess([], 0, stdout=f"{pid}\n") for pid in (10, 20)]
        with patch.object(deploy, "run", side_effect=results), patch.object(deploy, "functional_health") as verify:
            deploy.health(self.current)
        self.assertEqual(verify.call_count, 2)

    def test_baseline_conversion_keeps_relative_links_and_inode(self):
        original = self.current.stat()
        with patch.object(deploy, "preflight_baseline"), patch.object(deploy, "stop_services"), patch.object(
            deploy, "restart"
        ), patch.object(deploy, "health") as health:
            deploy.convert_baseline(original.st_uid)
        target = self.baseline / "app"
        self.assertEqual(self.current.resolve(), target)
        self.assertEqual(target.stat().st_ino, original.st_ino)
        self.assertEqual(target.stat().st_mode, original.st_mode)
        self.assertEqual(target.stat().st_uid, original.st_uid)
        self.assertEqual((target / "frontend/build").readlink(), Path("build-release"))
        self.assertEqual((target / "landing/.next/standalone").readlink(), Path("standalone-release"))
        health.assert_called_once_with(target)

    def test_failed_conversion_restores_real_directory_and_links(self):
        original = self.current.stat()
        with patch.object(deploy, "preflight_baseline"), patch.object(deploy, "stop_services"), patch.object(
            deploy, "restart"
        ) as restart, patch.object(deploy, "health", side_effect=[RuntimeError("unhealthy"), None]) as health:
            with self.assertRaisesRegex(RuntimeError, "unhealthy"):
                deploy.convert_baseline(original.st_uid)
        self.assertFalse(self.current.is_symlink())
        self.assertEqual(self.current.stat().st_ino, original.st_ino)
        self.assertEqual((self.landing / "standalone").resolve(), self.landing / "standalone-release")
        self.assertEqual((self.frontend / "build").resolve(), self.frontend / "build-release")
        self.assertFalse(self.baseline.exists())
        self.assertEqual(restart.call_count, 2)
        health.assert_called_with(self.current)

    def test_manual_restore_reinstates_real_directory(self):
        self.baseline.mkdir()
        target = self.baseline / "app"
        original_inode = self.current.stat().st_ino
        self.current.rename(target)
        deploy.swap(self.current, target)
        (self.baseline / "original-owner").write_text("0\n")
        with patch.object(deploy, "release_target", return_value=target), patch.object(
            deploy.pwd, "getpwnam"
        ), patch.object(deploy, "stop_services"), patch.object(deploy, "restart"), patch.object(
            deploy, "health"
        ) as health, patch.object(deploy.os, "chown") as chown:
            deploy.restore_baseline()
        self.assertFalse(self.current.is_symlink())
        self.assertEqual(self.current.stat().st_ino, original_inode)
        self.assertFalse(self.baseline.exists())
        chown.assert_called_once_with(self.base, 0, -1)
        health.assert_called_with(self.current)

    def test_release_rollback_checks_resolved_baseline_workdir(self):
        self.baseline.mkdir()
        target = self.baseline / "app"
        self.current.rename(target)
        deploy.swap(self.current, target)
        self.fake_processes()
        candidate = self.releases / "new"
        candidate.mkdir()

        def verify(release, origin):
            if release == candidate:
                raise RuntimeError("candidate health failure")

        pids = [10, 20]
        original_health = deploy.health
        with patch.object(deploy, "restart") as restart, patch.object(
            deploy, "run", side_effect=[deploy.subprocess.CompletedProcess([], 0, stdout=str(pid)) for pid in pids]
        ), patch.object(deploy, "functional_health", side_effect=verify), patch.object(
            deploy, "health", side_effect=lambda release, public=True: (
                verify(release, True) if release == candidate else original_health(release, public)
            )
        ):
            with self.assertRaisesRegex(RuntimeError, "candidate health failure"):
                deploy.activate(candidate, target)
        self.assertEqual(restart.call_count, 2)
        self.assertEqual(self.current.resolve(), target)
        self.assertEqual(self.previous.resolve(), target)
        self.assertEqual((self.landing / "standalone").readlink(), Path("standalone-release"))
