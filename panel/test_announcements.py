from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient
from accounts.models import Announcement

User = get_user_model()


class AnnouncementManagementTests(TestCase):
    def setUp(self):
        self.admin = User.objects.create_superuser('09124444001', 'admin-password')
        self.client = APIClient()
        self.client.force_authenticate(self.admin)
        Announcement.objects.create(title='خبر انتشار', description='متن قابل جستجو', link='https://example.com/news', status='published', created_by=self.admin)
        Announcement.objects.create(title='خبر پیش‌نویس', description='متن دوم', status='draft', created_by=self.admin)

    def test_filter_search_and_preview_match_the_actual_records(self):
        response = self.client.get('/panel/announcements/?status=published&search=قابل&page_size=1')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['data']['total_results'], 1)
        row = response.data['data']['results'][0]
        self.assertEqual(row['description'], 'متن قابل جستجو')
        self.assertEqual(row['link'], 'https://example.com/news')
        self.assertEqual(self.client.get('/panel/announcements/?status=unknown').status_code, 400)

    def test_announcement_create_edit_and_delete(self):
        response = self.client.post('/panel/announcements/', {'title': 'اطلاعیه جدید', 'description': 'متن اطلاعیه', 'status': 'draft', 'link': ''}, format='json')
        self.assertEqual(response.status_code, 201, response.data)
        url = f"/panel/announcements/{response.data['data']['id']}/"
        response = self.client.patch(url, {'description': 'متن به‌روز', 'status': 'published'}, format='json')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(self.client.get(url).data['data']['description'], 'متن به‌روز')
        self.assertEqual(self.client.delete(url).status_code, 200)

    def test_agency_cannot_manage_announcements(self):
        agency = User.objects.create_user('09124444002', role='agency')
        self.client.force_authenticate(agency)
        self.assertEqual(self.client.get('/panel/announcements/').status_code, 403)
