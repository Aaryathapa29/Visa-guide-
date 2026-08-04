import json

from asgiref.sync import async_to_sync, sync_to_async
from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer
from django.db import close_old_connections

from authentication.models import User
from .models import ChatRoom, Message


class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_id = self.scope['url_route']['kwargs']['room_id']
        self.room_group_name = f'chat_{self.room_id}'
        self.user = self.scope['user']

        if not self.user.is_authenticated:
            await self.close()
            return

        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    async def receive(self, text_data):
        if not text_data:
            return

        close_old_connections()
        data = json.loads(text_data)
        text = (data.get('message') or '').strip()
        if not text:
            return

        room = await self.get_room()
        if not room:
            return

        if self.user.id not in [room.aspirant_id, room.consultancy_id]:
            return

        saved_message = await self.save_message(room, text)
        payload = {
            'type': 'chat.message',
            'message': text,
            'sender_id': self.user.id,
            'timestamp': saved_message.timestamp.isoformat(),
            'message_id': saved_message.id,
        }
        await self.channel_layer.group_send(self.room_group_name, payload)

    async def chat_message(self, event):
        await self.send(text_data=json.dumps(event))

    @database_sync_to_async
    def get_room(self):
        close_old_connections()
        return ChatRoom.objects.filter(pk=self.room_id).first()

    @database_sync_to_async
    def save_message(self, room, text):
        close_old_connections()
        return Message.objects.create(room=room, sender=self.user, text=text)
