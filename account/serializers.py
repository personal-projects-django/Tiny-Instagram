from rest_framework import serializers

from account.models import User



class UserRegisterSerializer(serializers.ModelSerializer):
    password2 = serializers.CharField(write_only=True,required=True)

    class Meta:
        model = User
        fields = ['username', 'email','phone','password','password2']
        extra_kwargs = {'password':{'write_only':True}}


    def create(self, validated_data):
        del validated_data['password2']
        User.objects.create_user(**validated_data)
        return validated_data
        # user.generate_otp()


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