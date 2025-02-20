from django.shortcuts import render
from django.views import View
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import OTP
from utils import send_otp_code
from .serializers import UserRegisterSerializer
import random
# Create your views here.

class Home(APIView):
    def get(self, request):
        return Response({'message': 'Hello World!'})


class UserRegisterView(APIView):
    def post(self, request):
        print(request.data)
        serializer = UserRegisterSerializer(data=request.data)
        if serializer.is_valid():
            serializer.create(serializer.validated_data)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# class UserRegisterView(APIView):
#     def post(self, request):
#         serializer = UserRegisterSerializer(data=request.POST)
#         if serializer.is_valid():
#             random_code = random.randint(1000,9999)
#             send_otp_code(serializer.data['email'], random_code)
#             OTP.objects.create(email=serializer.validated_data['email'],code=random_code)
#             request.session['user_registration_info'] = {
#                 'email': serializer.validated_data['email'],
#                 'username': serializer.validated_data['username'],
#                 'phone': serializer.validated_data['phone'],
#                 'password': serializer.validated_data['password'],
#             }
#
#             return Response(serializer.data, status=status.HTTP_201_CREATED)
#         return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
#



# class userregister(View):
#     def get(self, request):
#
#
#     def post(self, request):
#
