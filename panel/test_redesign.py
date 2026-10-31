from datetime import timedelta
from django.test import TestCase
from django.core.cache import cache
from django.utils import timezone
from rest_framework.test import APIClient
from accounts.models import User, AgencyExpert, ActivityLog
from panel.models import ImportantTask, TaskAssignment

class RedesignFlowTests(TestCase):
    def setUp(self):
        cache.clear()
        self.admin=User.objects.create_superuser('09125555000','test-password')
        self.agency=User.objects.create_user('09125555001',role='agency')
        self.expert=User.objects.create_user('09125555002',role='expert')
        self.other=User.objects.create_user('09125555003',role='expert')
        AgencyExpert.objects.create(agency=self.agency,expert=self.expert)
        self.client=APIClient();self.client.force_authenticate(self.agency)
    def test_future_task_is_visible_after_creation_and_today_is_explicit(self):
        tomorrow=(timezone.localdate()+timedelta(days=1)).isoformat()
        response=self.client.post('/panel/tasks/',{'title':'کار فردا','description':'تست','due_date':tomorrow,'assignee_ids':[self.agency.pk,self.expert.pk]},format='json')
        self.assertEqual(response.status_code,201,response.data)
        task_id=response.data['data']['id']
        rows=self.client.get('/panel/tasks/').data['data']['results']
        self.assertIn(task_id,[row['id'] for row in rows])
        self.assertEqual(self.client.get('/panel/tasks/?period=today').data['data']['results'],[])
        data=self.client.get('/panel/tasks/?period=upcoming&page=1&page_size=12').data['data']
        self.assertEqual(data['total_results'],1);self.assertEqual(data['stats']['pending'],1)
        self.client.force_authenticate(self.expert)
        self.assertEqual(self.client.get('/panel/tasks/').data['data']['results'][0]['id'],task_id)
        self.assertEqual(self.client.patch(f'/panel/tasks/{task_id}/',{'title':'تغییر غیرمجاز'},format='json').status_code,403)
        assignment=TaskAssignment.objects.get(task_id=task_id,assignee=self.expert)
        self.assertEqual(self.client.patch(f'/panel/tasks/assignments/{assignment.pk}/',{'status':'done'},format='json').status_code,403)
        self.client.force_authenticate(self.other)
        self.assertEqual(self.client.get('/panel/tasks/').data['data']['results'],[])
        self.assertEqual(self.client.get(f'/panel/tasks/{task_id}/').status_code,404)
    def test_logs_filters_and_csv_are_root_only(self):
        ActivityLog.objects.create(actor=self.agency,event='test.success',path='/test',method='POST',status_code=201)
        ActivityLog.objects.create(actor=self.expert,event='test.failed',path='/test',method='PATCH',status_code=400)
        self.assertEqual(self.client.get('/panel/activity-logs/').status_code,403)
        self.client.force_authenticate(self.admin)
        response=self.client.get('/panel/activity-logs/?status=failure&method=PATCH')
        self.assertEqual(response.status_code,200,response.data)
        self.assertEqual(response.data['data']['stats']['failure'],1)
        self.assertEqual(response.data['data']['results'][0]['event'],'test.failed')
        export=self.client.get('/panel/activity-logs/?status=failure&export=csv')
        self.assertEqual(export.status_code,200)
        self.assertIn('test.failed',export.content.decode('utf-8'));self.assertNotIn('test.success',export.content.decode('utf-8'))
        self.assertEqual(self.client.get('/panel/activity-logs/?start_date=bad').status_code,400)
    def test_settings_roundtrip_and_permissions(self):
        self.assertEqual(self.client.patch('/panel/settings/',{'general':{'panelName':'غیرمجاز'}},format='json').status_code,403)
        self.client.force_authenticate(self.admin)
        response=self.client.patch('/panel/settings/',{'general':{'panelName':'ملکینو آزمایشی','timezone':'Asia/Tehran'},'contact':{'email':'test@example.com'}},format='json')
        self.assertEqual(response.status_code,200,response.data)
        self.assertEqual(self.client.get('/panel/settings/').data['data']['contact']['email'],'test@example.com')
        self.assertEqual(self.client.patch('/panel/settings/',{'general':{'timezone':'not/a-zone'}},format='json').status_code,400)
