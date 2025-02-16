from django.shortcuts import render
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from .serializers import UserRegisterSerializer
# Create your views here.

class Home(APIView):
    def get(self, request):
        return Response({'message': 'Hello World!'})


class UserRegisterView(APIView):
    def post(self, request):
        serializer = UserRegisterSerializer(data=request.POST)
        if serializer.is_valid():
            serializer.create(serializer.validated_data)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)