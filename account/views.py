from typing import Generic

from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.shortcuts import render
from django.utils.encoding import smart_str, DjangoUnicodeDecodeError
from django.utils.http import urlsafe_base64_decode
from django.views import View
from rest_framework import status
from rest_framework.generics import GenericAPIView
from rest_framework.views import APIView
from rest_framework.response import Response

from permissions import IsOwnerOrReadOnly
from .models import User, Profile ,OTP
from utils import send_otp_code
from .serializers import UserRegisterSerializer,  UserLoginSerializer, ProfileSerializer, \
    UserUpdateSerializer, PasswordResetRequestSerializer, SetNewPasswordSerializer,LogoutUserSerializer
import random
from .email import send_otp_email,generate_otp
from django.contrib.auth import login

from django.utils.timezone import now

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

class UserRegisterView(GenericAPIView):
    serializer_class = UserRegisterSerializer

    def post(self, request):
        serializer = self.serializer_class(data=request.data)
        if serializer.is_valid(raise_exception=True):
            serializer.save()
            user = serializer.data
            send_otp_email(user['email'])
            print(user)
            # send email
            return Response({
                'data':user,
                'message':f'hi {user} thanks for signing up a passcode'
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# class VerifyOTPView(GenericAPIView):
#     def post(self, request):
#         otpcode = request.data.get('otp')
#         try:
#             user_code_obj = OTP.objects.get(otp=otpcode)
#             user = user_code_obj.user
#             if not user.is_verified:
#                 user.is_verified = True
#                 user.save()
#                 return Response({
#                     'message':'account email verified successfully'
#                 }, status=status.HTTP_200_OK)
#             return Response({
#                 'message': 'code is invalid user already verified'
#             }, status=status.HTTP_204_NO_CONTENT)
#
#         except OTP.DoesNotExist:
#             return Response({
#                 'message': 'passcode not provided'
#             }, status=status.HTTP_404_NOT_FOUND)

class VerifyOTPView(GenericAPIView):
    def post(self, request):
        otp_code = request.data.get('otp')
        email = request.data.get('email')

        if not otp_code or not email:
            return Response({'message': 'Email and OTP are required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user_otp = OTP.objects.get(user__email=email, otp=otp_code)

            if user_otp.is_expired():
                new_otp_response = send_otp_email(email)
                return Response({
                    'message': 'OTP has expired, a new OTP has been sent',
                    'expires_in': new_otp_response.get('expires_in', '1 minutes ')
                }, status=status.HTTP_400_BAD_REQUEST)

            user = user_otp.user
            if not user.is_verified:
                user.is_verified = True
                user.save()
                user_otp.delete()

                return Response({'message': 'Account email verified successfully'}, status=status.HTTP_200_OK)

            return Response({'message': 'User already verified'}, status=status.HTTP_200_OK)

        except OTP.DoesNotExist:
            return Response({'message': 'Invalid OTP or email'}, status=status.HTTP_404_NOT_FOUND)


class UserLoginView(GenericAPIView):
    serializer_class = UserLoginSerializer
    def post(self, request):
        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)
        return Response(serializer.data,status=status.HTTP_200_OK)

#             Password

class PasswordResetRequestView(GenericAPIView):
    serializer_class = PasswordResetRequestSerializer
    def post(self, request):
        serializer = self.serializer_class(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        return Response({'message':'a link has been sent to your email to reset your password'}, status=status.HTTP_200_OK)


class PasswordResetConfirm(GenericAPIView):
    def get(self, request,uidb64, token):
        try:
            user_id = smart_str(urlsafe_base64_decode(uidb64))
            user = User.objects.get(pk=user_id)
            if not PasswordResetTokenGenerator().check_token(user, token):
                return Response({'message':'token is invalid or has expired'}, status=status.HTTP_401_UNAUTHORIZED)
            return Response({'success': True,'message':'credentials is valid','uidb64':uidb64,'token':token}, status=status.HTTP_200_OK)

        except DjangoUnicodeDecodeError:
            return Response({'message':'token is invalid or has expired'}, status=status.HTTP_401_UNAUTHORIZED)

class SetNewPasswordView(GenericAPIView):
    serializer_class = SetNewPasswordSerializer
    def patch(self, request):
        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)
        return Response({'message':'password reset successfull'},status=status.HTTP_200_OK)


#      logout

class LogoutUserView(GenericAPIView):
    serializer_class = LogoutUserSerializer
    permission_classes = (IsOwnerOrReadOnly,)
    def post(self, request):
        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(status=status.HTTP_204_NO_CONTENT)


# class ResendOTPView(APIView):
#     def post(self, request):
#         serializer = ResendOTPSerializer(data=request.data)
#         if serializer.is_valid():
#             email = serializer.validated_data['email']
#
#             try:
#                 otp_instance = OTP.objects.get(email=email)
#
#
#                 otp_instance.otp = str(random.randint(100000, 999999))
#                 otp_instance.expires_at = timezone.now() + timedelta(minutes=1)
#                 otp_instance.save()
#
#
#                 send_otp_email(email, otp_instance.otp)
#
#                 return Response({'message': 'OTP has been sent to your email.'}, status=status.HTTP_200_OK)
#
#             except OTP.DoesNotExist:
#                 return Response({'error': 'Email not registered.'}, status=status.HTTP_400_BAD_REQUEST)
#         return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
#


#  <<<<<<<<<<<  login  >>>>>>>>>>>>>>>>>>>>>
# class UserLoginView(APIView):
#
#     def post(self, request):
#         serializer = UserLoginSerializer(data=request.data)
#         if serializer.is_valid():
#             user = serializer.validated_data
#             login(request, user)
#             return Response({'message': 'Login successful'}, status=status.HTTP_200_OK)
#         return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

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