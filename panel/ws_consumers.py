import json
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from channels.db import database_sync_to_async

@database_sync_to_async
def can_access(user, chat_id):
    from django.db.models import Q
    from panel.models import DirectConversation
    return bool(user and user.is_authenticated and user.is_active and DirectConversation.objects.filter(pk=chat_id).filter(Q(user1_id=user.pk)|Q(user2_id=user.pk)).exists())

@database_sync_to_async
def peer_blocked(user, chat_id):
    from panel.models import DirectConversation, ChatBlock
    from django.db.models import Q
    chat = DirectConversation.objects.filter(pk=chat_id).first()
    if not chat: return True
    peer_id = chat.user2_id if chat.user1_id == user.pk else chat.user1_id
    return ChatBlock.objects.filter(Q(blocker_id=user.pk, blocked_id=peer_id)|Q(blocker_id=peer_id, blocked_id=user.pk)).exists()

class ChatConsumer(AsyncJsonWebsocketConsumer):
    async def valid_identity(self):
        from .ws_auth import authenticated_user
        user = await authenticated_user(self.scope.get('access_token'), self.scope.get('impersonation_token'))
        return bool(user and user.is_authenticated and user.pk == self.user.pk)

    async def connect(self):
        self.chat_id = self.scope['url_route']['kwargs']['chat_id']
        self.user = self.scope.get('user')
        if not await can_access(self.user, self.chat_id):
            await self.close(code=4403)
            return
        self.group = f'chat_{self.chat_id}'
        await self.channel_layer.group_add(self.group, self.channel_name)
        await self.accept()
        await self.send_json({'event':'chat.connected','data':{'conversation':self.chat_id}})

    async def disconnect(self, code):
        if hasattr(self,'group'):
            await self.channel_layer.group_discard(self.group, self.channel_name)

    async def receive_json(self, content, **kwargs):
        if not await self.valid_identity():
            await self.close(code=4401)
            return
        if not isinstance(content,dict):
            await self.send_json({'event':'chat.error','data':{'message':'Invalid payload'}})
            return
        event = content.get('event')
        data = content.get('data') or {}
        if not isinstance(data,dict): data={}
        if event == 'chat.ping':
            await self.send_json({'event':'chat.pong','data':{}})
        elif event == 'chat.typing':
            if await can_access(self.user,self.chat_id) and not await peer_blocked(self.user,self.chat_id):
                await self.channel_layer.group_send(self.group, {'type':'chat.event','event':'chat.typing','data':{'conversation':self.chat_id,'user_id':self.user.pk,'is_typing':bool(data.get('is_typing',True))}})
            else:
                await self.send_json({'event':'chat.error','data':{'message':'Forbidden'}})
        else:
            await self.send_json({'event':'chat.error','data':{'message':'Unsupported event; send messages/read receipts through REST API'}})

    async def chat_event(self, event):
        if not await self.valid_identity() or not await can_access(self.user,self.chat_id):
            await self.close(code=4403)
            return
        await self.send_json({'event':event['event'],'data':event['data']})


@database_sync_to_async
def signal_peer(user, conversation):
    from panel.models import DirectConversation, ChatBlock
    from django.db.models import Q
    chat = DirectConversation.objects.filter(pk=conversation).filter(Q(user1=user) | Q(user2=user)).first()
    if not chat:
        return None
    peer = chat.user2 if chat.user1_id == user.pk else chat.user1
    if not peer.is_active or ChatBlock.objects.filter(Q(blocker=user, blocked=peer) | Q(blocker=peer, blocked=user)).exists():
        return None
    return peer.pk


class InboxConsumer(AsyncJsonWebsocketConsumer):
    async def valid_identity(self):
        from .ws_auth import authenticated_user
        user = await authenticated_user(self.scope.get('access_token'), self.scope.get('impersonation_token'))
        return bool(user and user.is_authenticated and user.pk == self.user.pk)

    async def connect(self):
        self.user = self.scope.get('user')
        if not self.user or not self.user.is_authenticated or not self.user.is_active:
            await self.close(code=4401)
            return
        self.group = f'inbox_{self.user.pk}'
        await self.channel_layer.group_add(self.group, self.channel_name)
        await self.accept()
        await self.send_json({'event': 'inbox.connected', 'data': {'user_id': self.user.pk}})

    async def disconnect(self, code):
        if hasattr(self, 'group'):
            await self.channel_layer.group_discard(self.group, self.channel_name)

    async def receive(self, text_data=None, bytes_data=None, **kwargs):
        if bytes_data is not None or (text_data and len(text_data) > 65536):
            await self.close(code=4400)
            return
        try:
            await super().receive(text_data=text_data, bytes_data=bytes_data, **kwargs)
        except (ValueError, TypeError):
            await self.send_json({'event': 'chat.error', 'data': {'message': 'پیام نامعتبر است'}})

    async def receive_json(self, content, **kwargs):
        if not await self.valid_identity():
            await self.close(code=4401)
            return
        if not isinstance(content, dict):
            return
        event = content.get('event')
        if event == 'chat.ping':
            await self.send_json({'event': 'chat.pong', 'data': {}})
            return
        if event not in {'chat.typing', 'call.offer', 'call.answer', 'call.ice', 'call.end', 'call.reject'}:
            return
        data = content.get('data')
        if not isinstance(data, dict):
            return
        conversation = data.get('conversation')
        if not isinstance(conversation, int) or conversation < 1:
            return
        peer_id = await signal_peer(self.user, conversation)
        if not peer_id:
            await self.send_json({'event': 'chat.error', 'data': {'message': 'دسترسی به گفتگو ندارید'}})
            return
        if event.startswith('call.'):
            call_id = data.get('call_id')
            if not isinstance(call_id, str) or not 1 <= len(call_id) <= 80:
                return
            if event in {'call.offer', 'call.answer'}:
                description = data.get('description')
                expected = 'offer' if event == 'call.offer' else 'answer'
                if not isinstance(description, dict) or description.get('type') != expected or not isinstance(description.get('sdp'), str):
                    return
        payload = {key: data[key] for key in ('conversation', 'call_id', 'description', 'candidate', 'video', 'is_typing') if key in data}
        payload['sender'] = {'id': self.user.pk, 'name': self.user.full_name or f'کاربر #{self.user.pk}'}
        await self.channel_layer.group_send(f'inbox_{peer_id}', {'type': 'chat.event', 'event': event, 'data': payload})

    async def chat_event(self, event):
        if not await self.valid_identity():
            await self.close(code=4401)
            return
        await self.send_json({'event': event['event'], 'data': event['data']})
