from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.exceptions import PermissionDenied
from django.db.models import Q, Count

from src.pagination import StandardPagination, FeedPagination
from post.models import Post, Comment, Like, SavedPost
from post.serializers import (
    PostSerializer, PostCreateSerializer,
    CommentSerializer, LikeSerializer,
    ExplorePostSerializer,
)
from follow.models import Follow


class FeedView(generics.ListAPIView):
    """پست‌های کسایی که فالو کردی"""
    serializer_class   = PostSerializer
    permission_classes = [IsAuthenticated]
    pagination_class   = StandardPagination

    def get_queryset(self):
        following_ids = Follow.objects.filter(
            follower=self.request.user
        ).values_list('following_id', flat=True)

        return Post.objects.filter(
            Q(user_id__in=following_ids) | Q(user=self.request.user),
            is_active=True,
            visibility__in=[Post.Visibility.PUBLIC, Post.Visibility.FOLLOWERS]
        ).select_related('user__profile').prefetch_related('likes', 'comments', 'medias').order_by('-created_at')


class ExploreView(generics.ListAPIView):
    """اکسپلور — پست‌های محبوب + فیلتر پیشرفته"""
    serializer_class   = ExplorePostSerializer
    permission_classes = [IsAuthenticated]
    pagination_class   = StandardPagination

    def get_queryset(self):
        qs = Post.objects.filter(
            is_active=True,
            visibility=Post.Visibility.PUBLIC
        ).select_related('user__profile').prefetch_related('likes', 'comments', 'medias')

        q = self.request.query_params.get('q', '').strip()
        if q:
            qs = qs.filter(
                Q(caption__icontains=q) |
                Q(user__username__icontains=q)
            )

        sort = self.request.query_params.get('sort', 'popular')
        if sort == 'popular':
            qs = qs.annotate(like_count=Count('likes')).order_by('-like_count')
        elif sort == 'newest':
            qs = qs.order_by('-created_at')

        return qs


class PostCreateView(generics.CreateAPIView):
    serializer_class   = PostCreateSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class PostDetailView(generics.RetrieveUpdateDestroyAPIView):
    """جزئیات پست — همه می‌بینن، فقط مالک ویرایش/حذف می‌کنه"""
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method in ('PUT', 'PATCH'):
            return PostCreateSerializer
        return PostSerializer

    def get_queryset(self):
        # ✅ همه پست‌های public قابل دیدن، نه فقط مال خود کاربر
        return Post.objects.filter(is_active=True).select_related(
            'user__profile'
        ).prefetch_related('likes', 'comments', 'medias')

    def perform_update(self, serializer):
        # ✅ فقط مالک می‌تونه ویرایش کنه
        if serializer.instance.user != self.request.user:
            raise PermissionDenied('شما اجازه ویرایش این پست را ندارید.')
        serializer.save()

    def perform_destroy(self, instance):
        # ✅ فقط مالک می‌تونه حذف کنه — soft delete
        if instance.user != self.request.user:
            raise PermissionDenied('شما اجازه حذف این پست را ندارید.')
        instance.is_active = False
        instance.save(update_fields=['is_active'])


class LikeToggleView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, post_id):
        try:
            post = Post.objects.get(pk=post_id, is_active=True)
        except Post.DoesNotExist:
            return Response({'detail': 'پست یافت نشد.'}, status=404)

        like, created = Like.objects.get_or_create(user=request.user, post=post)
        if not created:
            like.delete()
            return Response({'liked': False, 'count': post.likes.count()})
        return Response({'liked': True, 'count': post.likes.count()})


class CommentListCreateView(generics.ListCreateAPIView):
    serializer_class   = CommentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Comment.objects.filter(
            post_id=self.kwargs['post_id'],
            parent=None,
        ).select_related('user__profile').prefetch_related('replies').order_by('-created_at')

    def perform_create(self, serializer):
        post_id = self.kwargs['post_id']
        # ✅ پیش‌فرض is_approved=True تا کامنت بلافاصله نشون داده بشه
        serializer.save(user=self.request.user, post_id=post_id, is_approved=True)


class CommentDeleteView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, comment_id):
        try:
            comment = Comment.objects.get(pk=comment_id, user=request.user)
        except Comment.DoesNotExist:
            return Response({'detail': 'کامنت یافت نشد.'}, status=404)
        comment.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class UserPostsView(generics.ListAPIView):
    """همه پست‌های یک کاربر — برای صفحه پروفایل"""
    serializer_class   = ExplorePostSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        username = self.kwargs['username']
        return Post.objects.filter(
            user__username=username,
            is_active=True,
            visibility=Post.Visibility.PUBLIC,
        ).select_related('user__profile').prefetch_related(
            'likes', 'comments', 'medias'
        ).order_by('-created_at')


class SavedPostToggleView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, post_id):
        try:
            post = Post.objects.get(pk=post_id, is_active=True)
        except Post.DoesNotExist:
            return Response({'detail': 'پست یافت نشد.'}, status=404)

        saved, created = SavedPost.objects.get_or_create(user=request.user, post=post)
        if not created:
            saved.delete()
            return Response({'saved': False})
        return Response({'saved': True})


class SavedPostsListView(generics.ListAPIView):
    """لیست پست‌های ذخیره‌شده"""
    serializer_class   = ExplorePostSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Post.objects.filter(
            saved_by__user=self.request.user,
            is_active=True,
        ).select_related('user__profile').prefetch_related(
            'likes', 'comments', 'medias'
        ).order_by('-saved_by__created_at')