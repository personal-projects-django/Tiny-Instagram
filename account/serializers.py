import random
from django.utils import timezone
from datetime import timedelta
from django.contrib.auth import authenticate
from rest_framework import serializers
from rest_framework.exceptions import AuthenticationFailed

from account.email import send_otp_email
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





class UserUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['username','phone']



class ProfileSerializer(serializers.ModelSerializer):
    # avatar = serializers.SerializerMethodField()
    class Meta:
        model = Profile
        fields = ('user', 'avatar', 'bio', 'first_name', 'last_name', 'age')
