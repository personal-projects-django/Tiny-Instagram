from rest_framework import serializers

from post.models import Post,Comment,Like


class PostSerializer(serializers.ModelSerializer):
    class Meta:
        model = Post
        fields = ['id','user','caption', 'image', 'is_active','is_public']
        extra_kwargs = {
            'user': {'read_only': True},
        }



#   Comment


class CommentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Comment
        fields = ('id','post', 'user', 'text')
        extra_kwargs = {
            'post': {'read_only': True},
            'user': {'read_only': True}
        }



#    Like

class LikeSerializer(serializers.ModelSerializer):
    like_count = serializers.SerializerMethodField()
    class Meta:
        model = Like
        fields = ('id','post', 'user', 'is_liked','like_count')
        extra_kwargs = {
            'post': {'read_only': True},
            'user': {'read_only': True},
            'is_liked': {'required': False}
        }

    def get_like_count(self, obj):
        return Like.objects.filter(post=obj.post, is_liked=True).count()