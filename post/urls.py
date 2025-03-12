from django.urls import path
from . import views


urlpatterns = [
    path('posts/user/<int:user_id>/', views.UserPostsView.as_view(), name='user-posts'),
    path('post/', views.PostView.as_view(), name='post'),
    path('post/<int:post_pk>/', views.GetPostView.as_view(), name='post'),
    path('post_update/<int:post_pk>/', views.PostUpdateView.as_view(), name='post_update'),
    path('post_delete/<int:post_pk>/', views.PostDeleteView.as_view(), name='post_delete'),
    path('post_list/', views.PostListView.as_view(), name='post_list'),
    path('post/<int:post_pk>/comments/', views.CommentView.as_view(), name='comment'),
    path('postget/<int:post_pk>/likes/', views.LikeView.as_view(), name='like'),
    path('post/<int:post_pk>/likes/', views.PostLikeView.as_view(), name='like'),





]