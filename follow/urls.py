from django.urls import path
from . import views


urlpatterns = [
    path('suggested/',                    views.SuggestedUsersView.as_view()),
    path('requests/',                     views.FollowRequestView.as_view()),           # ← جدید
    path('requests/<int:request_id>/',    views.FollowRequestView.as_view()),           # ← جدید
    path('<str:username>/follow/',        views.FollowToggleView.as_view()),
    path('<str:username>/followers/',     views.FollowersListView.as_view()),
    path('<str:username>/following/',     views.FollowingListView.as_view()),
]

# urlpatterns = [
#     path('users-list/', views.UserListView.as_view()),
#     path('request/', views.RequestView.as_view()),
#     path('requests-list/', views.RequestListView.as_view()),
#     path('accept/', views.AcceptView.as_view()),
#     path('friends/', views.FriendListView.as_view()),
#     path('unfollow/', views.UnfollowView.as_view()),
#
#
# ]



