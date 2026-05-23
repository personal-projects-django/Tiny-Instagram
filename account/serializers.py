from django.contrib.auth import authenticate
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.contrib.sites.shortcuts import get_current_site
from django.utils.encoding import smart_bytes, force_str
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.urls import reverse
from rest_framework import serializers
from rest_framework.exceptions import AuthenticationFailed
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError

from account.models import User, Profile, OTP
from account.email import send_normal_email


class UserRegisterSerializer(serializers.ModelSerializer):
    password  = serializers.CharField(write_only=True, min_length=8)
    password2 = serializers.CharField(write_only=True)

    class Meta:
        model  = User
        fields = ['username', 'email', 'phone', 'password', 'password2']

    def validate_username(self, value):
        if value.lower() in ('password', 'admin', 'root'):
            raise serializers.ValidationError('این نام کاربری مجاز نیست.')
        return value

    def validate(self, data):
        if data['password'] != data['password2']:
            raise serializers.ValidationError({'password': 'رمز عبور و تکرار آن یکسان نیستند.'})
        return data

    def create(self, validated_data):
        validated_data.pop('password2')
        return User.objects.create_user(**validated_data)


class UserLoginSerializer(serializers.Serializer):
    username_or_email = serializers.CharField()
    password          = serializers.CharField(write_only=True)
    access_token      = serializers.CharField(read_only=True)
    refresh_token     = serializers.CharField(read_only=True)
    user_id           = serializers.IntegerField(read_only=True)
    username          = serializers.CharField(read_only=True)
    avatar            = serializers.CharField(read_only=True)

    def validate(self, data):
        username_or_email = data.get('username_or_email')
        password          = data.get('password')

        user = (
            User.objects.filter(username=username_or_email).first() or
            User.objects.filter(email=username_or_email).first()
        )

        if not user:
            raise AuthenticationFailed('کاربر یافت نشد.')
        if not user.is_active:
            raise AuthenticationFailed('حساب کاربری غیرفعال است.')
        if not user.is_verified:
            raise AuthenticationFailed('ایمیل تأیید نشده است.')
        if not user.check_password(password):
            raise AuthenticationFailed('رمز عبور اشتباه است.')

        tokens = user.tokens()
        avatar = ''
        if hasattr(user, 'profile') and user.profile.avatar:
            avatar = user.profile.avatar.url

        return {
            'user_id': user.id,
            'username': user.username,
            'avatar': avatar,
            'access_token': tokens['access'],
            'refresh_token': tokens['refresh'],
        }


class OTPVerifySerializer(serializers.Serializer):
    email = serializers.EmailField()
    otp   = serializers.CharField(max_length=6, min_length=6)

    def validate(self, data):
        try:
            otp_obj = OTP.objects.get(email=data['email'])
        except OTP.DoesNotExist:
            raise serializers.ValidationError('کد OTP معتبر نیست.')

        if otp_obj.is_expired():
            raise serializers.ValidationError('کد OTP منقضی شده است.')
        if otp_obj.otp != data['otp']:
            raise serializers.ValidationError('کد OTP اشتباه است.')

        return data


class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate_email(self, value):
        # چه ایمیل وجود داشته باشه چه نه، پیام موفقیت برمی‌گردونیم (امنیت)
        return value

    def save(self):
        email   = self.validated_data['email']
        request = self.context.get('request')
        user    = User.objects.filter(email=email).first()
        if not user:
            return

        uidb64  = urlsafe_base64_encode(smart_bytes(user.id))
        token   = PasswordResetTokenGenerator().make_token(user)
        domain  = get_current_site(request).domain
        link    = reverse('password-reset-confirm')
        abslink = f'http://{domain}{link}?uidb64={uidb64}&token={token}'

        send_normal_email({
            'email_body'   : f'برای بازنشانی رمز عبور روی لینک زیر کلیک کنید:\n{abslink}',
            'email_subject': 'بازنشانی رمز عبور',
            'to_email'     : user.email,
        })


