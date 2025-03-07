from django.core.mail import send_mail,EmailMessage
import random
from .models import User,OTP
from django.conf import settings
from django.utils.timezone import now, timedelta

def generate_otp():
    return str(random.randint(100000, 999999))


# def send_otp_email(email):
#     subject = 'Your OTP'
#     otp_code = generate_otp()
#     print(otp_code)
#     user = User.objects.get(email=email)
#     current_site='mohammadrezajavaherykian@gmail.com'
#     email_body=f'Hi {user} thanks for signing up on {current_site} please verify your email with the \n one time passcode {otp_code}'
#     from_email =settings.DEFAULT_FROM_EMAIL
#
#     OTP.objects.create(user=user,otp=otp_code)
#
#     d_email = EmailMessage(subject=subject, body=email_body, from_email=from_email, to=[email])
#     d_email.send(fail_silently=True)
def send_otp_email(email):
    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        return {'error': 'User with this email does not exist'}

    otp_entry, created = OTP.objects.get_or_create(user=user, email=email)

    if not created and not otp_entry.is_expired():
        remaining_time = otp_entry.expires_at - now()
        return {
            'message': 'OTP is still valid',
            'expires_in': f'{remaining_time.seconds // 60} minutes {remaining_time.seconds % 60} seconds'
        }


    otp_entry.otp = generate_otp()
    otp_entry.expires_at = now() + timedelta(minutes=1)
    otp_entry.save()

    subject = 'Your OTP Code'
    email_body = f'''
    Hi {user.username},  
    Your one-time passcode is: **{otp_entry.otp}**  
    This code will expire in 1 minutes.
    '''

    d_email = EmailMessage(subject=subject, body=email_body, from_email=settings.DEFAULT_FROM_EMAIL, to=[email])

    try:
        d_email.send(fail_silently=False)
        return {
            'success': 'New OTP sent successfully',
            'expires_in': '1 minutes '
        }
    except Exception as e:
        return {'error': f'Failed to send OTP: {str(e)}'}

# def send_otp_email(email, otp):
#     send_mail(
#         'Your OTP Code',
#         f'Your OTP code is {otp}',
#         'mohammadrezajavaherykian@gmail.com',
#         [email],
#         fail_silently=False,
#     )

def send_normal_email(data):
    email=EmailMessage(
        subject=data['email_subject'],
        body=data['email_body'],
        from_email=settings.EMAIL_HOST_USER,
        to=[data['to_email']],
    )
    email.send()