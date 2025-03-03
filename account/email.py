from django.core.mail import send_mail,EmailMessage
import random
from .models import User,OTP
from django.conf import settings

def generate_otp():
    return str(random.randint(100000, 999999))


def send_otp_email(email):
    subject = 'Your OTP'
    otp_code = generate_otp()
    print(otp_code)
    user = User.objects.get(email=email)
    current_site='mohammadrezajavaherykian@gmail.com'
    email_body=f'Hi {user} thanks for signing up on {current_site} please verify your email with the \n one time passcode {otp_code}'
    from_email =settings.DEFAULT_FROM_EMAIL

    OTP.objects.create(user=user,otp=otp_code)

    d_email = EmailMessage(subject=subject, body=email_body, from_email=from_email, to=[email])
    d_email.send(fail_silently=True)


# def send_otp_email(email, otp):
#     send_mail(
#         'Your OTP Code',
#         f'Your OTP code is {otp}',
#         'mohammadrezajavaherykian@gmail.com',
#         [email],
#         fail_silently=False,
#     )

