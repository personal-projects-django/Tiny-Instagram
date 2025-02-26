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
    path('resend_otp/', views.ResendOTPView.as_view(), name='resend_otp'),
    path('login/', views.UserLoginView.as_view(), name='login'),
    path('user_update/<int:user_pk/>', views.UserUpdateView.as_view(), name='user_update'),


    # profile
    path('profile/', views.ProfileView.as_view(), name='profile'),
    path('profile/<int:profile_pk>/', views.ProfileView.as_view(), name='profile_get'),
    path('profile_update/<int:profile_pk>/', views.ProfileUpdateView.as_view(), name='profile_update'),
    path('profile_delete/<int:profile_pk>/', views.ProfileDeleteView.as_view(), name='profile_delete'),


    # auth_token
    path('api-token-auth/', auth_token.obtain_auth_token),

    # TOKEN JWT
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),


    # path('profile/<int:user_id>/password-change/',
    #      PasswordChangeView.as_view(template_name='accounts/password/password_change.html'), name='password_change'),
    # path('password-change-done/',
    #      PasswordChangeDoneView.as_view(template_name='accounts/password/password_change_done.html'),
    #      name='password_change_done'),

]