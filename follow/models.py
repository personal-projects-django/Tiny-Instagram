from django.db import models
from account.models import User
# Create your models here.

class Follow(models.Model):
    follower = models.ForeignKey(User, on_delete=models.CASCADE, related_name='following')
    following = models.ForeignKey(User, on_delete=models.CASCADE, related_name='followers')
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['follower', 'following'],
                name='unique_follow'
            )
        ]
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.follower.username} → {self.following.username}'

class FollowRequest(models.Model):
    class Status(models.TextChoices):
        PENDING  = 'pending',  'Pending'
        ACCEPTED = 'accepted', 'Accepted'
        REJECTED = 'rejected', 'Rejected'

    sender    = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_requests')
    receiver  = models.ForeignKey(User, on_delete=models.CASCADE, related_name='received_requests')
    status    = models.CharField(max_length=10, choices=Status.choices, default=Status.PENDING)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('sender', 'receiver')

    def __str__(self):
        return f'{self.sender} → {self.receiver} ({self.status})'

# class Friendship(models.Model):
#     request_from = models.ForeignKey(User, on_delete=models.PROTECT, related_name='friend_request_from')
#     request_to = models.ForeignKey(User, on_delete=models.PROTECT, related_name='friend_request_to')
#     is_accepted = models.BooleanField(default=False)
#     created_time = models.DateTimeField(auto_now_add=True)
#     updated_time = models.DateTimeField(auto_now=True)
#
#     class Meta:
#         unique_together = ('request_from', 'request_to')


