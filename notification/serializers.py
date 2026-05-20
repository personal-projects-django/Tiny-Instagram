from rest_framework import serializers
from notification.models import Notification
from account.serializers import UserMiniSerializer


class NotificationSerializer(serializers.ModelSerializer):
    sender         = UserMiniSerializer(read_only=True)
    content_object = serializers.SerializerMethodField()

    class Meta:
        model  = Notification
        fields = [
            'id', 'sender', 'type', 'is_read',
            'content_object', 'created_at',
        ]
        read_only_fields = fields

    def get_content_object(self, obj):
        """اطلاعات مختصر آبجکت مرتبط (پست، کامنت، استوری، ...)"""
        if not obj.content_object:
            return None
        from post.models import Post, Comment
        from story.models import Story
        from chat.models import Message

        co = obj.content_object
        if isinstance(co, Post):
            first_media = co.medias.first()
            return {
                'type': 'post',
                'id': co.pk,
                'image': first_media.file.url if first_media else None,
            }
        if isinstance(co, Comment):
            return {'type': 'comment', 'id': co.pk, 'text': co.text[:60]}
        if isinstance(co, Story):
            return {'type': 'story', 'id': co.pk, 'image': co.image.url if co.image else None}
        if isinstance(co, Message):
            return {'type': 'message', 'id': co.pk, 'text': co.text[:60]}
        return {'type': 'unknown', 'id': co.pk}