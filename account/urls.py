from django.urls import path
from . import views
from django.contrib.auth.views import  PasswordChangeView, PasswordChangeDoneView

urlpatterns = [







    path('profile/<int:user_id>/password-change/',
         PasswordChangeView.as_view(template_name='accounts/password/password_change.html'), name='password_change'),
    path('password-change-done/',
         PasswordChangeDoneView.as_view(template_name='accounts/password/password_change_done.html'),
         name='password_change_done'),

]