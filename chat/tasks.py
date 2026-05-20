# chat/tasks.py
from celery import shared_task
from chat.models import Message   # ← اضافه شد
import re
import requests
from bs4 import BeautifulSoup
from urllib.parse import urlparse


@shared_task
def fetch_link_preview(message_id):
    try:
        message = Message.objects.get(pk=message_id)
    except Message.DoesNotExist:
        return

    urls = re.findall(r'https?://\S+', message.text)
    if not urls:
        return

    url = urls[0]
    try:
        res = requests.get(url, timeout=5, headers={
            'User-Agent': 'Mozilla/5.0'  # ← بعضی سایت‌ها بدون این block می‌کنن
        })
        res.raise_for_status()
        soup = BeautifulSoup(res.text, 'html.parser')

        def get_meta(prop=None, name=None):
            if prop:
                tag = soup.find('meta', property=prop)
            else:
                tag = soup.find('meta', attrs={'name': name})
            return tag.get('content', '').strip() if tag else ''

        title_tag = soup.find('title')

        message.link_url         = url
        message.link_title       = get_meta('og:title') or (title_tag.string.strip() if title_tag else '')
        message.link_description = get_meta('og:description') or get_meta(name='description')
        message.link_image       = get_meta('og:image')
        message.link_domain      = urlparse(url).netloc

        message.save(update_fields=[    # ← فقط این فیلدها آپدیت بشن
            'link_url', 'link_title',
            'link_description', 'link_image', 'link_domain'
        ])
    except Exception:
        pass  # silent fail — لینک preview اختیاریه