from rest_framework import serializers

from authentication.models import User
from .models import ChatRoom, Message


class MessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Message
        fields = ('id', 'sender_id', 'text', 'timestamp', 'is_read')


class ChatRoomSerializer(serializers.ModelSerializer):
    opponent_display_name = serializers.SerializerMethodField()
    aspirant_name = serializers.SerializerMethodField()
    consultancy_name = serializers.SerializerMethodField()

    class Meta:
        model = ChatRoom
        fields = ('id', 'aspirant', 'consultancy', 'created_at', 'opponent_display_name', 'aspirant_name', 'consultancy_name')

    def get_opponent_display_name(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.get_opponent_display_name(request.user)
        return ''

    def get_aspirant_name(self, obj):
        return obj.aspirant.first_name or obj.aspirant.username or obj.aspirant.email or ''

    def get_consultancy_name(self, obj):
        return obj.consultancy.office_name or obj.consultancy.first_name or obj.consultancy.username or obj.consultancy.email or ''
