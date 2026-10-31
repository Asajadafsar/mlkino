from django.urls import path
from .profile_api import PreferencesView, SessionsView, NotificationsView, OwnActivityView

from accounts import views

app_name = "accounts"

urlpatterns = [
    # احراز هویت
    path("send-otp/", views.SendOtpView.as_view(), name="send-otp"),
    path("verify-otp/", views.VerifyOtpView.as_view(), name="verify-otp"),
    path("complete-register/", views.CompleteRegisterView.as_view(), name="complete-register"),
    path("login/password/", views.PasswordLoginView.as_view(), name="login-password"),
    path("change-password/", views.ChangePasswordView.as_view(), name="change-password"),
    path("login/otp/", views.LoginWithOtpView.as_view(), name="login-otp"),
    # پروفایل
    path("profile/", views.ProfileView.as_view(), name="profile"),
    path(
    "postal/lookup/",
    views.PostalLookupView.as_view(),
    name="postal-lookup",
),
    # session
    path("logout/", views.LogoutView.as_view(), name="logout"),
    path("token/refresh/", views.RefreshTokenView.as_view(), name="refresh"),
    path("activity/event/", views.RecordActivityEventView.as_view(), name="activity-event"),
    path('preferences/', PreferencesView.as_view(), name='preferences'),
    path('sessions/', SessionsView.as_view(), name='sessions'),
    path('sessions/<uuid:session_id>/', SessionsView.as_view(), name='session-revoke'),
    path('notifications/', NotificationsView.as_view(), name='notifications'),
    path('activity/', OwnActivityView.as_view(), name='own-activity'),
]