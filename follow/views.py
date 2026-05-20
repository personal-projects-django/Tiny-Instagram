from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import generics
from src.pagination import StandardPagination
from account.serializers import UserSearchSerializer
from follow.models import Follow ,FollowRequest
from follow.serializers import (
    FollowSerializer, FollowersListSerializer, FollowingListSerializer
)
from account.models import User
from django.db.models import Count

class FollowToggleView(APIView):
    """فالو / آنفالو"""
    permission_classes = [IsAuthenticated]

    def post(self, request, username):
        try:
            target = User.objects.get(username=username)
        except User.DoesNotExist:
            return Response({'detail': 'کاربر یافت نشد.'}, status=404)

        if target == request.user:
            return Response({'detail': 'نمی‌توانید خودتان را فالو کنید.'}, status=400)

        # چک آنفالو
        existing = Follow.objects.filter(follower=request.user, following=target).first()
        if existing:
            existing.delete()
            return Response({'detail': 'آنفالو شد.', 'is_following': False})

        # اکانت private → درخواست فالو
        if target.is_private:
            req, created = FollowRequest.objects.get_or_create(
                sender=request.user, receiver=target
            )
            if not created:
                # لغو درخواست
                req.delete()
                return Response({'detail': 'درخواست لغو شد.', 'status': 'cancelled'})
            return Response({'detail': 'درخواست فالو ارسال شد.', 'status': 'pending'})

        # اکانت public → فوری فالو
        Follow.objects.create(follower=request.user, following=target)
        return Response({'detail': 'فالو شد.', 'is_following': True})


