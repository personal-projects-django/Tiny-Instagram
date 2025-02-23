from django.core.mail import send_mail


def send_otp_email(email, otp):
    send_mail(
        'Your OTP Code',
        f'Your OTP code is {otp}',
        'your_email@gmail.com',
        [email],
        fail_silently=False,
    )