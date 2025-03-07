from tempfile import template

from django.urls import path
from . import views
from django.contrib.auth.views import  PasswordChangeView, PasswordChangeDoneView
from django.views.generic import TemplateView
from rest_framework_simplejwt.views import TokenObtainPairView,TokenRefreshView

from rest_framework.authtoken import views as auth_token


urlpatterns = [
    # path('', TemplateView.as_view(template_name='home/base.html'), name='base'),
    # path('add', TemplateView.as_view(template_name='home/register.html'), name='add'),

    # register
    path('register/', views.UserRegisterView.as_view(), name='register'),
    path('verify_otp/', views.VerifyOTPView.as_view(), name='verify_otp'),
    # path('resend_otp/', views.ResendOTPView.as_view(), name='resend_otp'),
    path('login/', views.UserLoginView.as_view(), name='login'),
    path('update/<int:user_pk>/', views.UserUpdateView.as_view(), name='user_update'),

    # password
    path('password_reset/', views.PasswordResetRequestView.as_view(), name='password_reset'),
    path('password_reset_confirm/<uidb64>/<token>/', views.PasswordResetConfirm.as_view(), name='password_reset_confirm'),
    path('set_new_password/', views.SetNewPasswordView.as_view(), name='set_new_password'),

    # logout
    path('logout/', views.LogoutUserView.as_view(), name='logout'),

    # profile
    path('profile/', views.ProfileView.as_view(), name='profile'),
    path('profile/<int:profile_pk>/', views.ProfileView.as_view(), name='profile_get'),
    path('profile_update/<int:profile_pk>/', views.ProfileUpdateView.as_view(), name='profile_update'),
    path('profile_delete/<int:profile_pk>/', views.ProfileDeleteView.as_view(), name='profile_delete'),


    # auth_token
    # path('api-token-auth/', auth_token.obtain_auth_token),

    # TOKEN JWT
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

]