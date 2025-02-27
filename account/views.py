from django.shortcuts import render
from django.views import View
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response

from permissions import IsOwnerOrReadOnly
from .models import User, Profile ,OTP
from utils import send_otp_code
from .serializers import UserRegisterSerializer, UserVerifyOTPSerializer, UserLoginSerializer, ProfileSerializer, \
    UserUpdateSerializer,ResendOTPSerializer
import random
from .email import send_otp_email,generate_otp
from django.contrib.auth import login

from django.utils import timezone
from datetime import timedelta
# Create your views here.

# <<<<<<<<<<<< normal register  >>>>>>>>>>>>>>>>>>>>>

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

# <<<<<<<<<<<< end normal register  >>>>>>>>>>>>>>>>>>>>>


#  <<<<<<<<<<<<<<<<<<< first code register test  >>>>>>>>>>>>>>>>>>>>>>>>

# class UserRegisterView(APIView):
#     def post(self, request):
#         serializer = UserRegisterSerializer(data=request.data)
#         if serializer.is_valid():
#             user = serializer.save()
#             send_otp_email(user.email, user.otp)
#             return Response({'message': 'OTP sent to email'}, status=status.HTTP_201_CREATED)
#         return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
#
#
# class VerifyOTPView(APIView):
#     def post(self, request):
#         serializer = UserVerifyOTPSerializer(data=request.data)
#         if serializer.is_valid():
#             email = serializer.validated_data['email']
#             otp = serializer.validated_data['otp']
#             try:
#                 user = User.objects.get(email=email, otp=otp).first()
#                 login(request, user)
#
#                 user.is_verified = True
#                 user.otp = None
#                 user.save()
#                 return Response({'message': 'Account verified'}, status=status.HTTP_200_OK)
#             except User.DoesNotExist:
#                 return Response({'error': 'Invalid OTP'}, status=status.HTTP_400_BAD_REQUEST)
#         return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
#
#
# class ResendOTPView(APIView):
#     def post(self, request):
#         email = request.data.get('email')
#         user = User.objects.filter(email=email).first()
#         if user:
#             user.generate_otp()
#             send_otp_email(user.email, user.otp)
#             return Response({'message': 'New OTP sent'}, status=status.HTTP_200_OK)
#         return Response({'error': 'User not found'}, status=status.HTTP_400_BAD_REQUEST)

#  <<<<<<<<<<<<<<<<<<< (end) first code register test  >>>>>>>>>>>>>>>>>>>>>>>>

#                         **************************

#  <<<<<<<<<<<<<<<<<<< second code register test  >>>>>>>>>>>>>>>>>>>>>>>>

class UserRegisterView(APIView):
    def post(self, request):
        serializer = UserRegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()


            existing_otp = OTP.objects.filter(email=user.email, expires_at__gt=timezone.now()).first()
            if existing_otp:
                return Response({
                    'message': 'An OTP is already sent. Please wait for it to expire.',
                    'expires_at': existing_otp.expires_at
                }, status=status.HTTP_400_BAD_REQUEST)


            otp_instance = OTP.objects.create(
                email=user.email,
                otp=str(random.randint(100000, 999999)),
                expires_at=timezone.now() + timedelta(minutes=1)
            )

            send_otp_email(user.email, otp_instance.otp)

            return Response({
                'message': 'OTP sent to email',
                'expires_at': otp_instance.expires_at
            }, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class VerifyOTPView(APIView):
    def post(self, request):
        serializer = UserVerifyOTPSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data['email']
            otp = serializer.validated_data['otp']

            otp_instance = OTP.objects.filter(email=email).first()
            if not otp_instance:
                return Response({'error': 'Invalid OTP'}, status=status.HTTP_400_BAD_REQUEST)


            if timezone.now() > otp_instance.expires_at:
                otp_instance.delete()
                return Response({'error': 'OTP expired. Please request a new one.'}, status=status.HTTP_400_BAD_REQUEST)


            if hasattr(otp_instance, 'attempts') and otp_instance.attempts >= 3:
                otp_instance.delete()
                return Response({'error': 'Too many failed attempts. Please request a new OTP.'},
                                status=status.HTTP_400_BAD_REQUEST)


            if otp_instance.otp != otp:
                otp_instance.attempts = getattr(otp_instance, 'attempts', 0) + 1
                otp_instance.save()
                return Response({'error': 'Invalid OTP'}, status=status.HTTP_400_BAD_REQUEST)


            user = User.objects.get(email=email)
            user.is_verified = True
            user.save()
            otp_instance.delete()

            login(request, user)
            return Response({'message': 'Account verified'}, status=status.HTTP_200_OK)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ResendOTPView(APIView):
    def post(self, request):
        serializer = ResendOTPSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data['email']

            try:
                otp_instance = OTP.objects.get(email=email)


                otp_instance.otp = str(random.randint(100000, 999999))
                otp_instance.expires_at = timezone.now() + timedelta(minutes=1)
                otp_instance.save()


                send_otp_email(email, otp_instance.otp)

                return Response({'message': 'OTP has been sent to your email.'}, status=status.HTTP_200_OK)

            except OTP.DoesNotExist:
                return Response({'error': 'Email not registered.'}, status=status.HTTP_400_BAD_REQUEST)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)



#  <<<<<<<<<<<  login  >>>>>>>>>>>>>>>>>>>>>
class UserLoginView(APIView):

    def post(self, request):
        serializer = UserLoginSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data
            login(request, user)
            return Response({'message': 'Login successful'}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

#  <<<<<<<<<<<<<< end login >>>>>>>>>>>>>>>>>>>>>>>>>>>


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


#  <<<<<<<<<<<<<<  User Update  >>>>>>>>>>>>>>>>>>>

class UserUpdateView(APIView):
    permission_classes = (IsOwnerOrReadOnly,)
    def put(self, request,user_pk):
        user = User.objects.get(pk=user_pk,user=request.user)
        self.check_object_permissions(request, user)
        serializer = UserUpdateSerializer(user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save(user=request.user)
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# <<<<<<<<<<<<<<<<  end user update >>>>>>>>>>>>>>>>>>>>>>>



#    <<<<<<<<<<<<<<<<<<<   Profile  >>>>>>>>>>>>>>>>>>>>>>
#                    get post put delete
class ProfileView(APIView):
    permission_classes = [IsOwnerOrReadOnly, ]

    def get(self, request,profile_pk):
        try:
            profile = Profile.objects.get(pk=profile_pk, user=request.user)
            self.check_object_permissions(request, profile)
        except Profile.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
        serializer = ProfileSerializer(profile)
        return Response(serializer.data)


    def post(self, request):
        serializer = ProfileSerializer(data=request.data)
        if serializer.is_valid(raise_exception=True):
            serializer.save(user=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# <<<<<<<<<<<<<<<<  update >>>>>>>>>>>>>>>>>>>>>>>

class ProfileUpdateView(APIView):
    permission_classes = [IsOwnerOrReadOnly, ]

    def put(self, request, profile_pk):
        profile = Profile.objects.get(pk=profile_pk, user=request.user)
        self.check_object_permissions(request, profile)
        serializer = ProfileSerializer(profile, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save(user=request.user)
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# <<<<<<<<<<<<<<<<  delete >>>>>>>>>>>>>>>>>>>>>>>

class ProfileDeleteView(APIView):
    permission_classes = [IsOwnerOrReadOnly, ]
    def delete(self, request, profile_pk):
        profile = Profile.objects.get(pk=profile_pk, user=request.user)
        self.check_object_permissions(request, profile)
        profile.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)