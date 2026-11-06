from io import BytesIO
from tempfile import TemporaryDirectory
from django.core.files.base import ContentFile
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase,override_settings
from django.urls import path
from rest_framework.test import APIClient,APIRequestFactory
from rest_framework.exceptions import ValidationError
from PIL import Image
from .models import User,AgencyProfile,ExpertProfile
from .private_media import PrivateDocumentView
from .media_processing import sanitized_document
from panel.models import AgencyExpertLink
from panel.serializers import PanelUserDetailSerializer,AgencyProfileSerializer,ExpertProfileSerializer

urlpatterns=[path('accounts/documents/<int:user_id>/<str:kind>/',PrivateDocumentView.as_view())]

@override_settings(ROOT_URLCONF=__name__)
class PrivateDocumentTests(TestCase):
    def setUp(self):
        self.folder=TemporaryDirectory();self.addCleanup(self.folder.cleanup)
        self.override=override_settings(MEDIA_ROOT=self.folder.name);self.override.enable();self.addCleanup(self.override.disable)
        self.owner=User.objects.create_user('09000008001','test-password',role='expert')
        self.other=User.objects.create_user('09000008002','test-password')
        self.agency=User.objects.create_user('09000008003','test-password',role='agency')
        self.admin=User.objects.create_superuser('09000008004','test-password')
        raw=BytesIO();Image.new('RGB',(20,20),'blue').save(raw,'PNG');self.content=raw.getvalue()
        self.owner.national_code_image.save('national.png',ContentFile(self.content))
        self.client=APIClient();self.url=f'/accounts/documents/{self.owner.pk}/national-card/'
    def test_guest_and_unrelated_user_cannot_download_private_identity(self):
        self.assertEqual(self.client.get(self.url).status_code,401)
        self.client.force_authenticate(self.other)
        self.assertEqual(self.client.get(self.url).status_code,404)
        self.assertEqual(self.client.get('/accounts/documents/999999/national-card/').status_code,404)
    def test_owner_admin_and_linked_agency_can_download_without_public_storage_url(self):
        AgencyExpertLink.objects.create(agency=self.agency,expert=self.owner)
        for user in [self.owner,self.admin,self.agency]:
            self.client.force_authenticate(user);response=self.client.get(self.url)
            self.assertEqual(response.status_code,200)
            self.assertEqual(b''.join(response.streaming_content),self.content)
            self.assertIn('attachment',response['Content-Disposition'])
            self.assertEqual(response['Cache-Control'],'private, no-store')
            self.assertEqual(response['X-Content-Type-Options'],'nosniff')
        AgencyExpertLink.objects.all().delete()
        self.client.force_authenticate(self.agency);self.assertEqual(self.client.get(self.url).status_code,404)
    def test_serializers_emit_authenticated_routes_for_all_document_types(self):
        request=APIRequestFactory().get('/');request.user=self.admin
        detail=PanelUserDetailSerializer(self.owner,context={'request':request}).data
        self.assertEqual(detail['national_code_image'],'http://testserver'+self.url)
        self.assertNotIn('/media/',detail['national_code_image'])
        agency=AgencyProfile.objects.create(manager=self.agency,agency_name='دفتر آزمایشی',occupancy_type='owner',office_address='نشانی آزمایشی')
        agency.license_image.save('license.png',ContentFile(self.content))
        self.assertIn(f'/accounts/documents/{self.agency.pk}/agency-license/',AgencyProfileSerializer(agency).data['license_image'])
        expert=ExpertProfile.objects.create(user=self.owner)
        expert.professional_document.save('certificate.pdf',ContentFile(b'%PDF-1.7\n%%EOF'))
        self.assertIn(f'/accounts/documents/{self.owner.pk}/expert-document/',ExpertProfileSerializer(expert).data['professional_document'])
    def test_private_document_uploads_reject_active_or_forged_files(self):
        for upload in [SimpleUploadedFile('evil.pdf',b'<script>alert(1)</script>',content_type='application/pdf'),
                       SimpleUploadedFile('incomplete.pdf',b'%PDF-1.7 missing-eof',content_type='application/pdf'),
                       SimpleUploadedFile('active.pdf',b'%PDF-1.7 /JavaScript (evil) %%EOF',content_type='application/pdf'),
                       SimpleUploadedFile('wrong.png',b'%PDF-1.7\n%%EOF',content_type='image/png')]:
            with self.assertRaises(ValidationError):sanitized_document(upload)
        result=sanitized_document(SimpleUploadedFile('private-name.pdf',b'%PDF-1.7\n%%EOF',content_type='application/pdf'))
        self.assertTrue(result.name.endswith('.pdf'));self.assertNotIn('private-name',result.name)
    def test_new_avatar_storage_names_do_not_disclose_phone(self):
        from .models import user_avatar_path
        first=user_avatar_path(self.owner,'portrait.webp');second=user_avatar_path(self.owner,'portrait.webp')
        self.assertNotIn(self.owner.phone,first);self.assertNotEqual(first,second)
