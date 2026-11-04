"""Short-lived TURN credentials for authenticated callers."""
import base64
import hashlib
import hmac
import time
from django.conf import settings
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView


class CallConfigView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        servers = [{'urls': 'stun:stun.l.google.com:19302'}]
        secret = getattr(settings, 'MLKINO_TURN_SECRET', '')
        urls = getattr(settings, 'MLKINO_TURN_URLS', [])
        if secret and urls:
            username = f'{int(time.time()) + 3600}:{request.user.pk}'
            credential = base64.b64encode(hmac.new(secret.encode(), username.encode(), hashlib.sha1).digest()).decode()
            servers = [{'urls': urls, 'username': username, 'credential': credential}]
        response = Response({'data': {'ice_servers': servers}})
        response['Cache-Control'] = 'no-store, private'
        return response
