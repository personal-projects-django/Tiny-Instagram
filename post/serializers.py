from rest_framework import serializers
from post.models import Post,PostMedia, Comment, Like, SavedPost
from account.serializers import UserMiniSerializer
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework import generics

class LikeSerializer(serializers.ModelSerializer):
    likes_count = serializers.SerializerMethodField()

    class Meta:
        model  = Like
        fields = ['id', 'post', 'user', 'likes_count', 'created_at']
        read_only_fields = ['post', 'user', 'created_at']

    def get_likes_count(self, obj):
        return obj.post.likes.count()

class PostMediaSerializer(serializers.ModelSerializer):
    class Meta:
        model  = PostMedia
        fields = ['id', 'media_type', 'file', 'thumbnail', 'order', 'width', 'height', 'duration']


class CommentSerializer(serializers.ModelSerializer):
    user    = UserMiniSerializer(read_only=True)
    replies = serializers.SerializerMethodField()

    class Meta:
        model  = Comment
        fields = ['id', 'user', 'text', 'parent', 'replies', 'created_at']
        read_only_fields = ['user', 'created_at']

    def get_replies(self, obj):
        qs = obj.replies.all().select_related('user__profile')
        return CommentSerializer(qs, many=True, context=self.context).data


class PostSerializer(serializers.ModelSerializer):
    user           = UserMiniSerializer(read_only=True)
    medias         = PostMediaSerializer(many=True, read_only=True)
    likes_count    = serializers.SerializerMethodField()
    comments_count = serializers.SerializerMethodField()
    is_liked       = serializers.SerializerMethodField()
    is_saved       = serializers.SerializerMethodField()

    class Meta:
        model  = Post
        fields = [
            'id', 'user', 'caption', 'visibility', 'is_active',
            'comments_disabled', 'medias',
            'likes_count', 'comments_count',
            'is_liked', 'is_saved',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['user', 'created_at', 'updated_at']

    def get_likes_count(self, obj):
        return obj.likes.count()

    def get_comments_count(self, obj):
        return obj.comments.filter(parent=None).count()

    def get_is_liked(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.likes.filter(user=request.user).exists()
        return False

    def get_is_saved(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.saved_by.filter(user=request.user).exists()
        return False


class PostCreateSerializer(serializers.ModelSerializer):
    medias = serializers.ListField(
        child=serializers.FileField(), write_only=True, required=False
    )

    class Meta:
        model  = Post
        fields = ['caption', 'visibility', 'comments_disabled', 'medias']

    def create(self, validated_data):
        medias_data = validated_data.pop('medias', [])
        post = Post.objects.create(**validated_data)
        for i, file in enumerate(medias_data):
            media_type = 'video' if file.content_type.startswith('video') else 'image'
            PostMedia.objects.create(
                post=post, file=file, media_type=media_type, order=i
            )
        return post


class ExplorePostSerializer(serializers.ModelSerializer):
    user           = UserMiniSerializer(read_only=True)
    medias         = PostMediaSerializer(many=True, read_only=True)
    likes_count    = serializers.SerializerMethodField()
    comments_count = serializers.SerializerMethodField()
    is_liked       = serializers.SerializerMethodField()

    class Meta:
        model  = Post
        fields = ['id', 'user', 'medias', 'caption',
                  'likes_count', 'comments_count', 'is_liked', 'created_at']

    def get_likes_count(self, obj):
        return obj.likes.count()

    def get_comments_count(self, obj):
        return obj.comments.all().count()

    def get_is_liked(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.likes.filter(user=request.user).exists()
        return False


class SavedPostSerializer(serializers.ModelSerializer):
    post = ExplorePostSerializer(read_only=True)

    class Meta:
        model  = SavedPost
        fields = ['id', 'post', 'created_at']

# from rest_framework import serializers
#
# from post.models import Post,Comment,Like
#
#
# class PostSerializer(serializers.ModelSerializer):
#     class Meta:
#         model = Post
#         fields = ['id','user','caption', 'image', 'is_active']
#         extra_kwargs = {
#             'user': {'read_only': True},
#         }
#
#
#
# #   Comment
#
#
# class CommentSerializer(serializers.ModelSerializer):
#     username = serializers.CharField(source='user.username', read_only=True)
#     class Meta:
#         model = Comment
#         fields = ('id','post', 'user', 'text','username')
#         extra_kwargs = {
#             'post': {'read_only': True},
#             'user': {'read_only': True}
#         }
#
#
#
# #    Like
#
# class LikeSerializer(serializers.ModelSerializer):
#     like_count = serializers.SerializerMethodField()
#     class Meta:
#         model = Like
#         fields = ('id','post', 'user', 'is_liked','like_count')
#         extra_kwargs = {
#             'post': {'read_only': True},
#             'user': {'read_only': True},
#             'is_liked': {'required': False}
#         }
#
#     def get_like_count(self, obj):
#         return Like.objects.filter(post=obj.post, is_liked=True).count()