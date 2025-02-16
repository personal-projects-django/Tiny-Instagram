# from django.db import models
#
# from account.models import User
#
#
# # Create your models here.
#
#
#
# class Profile(models.Model):
#     user = models.OneToOneField(User, on_delete=models.CASCADE)
#     bio = models.TextField(max_length=500, blank=True)
#     avatar = models.ImageField(default='default.jpg', upload_to='img/profile/')
#     first_name = models.CharField(max_length=50, blank=True)
#     last_name = models.CharField(max_length=50, blank=True)
#     age = models.PositiveSmallIntegerField(null=True, blank=True)
#     created_at = models.DateTimeField(auto_now_add=True)
#     updated_at = models.DateTimeField(auto_now=True)
#     # post = models.ManyToManyField(Post, blank=True)
#
#     def full_name(self):
#         return f'{self.first_name} {self.last_name}'
#
#
#     def __str__(self):
#         return f'{self.user},{self.full_name}'
#
#
#