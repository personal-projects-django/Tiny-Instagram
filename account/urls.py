from tempfile import template

from django.urls import path
from . import views
from django.contrib.auth.views import  PasswordChangeView, PasswordChangeDoneView
from django.views.generic import TemplateView
from rest_framework_simplejwt.views import TokenObtainPairView,TokenRefreshView



urlpatterns = [
    # path('', TemplateView.as_view(template_name='home/base.html'), name='base'),
    # path('add', TemplateView.as_view(template_name='home/register.html'), name='add'),
    path('register/', views.UserRegisterView.as_view(), name='register'),
    path('verify-otp/', views.VerifyOTPAPIView.as_view(), name='verify-otp'),
    # path('verify-otp/', views.LoginWithOTPAPIView.as_view(), name='verify-otp'),
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    # path('', views.Home.as_view(), name='home'),







    # path('profile/<int:user_id>/password-change/',
    #      PasswordChangeView.as_view(template_name='accounts/password/password_change.html'), name='password_change'),
    # path('password-change-done/',
    #      PasswordChangeDoneView.as_view(template_name='accounts/password/password_change_done.html'),
    #      name='password_change_done'),

]