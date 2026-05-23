from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from notification.models import Notification
from notification.serializers import NotificationSerializer
from src.pagination import StandardPagination


class NotificationListView(generics.ListAPIView):
    """لیست همه نوتیفیکیشن‌ها — با فیلتر unread"""
    serializer_class   = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class   = StandardPagination

    def get_queryset(self):
        qs = Notification.objects.filter(
            recipient=self.request.user          # ← recipient (قبلاً receiver بود — اشتباه)
        ).select_related(
            'sender__profile',
            'content_type'
        )

        # فیلتر فقط unread — مثلاً GET /notifications/?unread=true
        if self.request.query_params.get('unread') == 'true':
            qs = qs.filter(is_read=False)

        return qs


class NotificationMarkReadView(APIView):
    """یک نوتیف خاص رو read کن"""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            notif = Notification.objects.get(pk=pk, recipient=request.user)
        except Notification.DoesNotExist:
            return Response(
                {'detail': 'نوتیفیکیشن یافت نشد.'},
                status=status.HTTP_404_NOT_FOUND
            )
        notif.is_read = True
        notif.save(update_fields=['is_read'])
        return Response({'detail': 'خوانده شد.'})


class NotificationMarkAllReadView(APIView):
    """همه نوتیف‌ها رو یکجا read کن"""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        updated = Notification.objects.filter(
            recipient=request.user,
            is_read=False
        ).update(is_read=True)
        return Response({'detail': f'{updated} نوتیفیکیشن خوانده شد.'})


class UnreadNotificationCountView(APIView):
    """تعداد نوتیف‌های خوانده‌نشده — برای badge در فرانت"""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        count = Notification.objects.filter(
            recipient=request.user,
            is_read=False
        ).count()
        return Response({'unread_count': count})


class NotificationDeleteView(APIView):
    """حذف یک نوتیف"""
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, pk):
        try:
            notif = Notification.objects.get(pk=pk, recipient=request.user)
        except Notification.DoesNotExist:
            return Response(
                {'detail': 'نوتیفیکیشن یافت نشد.'},
                status=status.HTTP_404_NOT_FOUND
            )
        notif.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)