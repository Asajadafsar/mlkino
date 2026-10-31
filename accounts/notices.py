from django.db import transaction
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from .models import AccountPreferences, AccountNotification

NOTIFICATION_DEFAULTS = {'in_app': True, 'ticket_updates': True, 'task_updates': True, 'browser': False}
PRIVACY_DEFAULTS = {'listed_in_contacts': True, 'allow_new_conversations': True}


def notification_values(user):
    obj = AccountPreferences.objects.filter(user=user).first()
    return {**NOTIFICATION_DEFAULTS, **(obj.notifications if obj else {})}


def notify(user, kind, title, body='', link=''):
    values = notification_values(user)
    if not values['in_app'] or not values.get(f'{kind}_updates', True): return None
    notice = AccountNotification.objects.create(user=user, kind=kind, title=title, body=body, link=link)
    def publish():
        layer = get_channel_layer()
        if layer:
            async_to_sync(layer.group_send)(f'inbox_{user.pk}', {'type':'chat.event','event':'account.notification','data':{
                'id':notice.pk,'title':notice.title,'body':notice.body,'link':notice.link,'created_at':notice.created_at.isoformat()}})
    transaction.on_commit(publish)
    return notice
