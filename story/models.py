from django.db import models

from account.models import User

from django.db import models
from django.utils.timezone import now
from datetime import timedelta
from account.models import User


def story_expiry():
    return now() + timedelta(hours=24)


class Story(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='stories')
    image = models.ImageField(upload_to='img/stories/', blank=True, null=True)
    video = models.FileField(upload_to='video/stories/', blank=True, null=True)
    caption = models.CharField(max_length=200, blank=True)
    views = models.ManyToManyField(User, related_name='viewed_stories', blank=True)
    expires_at = models.DateTimeField(default=story_expiry)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name_plural = 'Stories'

    @property
    def is_active(self):
        return now() < self.expires_at

    @property
    def views_count(self):
        return self.views.count()

    def __str__(self):
        return f'{self.user.username} - {self.created_at:%Y/%m/%d %H:%M}'


class StoryLike(models.Model):
    story = models.ForeignKey(Story, on_delete=models.CASCADE, related_name='likes')
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    emoji = models.CharField(max_length=10, default='❤️')   # ری‌اکشن به استوری
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('story', 'user')


class StoryReply(models.Model):
    """ریپلای به استوری — در واقع یک پیام خصوصی به صاحب استوری"""
    story = models.ForeignKey(Story, on_delete=models.CASCADE, related_name='replies')
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='story_replies')
    text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'{self.sender.username} → story#{self.story_id}'



# Create your models here.

# class Message(models.Model):
#     sender = models.ForeignKey(User, on_delete=models.CASCADE)
#     receiver = models.ForeignKey(User, on_delete=models.CASCADE)
#     text = models.TextField()
#     created_at = models.DateTimeField(auto_now_add=True)
#
#     def __str__(self):
#         return self.text



# class Reply(models.Model):
#     sender = models.ForeignKey(User, on_delete=models.CASCADE)
#     message = models.ForeignKey(Message, on_delete=models.CASCADE)
#     text = models.TextField()
#     created_at = models.DateTimeField(auto_now_add=True)
#
#     def __str__(self):
#         return self.text



# class Story(models.Model):
#     user = models.ForeignKey(User, on_delete=models.CASCADE)
#     like = models.ManyToManyField(User)
#     image = models.ImageField(upload_to='img/story/')
#     reply = models.ManyToManyField(Reply)
#     created = models.DateTimeField(auto_now_add=True)
#
#

