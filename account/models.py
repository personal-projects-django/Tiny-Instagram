from django.db import models

# Create your models here.
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from rest_framework_simplejwt.tokens import RefreshToken

from .managers import UserManager
from django.core.validators import RegexValidator
import random
from django.utils import timezone
from datetime import timedelta


#    User

class User(AbstractBaseUser, PermissionsMixin):
    email = models.EmailField(unique=True,verbose_name="Email")
    username = models.CharField(max_length=50, unique=True, verbose_name="Username")
    phone_regex = RegexValidator(regex=r'^(0|0098|\+98)?9(0[1-5]|[1-3]\d|2[0-2]|9[0-9])\d{7}$',
                                 message='The entered phone number format is incorrect.')
    phone = models.CharField(validators=[phone_regex], max_length=11, blank=True, verbose_name="Phone number")
    is_verified = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    def __str__(self):
        return f'{self.email}, ( {self.username} )'


    def tokens(self):
        refresh = RefreshToken.for_user(self)
        return {
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        }

    # def generate_otp(self):
    #     self.otp = str(random.randint(100000, 999999))
    #     self.otp_created_at = datetime.now()
    #     self.save()
    #
    # def is_otp_valid(self):
    #     if self.otp_created_at:
    #         return datetime.now() - self.otp_created_at <= timedelta(minutes=1)
    #     return False

#   OTP

class OTP(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    email = models.EmailField(unique=True, verbose_name="Email")
    otp = models.CharField(max_length=6, verbose_name="OTP Code")
    # expires_at = models.DateTimeField(verbose_name="Expires at")
    # is_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'{self.email}, ( {self.otp} ),{self.created_at}'

    def generate_otp(self):
        self.otp = str(random.randint(100000, 999999))
        self.expires_at = timezone.now() + timedelta(minutes=1)
        self.save()

    def is_otp_valid(self):
        return timezone.now() <= self.expires_at


#      Profile

class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    bio = models.TextField(max_length=500, blank=True)
    avatar = models.ImageField(default='default.jpg', upload_to='img/profile/')
    first_name = models.CharField(max_length=50, blank=True)
    last_name = models.CharField(max_length=50, blank=True)
    age = models.PositiveSmallIntegerField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    # post = models.ManyToManyField(Post, blank=True)


    @property
    def full_name(self):
        return f'{self.first_name} {self.last_name}'


    def __str__(self):
        return f'{self.user},{self.full_name}'