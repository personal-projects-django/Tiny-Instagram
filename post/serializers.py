from rest_framework import serializers

from post.models import Post,Comment,Like


class PostSerializer(serializers.ModelSerializer):
    class Meta:
        model = Post
        fields = ['user','caption','is_active','is_public']
        extra_kwargs = {
            'user': {'read_only': True},
        }



#   Comment


class CommentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Comment
        fields = ('post', 'user', 'text')
        extra_kwargs = {
            'post': {'read_only': True},
            'user': {'read_only': True}
        }



#    Like

class LikeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Like
        fields = ('post', 'user', 'is_liked')
        extra_kwargs = {
            'post': {'read_only': True},
            'user': {'read_only': True},
            'is_liked': {'required': False}
        }