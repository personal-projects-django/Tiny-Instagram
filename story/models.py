from django.db import models

from account.models import User


# Create your models here.

class Message(models.Model):
    sender = models.ForeignKey(User, on_delete=models.CASCADE)
    receiver = models.ForeignKey(User, on_delete=models.CASCADE)
    text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.text



class Reply(models.Model):
    sender = models.ForeignKey(User, on_delete=models.CASCADE)
    message = models.ForeignKey(Message, on_delete=models.CASCADE)
    text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.text



class Story(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    like = models.ManyToManyField(User)
    image = models.ImageField(upload_to='img/story/')
    reply = models.ManyToManyField(Reply)
    created = models.DateTimeField(auto_now_add=True)



