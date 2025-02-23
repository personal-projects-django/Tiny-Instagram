from django.shortcuts import render
from django.views import View
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import User
from utils import send_otp_code
from .serializers import UserRegisterSerializer ,UserVerifyOTPSerializer,UserLoginSerializer
import random
from .email import send_otp_email
from django.contrib.auth import login
# Create your views here.

# class Home(View):
#     template_name = 'account/base.html'


# class UserRegisterView(APIView):
#     def post(self, request):
#         print(request.data)
#         serializer = UserRegisterSerializer(data=request.data)
#         if serializer.is_valid():
#             serializer.create(serializer.validated_data)
#             return Response(serializer.data, status=status.HTTP_201_CREATED)
#         return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
#
class UserRegisterView(APIView):
    def post(self, request):
        serializer = UserRegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            send_otp_email(user.email, user.otp)
            return Response({'message': 'OTP sent to email'}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class VerifyOTPView(APIView):
    def post(self, request):
        serializer = UserVerifyOTPSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data['email']
            otp = serializer.validated_data['otp']
            try:
                user = User.objects.get(email=email, otp=otp).first()

                user.is_verified = True
                user.otp = None
                user.save()
                return Response({'message': 'Account verified'}, status=status.HTTP_200_OK)
            except User.DoesNotExist:
                return Response({'error': 'Invalid OTP'}, status=status.HTTP_400_BAD_REQUEST)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)




class UserLoginView(APIView):
    def post(self, request):
        serializer = UserLoginSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data
            login(request, user)
            return Response({'message': 'Login successful'}, status=status.HTTP_200_OK)
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



# class UserRegisterView(APIView):
#     def post(self, request):
#         serializer = UserRegisterSerializer(data=request.data)
#         if serializer.is_valid():
#             user = serializer.save()
#             send_mail(
#                 'Your OTP Code',
#                 f'Your OTP Code is: {user.otp}',
#                 'noreply@example.com',
#                 [user.email],
#                 fail_silently=False,
#             )
#             return Response({'message': 'OTP sent to email'}, status=status.HTTP_201_CREATED)
#         return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)





# class VerifyOTPAPIView(APIView):
#     def post(self, request):
#         email = request.data.get('email')
#         otp = request.data.get('otp')
#         user = User.objects.filter(email=email, otp=otp).first()
#         if user:
#             user.otp = None
#             user.save()
#             return Response({'message': 'Registration complete'}, status=status.HTTP_200_OK)
#         return Response({'error': 'Invalid OTP'}, status=status.HTTP_400_BAD_REQUEST)

# class LoginWithOTPAPIView(APIView):
#     def post(self, request):
#         email = request.data.get('email')
#         user = User.objects.filter(email=email).first()
#
#         if user:
#             user.generate_otp()
#             send_mail(
#                 'Login OTP Code',
#                 f'Your OTP Code is: {user.otp}',
#                 'noreply@example.com',
#                 [user.email],
#                 fail_silently=False,
#             )
#             return Response({'message': 'OTP sent to email'}, status=status.HTTP_200_OK)
#         return Response({'error': 'کاربری با این ایمیل وجود ندارد!'}, status=status.HTTP_400_BAD_REQUEST)
#
#
# class VerifyLoginOTPAPIView(APIView):
#     def post(self, request):
#         email = request.data.get('email')
#         otp = request.data.get('otp')
#         user = User.objects.filter(email=email, otp=otp).first()
#
#         if user:
#             user.otp = None
#             user.save()
#             return Response({'message': 'ورود موفقیت‌آمیز!', 'username': user.username}, status=status.HTTP_200_OK)
#         return Response({'error': 'کد OTP اشتباه است!'}, status=status.HTTP_400_BAD_REQUEST)
