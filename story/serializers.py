from rest_framework import serializers
from story.models import Story, StoryLike, StoryReply
from account.serializers import UserMiniSerializer


class StoryReplySerializer(serializers.ModelSerializer):
    sender = UserMiniSerializer(read_only=True)

    class Meta:
        model  = StoryReply
        fields = ['id', 'sender', 'text', 'created_at']
        read_only_fields = ['sender', 'created_at']


class StoryLikeSerializer(serializers.ModelSerializer):
    user = UserMiniSerializer(read_only=True)

    class Meta:
        model  = StoryLike
        fields = ['id', 'user', 'emoji', 'created_at']
        read_only_fields = ['user', 'created_at']


class StorySerializer(serializers.ModelSerializer):
    user         = UserMiniSerializer(read_only=True)
    views_count  = serializers.SerializerMethodField()
    likes_count  = serializers.SerializerMethodField()
    is_viewed    = serializers.SerializerMethodField()
    is_liked     = serializers.SerializerMethodField()
    is_active    = serializers.BooleanField(read_only=True)

    class Meta:
        model  = Story
        fields = [
            'id', 'user', 'image', 'video', 'caption',
            'views_count', 'likes_count',
            'is_viewed', 'is_liked', 'is_active',
            'expires_at', 'created_at',
        ]
        read_only_fields = ['user', 'expires_at', 'created_at']

    def get_views_count(self, obj):
        return obj.views.count()

    def get_likes_count(self, obj):
        return obj.likes.count()

    def get_is_viewed(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.views.filter(pk=request.user.pk).exists()
        return False

    def get_is_liked(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.likes.filter(user=request.user).exists()
        return False


class StoryCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Story
        fields = ['image', 'video', 'caption']

    def validate(self, data):
        if not data.get('image') and not data.get('video'):
            raise serializers.ValidationError('باید عکس یا ویدیو آپلود کنید.')
        return data