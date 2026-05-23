from django.db import models

# Create your models here.
from django.db import models
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from account.models import User


# ===== Room =====

class Room(models.Model):
    class RoomType(models.TextChoices):
        PRIVATE = 'private', 'Private'      # چت خصوصی
        GROUP = 'group', 'Group'            # گروه
        CHANNEL = 'channel', 'Channel'      # کانال

    type = models.CharField(max_length=10, choices=RoomType.choices)
    name = models.CharField(max_length=128, blank=True)
    description = models.TextField(blank=True)
    avatar = models.ImageField(upload_to='img/rooms/', blank=True, null=True)
    username = models.CharField(max_length=50, unique=True, null=True, blank=True)  # برای کانال عمومی
    is_public = models.BooleanField(default=False)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_rooms')
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'[{self.type}] {self.name or self.pk}'


class RoomMember(models.Model):
    class Role(models.TextChoices):
        OWNER = 'owner', 'Owner'
        ADMIN = 'admin', 'Admin'
        MEMBER = 'member', 'Member'
        SUBSCRIBER = 'subscriber', 'Subscriber'   # برای کانال

    room = models.ForeignKey(Room, on_delete=models.CASCADE, related_name='members')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='room_memberships')
    role = models.CharField(max_length=12, choices=Role.choices, default=Role.MEMBER)
    is_muted = models.BooleanField(default=False)
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('room', 'user')

    def __str__(self):
        return f'{self.user.username} in {self.room} ({self.role})'


# ===== Sticker =====

class StickerPack(models.Model):
    name = models.CharField(max_length=100)
    creator = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='sticker_packs')
    thumbnail = models.ImageField(upload_to='img/stickers/packs/')
    is_animated = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    def __str__(self):
        return self.name


class Sticker(models.Model):
    pack = models.ForeignKey(StickerPack, on_delete=models.CASCADE, related_name='stickers')
    emoji = models.CharField(max_length=10, blank=True)
    file = models.FileField(upload_to='img/stickers/')    # .webp یا .tgs
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    def __str__(self):
        return f'{self.pack.name} - {self.emoji}'


# ===== Message =====

def message_upload_path(instance, filename):
    return f'chat/{instance.room_id}/{filename}'


class Message(models.Model):
    class MessageType(models.TextChoices):
        TEXT = 'text', 'Text'
        IMAGE = 'image', 'Image'
        VIDEO = 'video', 'Video'
        AUDIO = 'audio', 'Audio'
        FILE = 'file', 'File'
        STICKER = 'sticker', 'Sticker'
        GIF = 'gif', 'GIF'
        LOCATION = 'location', 'Location'
        VOICE = 'voice', 'Voice'

    room = models.ForeignKey(Room, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='sent_messages')
    type = models.CharField(max_length=10, choices=MessageType.choices, default=MessageType.TEXT)

    # محتوا
    text = models.TextField(blank=True)
    file = models.FileField(upload_to=message_upload_path, blank=True, null=True)
    sticker = models.ForeignKey(Sticker, on_delete=models.SET_NULL, null=True, blank=True)
    thumbnail = models.ImageField(upload_to='chat/thumbs/', blank=True, null=True)  # برای ویدیو

    # لوکیشن
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)

    # ریپلای
    reply_to = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='replies')

    # فوروارد — می‌تونه از پیام، پست، یا استوری باشه
    forwarded_from_type = models.ForeignKey(ContentType, on_delete=models.SET_NULL, null=True, blank=True)
    forwarded_from_id = models.PositiveIntegerField(null=True, blank=True)
    forwarded_from_object = GenericForeignKey('forwarded_from_type', 'forwarded_from_id')

    # وضعیت
    is_edited = models.BooleanField(default=False)
    is_deleted_for_all = models.BooleanField(default=False)    # حذف برای همه
    deleted_at = models.DateTimeField(null=True, blank=True)
    pinned = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # مدت زمان — برای ویس و ویدیو و آهنگ
    duration = models.PositiveIntegerField(null=True, blank=True)  # به ثانیه

    # اندازه فایل — برای نمایش به کاربر
    file_size = models.PositiveIntegerField(null=True, blank=True)  # به بایت

    # نام اصلی فایل — برای دانلود
    file_name = models.CharField(max_length=255, blank=True)

    # waveform ویس — برای نمایش موج صدا در UI
    waveform = models.JSONField(null=True, blank=True)  # list of amplitudes

    # mime type — مرورگر بفهمه چی باز کنه
    mime_type = models.CharField(max_length=100, blank=True)

    # ===== لینک پیش‌نمایش (Link Preview) =====
    link_url = models.URLField(blank=True)
    link_title = models.CharField(max_length=255, blank=True)
    link_description = models.TextField(blank=True)
    link_image = models.URLField(blank=True)  # thumbnail لینک
    link_domain = models.CharField(max_length=100, blank=True)  # مثلاً youtube.com


    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f'{self.sender} [{self.type}]: {self.text[:30] or "-"}'


class MessageRead(models.Model):
    """تیک دوبل — چه کسی پیام را خوانده"""
    message = models.ForeignKey(Message, on_delete=models.CASCADE, related_name='reads')
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    read_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('message', 'user')


class MessageReaction(models.Model):
    """لایک یا ایموجی روی پیام"""
    message = models.ForeignKey(Message, on_delete=models.CASCADE, related_name='reactions')
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    emoji = models.CharField(max_length=10)   # مثلاً ❤️ 👍 😂
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        unique_together = ('message', 'user', 'emoji')

    def __str__(self):
        return f'{self.user.username} {self.emoji} on msg#{self.message_id}'


class MessageEditHistory(models.Model):
    """تاریخچه ویرایش پیام"""
    message = models.ForeignKey(Message, on_delete=models.CASCADE, related_name='edit_history')
    old_text = models.TextField()
    edited_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-edited_at']


class DeletedMessageForUser(models.Model):
    """حذف فقط برای من (نه برای همه)"""
    message = models.ForeignKey(Message, on_delete=models.CASCADE, related_name='deleted_for')
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    deleted_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('message', 'user')


# ===== User Sticker Library =====

class UserStickerPack(models.Model):
    """پک‌های استیکر نصب‌شده توسط کاربر"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='installed_sticker_packs')
    pack = models.ForeignKey(StickerPack, on_delete=models.CASCADE)
    added_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        unique_together = ('user', 'pack')