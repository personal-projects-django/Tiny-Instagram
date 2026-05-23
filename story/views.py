from django.utils.timezone import now
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from story.models import Story, StoryLike, StoryReply
from story.serializers import (
    StorySerializer, StoryCreateSerializer,
    StoryReplySerializer, StoryLikeSerializer
)
from src.pagination import StandardPagination



class StoryListView(generics.ListAPIView):
    serializer_class = StorySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Story.objects.filter(user__in=self.request.user.following.values_list('following', flat=True), expires_at__gt=now()).order_by('-created_at')


class StoryFeedView(generics.ListAPIView):
    """استوری‌های کسایی که فالو کردی — گروه‌بندی شده بر اساس کاربر"""
    serializer_class   = StorySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        from follow.models import Follow
        following_ids = Follow.objects.filter(
            follower=self.request.user
        ).values_list('following_id', flat=True)

        return Story.objects.filter(
            user_id__in=following_ids,
            expires_at__gt=now()          # ← درست، نه is_active=True
        ).select_related('user__profile').prefetch_related('views', 'likes')

    def list(self, request, *args, **kwargs):
        qs = self.get_queryset()

        # گروه‌بندی بر اساس کاربر — مثل اینستاگرام
        from collections import defaultdict
        grouped = defaultdict(list)
        for story in qs:
            grouped[story.user_id].append(story)

        result = []
        for user_id, stories in grouped.items():
            user = stories[0].user
            result.append({
                'user'            : {
                    'id'      : user.id,
                    'username': user.username,
                    'avatar'  : user.profile.avatar.url if user.profile.avatar else '',
                },
                'stories'         : StorySerializer(stories, many=True, context={'request': request}).data,
                'has_unseen'      : any(
                    not s.views.filter(pk=request.user.pk).exists()
                    for s in stories
                ),
            })

        return Response(result)


class MyStoriesView(generics.ListAPIView):
    """استوری‌های خودم"""
    serializer_class   = StorySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Story.objects.filter(
            user=self.request.user,
            expires_at__gt=now()
        ).prefetch_related('views', 'likes')


class StoryCreateView(generics.CreateAPIView):
    """ساخت استوری جدید"""
    serializer_class   = StoryCreateSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class StoryDetailView(APIView):
    """جزئیات استوری + ثبت view"""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, story_id):
        try:
            story = Story.objects.get(pk=story_id, expires_at__gt=now())
        except Story.DoesNotExist:
            return Response({'detail': 'استوری یافت نشد یا منقضی شده.'}, status=404)

        # ثبت view خودکار
        story.views.add(request.user)

        return Response(StorySerializer(story, context={'request': request}).data)


class StoryDeleteView(APIView):
    """حذف استوری — فقط صاحبش"""
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, story_id):
        try:
            story = Story.objects.get(pk=story_id, user=request.user)
        except Story.DoesNotExist:
            return Response({'detail': 'استوری یافت نشد.'}, status=404)
        story.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class StoryLikeView(APIView):
    """لایک/آنلایک استوری با ایموجی"""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, story_id):
        try:
            story = Story.objects.get(pk=story_id, expires_at__gt=now())
        except Story.DoesNotExist:
            return Response({'detail': 'استوری یافت نشد.'}, status=404)

        emoji = request.data.get('emoji', '❤️')
        like, created = StoryLike.objects.get_or_create(
            user=request.user, story=story,
            defaults={'emoji': emoji}
        )
        if not created:
            like.delete()
            return Response({'liked': False})

        return Response({'liked': True, 'emoji': like.emoji})


class StoryReplyView(APIView):
    """ریپلای به استوری"""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, story_id):
        try:
            story = Story.objects.get(pk=story_id, expires_at__gt=now())
        except Story.DoesNotExist:
            return Response({'detail': 'استوری یافت نشد.'}, status=404)

        text = request.data.get('text', '').strip()
        if not text:
            return Response({'detail': 'متن الزامی است.'}, status=400)

        reply = StoryReply.objects.create(
            sender=request.user,    # ← sender نه user
            story=story,
            text=text
        )
        return Response(StoryReplySerializer(reply, context={'request': request}).data, status=201)


class StoryViewersView(generics.ListAPIView):
    """لیست بینندگان استوری — فقط برای صاحبش"""
    permission_classes = [permissions.IsAuthenticated]
    pagination_class   = StandardPagination

    def get(self, request, story_id):
        try:
            story = Story.objects.get(pk=story_id, user=request.user)
        except Story.DoesNotExist:
            return Response({'detail': 'استوری یافت نشد.'}, status=404)

        from account.serializers import UserMiniSerializer
        viewers = story.views.select_related('profile').all()
        return Response(UserMiniSerializer(viewers, many=True, context={'request': request}).data)


class StoryLikersView(generics.ListAPIView):
    """لیست لایک‌کنندگان استوری — فقط برای صاحبش"""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, story_id):
        try:
            story = Story.objects.get(pk=story_id, user=request.user)
        except Story.DoesNotExist:
            return Response({'detail': 'استوری یافت نشد.'}, status=404)

        likes = StoryLike.objects.filter(story=story).select_related('user__profile')
        return Response(StoryLikeSerializer(likes, many=True, context={'request': request}).data)



class MyStoryRepliesView(generics.ListAPIView):
    """پاسخ‌های همه استوری‌های من"""
    serializer_class   = StoryReplySerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class   = StandardPagination

    def get_queryset(self):
        return StoryReply.objects.filter(
            story__user=self.request.user
        ).select_related('sender__profile', 'story').order_by('-created_at')


class MyStoriesArchiveView(generics.ListAPIView):
    """همه استوری‌های من (شامل expire شده‌ها — برای archive)"""
    serializer_class   = StorySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Story.objects.filter(
            user=self.request.user
        ).prefetch_related('views', 'likes').order_by('-created_at')