from django.urls import path
from . import views
from django.contrib.auth.views import  PasswordChangeView, PasswordChangeDoneView

from rest_framework_simplejwt.views import TokenObtainPairView,TokenRefreshView



urlpatterns = [
    path('', views.UserRegisterView.as_view(), name='register'),
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    # path('', views.Home.as_view(), name='home'),







    # path('profile/<int:user_id>/password-change/',
    #      PasswordChangeView.as_view(template_name='accounts/password/password_change.html'), name='password_change'),
    # path('password-change-done/',
    #      PasswordChangeDoneView.as_view(template_name='accounts/password/password_change_done.html'),
    #      name='password_change_done'),

]