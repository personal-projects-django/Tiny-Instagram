from django.db import models
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from account.models import User


class Notification(models.Model):
    class Type(models.TextChoices):
        # پست
        LIKE            = 'like',            'Like'
        COMMENT         = 'comment',         'Comment'
        COMMENT_REPLY   = 'comment_reply',   'Comment reply'
        MENTION         = 'mention',         'Mention'
        # فالو
        FOLLOW          = 'follow',          'Follow'
        FOLLOW_REQUEST = 'follow_request', 'Follow Request'
        # استوری
        STORY_LIKE      = 'story_like',      'Story like'
        STORY_REPLY     = 'story_reply',     'Story reply'
        STORY_VIEW      = 'story_view',      'Story view'
        # چت
        NEW_MESSAGE     = 'new_message',     'New message'
        MESSAGE_REACTION= 'msg_reaction',    'Message reaction'
        ADDED_TO_GROUP  = 'added_to_group',  'Added to group'
        FORWARD         = 'forward',         'Forward'

    recipient   = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    sender      = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_notifications', null=True)
    type        = models.CharField(max_length=20, choices=Type.choices)
    is_read     = models.BooleanField(default=False)
    created_at  = models.DateTimeField(auto_now_add=True, db_index=True)

    # به هر مدلی می‌تونه اشاره کنه: Post, Comment, Story, Message
    content_type    = models.ForeignKey(ContentType, on_delete=models.CASCADE, null=True, blank=True)
    object_id       = models.PositiveIntegerField(null=True, blank=True)
    content_object  = GenericForeignKey('content_type', 'object_id')

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.sender} → {self.recipient} ({self.type})'