from rest_framework import status, generics
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from rest_framework.response import Response

from permissions import IsOwnerOrReadOnly
from .models import User, Post
from .serializers import PostSerializer, CommentSerializer, LikeSerializer


# Create your views here.

class UserPostsView(APIView):
    permission_classes = (IsOwnerOrReadOnly,)

    def get(self, request, user_id):
        posts = Post.objects.filter(user__id=user_id)  # فیلتر کردن بر اساس شناسه کاربر
        serializer = PostSerializer(posts, many=True)
        return Response(serializer.data)

class GetPostView(APIView):
    permission_classes = (IsOwnerOrReadOnly,)


    def get(self, request, post_pk):
        try:
            post = Post.objects.get(pk=post_pk, user=request.user)
            self.check_object_permissions(request, post)
        except Post.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
        serializer = PostSerializer(post)
        return Response(serializer.data)

class PostView(APIView):
    permission_classes = (IsOwnerOrReadOnly,)
    def post(self, request):
        serializer = PostSerializer(data=request.data)
        if serializer.is_valid(raise_exception=True):
            serializer.save(user=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class PostUpdateView(APIView):
    permission_classes = (IsOwnerOrReadOnly,)

    def put(self, request, post_pk):
        post = Post.objects.get(pk=post_pk, user=request.user)
        self.check_object_permissions(request, post)
        serializer = PostSerializer(post, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class PostDeleteView(APIView):
    permission_classes = (IsOwnerOrReadOnly,)
    def delete(self, request, post_pk):
        post = Post.objects.get(pk=post_pk, user=request.user)
        self.check_object_permissions(request, post)
        post.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)



class PostListView(APIView):
    permission_classes = [ IsOwnerOrReadOnly,]

    def get(self, request):
        posts = Post.objects.all()
        serializer = PostSerializer(posts, many=True)
        return Response(serializer.data)


# class PostListView(generics.ListAPIView):
#     queryset = Post.objects.filter(is_active=True)
#     serializer_class = PostSerializer(queryset, many=True)

#   Comment

class CommentView(APIView):
    permission_classes = [ IsOwnerOrReadOnly,]

    def get_post(self, post_pk):
        try:
            return Post.objects.get(pk=post_pk)
        except Post.DoesNotExist:
            return False

    def get(self, request, post_pk):
        post = self.get_post(post_pk)
        if not post:
            return Response(status=status.HTTP_404_NOT_FOUND)

        # comments = Comment.objects.filter(post=post, is_approved=True)
        comments = post.comments.filter(is_approved=True)
        serializer = CommentSerializer(comments, many=True)
        return Response(serializer.data)

    def post(self, request, post_pk):
        post = self.get_post(post_pk)
        if not post:
            return Response(status=status.HTTP_404_NOT_FOUND)

        serializer = CommentSerializer(data=request.data)
        if serializer.is_valid(raise_exception=True):
            serializer.save(post=post, user=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)



#    Like


class LikeView(APIView):
    permission_classes = [IsOwnerOrReadOnly, ]

    def get_post(self, post_pk):
        try:
            return Post.objects.get(pk=post_pk)
        except Post.DoesNotExist:
            return False

    def get(self, request, post_pk):
        post = self.get_post(post_pk)
        if not post:
            return Response(status=status.HTTP_404_NOT_FOUND)

        likes = post.likes.filter(is_liked=True).count()
        return Response({'likes': likes})



class PostLikeView(APIView):
    permission_classes = [IsOwnerOrReadOnly, ]

    def get_post(self, post_pk):
        try:
            return Post.objects.get(pk=post_pk)
        except Post.DoesNotExist:
            return False
    def post(self, request, post_pk):
        post = self.get_post(post_pk)
        if not post:
            return Response(status=status.HTTP_404_NOT_FOUND)
        print(request.data)
        serializer = LikeSerializer(data=request.data)
        if serializer.is_valid(raise_exception=True):
            serializer.save(post=post, user=request.user,is_liked=True)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)