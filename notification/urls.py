from django.urls import path
from notification.views import (
    NotificationListView,
    NotificationMarkReadView,
    NotificationMarkAllReadView,   # ← اضافه کن
    UnreadNotificationCountView,   # ← اضافه کن
)

urlpatterns = [
    path('',              NotificationListView.as_view(),        name='notifications-list'),
    path('unread-count/', UnreadNotificationCountView.as_view(), name='notifications-unread-count'),
    path('read-all/',     NotificationMarkAllReadView.as_view(), name='notifications-read-all'),
    path('<int:pk>/read/', NotificationMarkReadView.as_view(),   name='notification-mark-read'),
]