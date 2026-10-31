from datetime import timedelta
from django.test import TestCase,RequestFactory,override_settings
from django.utils import timezone
from django.core.cache import cache
from rest_framework.test import APIClient
from accounts.models import User,AgencyExpert,ActivityLog
from accounts.client_ip import get_client_ip
from panel.models import PersonalReminder,ImportantTask,TaskAssignment

class DevelopmentUpdatesTests(TestCase):
 def setUp(self):
  cache.clear();self.admin=User.objects.create_superuser('09127777000','test-password',first_name='مدیر',last_name='سامانه');self.agency=User.objects.create_user('09127777001',role='agency');self.expert=User.objects.create_user('09127777002',role='expert');self.other=User.objects.create_user('09127777003',role='expert');self.member=User.objects.create_user('09127777004',role='user');AgencyExpert.objects.create(agency=self.agency,expert=self.expert);self.client=APIClient()
 def test_settings_private_appearance_available(self):
  for user in [self.agency,self.expert,self.member]:
   self.client.force_authenticate(user);self.assertEqual(self.client.get('/panel/settings/').status_code,403);r=self.client.get('/panel/appearance/');self.assertEqual(r.status_code,200);self.assertNotIn('contact',r.data['data'])
  self.client.force_authenticate(self.admin);self.assertEqual(self.client.get('/panel/settings/').status_code,200)
 def test_recipient_scope_and_read_only_other_roles(self):
  self.client.force_authenticate(self.admin);ids={r['id'] for r in self.client.get('/panel/tasks/recipients/').data['data']['results']};self.assertTrue({self.agency.id,self.expert.id,self.other.id}.issubset(ids));self.assertNotIn(self.member.id,ids)
  self.client.force_authenticate(self.agency);ids={r['id'] for r in self.client.get('/panel/tasks/recipients/').data['data']['results']};self.assertEqual(ids,{self.agency.id,self.expert.id})
  task=ImportantTask.objects.create(title='وظیفه آزمایش',created_by=self.agency,due_date=timezone.localdate());assignment=TaskAssignment.objects.create(task=task,assignee=self.expert)
  self.client.force_authenticate(self.expert);self.assertEqual(self.client.get('/panel/tasks/').status_code,200);self.assertEqual(self.client.post('/panel/tasks/',{'title':'غیرمجاز'},format='json').status_code,403);self.assertEqual(self.client.patch(f'/panel/tasks/assignments/{assignment.pk}/',{'status':'done'},format='json').status_code,403)
  self.assertEqual(self.client.patch(f'/panel/dashboard/tasks/{task.pk}/toggle/',{'status':'done'},format='json').status_code,403)
  self.client.force_authenticate(self.agency);self.assertEqual(self.client.patch(f'/panel/tasks/assignments/{assignment.pk}/',{'status':'done'},format='json').status_code,200)
 def test_reminders_owner_only_and_three_dashboard_records(self):
  for user in [self.admin,self.agency,self.expert,self.member]:
   self.client.force_authenticate(user)
   for i in range(4):
    r=self.client.post('/panel/reminders/',{'title':f'یادداشت {i}','description':'خصوصی','remind_at':(timezone.now()+timedelta(days=i)).isoformat()},format='json');self.assertEqual(r.status_code,201,r.data)
   data=self.client.get('/panel/dashboard/').data['data']['personal_reminders'];self.assertEqual(len(data['results']),3);self.assertEqual(data['total_results'],4)
  private=PersonalReminder.objects.filter(owner=self.admin).first();self.client.force_authenticate(self.member)
  self.assertEqual(self.client.get(f'/panel/reminders/{private.pk}/').status_code,404);self.assertEqual(self.client.patch(f'/panel/reminders/{private.pk}/',{'title':'غیرمجاز'},format='json').status_code,404);self.assertEqual(self.client.delete(f'/panel/reminders/{private.pk}/').status_code,404)
  self.assertEqual(self.client.post('/panel/reminders/',{'title':'عنوان','owner':self.admin.id,'remind_at':timezone.now().isoformat()},format='json').status_code,400)
  self.assertEqual(self.client.get('/panel/reminders/?search=یادداشت&page_size=3').data['data']['total_results'],4)
 def test_audit_has_ip_details_and_does_not_show_navigation(self):
  self.client.force_authenticate(self.admin)
  ActivityLog.objects.create(event='http.request',method='GET',path='/panel/users/',status_code=200,actor=self.admin)
  response=self.client.patch(f'/panel/users/{self.member.id}/',{'first_name':'نام تازه'},format='json',REMOTE_ADDR='203.0.113.8');self.assertEqual(response.status_code,200,response.data)
  rows=self.client.get('/panel/activity-logs/').data['data']['results'];self.assertFalse(any(r['event']=='http.request' for r in rows))
  row=next(r for r in rows if r['event']=='user.update');self.assertEqual(row['ip_address'],'203.0.113.8');self.assertIn('مدیر سامانه',row['description']);self.assertIn('نام',row['description']);self.assertIn('موفق',row['description'])

class ClientIPTests(TestCase):
 @override_settings(MLKINO_TRUSTED_PROXIES=['127.0.0.1/32'],MLKINO_TRUST_PROXY_HEADERS_WITHOUT_REMOTE=True)
 def test_trusted_proxy_and_unix_socket(self):
  f=RequestFactory();self.assertEqual(get_client_ip(f.get('/',REMOTE_ADDR='',HTTP_X_REAL_IP='198.51.100.3')),'198.51.100.3');self.assertEqual(get_client_ip(f.get('/',REMOTE_ADDR='127.0.0.1',HTTP_X_FORWARDED_FOR='203.0.113.2, 198.51.100.9')),'198.51.100.9')
 @override_settings(MLKINO_TRUSTED_PROXIES=[],MLKINO_TRUST_PROXY_HEADERS_WITHOUT_REMOTE=False)
 def test_untrusted_spoofing_is_ignored(self):
  f=RequestFactory();self.assertEqual(get_client_ip(f.get('/',REMOTE_ADDR='203.0.113.4',HTTP_X_FORWARDED_FOR='1.1.1.1')),'203.0.113.4');self.assertIsNone(get_client_ip(f.get('/',REMOTE_ADDR='',HTTP_X_REAL_IP='1.1.1.1')))
