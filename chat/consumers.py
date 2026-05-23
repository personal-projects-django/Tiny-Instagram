# chat/consumers.py  ← باید بسازی
import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_id   = self.scope['url_route']['kwargs']['room_id']
        self.room_group = f'chat_{self.room_id}'

        # چک عضویت
        is_member = await self.check_membership()
        if not is_member:
            await self.close()
            return

        await self.channel_layer.group_add(self.room_group, self.channel_name)
        await self.accept()

    async def disconnect(self, code):
        await self.channel_layer.group_discard(self.room_group, self.channel_name)

    async def receive(self, text_data):
        data    = json.loads(text_data)
        action  = data.get('action')  # 'message', 'typing', 'read'

        if action == 'typing':
            await self.channel_layer.group_send(self.room_group, {
                'type'    : 'typing_event',
                'username': self.scope['user'].username,
            })
        elif action == 'read':
            await self.mark_read(data.get('message_id'))

    async def chat_message(self, event):
        await self.send(text_data=json.dumps(event['message']))

    async def typing_event(self, event):
        await self.send(text_data=json.dumps({
            'type'    : 'typing',
            'username': event['username'],
        }))

    @database_sync_to_async
    def check_membership(self):
        from chat.models import RoomMember
        return RoomMember.objects.filter(
            room_id=self.room_id, user=self.scope['user']
        ).exists()

    @database_sync_to_async
    def mark_read(self, message_id):
        from chat.models import Message, MessageRead
        try:
            msg = Message.objects.get(pk=message_id)
            MessageRead.objects.get_or_create(message=msg, user=self.scope['user'])
        except Message.DoesNotExist:
            pass