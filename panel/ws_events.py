"""Broadcast REST writes to the corresponding WebSocket room."""
import logging
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from django.conf import settings
logger = logging.getLogger(__name__)

def emit(chat_id, event, data):
    layer = get_channel_layer()
    if layer is None:
        logger.error('CHANNEL_LAYERS is not configured; WS event %s not delivered', event)
        return
    try:
        async_to_sync(layer.group_send)(f'chat_{chat_id}', {'type':'chat.event', 'event':event, 'data':data})
    except Exception:
        logger.exception('Failed to publish chat websocket event %s', event)

def publish_chat_message(message_id):
    from panel.models import DirectMessage
    from panel.serializers import ChatMessageSerializer
    obj = DirectMessage.objects.select_related('sender').filter(pk=message_id).first()
    if obj: emit(obj.conversation_id, 'chat.message', ChatMessageSerializer(obj).data)

def publish_chat_read(chat_id, reader_id, last_message_id):
    emit(chat_id, 'chat.message.read', {'conversation':chat_id,'reader_id':reader_id,'last_message_id':last_message_id})

def publish_chat_deleted(chat_id, message_id):
    emit(chat_id, 'chat.message.deleted', {'conversation':chat_id,'message_id':message_id})
