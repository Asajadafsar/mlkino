from .plan_catalog import PlanCatalogView
from .onboarding_api import Applications, ApplicationDecision, ApplicationPayment, ApplicationResume, OfficeLookup, OfficePromotions, DiamondAdCopy, GatewaySettings, DemoCheckout
from .private_media import PrivateDocumentView
from django.urls import path
from .profile_api import PreferencesView, SessionsView, NotificationsView, OwnActivityView

from accounts import views
from .csrf_api import csrf_token

app_name = "accounts"

urlpatterns = [
    path("plans/", PlanCatalogView.as_view(), {'collection':'plans'}),
    path("plans/<int:pk>/", PlanCatalogView.as_view(), {'collection':'plans'}),
    path("plan-capabilities/", PlanCatalogView.as_view(), {'collection':'capabilities'}),
    path("plan-capabilities/<int:pk>/", PlanCatalogView.as_view(), {'collection':'capabilities'}),
    path("role-applications/", Applications.as_view()),
    path("role-applications/<int:pk>/decision/", ApplicationDecision.as_view()),
    path("role-applications/<int:pk>/payment/", ApplicationPayment.as_view()),
    path("role-applications/<int:pk>/resume/", ApplicationResume.as_view()),
    path("office-lookup/", OfficeLookup.as_view()),
    path("office-promotions/", OfficePromotions.as_view()),
    path("gateway-settings/", GatewaySettings.as_view()),
    path("demo-checkout/", DemoCheckout.as_view()),
    path("diamond-ad-copy/", DiamondAdCopy.as_view()),
    path('csrf/', csrf_token, name='csrf-token'),
    path("documents/<int:user_id>/<str:kind>/",PrivateDocumentView.as_view(),name="private-document"),
    path("session/", views.LandingSessionView.as_view(), name="landing-session"),
    path("identity/retry/", views.IdentityRetryView.as_view(),name="identity-retry"),
    # احراز هویت
    path("send-otp/", views.SendOtpView.as_view(), name="send-otp"),
    path("verify-otp/", views.VerifyOtpView.as_view(), name="verify-otp"),
    path("complete-register/", views.CompleteRegisterView.as_view(), name="complete-register"),
    path("login/password/", views.PasswordLoginView.as_view(), name="login-password"),
    path("change-password/", views.ChangePasswordView.as_view(), name="change-password"),
    path("password/change/send-otp/", views.PasswordChangeSendOtpView.as_view(), name="password-change-send-otp"),
    path("password/change/verify-otp/", views.PasswordChangeVerifyOtpView.as_view(), name="password-change-verify-otp"),
    path("password/reset/send-otp/", views.PasswordResetSendOtpView.as_view(), name="password-reset-send-otp"),
    path("password/reset/verify-otp/", views.PasswordResetVerifyOtpView.as_view(), name="password-reset-verify-otp"),
    path("password/reset/complete/", views.PasswordResetCompleteView.as_view(), name="password-reset-complete"),
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
