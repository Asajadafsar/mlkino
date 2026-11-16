from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path

from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularRedocView,
    SpectacularSwaggerView,
)


urlpatterns = [
    # پنل ادمین جنگو
    path("admin/", admin.site.urls),

    # اپ panel
    # The public React panel is served by Nginx at /panel/. Keep its API
    # separate from that SPA route on the single mlkino.com origin.
    path("api/panel/", include("panel.urls")),

    # API
    path("api/accounts/", include("accounts.urls")),

    # مستندات
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path(
        "api/docs/",
        SpectacularSwaggerView.as_view(url_name="schema"),
        name="swagger-ui",
    ),
    path(
        "api/redoc/",
        SpectacularRedocView.as_view(url_name="schema"),
        name="redoc",
    ),
]


if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