class SetNewPasswordSerializer(serializers.Serializer):
    password         = serializers.CharField(write_only=True, min_length=8)
    confirm_password = serializers.CharField(write_only=True)
    uidb64           = serializers.CharField(write_only=True)
    token            = serializers.CharField(write_only=True)

    def validate(self, data):
        if data['password'] != data['confirm_password']:
            raise serializers.ValidationError({'password': 'رمزها یکسان نیستند.'})
        try:
            user_id = force_str(urlsafe_base64_decode(data['uidb64']))
            user    = User.objects.get(pk=user_id)
        except (ValueError, User.DoesNotExist):
            raise AuthenticationFailed('لینک نامعتبر است.')

        if not PasswordResetTokenGenerator().check_token(user, data['token']):
            raise AuthenticationFailed('لینک منقضی یا نامعتبر است.')

        user.set_password(data['password'])
        user.save()
        return data


class LogoutUserSerializer(serializers.Serializer):
    refresh_token = serializers.CharField()

    def validate(self, attrs):
        self.token = attrs['refresh_token']
        return attrs

    def save(self, **kwargs):
        try:
            RefreshToken(self.token).blacklist()
        except TokenError:
            raise serializers.ValidationError('توکن نامعتبر یا منقضی شده است.')


class ProfileSerializer(serializers.ModelSerializer):
    username       = serializers.CharField(source='user.username', read_only=True)
    email          = serializers.EmailField(source='user.email', read_only=True)
    full_name      = serializers.SerializerMethodField()
    followers_count = serializers.SerializerMethodField()
    following_count = serializers.SerializerMethodField()
    posts_count    = serializers.SerializerMethodField()

    class Meta:
        model  = Profile
        fields = [
            'user', 'username', 'email', 'avatar', 'bio',
            'first_name', 'last_name', 'full_name', 'age',
            'followers_count', 'following_count', 'posts_count',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['user', 'created_at', 'updated_at']

    def get_full_name(self, obj):
        return f'{obj.first_name} {obj.last_name}'.strip()

    def get_followers_count(self, obj):
        return obj.user.followers.count()

    def get_following_count(self, obj):
        return obj.user.following.count()

    def get_posts_count(self, obj):
        return obj.user.posts.filter(is_active=True).count()

class ProfileUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Profile
        fields = ['avatar', 'bio', 'first_name', 'last_name', 'age']


class UserUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model  = User
        fields = ['username', 'phone']

    def validate_username(self, value):
        user = self.context['request'].user
        if User.objects.exclude(pk=user.pk).filter(username=value).exists():
            raise serializers.ValidationError('این نام کاربری قبلاً گرفته شده.')
        return value


class UserMiniSerializer(serializers.ModelSerializer):
    """سریالایزر سبک — برای نمایش در لیست‌ها"""
    avatar = serializers.SerializerMethodField()

    class Meta:
        model  = User
        fields = ['id', 'username', 'avatar']

    def get_avatar(self, obj):
        if hasattr(obj, 'profile') and obj.profile.avatar:
            return obj.profile.avatar.url
        return ''

class UserSearchSerializer(serializers.ModelSerializer):
    """برای سرچ کاربران"""
    avatar           = serializers.SerializerMethodField()
    followers_count  = serializers.SerializerMethodField()
    is_following     = serializers.SerializerMethodField()

    class Meta:
        model  = User
        fields = ['id', 'username', 'avatar', 'followers_count', 'is_following']

    def get_avatar(self, obj):
        if hasattr(obj, 'profile') and obj.profile.avatar:
            return obj.profile.avatar.url
        return ''

    def get_followers_count(self, obj):
        return obj.followers.count()

    def get_is_following(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            from follow.models import Follow
            return Follow.objects.filter(
                follower=request.user, following=obj
            ).exists()
        return False


class PublicProfileSerializer(serializers.ModelSerializer):
    """پروفایل عمومی — دیدن پروفایل بقیه مثل اینستاگرام"""
    username        = serializers.CharField(source='user.username', read_only=True)
    full_name       = serializers.SerializerMethodField()
    followers_count = serializers.SerializerMethodField()
    following_count = serializers.SerializerMethodField()
    posts_count     = serializers.SerializerMethodField()
    is_following    = serializers.SerializerMethodField()
    is_followed_by  = serializers.SerializerMethodField()  # این کاربر تو رو فالو کرده؟
    posts           = serializers.SerializerMethodField()

    class Meta:
        model  = Profile
        fields = [
            'user', 'username', 'full_name', 'avatar', 'bio',
            'followers_count', 'following_count', 'posts_count',
            'is_following', 'is_followed_by', 'posts',
        ]

    def get_full_name(self, obj):
        return f'{obj.first_name} {obj.last_name}'.strip()

    def get_followers_count(self, obj):
        return obj.user.followers.count()

    def get_following_count(self, obj):
        return obj.user.following.count()

    def get_posts_count(self, obj):
        return obj.user.posts.filter(is_active=True, visibility='public').count()

    def get_is_following(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            from follow.models import Follow
            return Follow.objects.filter(
                follower=request.user, following=obj.user
            ).exists()
        return False

    def get_is_followed_by(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            from follow.models import Follow
            return Follow.objects.filter(
                follower=obj.user, following=request.user
            ).exists()
        return False

    def get_posts(self, obj):
        """فقط پست‌های عمومی نمایش داده میشه"""
        from post.serializers import PostSerializer
        posts = obj.user.posts.filter(is_active=True, visibility='public').order_by('-created_at')[:12]
        return PostSerializer(posts, many=True, context=self.context).data





# import random
# from django.utils import timezone
# from datetime import timedelta
# from django.contrib.auth import authenticate
# from rest_framework import serializers
# from rest_framework.exceptions import AuthenticationFailed
# from django.contrib.auth.tokens import PasswordResetTokenGenerator
# from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
# from django.contrib.sites.shortcuts import get_current_site
# from django.utils.encoding import smart_str, smart_bytes, force_str
# from django.urls import reverse
# from rest_framework_simplejwt.exceptions import TokenError
#
# from account.email import send_normal_email
# from rest_framework_simplejwt.tokens import RefreshToken,Token
# from account.models import User, Profile,OTP
#
#
#
# class UserRegisterSerializer(serializers.ModelSerializer):
#     password2 = serializers.CharField(write_only=True, required=True)
#
#     class Meta:
#         model = User
#         fields = ['username', 'email', 'phone', 'password', 'password2']
#         extra_kwargs = {'password': {'write_only': True}}
#
#     def create(self, validated_data):
#         del validated_data['password2']
#         user = User.objects.create_user(**validated_data)
#         user.set_password(validated_data['password'])
#         user.save()
#         # otp_instance = OTP.objects.create(
#         #     email=user.email,
#         #     otp=str(random.randint(100000, 999999)),
#         #     expires_at=timezone.now() + timedelta(minutes=1)
#         # )
#         #
#         # send_otp_email(user.email, otp_instance.otp)
#         return user
#
#     def validate_username(self, value):
#         if value == 'password':
#             raise serializers.ValidationError('Username cannot be "password".')
#         return value
#
#     def validate(self, data):
#
#         if data['password'] != data['password2']:
#             raise serializers.ValidationError('Passwords must match.')
#         return data
#
#
#
# # class UserRegisterSerializer(serializers.ModelSerializer):
# #     password2 = serializers.CharField(write_only=True,required=True)
# #
# #     class Meta:
# #         model = User
# #         fields = ['username', 'email','phone','password','password2']
# #         extra_kwargs = {'password':{'write_only':True}}
# #
# #
# #     def create(self, validated_data):
# #         del validated_data['password2']
# #         user = User.objects.create_user(**validated_data)
# #         user.generate_otp()
# #         user.set_password(validated_data['password'])
# #         user.save()
# #         return user
# #
# #     # def create(self, validated_data):
# #     #     user = User.objects.create(
# #     #         username=validated_data['username'],
# #     #         email=validated_data['email']
# #     #     )
# #     #     user.set_password(validated_data['password'])
# #     #     user.generate_otp()
# #     #     return user
# #     #
# #
# #
# #     def validate_username(self, value):
# #         if value == 'password':
# #             raise serializers.ValidationError('username can not be password')
# #         return value
# #
# #     def validate(self, data):
# #
# #         if data['password'] != data['password2']:
# #             raise serializers.ValidationError('passwords must match')
# #         return data
#
#
# # class UserVerifyOTPSerializer(serializers.Serializer):
# #     email = serializers.EmailField()
# #     otp = serializers.CharField(max_length=6)
# #
# #     def validate(self, data):
# #         try:
# #             otp_instance = OTP.objects.get(email=data['email'], otp=data['otp'])
# #
# #             if timezone.now() > otp_instance.expires_at:
# #                 raise serializers.ValidationError({'error': 'OTP has expired.'})
# #
# #             return data
# #
# #         except OTP.DoesNotExist:
# #             raise serializers.ValidationError({'error': 'Invalid OTP.'})
# #
# #
# # class ResendOTPSerializer(serializers.Serializer):
# #     email = serializers.EmailField()
# #
# #     def validate_email(self, value):
# #
# #         if not OTP.objects.filter(email=value).exists():
# #             raise serializers.ValidationError("email does not exist.")
# #         return value
#
#
#
# class UserLoginSerializer(serializers.ModelSerializer):
#     username_or_email = serializers.CharField()
#     password = serializers.CharField(write_only=True)
#     access_token = serializers.CharField(max_length=255, read_only=True)
#     refresh_token = serializers.CharField(max_length=255, read_only=True)
#     user_id = serializers.IntegerField(source='id', read_only=True)  # اضافه کردن id کاربر
#
#     class Meta:
#         model = User
#         fields = ['username_or_email', 'password', 'access_token', 'refresh_token', 'user_id']  # اضافه کردن id
#
#     def validate(self, data):
#         username_or_email = data.get('username_or_email')
#         password = data.get('password')
#
#         user = (User.objects.filter(username=username_or_email).first() or
#                 User.objects.filter(email=username_or_email).first())
#
#         if not user:
#             raise AuthenticationFailed('User not found')
#         if not user.is_verified:
#             raise AuthenticationFailed('Account not verified')
#
#         authenticated_user = authenticate(username=username_or_email, password=password)
#         if not authenticated_user:
#             raise AuthenticationFailed('Invalid credentials, try again.')
#
#         user_tokens = user.tokens()
#
#         return {
#             'username_or_email': user.username,
#             'access_token': str(user_tokens.get('access')),
#             'refresh_token': str(user_tokens.get('refresh')),
#             'user_id': user.id  # ارسال user_id به فرانت‌اند
#         }
# # class UserLoginSerializer(serializers.ModelSerializer):
# #     username_or_email = serializers.CharField()
# #     password = serializers.CharField(write_only=True)
# #     access_token = serializers.CharField(max_length=255, read_only=True)
# #     refresh_token = serializers.CharField(max_length=255, read_only=True)
# #
# #     class Meta:
# #         model = User
# #         fields = ['username_or_email', 'password', 'access_token', 'refresh_token']
# #
# #     def validate(self, data):
# #         username_or_email = data.get('username_or_email')
# #         password = data.get('password')
# #
# #         user = User.objects.filter(username=username_or_email).first() or \
# #                User.objects.filter(email=username_or_email).first()
# #
# #         if not user:
# #             raise AuthenticationFailed('User not found')
# #         if not user.is_verified:
# #             raise AuthenticationFailed('Account not verified')
# #
# #         # **اینجا مقدار صحیح را برای لاگین ارسال می‌کنیم**
# #         authenticated_user = authenticate(username=user.username, password=password)
# #         if not authenticated_user:
# #             raise AuthenticationFailed('Invalid credentials, try again.')
# #
# #         user_tokens = user.tokens()
# #
# #         return {
# #             'username_or_email': user.username,
# #             'access_token': str(user_tokens.get('access')),
# #             'refresh_token': str(user_tokens.get('refresh')),
# #         }
#
#
# #                      PasswordResetRequestSerializer
#
# class PasswordResetRequestSerializer(serializers.Serializer):
#     email = serializers.EmailField()
#
#     class Meta:
#         fields = ['email']
#
#     def validate(self, attrs):
#         email = attrs.get('email')
#         if User.objects.filter(email=email).exists():
#             user = User.objects.get(email=email)
#             uidb64 = urlsafe_base64_encode(smart_bytes(user.id))
#             token = PasswordResetTokenGenerator().make_token(user)
#             request = self.context.get('request')
#             site_domain = get_current_site(request).domain
#             relative_link = reverse('passcon')  # به جای مسیر API از مسیر فرانت استفاده کنید
#             abslink = f'http://{site_domain}{relative_link}?uidb64={uidb64}&token={token}'
#             email_body = f'Hi use the link below to reset your password \n {abslink}'
#             data = {
#                 'email_body': email_body,
#                 'email_subject': 'Reset your password',
#                 'to_email':user.email,
#             }
#             send_normal_email(data)
#
#         return super().validate(attrs)
#
# #                 SetNewPasswordSerializer
#
# class SetNewPasswordSerializer(serializers.Serializer):
#     password = serializers.CharField(write_only=True)
#     confirm_password = serializers.CharField(write_only=True)
#     uidb64 = serializers.CharField(write_only=True)
#     token = serializers.CharField(write_only=True)
#
#     class Meta:
#         fields = ['password', 'confirm_password', 'uidb64', 'token']
#
#     def validate(self, attrs):
#         try:
#             token = attrs.get('token')
#             uidb64 = attrs.get('uidb64')
#             password = attrs.get('password')
#             confirm_password = attrs.get('confirm_password')
#
#             user_id = force_str(urlsafe_base64_decode(uidb64))
#             user = User.objects.get(pk=user_id)
#             if not PasswordResetTokenGenerator().check_token(user, token):
#                 raise AuthenticationFailed('reset link is invalid or has expired.')
#             if password != confirm_password:
#                 raise AuthenticationFailed('password and confirm_password do not match.')
#             user.set_password(password)
#             user.save()
#             return user
#
#         except Exception as e:
#             raise AuthenticationFailed('link is invalid or has expired.')
#
# #
# class LogoutUserSerializer(serializers.Serializer):
#     refresh_token = serializers.CharField()
#
#     default_error_messages = {
#         'bad_token':('Token is invalid or has expired.')
#     }
#
#     def validate(self, attrs):
#         self.token = attrs.get('refresh_token')
#         return attrs
#
#     def save(self, **kwargs):
#         try:
#             token = RefreshToken(self.token)
#             token.blacklist()
#         except TokenError:
#             return self.fail('bad_token')
#
#
#
#
#
#
#
#
#
# class UserUpdateSerializer(serializers.ModelSerializer):
#     class Meta:
#         model = User
#         fields = ['username','phone']
#
#
#
# class ProfileSerializer(serializers.ModelSerializer):
#     username = serializers.CharField(source="user.username", read_only=True)
#     full_name = serializers.SerializerMethodField()
#
#     class Meta:
#         model = Profile
#         fields = ('user', 'username', 'avatar', 'bio', 'first_name', 'last_name', 'age', 'full_name')
#
#     def get_full_name(self, obj):
#         return f"{obj.first_name} {obj.last_name}".strip()
#
#
#
# class UserProfileSerializer(serializers.ModelSerializer):
#     profile = ProfileSerializer(read_only=True)
#
#     class Meta:
#         model = User
#         fields = ['id', 'username','profile']
