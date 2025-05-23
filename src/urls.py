"""
URL configuration for src project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/4.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path,include
from django.conf import settings
from django.conf.urls.static import static
from django.views.generic import TemplateView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('',include('account.urls')),
    path('',include('post.urls')),
    path('',include('follow.urls')),

    # path('',include('notification.urls')),
    # path('',include('story.urls')),

    path('', TemplateView.as_view(template_name='home/base.html'), name='base'),
    path('add/', TemplateView.as_view(template_name='home/register.html'), name='add'),
    path('otp/', TemplateView.as_view(template_name='home/verify_otp.html'), name='otp'),
    path('log/', TemplateView.as_view(template_name='home/login.html'), name='log'),
    path('dash/', TemplateView.as_view(template_name='home/dashboard.html'), name='dashboard'),
    path('pro/', TemplateView.as_view(template_name='home/profile.html'), name='pro'),
    path('mypro/', TemplateView.as_view(template_name='home/myprofile.html'), name='mypro'),
    path('edpro/', TemplateView.as_view(template_name='home/edit_profile.html'), name='edipro'),
    path('exp/', TemplateView.as_view(template_name='home/explore.html'), name='exp'),
    path('prosec/', TemplateView.as_view(template_name='home/profilesection.html'), name='prosec'),
    path('postha/', TemplateView.as_view(template_name='home/post.html'), name='postha'),
    path('crepost/', TemplateView.as_view(template_name='home/createpost.html'), name='crepost'),
    path('out/', TemplateView.as_view(template_name='home/logout.html'), name='out'),
    path('passreq/', TemplateView.as_view(template_name='home/password_request.html'), name='passreq'),
    path('passcon/', TemplateView.as_view(template_name='home/password_confirm.html'), name='passcon'),


]


if settings.DEBUG:
    urlpatterns += [
        path('__debug__/', include('debug_toolbar.urls')),
    ] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)