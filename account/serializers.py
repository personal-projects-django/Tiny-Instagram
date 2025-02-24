from django.contrib.auth import authenticate
from rest_framework import serializers

from account.models import User



class UserRegisterSerializer(serializers.ModelSerializer):
    password2 = serializers.CharField(write_only=True,required=True)

    class Meta:
        model = User
        fields = ['username', 'email','phone','password','password2','is_verified']
        extra_kwargs = {'password':{'write_only':True}}


    def create(self, validated_data):
        del validated_data['password2']
        user = User.objects.create_user(**validated_data)
        user.generate_otp()
        user.set_password(validated_data['password'])
        user.save()
        return user

    # def create(self, validated_data):
    #     user = User.objects.create(
    #         username=validated_data['username'],
    #         email=validated_data['email']
    #     )
    #     user.set_password(validated_data['password'])
    #     user.generate_otp()
    #     return user
    #


    def validate_username(self, value):
        if value == 'password':
            raise serializers.ValidationError('username can not be password')
        return value

    def validate(self, data):

        if data['password'] != data['password2']:
            raise serializers.ValidationError('passwords must match')
        return data




class UserVerifyOTPSerializer(serializers.Serializer):
    email = serializers.EmailField()
    otp = serializers.CharField(max_length=6)



class UserLoginSerializer(serializers.Serializer):
    username_or_email = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        username_or_email = data.get('username_or_email')
        password = data.get('password')

        user = (User.objects.filter(username=username_or_email).first() or
                User.objects.filter(email=username_or_email).first())

        if user and user.is_verified:
            authenticated_user = authenticate(username=username_or_email, password=password)
            if authenticated_user:
                return authenticated_user
            raise serializers.ValidationError('Invalid credentials')