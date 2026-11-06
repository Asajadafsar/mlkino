from io import BytesIO
from PIL import Image
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import SimpleTestCase
from rest_framework.exceptions import ValidationError
from .serializers import TicketReplySerializer

class AttachmentImageTests(SimpleTestCase):
    def test_ticket_image_is_webp_without_original_metadata(self):
        image=Image.new('RGB',(2400,1200),'blue');out=BytesIO()
        exif=Image.Exif();exif[270]='private metadata'
        image.save(out,'JPEG',exif=exif)
        serializer=TicketReplySerializer(data={'message':'تصویر پشتیبانی','attachment':SimpleUploadedFile('photo.jpg',out.getvalue(),content_type='image/jpeg')})
        self.assertTrue(serializer.is_valid(),serializer.errors)
        upload=serializer.validated_data['attachment'];self.assertTrue(upload.name.endswith('.webp'))
        with Image.open(upload) as decoded:
            self.assertEqual(decoded.format,'WEBP');self.assertLessEqual(decoded.width,2000);self.assertFalse(decoded.getexif())
    def test_disguised_active_content_is_rejected(self):
        serializer=TicketReplySerializer(data={'message':'تصویر','attachment':SimpleUploadedFile('bad.png',b'<svg onload="alert(1)"/>',content_type='image/png')})
        self.assertFalse(serializer.is_valid())
