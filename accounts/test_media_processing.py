from io import BytesIO
from tempfile import TemporaryDirectory
from unittest.mock import patch
from django.core.files.storage import FileSystemStorage
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import SimpleTestCase, override_settings
from PIL import Image
from rest_framework.exceptions import ValidationError
from .media_processing import (decode_raster, optimized_avatar, image_derivatives,
                               store_property_image, local_media_path)


def upload(size=(1800, 1200), format='JPEG', mime='image/jpeg', exif=None, mode='RGB'):
    image=Image.new(mode,size,'red' if mode=='RGB' else (128,80))
    out=BytesIO();options={'exif':exif} if exif else {}
    image.save(out,format,**options)
    return SimpleUploadedFile('untrusted-name.'+format.lower(),out.getvalue(),content_type=mime)

class RasterMediaTests(SimpleTestCase):
    def test_exif_rotation_and_private_metadata_are_removed_from_avatar(self):
        exif=Image.Exif();exif[274]=6;exif[270]='private-description';exif[315]='private-author'
        result=optimized_avatar(upload(size=(400,200),exif=exif))
        with Image.open(result) as image:
            self.assertEqual(image.size,(200,400));self.assertEqual(image.format,'WEBP')
            self.assertFalse(image.getexif());self.assertNotIn('xmp',image.info)
        self.assertTrue(result.name.endswith('.webp'))
    def test_alpha_channel_is_retained(self):
        result=optimized_avatar(upload(size=(100,50),format='PNG',mime='image/png',mode='LA'))
        with Image.open(result) as image:self.assertIn('A',image.getbands())
    def test_responsive_derivatives_preserve_ratio_without_upscaling(self):
        variants=image_derivatives(upload())
        self.assertEqual([x.width for x in variants],[320,768,1600])
        for item in variants:
            self.assertAlmostEqual(item.width/item.height,1.5,delta=0.01)
        self.assertEqual(len(image_derivatives(upload(size=(80,40)))),1)
    def test_reject_svg_mime_spoof_truncation_oversize_and_excessive_pixels(self):
        invalid=[SimpleUploadedFile('evil.png',b'<svg onload="alert(1)"/>',content_type='image/png'),
                 upload(mime='image/png'),
                 SimpleUploadedFile('broken.jpg',upload().read()[:40],content_type='image/jpeg'),
                 SimpleUploadedFile('large.jpg',b'a'*(5*1024*1024+1),content_type='image/jpeg')]
        for item in invalid:
            with self.assertRaises(ValidationError):decode_raster(item)
        with patch('accounts.media_processing.MAX_PIXELS',100):
            with self.assertRaises(ValidationError):decode_raster(upload(size=(20,20)))
    def test_animated_gif_is_rejected_instead_of_silently_losing_frames(self):
        out=BytesIO();Image.new('RGB',(20,20),'red').save(out,'GIF',save_all=True,append_images=[Image.new('RGB',(20,20),'blue')])
        with self.assertRaises(ValidationError):decode_raster(SimpleUploadedFile('x.gif',out.getvalue(),content_type='image/gif'))
    def test_storage_uses_generated_paths_and_cleans_partial_failure(self):
        with TemporaryDirectory() as folder:
            storage=FileSystemStorage(location=folder,base_url='/media/')
            result=store_property_image(upload(),storage=storage)
            self.assertEqual(len(result['variants']),3)
            self.assertTrue(all(storage.exists(path) for path in result['stored_paths']))
            self.assertNotIn('untrusted-name',result['url'])
            original=storage.save;count=0;created=[]
            def fail_second(*args,**kwargs):
                nonlocal count
                count+=1
                if count==2:raise OSError('disk full')
                saved=original(*args,**kwargs);created.append(saved);return saved
            with patch.object(storage,'save',side_effect=fail_second):
                with self.assertRaises(OSError):store_property_image(upload(),storage=storage)
            self.assertTrue(all(not storage.exists(path) for path in created))
    @override_settings(MEDIA_URL='/media/',PANEL_SETTINGS_PUBLIC_BASE_URL='https://api.mlkino.com')
    def test_legacy_lookup_does_not_fetch_remote_or_escape_storage(self):
        self.assertEqual(local_media_path('https://api.mlkino.com/media/properties/a.jpg'),'properties/a.jpg')
        for url in ['https://evil.example/media/a.jpg','https://api.mlkino.com/media/%2e%2e/secret',
                    'https://api.mlkino.com/media/a.jpg?token=secret','/media/../a.jpg']:
            self.assertIsNone(local_media_path(url))

from django.test import TestCase
from django.core.management import call_command
from django.core.files.storage import default_storage
from accounts.models import User
from panel.models import PropertyRecord
import json

class GradualImageConversionTests(TestCase):
    def test_dry_run_is_read_only_apply_is_repeatable_and_old_url_survives(self):
        with TemporaryDirectory() as folder, override_settings(MEDIA_ROOT=folder,MEDIA_URL='/media/',PANEL_SETTINGS_PUBLIC_BASE_URL='https://api.mlkino.com'):
            owner=User.objects.create_user('09000007001')
            original=default_storage.save('properties/legacy.jpg',upload(size=(600,400)))
            original_url='https://api.mlkino.com'+default_storage.url(original)
            row=PropertyRecord.objects.create(created_by=owner,kind='file',data={'images':[original_url]})
            from io import StringIO
            output=StringIO();call_command('optimize_property_images',stdout=output)
            self.assertEqual(json.loads(output.getvalue())['mode'],'dry-run')
            row.refresh_from_db();self.assertEqual(row.data['images'],[original_url])
            output=StringIO();call_command('optimize_property_images',apply=True,stdout=output)
            self.assertEqual(json.loads(output.getvalue())['converted'],1)
            row.refresh_from_db();self.assertTrue(row.data['images'][0].endswith('.webp'))
            self.assertIn(row.data['images'][0],row.data['image_variants'])
            self.assertTrue(default_storage.exists(original))
            output=StringIO();call_command('optimize_property_images',apply=True,stdout=output)
            self.assertEqual(json.loads(output.getvalue())['eligible'],0)
