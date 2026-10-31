import importlib.util, io, pathlib, tempfile, tarfile, unittest
from unittest.mock import patch
MODULE=pathlib.Path(__file__).resolve().parents[1]/'runtime.py'
spec=importlib.util.spec_from_file_location('release_runtime',MODULE);runtime=importlib.util.module_from_spec(spec);spec.loader.exec_module(runtime)
class ReleaseSafetyTests(unittest.TestCase):
    def test_approval_gate_refuses_unapproved_actions(self):
        with patch.dict('os.environ',{},clear=True),patch.object(runtime.os,'geteuid',return_value=0):
            with self.assertRaises(SystemExit):runtime.approve()
    def test_archive_path_traversal_is_rejected(self):
        with tempfile.TemporaryDirectory() as directory:
            root=pathlib.Path(directory);archive=root/'bad.tar.gz'
            with tarfile.open(archive,'w:gz') as tar:
                info=tarfile.TarInfo('../outside');info.size=1;tar.addfile(info,io.BytesIO(b'x'))
            with self.assertRaises(SystemExit):runtime.extract(archive,root/'out',{'../outside':'wrong'})
            self.assertFalse((root/'outside').exists())
    def test_archive_symlink_is_rejected(self):
        with tempfile.TemporaryDirectory() as directory:
            root=pathlib.Path(directory);archive=root/'bad.tar.gz'
            with tarfile.open(archive,'w:gz') as tar:
                info=tarfile.TarInfo('settings.py');info.type=tarfile.SYMTYPE;info.linkname='/etc/shadow';tar.addfile(info)
            with self.assertRaises(SystemExit):runtime.extract(archive,root/'out',{'settings.py':'wrong'})
    def test_extract_verifies_every_file_checksum(self):
        with tempfile.TemporaryDirectory() as directory:
            root=pathlib.Path(directory);source=root/'index.html';source.write_text('new release');archive=root/'site.tar.gz'
            with tarfile.open(archive,'w:gz') as tar:tar.add(source,arcname='index.html')
            runtime.extract(archive,root/'out',{'index.html':runtime.sha(source)})
            self.assertEqual((root/'out/index.html').read_text(),'new release')
            with self.assertRaises(SystemExit):runtime.extract(archive,root/'other',{'index.html':'invalid'})
    def test_frontend_rollback_never_accepts_external_directory(self):
        with tempfile.TemporaryDirectory() as directory:
            root=pathlib.Path(directory);(root/'releases').mkdir();outside=root/'outside';outside.mkdir();(outside/'index.html').write_text('x')
            with self.assertRaises(SystemExit):runtime.frontend_swap(root,outside)
    def test_rollback_swaps_only_symlink_and_retains_both_versions(self):
        with tempfile.TemporaryDirectory() as directory:
            root=pathlib.Path(directory);releases=root/'releases';releases.mkdir()
            for name in ['old','new']:(releases/name).mkdir();(releases/name/'index.html').write_text(name)
            (root/'current').symlink_to(releases/'new');runtime.frontend_swap(root,releases/'old')
            self.assertEqual((root/'current/index.html').read_text(),'old');self.assertTrue((releases/'new/index.html').exists())
if __name__=='__main__':unittest.main()