class FollowRequestView(APIView):
    """قبول یا رد درخواست فالو"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """لیست درخواست‌های pending"""
        requests = FollowRequest.objects.filter(
            receiver=request.user,
            status=FollowRequest.Status.PENDING
        ).select_related('sender__profile')
        data = [
            {
                'id'        : r.id,
                'sender'    : r.sender.username,
                'avatar'    : r.sender.profile.avatar.url if r.sender.profile.avatar else '',
                'created_at': r.created_at,
            }
            for r in requests
        ]
        return Response(data)

    def post(self, request, request_id):
        """قبول یا رد"""
        action = request.data.get('action')  # 'accept' or 'reject'
        try:
            follow_req = FollowRequest.objects.get(
                pk=request_id, receiver=request.user
            )
        except FollowRequest.DoesNotExist:
            return Response({'detail': 'درخواست یافت نشد.'}, status=404)

        if action == 'accept':
            Follow.objects.get_or_create(
                follower=follow_req.sender,
                following=follow_req.receiver
            )
            follow_req.delete()
            return Response({'detail': 'درخواست قبول شد.'})
        elif action == 'reject':
            follow_req.delete()
            return Response({'detail': 'درخواست رد شد.'})

        return Response({'detail': 'action نامعتبر است.'}, status=400)

class FollowersListView(generics.ListAPIView):
    """لیست فالوورهای یک کاربر"""
    serializer_class   = FollowersListSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = StandardPagination

    def get_queryset(self):
        username = self.kwargs['username']
        return Follow.objects.filter(
            following__username=username
        ).select_related('follower__profile')


class FollowingListView(generics.ListAPIView):
    """لیست کسایی که یک کاربر فالو کرده"""
    serializer_class   = FollowingListSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = StandardPagination

    def get_queryset(self):
        username = self.kwargs['username']
        return Follow.objects.filter(
            follower__username=username
        ).select_related('following__profile')


class SuggestedUsersView(generics.ListAPIView):
    """
    پیشنهاد فالو — کاربرانی که:
    1. فالوورهای مشترک دارن
    2. هنوز فالو نکردی
    """
    serializer_class   = UserSearchSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        following_ids = set(
            Follow.objects.filter(follower=user).values_list('following_id', flat=True)
        )

        return User.objects.filter(
            followers__follower_id__in=following_ids
        ).exclude(
            pk__in=following_ids
        ).exclude(
            pk=user.pk
        ).annotate(
            mutual_count=Count('followers')
        ).order_by('-mutual_count').select_related('profile')[:10]



# from django.db.models import Q
#
# from rest_framework import status
# from rest_framework.response import Response
# from rest_framework.permissions import IsAuthenticated
# from rest_framework.views import APIView
#
# from account.models import User
# from permissions import IsOwnerOrReadOnly
# from .models import Friendship
# from .serializers import UserListSerializer
#
#
# class UnfollowView(APIView):
#     permission_classes = [IsAuthenticated]
#
#     def post(self, request):
#         user_id = request.data.get('user')
#
#         try:
#             user = User.objects.get(pk=user_id)
#             friendship = Friendship.objects.get(request_from=request.user, request_to=user)
#         except (User.DoesNotExist, Friendship.DoesNotExist):
#             return Response({'error': 'درخواستی برای این کاربر یافت نشد'}, status=status.HTTP_400_BAD_REQUEST)
#
#         friendship.delete()
#         return Response({'detail': 'آنفالو انجام شد'}, status=status.HTTP_200_OK)
#
#
# class UserListView(APIView):
#     permission_classes = [IsOwnerOrReadOnly, ]
#
#     def get(self, request):
#         # users = User.objects.filter(is_superuser=False, is_staff=False, is_active=True)
#         q = request.query_params.get('q')
#         if q:
#             users = User.objects.filter(username__icontains=q)
#         else:
#             users = User.objects.all()
#         serializer = UserListSerializer(users, many=True)
#         return Response(serializer.data)
# # class UserListView(APIView):
# #     permission_classes = [IsAuthenticated]
# #
# #     def get(self, request):
# #         friendships = Friendship.objects.filter(
# #             Q(request_from=request.user) | Q(request_to=request.user),
# #             is_accepted=True
# #         )
# #
# #         users = set()
# #         for fr in friendships:
# #             if fr.request_from == request.user:
# #                 users.add(fr.request_to)
# #             else:
# #                 users.add(fr.request_from)
# #
# #         serializer = UserListSerializer(users, many=True)
# #         return Response(serializer.data)
# #
#
# class RequestView(APIView):
#     permission_classes = [IsOwnerOrReadOnly, ]
#
#     def post(self, request):
#         user_id = request.data.get('user')
#
#         try:
#             user = User.objects.get(pk=user_id)
#         except User.DoesNotExist:
#             return Response(status=status.HTTP_400_BAD_REQUEST)
#
#         Friendship.objects.get_or_create(request_from=request.user, request_to=user)
#
#         return Response({'detail': 'Request sent'}, status=status.HTTP_201_CREATED)
#
#
# class RequestListView(APIView):
#     permission_classes = [IsOwnerOrReadOnly, ]
#
#     def get(self, request):
#         friendship = Friendship.objects.filter(request_to=request.user, is_accepted=False)
#         users = [fr.request_from for fr in friendship]
#         serializer = UserListSerializer(users, many=True)
#         return Response(serializer.data)
#
#
# class AcceptView(APIView):
#     permission_classes = [IsOwnerOrReadOnly, ]
#
#     def post(self, request):
#         user_id = request.data.get('user')
#
#         try:
#             user = User.objects.get(pk=user_id)
#             friendship = Friendship.objects.get(request_from=user, request_to=request.user, is_accepted=False)
#         except (User.DoesNotExist, Friendship.DoesNotExist):
#             return Response(status=status.HTTP_400_BAD_REQUEST)
#
#         friendship.is_accepted = True
#         friendship.save()
#
#         return Response({'detail': 'Connected'})
#
#
# class FriendListView(APIView):
#     permission_classes = [IsOwnerOrReadOnly,]
#
#     def get(self, request):
#         friendship = Friendship.objects.filter(
#             Q(request_from_id=request.user) | Q(request_to=request.user),
#             is_accepted=True
#         )
#         users = [fr.request_from for fr in friendship]
#         serializer = UserListSerializer(users, many=True)
#         return Response(serializer.data)