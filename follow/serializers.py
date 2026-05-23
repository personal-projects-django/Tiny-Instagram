from rest_framework import serializers
from follow.models import Follow
from account.serializers import UserMiniSerializer


class FollowSerializer(serializers.ModelSerializer):
    follower  = UserMiniSerializer(read_only=True)
    following = UserMiniSerializer(read_only=True)

    class Meta:
        model  = Follow
        fields = ['id', 'follower', 'following', 'created_at']
        read_only_fields = ['follower', 'following', 'created_at']


class FollowersListSerializer(serializers.ModelSerializer):
    """لیست فالوورها"""
    user = UserMiniSerializer(source='follower', read_only=True)

    class Meta:
        model  = Follow
        fields = ['user', 'created_at']


class FollowingListSerializer(serializers.ModelSerializer):
    """لیست کسایی که فالو کردی"""
    user = UserMiniSerializer(source='following', read_only=True)

    class Meta:
        model  = Follow
        fields = ['user', 'created_at']




# from rest_framework import serializers
# from account.models import User, Profile
#
#
# class UserListSerializer(serializers.ModelSerializer):
#     avatar = serializers.SerializerMethodField()
#
#     class Meta:
#         model = User
#         fields = ('id', 'username', 'avatar')
#
#     def get_avatar(self, instance):
#         if hasattr(instance, 'profile') and instance.profile.avatar:
#             return instance.profile.avatar.url
#         return ''
#
#
