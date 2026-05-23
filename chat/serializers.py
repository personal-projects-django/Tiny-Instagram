from rest_framework import serializers
from django.contrib.contenttypes.models import ContentType
from chat.models import (
    Room, RoomMember, Message, MessageReaction,
    MessageRead, MessageEditHistory, Sticker, StickerPack
)
from account.serializers import UserMiniSerializer
from post.serializers import ExplorePostSerializer


class StickerSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Sticker
        fields = ['id', 'emoji', 'file']


class StickerPackSerializer(serializers.ModelSerializer):
    stickers = StickerSerializer(many=True, read_only=True)

    class Meta:
        model  = StickerPack
        fields = ['id', 'name', 'thumbnail', 'is_animated', 'stickers']


class RoomMemberSerializer(serializers.ModelSerializer):
    user = UserMiniSerializer(read_only=True)

    class Meta:
        model  = RoomMember
        fields = ['id', 'user', 'role', 'is_muted', 'joined_at']


class MessageReactionSerializer(serializers.ModelSerializer):
    user = UserMiniSerializer(read_only=True)

    class Meta:
        model  = MessageReaction
        fields = ['id', 'user', 'emoji', 'created_at']
        read_only_fields = ['user', 'created_at']


class MessageSerializer(serializers.ModelSerializer):
    sender          = UserMiniSerializer(read_only=True)
    reactions       = MessageReactionSerializer(many=True, read_only=True)
    reply_to        = serializers.SerializerMethodField()
    forwarded_from  = serializers.SerializerMethodField()
    reads_count     = serializers.SerializerMethodField()
    is_read_by_me   = serializers.SerializerMethodField()

    class Meta:
        model  = Message
        fields = [
            'id', 'room', 'sender', 'type',
            'text', 'file', 'sticker', 'thumbnail',
            'file_name', 'file_size', 'mime_type', 'duration', 'waveform',
            'latitude', 'longitude',
            'link_url', 'link_title', 'link_description',
            'link_image', 'link_domain',
            'reply_to', 'forwarded_from',
            'reactions', 'reads_count', 'is_read_by_me',
            'is_edited', 'is_deleted_for_all',
            'pinned', 'created_at', 'updated_at',
        ]
        read_only_fields = [
            'sender', 'is_edited', 'created_at', 'updated_at'
        ]

    def get_reply_to(self, obj):
        if obj.reply_to:
            return {
                'id'    : obj.reply_to.pk,
                'sender': obj.reply_to.sender.username if obj.reply_to.sender else None,
                'text'  : obj.reply_to.text[:80],
                'type'  : obj.reply_to.type,
            }
        return None

    def get_forwarded_from(self, obj):
        if not obj.forwarded_from_object:
            return None
        co = obj.forwarded_from_object
        from post.models import Post
        from story.models import Story
        if isinstance(co, Message):
            return {'type': 'message', 'id': co.pk, 'text': co.text[:60]}
        if isinstance(co, Post):
            return {'type': 'post', 'id': co.pk, 'post': ExplorePostSerializer(co, context=self.context).data}
        if isinstance(co, Story):
            return {'type': 'story', 'id': co.pk}
        return None

    def get_reads_count(self, obj):
        return obj.reads.count()

    def get_is_read_by_me(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.reads.filter(user=request.user).exists()
        return False


class MessageCreateSerializer(serializers.ModelSerializer):
    forwarded_post = serializers.IntegerField(write_only=True, required=False)

    class Meta:
        model  = Message
        fields = [
            'room', 'type', 'text', 'file', 'sticker',
            'latitude', 'longitude',
            'reply_to', 'forwarded_from_type', 'forwarded_from_id', 'forwarded_post',
        ]

    def validate(self, data):
        msg_type = data.get('type', 'text')
        if msg_type == 'text' and not data.get('text', '').strip() and not data.get('forwarded_post'):
            raise serializers.ValidationError({'text': 'متن پیام نمی‌تواند خالی باشد.'})
        if msg_type in ('image', 'video', 'audio', 'voice', 'file', 'gif') and not data.get('file'):
            raise serializers.ValidationError({'file': 'فایل الزامی است.'})
        if msg_type == 'location':
            if not data.get('latitude') or not data.get('longitude'):
                raise serializers.ValidationError('موقعیت مکانی ناقص است.')
        if data.get('forwarded_post'):
            from post.models import Post
            if not Post.objects.filter(pk=data['forwarded_post'], is_active=True).exists():
                raise serializers.ValidationError({'forwarded_post': 'پست یافت نشد.'})
        return data

    def create(self, validated_data):
        forwarded_post = validated_data.pop('forwarded_post', None)
        if forwarded_post:
            from post.models import Post
            validated_data['forwarded_from_type'] = ContentType.objects.get_for_model(Post)
            validated_data['forwarded_from_id'] = forwarded_post
        return super().create(validated_data)


class RoomSerializer(serializers.ModelSerializer):
    members      = RoomMemberSerializer(many=True, read_only=True)
    last_message = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()

    class Meta:
        model  = Room
        fields = [
            'id', 'type', 'name', 'description', 'avatar',
            'username', 'is_public', 'created_by',
            'members', 'last_message', 'unread_count', 'created_at',
        ]
        read_only_fields = ['created_by', 'created_at']

    def get_last_message(self, obj):
        msg = obj.messages.filter(is_deleted_for_all=False).last()
        if msg:
            return {
                'id'    : msg.pk,
                'text'  : msg.text[:60],
                'type'  : msg.type,
                'sender': msg.sender.username if msg.sender else None,
                'time'  : msg.created_at,
            }
        return None

    def get_unread_count(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.messages.filter(
                is_deleted_for_all=False
            ).exclude(
                reads__user=request.user
            ).exclude(
                sender=request.user
            ).count()
        return 0