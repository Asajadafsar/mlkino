from asgiref.sync import async_to_sync
from channels.db import database_sync_to_async
from channels.testing import WebsocketCommunicator
from django.contrib.auth import get_user_model
from django.test import TransactionTestCase, TestCase
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import AccessToken
from .models import DirectConversation, DirectMessage

User = get_user_model()


class ChatApiTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user('09121111111', role='agency')
        self.peer = User.objects.create_user('09121111112', role='user')
        self.outsider = User.objects.create_user('09121111113', role='user')
        self.client = APIClient()
        self.client.force_authenticate(self.user)
        self.chat = DirectConversation.objects.create(user1=self.user, user2=self.peer)

    def test_conversation_messages_and_read_receipt_permissions(self):
        response = self.client.post(f'/panel/chats/{self.chat.pk}/messages/', {'body': 'سلام'}, format='json')
        self.assertEqual(response.status_code, 201, response.data)
        self.assertEqual(response.data['data']['body'], 'سلام')
        message_id = response.data['data']['id']
        self.client.force_authenticate(self.outsider)
        self.assertEqual(self.client.get(f'/panel/chats/{self.chat.pk}/messages/').status_code, 404)
        self.client.force_authenticate(self.peer)
        self.assertEqual(self.client.post(f'/panel/chats/{self.chat.pk}/read/', {'last_message_id': message_id}, format='json').status_code, 200)
        self.assertIsNotNone(DirectMessage.objects.get(pk=message_id).read_at)
        self.assertEqual(self.client.delete(f'/panel/chats/{self.chat.pk}/messages/{message_id}/').status_code, 404)

    def test_settings_are_persistent_and_only_admin_can_save(self):
        response = self.client.get('/panel/settings/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(self.client.patch('/panel/settings/', {'general': {'panelName': 'تست'}}, format='json').status_code, 403)
        admin = User.objects.create_superuser('09121111114', 'temporary-password')
        self.client.force_authenticate(admin)
        self.assertEqual(self.client.patch('/panel/settings/', {'general': {'panelName': 'پنل تست'}}, format='json').status_code, 200)
        self.client.force_authenticate(self.peer)
        self.assertEqual(self.client.get('/panel/settings/').data['data']['general']['panelName'], 'پنل تست')


class RealtimeTests(TransactionTestCase):
    def test_live_message_delivery_call_signaling_and_access_control(self):
        user = User.objects.create_user('09122222221')
        peer = User.objects.create_user('09122222222')
        outsider = User.objects.create_user('09122222223')
        chat = DirectConversation.objects.create(user1=user, user2=peer)
        from mlkino.asgi import application

        def socket(person, origin='http://localhost:3000'):
            headers = [(b'origin', origin.encode())]
            if person: headers.append((b'cookie', f'accessToken={AccessToken.for_user(person)}'.encode()))
            return WebsocketCommunicator(application, '/ws/inbox/', headers=headers)

        async def verify():
            first, second, third = socket(user), socket(peer), socket(outsider)
            for client in (first, second, third):
                self.assertTrue((await client.connect())[0])
                self.assertEqual((await client.receive_json_from())['event'], 'inbox.connected')
            api = APIClient(); api.force_authenticate(user)
            response = await database_sync_to_async(api.post)(f'/panel/chats/{chat.pk}/messages/', {'body': 'پیام لحظه‌ای'}, format='json')
            self.assertEqual(response.status_code, 201)
            for client in (first, second):
                event = await client.receive_json_from()
                self.assertEqual(event['event'], 'chat.message')
                self.assertEqual(event['data']['body'], 'پیام لحظه‌ای')
            self.assertTrue(await third.receive_nothing(timeout=.1))
            await first.send_json_to({'event': 'call.offer', 'data': {'conversation': chat.pk, 'call_id': 'test-call', 'description': {'type': 'offer', 'sdp': 'test-offer'}}})
            signal = await second.receive_json_from()
            self.assertEqual(signal['event'], 'call.offer')
            self.assertEqual(signal['data']['sender']['id'], user.pk)
            await third.send_json_to({'event': 'call.end', 'data': {'conversation': chat.pk, 'call_id': 'test-call'}})
            self.assertEqual((await third.receive_json_from())['event'], 'chat.error')
            await second.send_json_to({'event': 'call.answer', 'data': {'conversation': chat.pk, 'call_id': 'test-call', 'description': {'type': 'answer', 'sdp': 'test-answer'}}})
            self.assertEqual((await first.receive_json_from())['event'], 'call.answer')
            for client in (first, second, third): await client.disconnect()
            for rejected in (socket(None), socket(user, 'https://untrusted.invalid')):
                self.assertFalse((await rejected.connect())[0]); await rejected.disconnect()
        async_to_sync(verify)()
