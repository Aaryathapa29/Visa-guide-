from django.conf import settings
from django.db import models


class ChatRoom(models.Model):
    aspirant = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='chat_rooms_as_aspirant',
    )
    consultancy = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='chat_rooms_as_consultancy',
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('aspirant', 'consultancy')

    def __str__(self):
        return f'{self.aspirant} <-> {self.consultancy}'

    def get_opponent_display_name(self, for_user):
        if for_user.id == self.aspirant_id:
            return self.consultancy.office_name or self.consultancy.first_name or self.consultancy.username or self.consultancy.email or ''
        if for_user.id == self.consultancy_id:
            return self.aspirant.first_name or self.aspirant.username or self.aspirant.email or ''
        return ''


class Message(models.Model):
    room = models.ForeignKey(ChatRoom, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='sent_messages')
    text = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)

    class Meta:
        ordering = ('timestamp', 'id')

    def __str__(self):
        return f'{self.sender} @ {self.timestamp}'
