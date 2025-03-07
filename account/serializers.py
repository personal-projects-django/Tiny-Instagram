import random
from django.utils import timezone
from datetime import timedelta
from django.contrib.auth import authenticate
from rest_framework import serializers
from rest_framework.exceptions import AuthenticationFailed
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.contrib.sites.shortcuts import get_current_site
from django.utils.encoding import smart_str, smart_bytes, force_str
from django.urls import reverse
from rest_framework_simplejwt.exceptions import TokenError

from account.email import send_normal_email
from rest_framework_simplejwt.tokens import RefreshToken,Token
from account.models import User, Profile,OTP



class UserRegisterSerializer(serializers.ModelSerializer):
    password2 = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'phone', 'password', 'password2']
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        del validated_data['password2']
        user = User.objects.create_user(**validated_data)
        user.set_password(validated_data['password'])
        user.save()
        # otp_instance = OTP.objects.create(
        #     email=user.email,
        #     otp=str(random.randint(100000, 999999)),
        #     expires_at=timezone.now() + timedelta(minutes=1)
        # )
        #
        # send_otp_email(user.email, otp_instance.otp)
        return user

    def validate_username(self, value):
        if value == 'password':
            raise serializers.ValidationError('Username cannot be "password".')
        return value

    def validate(self, data):

        if data['password'] != data['password2']:
            raise serializers.ValidationError('Passwords must match.')
        return data



# class UserRegisterSerializer(serializers.ModelSerializer):
#     password2 = serializers.CharField(write_only=True,required=True)
#
#     class Meta:
#         model = User
#         fields = ['username', 'email','phone','password','password2']
#         extra_kwargs = {'password':{'write_only':True}}
#
#
#     def create(self, validated_data):
#         del validated_data['password2']
#         user = User.objects.create_user(**validated_data)
#         user.generate_otp()
#         user.set_password(validated_data['password'])
#         user.save()
#         return user
#
#     # def create(self, validated_data):
#     #     user = User.objects.create(
#     #         username=validated_data['username'],
#     #         email=validated_data['email']
#     #     )
#     #     user.set_password(validated_data['password'])
#     #     user.generate_otp()
#     #     return user
#     #
#
#
#     def validate_username(self, value):
#         if value == 'password':
#             raise serializers.ValidationError('username can not be password')
#         return value
#
#     def validate(self, data):
#
#         if data['password'] != data['password2']:
#             raise serializers.ValidationError('passwords must match')
#         return data


class UserVerifyOTPSerializer(serializers.Serializer):
    email = serializers.EmailField()
    otp = serializers.CharField(max_length=6)

    def validate(self, data):
        try:
            otp_instance = OTP.objects.get(email=data['email'], otp=data['otp'])

            if timezone.now() > otp_instance.expires_at:
                raise serializers.ValidationError({'error': 'OTP has expired.'})

            return data

        except OTP.DoesNotExist:
            raise serializers.ValidationError({'error': 'Invalid OTP.'})


class ResendOTPSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate_email(self, value):

        if not OTP.objects.filter(email=value).exists():
            raise serializers.ValidationError("email does not exist.")
        return value




class UserLoginSerializer(serializers.ModelSerializer):
    username_or_email = serializers.CharField()
    password = serializers.CharField(write_only=True)
    access_token = serializers.CharField(max_length=255,read_only=True)
    refresh_token = serializers.CharField(max_length=255,read_only=True)

    class Meta:
        model = User
        fields = ['username_or_email','password','access_token','refresh_token']

    def validate(self, data):
        username_or_email = data.get('username_or_email')
        password = data.get('password')

        user = (User.objects.filter(username=username_or_email).first() or
                User.objects.filter(email=username_or_email).first())

        if user and User.is_verified:
            authenticated_user = authenticate(username=username_or_email, password=password)
            if not authenticated_user:
                raise AuthenticationFailed('Invalid credentials try again.')
            user_tokens = user.tokens()


            return {
                'username_or_email': user.username,
                'access_token': str(user_tokens.get('access')),
                'refresh_token': str(user_tokens.get('refresh')),

            }

#                      PasswordResetRequestSerializer

class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()

    class Meta:
        fields = ['email']

    def validate(self, attrs):
        email = attrs.get('email')
        if User.objects.filter(email=email).exists():
            user = User.objects.get(email=email)
            uidb64 = urlsafe_base64_encode(smart_bytes(user.id))
            token = PasswordResetTokenGenerator().make_token(user)
            request = self.context.get('request')
            site_domain = get_current_site(request).domain
            relative_link = reverse('password_reset_confirm', kwargs={'uidb64': uidb64, 'token': token})
            abslink = f'http://{site_domain}{relative_link}'
            email_body = f'Hi use the link below to reset your password \n {abslink}'
            data = {
                'email_body': email_body,
                'email_subject': 'Reset your password',
                'to_email':user.email,
            }
            send_normal_email(data)

        return super().validate(attrs)

#                 SetNewPasswordSerializer

class SetNewPasswordSerializer(serializers.Serializer):
    password = serializers.CharField(write_only=True)
    confirm_password = serializers.CharField(write_only=True)
    uidb64 = serializers.CharField(write_only=True)
    token = serializers.CharField(write_only=True)

    class Meta:
        fields = ['password', 'confirm_password', 'uidb64', 'token']

    def validate(self, attrs):
        try:
            token = attrs.get('token')
            uidb64 = attrs.get('uidb64')
            password = attrs.get('password')
            confirm_password = attrs.get('confirm_password')

            user_id = force_str(urlsafe_base64_decode(uidb64))
            user = User.objects.get(pk=user_id)
            if not PasswordResetTokenGenerator().check_token(user, token):
                raise AuthenticationFailed('reset link is invalid or has expired.')
            if password != confirm_password:
                raise AuthenticationFailed('password and confirm_password do not match.')
            user.set_password(password)
            user.save()
            return user

        except Exception as e:
            raise AuthenticationFailed('link is invalid or has expired.')

#
class LogoutUserSerializer(serializers.Serializer):
    refresh_token = serializers.CharField()

    default_error_messages = {
        'bad_token':('Token is invalid or has expired.')
    }

    def validate(self, attrs):
        self.token = attrs.get('refresh_token')
        return attrs

    def save(self, **kwargs):
        try:
            token = RefreshToken(self.token)
            token.blacklist()
        except TokenError:
            return self.fail('bad_token')









class UserUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['username','phone']



class ProfileSerializer(serializers.ModelSerializer):
    # avatar = serializers.SerializerMethodField()
    class Meta:
        model = Profile
        fields = ('user', 'avatar', 'bio', 'first_name', 'last_name', 'age')
