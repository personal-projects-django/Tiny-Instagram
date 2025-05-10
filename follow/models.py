from django.db import models
from account.models import User
# Create your models here.



class Friendship(models.Model):
    request_from = models.ForeignKey(User, on_delete=models.PROTECT, related_name='friend_request_from')
    request_to = models.ForeignKey(User, on_delete=models.PROTECT, related_name='friend_request_to')
    is_accepted = models.BooleanField(default=False)
    created_time = models.DateTimeField(auto_now_add=True)
    updated_time = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('request_from', 'request_to')