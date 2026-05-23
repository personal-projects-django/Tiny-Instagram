from django.db import models
from account.models import User
from django.core.validators import FileExtensionValidator
# Create your models here.
#    Post
class Post(models.Model):
    class Visibility(models.TextChoices):
        PUBLIC     = 'public',     'Public'
        FOLLOWERS  = 'followers',  'Followers'
        PRIVATE    = 'private',    'Private'

    user               = models.ForeignKey(User, on_delete=models.CASCADE, related_name='posts')
    caption            = models.TextField(blank=True)
    visibility         = models.CharField(max_length=20, choices=Visibility.choices, default=Visibility.PUBLIC)
    is_active          = models.BooleanField(default=True)   # ← اضافه کن
    comments_disabled  = models.BooleanField(default=False)
    created_at         = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at         = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes  = [
            models.Index(fields=['user', 'created_at']),
            models.Index(fields=['visibility']),
        ]

    def __str__(self):
        return f'{self.user.username} - {self.id}'

class PostMedia(models.Model):

    class MediaType(models.TextChoices):
        IMAGE = 'image', 'Image'
        VIDEO = 'video', 'Video'

    post = models.ForeignKey(
        Post,
        on_delete=models.CASCADE,
        related_name='medias'
    )

    media_type = models.CharField(
        max_length=10,
        choices=MediaType.choices
    )

    file = models.FileField(
        upload_to='posts/media/',
        validators=[
            FileExtensionValidator(
                allowed_extensions=[
                    'jpg',
                    'jpeg',
                    'png',
                    'webp',
                    'mp4',
                    'mov',
                    'webm'
                ]
            )
        ]
    )

    thumbnail = models.ImageField(
        upload_to='posts/thumbnails/',
        blank=True,
        null=True
    )

    order = models.PositiveSmallIntegerField(default=0)

    width = models.PositiveIntegerField(null=True, blank=True)
    height = models.PositiveIntegerField(null=True, blank=True)

    duration = models.FloatField(null=True, blank=True)

    file_size = models.BigIntegerField(null=True, blank=True)

    mime_type = models.CharField(max_length=100, blank=True)

    is_processed = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['order']
        indexes = [
            models.Index(fields=['post']),
            models.Index(fields=['media_type']),
        ]

    def __str__(self):
        return f'{self.post_id} - {self.media_type}'
# class PostFile(models.Model):
#     post = models.ForeignKey(to='post.Post', on_delete=models.CASCADE)
#     file = models.FileField()
#     created_at = models.DateTimeField(auto_now_add=True)
#     updated_at = models.DateTimeField(auto_now=True)



#  Comment
class Comment(models.Model):
    post = models.ForeignKey(Post, on_delete=models.PROTECT,related_name='comments')
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    text = models.TextField()
    parent = models.ForeignKey('self', null=True, blank=True, on_delete=models.SET_NULL, related_name='replies')
    is_approved = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    # likes = models.IntegerField(default=0)

    def __str__(self):
        return f'{self.text}, {self.user}, {self.created_at}'


#   Like

class Like(models.Model):
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='likes')
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        unique_together = ('user', 'post')



class SavedPost(models.Model):
    user       = models.ForeignKey(User, on_delete=models.CASCADE, related_name='saved_posts')
    post       = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='saved_by')
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        unique_together = ('user', 'post')

class CommentLike(models.Model):
    comment    = models.ForeignKey(Comment, on_delete=models.CASCADE, related_name='likes')
    user       = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'comment')

#  follower

# class following(models.Model):
#     user = models.ForeignKey(User, on_delete=models.CASCADE)
#     following = models.ForeignKey(User, on_delete=models.CASCADE, related_name='following')
#
# class followers(models.Model):
#     user = models.ForeignKey(User, on_delete=models.CASCADE)
#     followers = models.ForeignKey(User, on_delete=models.CASCADE, related_name='followers')