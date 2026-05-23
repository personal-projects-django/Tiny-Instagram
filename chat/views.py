# chat/views.py
import logging
import os
from django.http import FileResponse
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from django.db.models import Q
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from chat.models import (
    Room, RoomMember, Message, MessageReaction,
    MessageRead, MessageEditHistory, DeletedMessageForUser,
    StickerPack, UserStickerPack
)
from chat.serializers import (
    RoomSerializer, MessageSerializer,
    MessageCreateSerializer, MessageReactionSerializer,
    StickerPackSerializer
)
from src.pagination import StandardPagination

logger = logging.getLogger(__name__)


# ===== Room =====

class RoomListCreateView(generics.ListCreateAPIView):
    """لیست روم‌های کاربر + ساخت روم جدید"""
    serializer_class   = RoomSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Room.objects.filter(
            members__user=self.request.user
        ).prefetch_related('members__user__profile').order_by('-created_at')

    def create(self, request, *args, **kwargs):
        room_type   = request.data.get('type', 'private')
        member_ids  = request.data.get('members', [])

        # چت خصوصی — اگه قبلاً وجود داره برگردون
        if room_type == 'private':
            if len(member_ids) != 1:
                return Response(
                    {'detail': 'چت خصوصی باید دقیقاً یک طرف مقابل داشته باشد.'},
                    status=400
                )
            other_id = member_ids[0]
            existing = Room.objects.filter(
                type='private',
                members__user=request.user
            ).filter(
                members__user_id=other_id
            ).first()
            if existing:
                return Response(RoomSerializer(existing, context={'request': request}).data)

        room = Room.objects.create(
            type       = room_type,
            name       = request.data.get('name', ''),
            created_by = request.user,
        )
        # اضافه کردن creator
        RoomMember.objects.create(room=room, user=request.user, role='owner')
        # اضافه کردن بقیه اعضا
        for uid in member_ids:
            RoomMember.objects.get_or_create(room=room, user_id=uid)

        return Response(
            RoomSerializer(room, context={'request': request}).data,
            status=status.HTTP_201_CREATED
        )


class RoomDetailView(generics.RetrieveUpdateDestroyAPIView):
    """جزئیات روم + ویرایش + حذف"""
    serializer_class   = RoomSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Room.objects.filter(members__user=self.request.user)

    def destroy(self, request, *args, **kwargs):
        room   = self.get_object()
        member = room.members.filter(user=request.user).first()
        if not member or member.role not in ('owner', 'admin'):
            return Response({'detail': 'دسترسی ندارید.'}, status=403)
        room.delete()
        return Response(status=204)


class RoomMemberView(APIView):
    """اضافه/حذف عضو از گروه"""
    permission_classes = [IsAuthenticated]

    def post(self, request, room_id):
        """اضافه کردن عضو"""
        room   = Room.objects.get(pk=room_id)
        me     = room.members.filter(user=request.user).first()
        if not me or me.role not in ('owner', 'admin'):
            return Response({'detail': 'دسترسی ندارید.'}, status=403)

        user_id = request.data.get('user_id')
        RoomMember.objects.get_or_create(room=room, user_id=user_id)
        return Response({'detail': 'عضو اضافه شد.'})

    def delete(self, request, room_id):
        """حذف عضو یا خروج از گروه"""
        room    = Room.objects.get(pk=room_id)
        user_id = request.data.get('user_id', request.user.id)
        me      = room.members.filter(user=request.user).first()

        # فقط owner/admin می‌تونن بقیه رو حذف کنن
        if user_id != request.user.id:
            if not me or me.role not in ('owner', 'admin'):
                return Response({'detail': 'دسترسی ندارید.'}, status=403)

        RoomMember.objects.filter(room=room, user_id=user_id).delete()
        return Response({'detail': 'حذف شد.'})


# ===== Message =====

