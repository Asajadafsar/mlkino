from django.urls import path

from accounts import views

app_name = "accounts"

urlpatterns = [
    # احراز هویت
    path("send-otp/", views.SendOtpView.as_view(), name="send-otp"),
    path("verify-otp/", views.VerifyOtpView.as_view(), name="verify-otp"),
    path("complete-register/", views.CompleteRegisterView.as_view(), name="complete-register"),
    path("login/password/", views.PasswordLoginView.as_view(), name="login-password"),
    path("change-password/", views.ChangePasswordView.as_view(), name="change-password"),

    # پروفایل
    path("me/", views.MeView.as_view(), name="me"),

    # session
    path("logout/", views.LogoutView.as_view(), name="logout"),
    path("token/refresh/", views.RefreshTokenView.as_view(), name="refresh"),
]