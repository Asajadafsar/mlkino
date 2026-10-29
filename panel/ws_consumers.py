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
        if not await can_access(self.user,self.chat_id):
            await self.close(code=4403)
            return
        await self.send_json({'event':event['event'],'data':event['data']})
