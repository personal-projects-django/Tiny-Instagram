from django.core.mail import send_mail
import random

def send_otp_email(email, otp):
    send_mail(
        'Your OTP Code',
        f'Your OTP code is {otp}',
        'mohammadrezajavaherykian@gmail.com',
        [email],
        fail_silently=False,
    )


def generate_otp():
    return str(random.randint(100000, 999999))