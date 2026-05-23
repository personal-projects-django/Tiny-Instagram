from django.urls import path
from . import views

urlpatterns = [
    path('',                                   views.PostCreateView.as_view()),
    path('feed/',                              views.FeedView.as_view()),
    path('explore/',                           views.ExploreView.as_view()),
    path('saved/',                             views.SavedPostsListView.as_view()),
    path('comments/<int:comment_id>/delete/',  views.CommentDeleteView.as_view()),
    path('user/<str:username>/',               views.UserPostsView.as_view()),   # ← پیشوند user/
    path('<int:pk>/',                          views.PostDetailView.as_view()),
    path('<int:post_id>/like/',                views.LikeToggleView.as_view()),
    path('<int:post_id>/comments/',            views.CommentListCreateView.as_view()),
    path('<int:post_id>/save/',                views.SavedPostToggleView.as_view()),
]


# urlpatterns = [
#     path('posts/user/<int:user_id>/', views.UserPostsView.as_view(), name='user-posts'),
#     path('post/', views.PostView.as_view(), name='post'),
#     path('post/<int:post_pk>/', views.GetPostView.as_view(), name='post'),
#     path('post_update/<int:post_pk>/', views.PostUpdateView.as_view(), name='post_update'),
#     path('post_delete/<int:post_pk>/', views.PostDeleteView.as_view(), name='post_delete'),
#     path('post_list/', views.PostListView.as_view(), name='post_list'),
#     path('post/<int:post_pk>/comments/', views.CommentView.as_view(), name='comment'),
#     path('postget/<int:post_pk>/likes/', views.LikeView.as_view(), name='like'),
#     path('post/<int:post_pk>/likes/', views.PostLikeView.as_view(), name='like'),
# ]




