from celery import shared_task
from django.utils.timezone import now

@shared_task
def delete_expired_stories():
    from story.models import Story
    deleted, _ = Story.objects.filter(expires_at__lt=now()).delete()
    return f'{deleted} استوری منقضی حذف شد.'