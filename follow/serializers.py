# from rest_framework import serializers
# from account.models import User
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