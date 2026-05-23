# chat/urls.py
from django.urls import path
from chat import views

urlpatterns = [
    # روم
    path('rooms/',                                    views.RoomListCreateView.as_view()),
    path('rooms/<int:pk>/',                           views.RoomDetailView.as_view()),
    path('rooms/<int:room_id>/members/',              views.RoomMemberView.as_view()),

    # پیام
    path('rooms/<int:room_id>/messages/',             views.MessageListView.as_view()),
    path('rooms/<int:room_id>/messages/search/',      views.MessageSearchView.as_view()),
    path('messages/send/',                            views.MessageSendView.as_view()),
    path('messages/<int:message_id>/edit/',           views.MessageEditView.as_view()),
    path('messages/<int:message_id>/delete/',         views.MessageDeleteView.as_view()),
    path('messages/<int:message_id>/pin/',            views.MessagePinView.as_view()),
    path('messages/<int:message_id>/read/',           views.MessageReadView.as_view()),
    path('messages/<int:message_id>/reaction/',       views.MessageReactionView.as_view()),
    path('messages/<int:message_id>/download/',       views.MessageFileDownloadView.as_view()),

    # استیکر
    path('stickers/',                                 views.StickerPackListView.as_view()),
    path('stickers/<int:pack_id>/install/',           views.InstallStickerPackView.as_view()),
]