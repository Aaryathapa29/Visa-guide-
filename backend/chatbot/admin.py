from django.contrib import admin

from .models import ChatMessage


@admin.register(ChatMessage)
class ChatMessageAdmin(admin.ModelAdmin):
    list_display = ('session_id', 'sender', 'timestamp')
    list_filter = ('sender',)
    search_fields = ('session_id', 'message')