class MessageListView(generics.ListAPIView):
    """تاریخچه پیام‌های یک روم"""
    serializer_class   = MessageSerializer
    permission_classes = [IsAuthenticated]
    pagination_class   = StandardPagination

    def get_queryset(self):
        room_id = self.kwargs['room_id']

        # فقط اعضای روم
        if not RoomMember.objects.filter(
            room_id=room_id, user=self.request.user
        ).exists():
            return Message.objects.none()

        # پیام‌هایی که برای این کاربر حذف نشدن
        deleted_ids = DeletedMessageForUser.objects.filter(
            user=self.request.user
        ).values_list('message_id', flat=True)

        return Message.objects.filter(
            room_id=room_id,
            is_deleted_for_all=False,
        ).exclude(
            id__in=deleted_ids
        ).select_related(
            'sender__profile', 'reply_to__sender', 'sticker'
        ).prefetch_related('reactions__user', 'reads').order_by('-created_at')


class MessageSendView(APIView):
    """ارسال پیام"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        s = MessageCreateSerializer(data=request.data)
        s.is_valid(raise_exception=True)

        room = s.validated_data['room']
        if not room.members.filter(user=request.user).exists():
            return Response({'detail': 'عضو این روم نیستید.'}, status=403)

        msg = s.save(sender=request.user)
        if msg.file:
            msg.file_name = getattr(msg.file, 'name', '').split('/')[-1]
            msg.file_size = getattr(msg.file, 'size', None) or 0
            msg.mime_type = getattr(getattr(request, 'FILES', {}).get('file'), 'content_type', '')
            msg.save(update_fields=['file_name', 'file_size', 'mime_type'])

        data = MessageSerializer(msg, context={'request': request}).data
        channel_layer = get_channel_layer()
        if channel_layer:
            try:
                async_to_sync(channel_layer.group_send)(
                    f'chat_{room.id}',
                    {'type': 'chat_message', 'message': {'type': 'message', 'message': data}}
                )
            except Exception:
                logger.exception('Failed to broadcast chat message %s to room %s', msg.id, room.id)

        return Response(data, status=201)


class MessageEditView(APIView):
    """ویرایش پیام"""
    permission_classes = [IsAuthenticated]

    def patch(self, request, message_id):
        try:
            msg = Message.objects.get(pk=message_id, sender=request.user)
        except Message.DoesNotExist:
            return Response({'detail': 'پیام یافت نشد.'}, status=404)

        new_text = request.data.get('text', '').strip()
        if not new_text:
            return Response({'detail': 'متن نمی‌تواند خالی باشد.'}, status=400)

        # ذخیره تاریخچه
        MessageEditHistory.objects.create(message=msg, old_text=msg.text)

        msg.text      = new_text
        msg.is_edited = True
        msg.save(update_fields=['text', 'is_edited', 'updated_at'])

        return Response(MessageSerializer(msg, context={'request': request}).data)


class MessageDeleteView(APIView):
    """حذف پیام — برای همه یا فقط برای من"""
    permission_classes = [IsAuthenticated]

    def delete(self, request, message_id):
        try:
            msg = Message.objects.get(pk=message_id)
        except Message.DoesNotExist:
            return Response({'detail': 'پیام یافت نشد.'}, status=404)

        delete_for_all = request.data.get('delete_for_all', False)

        if delete_for_all:
            # فقط فرستنده یا admin می‌تونه برای همه حذف کنه
            is_admin = msg.room.members.filter(
                user=request.user, role__in=['owner', 'admin']
            ).exists()
            if msg.sender != request.user and not is_admin:
                return Response({'detail': 'دسترسی ندارید.'}, status=403)
            msg.is_deleted_for_all = True
            msg.save(update_fields=['is_deleted_for_all'])
        else:
            # حذف فقط برای من
            DeletedMessageForUser.objects.get_or_create(
                message=msg, user=request.user
            )

        return Response(status=204)


class MessagePinView(APIView):
    """پین/آنپین پیام"""
    permission_classes = [IsAuthenticated]

    def post(self, request, message_id):
        try:
            msg = Message.objects.get(pk=message_id)
        except Message.DoesNotExist:
            return Response({'detail': 'پیام یافت نشد.'}, status=404)

        is_admin = msg.room.members.filter(
            user=request.user, role__in=['owner', 'admin']
        ).exists()
        if not is_admin:
            return Response({'detail': 'دسترسی ندارید.'}, status=403)

        msg.pinned = not msg.pinned
        msg.save(update_fields=['pinned'])
        return Response({'pinned': msg.pinned})


class MessageReadView(APIView):
    """علامت‌گذاری پیام به عنوان خوانده شده"""
    permission_classes = [IsAuthenticated]

    def post(self, request, message_id):
        try:
            msg = Message.objects.get(pk=message_id)
        except Message.DoesNotExist:
            return Response({'detail': 'پیام یافت نشد.'}, status=404)

        if not msg.room.members.filter(user=request.user).exists():
            return Response({'detail': 'دسترسی ندارید.'}, status=403)

        MessageRead.objects.get_or_create(message=msg, user=request.user)
        return Response({'detail': 'خوانده شد.'})


class MessageReactionView(APIView):
    """اضافه/حذف reaction روی پیام"""
    permission_classes = [IsAuthenticated]

    def post(self, request, message_id):
        try:
            msg = Message.objects.get(pk=message_id)
        except Message.DoesNotExist:
            return Response({'detail': 'پیام یافت نشد.'}, status=404)

        emoji = request.data.get('emoji', '').strip()
        if not emoji:
            return Response({'detail': 'ایموجی الزامی است.'}, status=400)

        reaction, created = MessageReaction.objects.get_or_create(
            message=msg, user=request.user, emoji=emoji
        )
        if not created:
            reaction.delete()
            return Response({'detail': 'reaction حذف شد.'})

        return Response(
            MessageReactionSerializer(reaction, context={'request': request}).data,
            status=201
        )


class MessageSearchView(generics.ListAPIView):
    """سرچ در پیام‌های یک روم"""
    serializer_class   = MessageSerializer
    permission_classes = [IsAuthenticated]
    pagination_class   = StandardPagination

    def get_queryset(self):
        room_id = self.kwargs['room_id']
        q       = self.request.query_params.get('q', '').strip()

        if not RoomMember.objects.filter(
            room_id=room_id, user=self.request.user
        ).exists():
            return Message.objects.none()

        if not q:
            return Message.objects.none()

        return Message.objects.filter(
            room_id=room_id,
            is_deleted_for_all=False,
            text__icontains=q
        ).select_related('sender__profile')


# ===== Sticker =====

class StickerPackListView(generics.ListAPIView):
    """همه پک‌های استیکر"""
    serializer_class   = StickerPackSerializer
    permission_classes = [IsAuthenticated]
    queryset           = StickerPack.objects.prefetch_related('stickers')


class InstallStickerPackView(APIView):
    """نصب/حذف پک استیکر"""
    permission_classes = [IsAuthenticated]

    def post(self, request, pack_id):
        try:
            pack = StickerPack.objects.get(pk=pack_id)
        except StickerPack.DoesNotExist:
            return Response({'detail': 'پک یافت نشد.'}, status=404)

        installed, created = UserStickerPack.objects.get_or_create(
            user=request.user, pack=pack
        )
        if not created:
            installed.delete()
            return Response({'detail': 'پک حذف شد.'})

        return Response({'detail': 'پک نصب شد.'})


# ===== File Download =====

class MessageFileDownloadView(APIView):
    """دانلود فایل پیام"""
    permission_classes = [IsAuthenticated]

    def get(self, request, message_id):
        try:
            msg = Message.objects.get(pk=message_id)
        except Message.DoesNotExist:
            return Response({'detail': 'پیام یافت نشد.'}, status=404)

        if not msg.room.members.filter(user=request.user).exists():
            return Response({'detail': 'دسترسی ندارید.'}, status=403)

        if not msg.file:
            return Response({'detail': 'فایلی وجود ندارد.'}, status=404)

        return FileResponse(
            msg.file.open('rb'),
            as_attachment=True,
            filename=msg.file_name or os.path.basename(msg.file.name)
        )