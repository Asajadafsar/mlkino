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
