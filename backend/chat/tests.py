from django.test import TestCase

from authentication.models import User
from .models import ChatRoom


class ChatRoomModelTests(TestCase):
    def test_get_opponent_display_name_for_aspirant(self):
        aspirant = User.objects.create_user(username='aspirant', email='aspirant@gmail.com', password='StrongPass123', role='student')
        consultancy = User.objects.create_user(username='consultancy', email='consultancy@gmail.com', password='StrongPass123', role='consultancy', office_name='Bright Visa')
        room = ChatRoom.objects.create(aspirant=aspirant, consultancy=consultancy)

        self.assertEqual(room.get_opponent_display_name(aspirant), 'Bright Visa')

    def test_get_opponent_display_name_for_consultancy(self):
        aspirant = User.objects.create_user(username='aspirant', email='aspirant2@gmail.com', password='StrongPass123', role='student', first_name='Ada')
        consultancy = User.objects.create_user(username='consultancy', email='consultancy2@gmail.com', password='StrongPass123', role='consultancy', office_name='Bright Visa')
        room = ChatRoom.objects.create(aspirant=aspirant, consultancy=consultancy)

        self.assertEqual(room.get_opponent_display_name(consultancy), 'Ada')
