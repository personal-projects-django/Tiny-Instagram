from django.urls import path
from . import views


urlpatterns = [
    path('users-list/', views.UserListView.as_view()),
    path('request/', views.RequestView.as_view()),
    path('requests-list/', views.RequestListView.as_view()),
    path('accept/', views.AcceptView.as_view()),
    path('friends/', views.FriendListView.as_view())



]



