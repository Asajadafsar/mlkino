from django.test import TestCase
from django.core.cache import cache
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import AccessToken, RefreshToken
from accounts.models import User, DeviceSession, AccountNotification, ActivityLog
from accounts.serializers import build_tokens_for_user

class ProfileFeaturesTests(TestCase):
    def setUp(self):
        cache.clear()
        self.user=User.objects.create_user('09124444000','test-password',first_name='کاربر',last_name='آزمایشی')
        self.other=User.objects.create_user('09124444001','test-password')
        self.client=APIClient()
        self.tokens=build_tokens_for_user(self.user)
        self.client.credentials(HTTP_AUTHORIZATION='Bearer '+self.tokens['access'])

    def test_profile_patch_only_supported_fields_and_clear_optional_data(self):
        response=self.client.patch('/accounts/profile/',{'first_name':'نام جدید','email':None,'postal_code':None},format='json')
        self.assertEqual(response.status_code,200,response.data)
        self.user.refresh_from_db()
        self.assertEqual(self.user.first_name,'نام جدید')
        self.assertIsNotNone(self.user.profile_updated_at)
        self.assertEqual(self.client.patch('/accounts/profile/',{'role':'superadmin'},format='json').status_code,400)

    def test_preferences_roundtrip_and_reject_unknown_or_nonboolean(self):
        response=self.client.patch('/accounts/preferences/',{'privacy':{'listed_in_contacts':False},'notifications':{'browser':True}},format='json')
        self.assertEqual(response.status_code,200,response.data)
        saved=self.client.get('/accounts/preferences/').data['data']
        self.assertFalse(saved['privacy']['listed_in_contacts'])
        self.assertTrue(saved['privacy']['allow_new_conversations'])
        self.assertTrue(saved['notifications']['browser'])
        self.assertEqual(self.client.patch('/accounts/preferences/',{'privacy':{'hidden':True}},format='json').status_code,400)
        self.assertEqual(self.client.patch('/accounts/preferences/',{'privacy':{'listed_in_contacts':'false'}},format='json').status_code,400)

    def test_revoked_session_access_and_refresh_stop_working(self):
        second=build_tokens_for_user(self.user)
        other=build_tokens_for_user(self.other)
        current=str(AccessToken(self.tokens['access'])['sid'])
        second_id=str(AccessToken(second['access'])['sid'])
        other_id=str(AccessToken(other['access'])['sid'])
        response=self.client.get('/accounts/sessions/')
        self.assertEqual(response.status_code,200,response.data)
        rows=response.data['data']['results']
        self.assertEqual(len(rows),2)
        self.assertTrue(next(row for row in rows if row['id']==current)['current'])
        self.assertEqual(self.client.delete('/accounts/sessions/'+current+'/').status_code,409)
        self.assertEqual(self.client.delete('/accounts/sessions/'+other_id+'/').data['data']['revoked'],0)
        self.assertEqual(self.client.delete('/accounts/sessions/'+second_id+'/').data['data']['revoked'],1)
        self.client.cookies.clear()
        self.client.credentials(HTTP_AUTHORIZATION='Bearer '+second['access'])
        self.assertEqual(self.client.get('/accounts/profile/').status_code,401)
        self.client.credentials()
        self.client.cookies['refreshToken']=second['refresh']
        self.assertEqual(self.client.post('/accounts/token/refresh/').status_code,401)
        self.assertIsNone(DeviceSession.objects.get(pk=other_id).revoked_at)

    def test_notification_read_and_activity_are_scoped_to_self(self):
        mine=AccountNotification.objects.create(user=self.user,kind='task',title='کار جدید')
        theirs=AccountNotification.objects.create(user=self.other,kind='task',title='کار دیگر')
        response=self.client.get('/accounts/notifications/').data['data']
        self.assertEqual([row['id'] for row in response['results']],[mine.pk])
        self.client.patch('/accounts/notifications/',{'ids':[mine.pk,theirs.pk]},format='json')
        mine.refresh_from_db();theirs.refresh_from_db()
        self.assertIsNotNone(mine.read_at);self.assertIsNone(theirs.read_at)
        ActivityLog.objects.create(actor=self.user,event='test.mine',path='/test',method='GET',status_code=200)
        ActivityLog.objects.create(actor=self.other,event='test.other',path='/test',method='GET',status_code=200)
        events=[row['event'] for row in self.client.get('/accounts/activity/').data['data']['results']]
        self.assertIn('test.mine',events);self.assertNotIn('test.other',events)

    def test_password_change_revokes_previous_devices_and_keeps_new_login(self):
        second=build_tokens_for_user(self.user)
        response=self.client.post('/accounts/change-password/',{'old_password':'test-password','new_password':'new-test-password','new_password_confirm':'new-test-password'},format='json')
        self.assertEqual(response.status_code,200,response.data)
        self.user.refresh_from_db();self.assertTrue(self.user.check_password('new-test-password'))
        self.assertEqual(DeviceSession.objects.filter(user=self.user,revoked_at__isnull=True).count(),1)
        access=response.cookies['accessToken'].value
        self.client.credentials(HTTP_AUTHORIZATION='Bearer '+access)
        self.assertEqual(self.client.get('/accounts/profile/').status_code,200)
        self.client.cookies.clear()
        self.client.credentials(HTTP_AUTHORIZATION='Bearer '+second['access'])
        self.assertEqual(self.client.get('/accounts/profile/').status_code,401)

    def test_privacy_controls_contacts_and_new_conversations(self):
        from accounts.models import AccountPreferences
        from panel.models import DirectConversation
        AccountPreferences.objects.create(user=self.other,privacy={'listed_in_contacts':False,'allow_new_conversations':False})
        response=self.client.get('/panel/chats/contacts/')
        self.assertEqual(response.status_code,200,response.data)
        self.assertNotIn(self.other.pk,[row['id'] for row in response.data['data']])
        response=self.client.post('/panel/chats/',{'user_id':self.other.pk},format='json')
        self.assertEqual(response.status_code,403,response.data)
        chat=DirectConversation.objects.create(user1=self.user,user2=self.other)
        self.assertEqual(self.client.get(f'/panel/chats/{chat.pk}/').status_code,200)

    def test_legacy_login_can_be_managed_without_password(self):
        legacy=RefreshToken.for_user(self.user)
        self.client.credentials(HTTP_AUTHORIZATION='Bearer '+str(legacy.access_token))
        self.client.cookies['refreshToken']=str(legacy)
        response=self.client.get('/accounts/sessions/')
        self.assertEqual(response.status_code,200,response.data)
        self.assertTrue(response.data['data']['current_id'])
        upgraded=AccessToken(response.cookies['accessToken'].value)
        self.assertEqual(str(upgraded['sid']),response.data['data']['current_id'])
