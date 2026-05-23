import logging

from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.contenttypes.models import ContentType
from .models import Notification
from post.models import Like, Comment
from follow.models import Follow, FollowRequest
from story.models import StoryLike, StoryReply
from chat.models import Message, MessageReaction, RoomMember

logger = logging.getLogger(__name__)


def create_notification(recipient, sender, notif_type, obj=None):
    if not recipient or recipient == sender:
        return

    try:
        kwargs = dict(recipient=recipient, sender=sender, type=notif_type)
        if obj:
            kwargs['content_type'] = ContentType.objects.get_for_model(obj)
            kwargs['object_id'] = obj.pk
        Notification.objects.create(**kwargs)
    except Exception:
        logger.exception(
            'Failed to create notification type=%s recipient=%s sender=%s object=%s',
            notif_type,
            getattr(recipient, 'pk', None),
            getattr(sender, 'pk', None),
            getattr(obj, 'pk', None),
        )


# ===== پست =====

@receiver(post_save, sender=Like)
def notify_like(sender, instance, created, **kwargs):
    if created:
        create_notification(
            instance.post.user, instance.user,
            Notification.Type.LIKE, instance.post
        )


@receiver(post_save, sender=Comment)
def notify_comment(sender, instance, created, **kwargs):
    if not created:
        return
    if instance.parent:
        create_notification(
            instance.parent.user, instance.user,
            Notification.Type.COMMENT_REPLY, instance
        )
    else:
        create_notification(
            instance.post.user, instance.user,
            Notification.Type.COMMENT, instance
        )

    # منشن
    import re
    from account.models import User
    mentions = re.findall(r'@(\w+)', instance.text)
    for username in mentions:
        try:
            mentioned_user = User.objects.get(username=username)
            create_notification(
                mentioned_user, instance.user,
                Notification.Type.MENTION, instance
            )
        except User.DoesNotExist:
            pass


# ===== فالو =====

@receiver(post_save, sender=Follow)
def notify_follow(sender, instance, created, **kwargs):
    if created:
        create_notification(
            instance.following, instance.follower,
            Notification.Type.FOLLOW
        )


@receiver(post_save, sender=FollowRequest)
def notify_follow_request(sender, instance, created, **kwargs):
    if created:
        create_notification(
            instance.receiver, instance.sender,
            Notification.Type.FOLLOW_REQUEST
        )


# ===== استوری =====

@receiver(post_save, sender=StoryLike)
def notify_story_like(sender, instance, created, **kwargs):
    if created:
        create_notification(
            instance.story.user, instance.user,
            Notification.Type.STORY_LIKE, instance.story
        )


@receiver(post_save, sender=StoryReply)
def notify_story_reply(sender, instance, created, **kwargs):
    if created:
        create_notification(
            instance.story.user, instance.sender,
            Notification.Type.STORY_REPLY, instance.story
        )


# ===== چت =====

@receiver(post_save, sender=Message)
def notify_new_message(sender, instance, created, **kwargs):
    if not created:
        return
    # ✅ به همه اعضای روم به جز فرستنده
    for member in instance.room.members.exclude(user=instance.sender):
        create_notification(
            member.user, instance.sender,
            Notification.Type.NEW_MESSAGE, instance
        )

    # فوروارد
    if instance.forwarded_from_object:
        obj = instance.forwarded_from_object
        owner = getattr(obj, 'user', None)
        if owner:
            create_notification(
                owner, instance.sender,
                Notification.Type.FORWARD, obj
            )


@receiver(post_save, sender=MessageReaction)
def notify_message_reaction(sender, instance, created, **kwargs):
    if created:
        create_notification(
            instance.message.sender, instance.user,
            Notification.Type.MESSAGE_REACTION, instance.message
        )


@receiver(post_save, sender=RoomMember)
def notify_added_to_group(sender, instance, created, **kwargs):
    if created and instance.room.type in ('group', 'channel'):
        create_notification(
            instance.user, instance.room.created_by,
            Notification.Type.ADDED_TO_GROUP, instance.room
        )