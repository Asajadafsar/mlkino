from django.urls import path

from panel import views

app_name = "panel"

urlpatterns = [
    # اطلاعیه‌ها
    path(
        "announcements/",
        views.AnnouncementListCreateView.as_view(),
        name="announcement-list-create",
    ),
    path(
        "announcements/<int:announcement_id>/",
        views.AnnouncementDetailView.as_view(),
        name="announcement-detail",
    ),
]