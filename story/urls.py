from django.urls import path
from story import views

urlpatterns = [
    path('',                              views.StoryFeedView.as_view(),    name='story-feed'),
    path('me/',                           views.MyStoriesView.as_view(),    name='my-stories'),
    path('archive/',                      views.MyStoriesArchiveView.as_view(), name='my-stories-archive'),
    path('replies/',                      views.MyStoryRepliesView.as_view(), name='my-story-replies'),
    path('create/',                       views.StoryCreateView.as_view(),  name='story-create'),
    path('<int:story_id>/',               views.StoryDetailView.as_view(),  name='story-detail'),
    path('<int:story_id>/delete/',        views.StoryDeleteView.as_view(),  name='story-delete'),
    path('<int:story_id>/like/',          views.StoryLikeView.as_view(),    name='story-like'),
    path('<int:story_id>/reply/',         views.StoryReplyView.as_view(),   name='story-reply'),
    path('<int:story_id>/viewers/',       views.StoryViewersView.as_view(), name='story-viewers'),
    path('<int:story_id>/likers/',        views.StoryLikersView.as_view(),  name='story-likers'),
]