from django.urls import path
from . import views


urlpatterns = [
    path('post/', views.PostView.as_view(), name='post'),
    path('post/<int:post_pk>/', views.PostView.as_view(), name='post'),
    path('post_list/', views.PostListView.as_view(), name='post_list'),
    path('post/<int:post_pk>/comments/', views.CommentView.as_view(), name='comment'),
    path('post/<int:post_pk>/likes/', views.LikeView.as_view(), name='like'),





]