from django.contrib import admin

from .models import Post, Comment, Like


@admin.register(Post)
class PostAdmin(admin.ModelAdmin):
    list_display = ('caption', 'user', 'is_active', 'created_at')



@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = ('post', 'user', 'is_approved')
    list_filter = ('is_approved',)
    date_hierarchy = 'created_at'


@admin.register(Like)
class LikeAdmin(admin.ModelAdmin):
    list_display = ('post', 'user', 'is_liked')
    list_filter = ('is_liked',)
    date_hierarchy = 'created_at'