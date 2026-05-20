from django.contrib import admin

from follow.models import Follow,FollowRequest


@admin.register(Follow)
class FollowAdmin(admin.ModelAdmin):
    list_display = ['follower', 'following', 'created_at']
    actions = False

    def has_add_permission(self, request):
        return False

    def has_delete_permission(self, request, obj=None):
        return False