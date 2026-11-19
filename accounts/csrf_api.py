"""Expose a masked CSRF token to allowed browser origins, never auth tokens."""
from django.http import JsonResponse
from django.conf import settings
from django.middleware.csrf import get_token
from django.utils.cache import patch_vary_headers
from django.views.decorators.http import require_GET


@require_GET
def csrf_token(request):
    response = JsonResponse({'csrfToken': get_token(request), 'csrfCookiePresent': bool(request.COOKIES.get(settings.CSRF_COOKIE_NAME))})
    response['Cache-Control'] = 'private, no-store'
    patch_vary_headers(response, ('Cookie', 'Origin'))
    return response
