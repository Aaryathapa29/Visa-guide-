from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import RefreshToken
from django.test import Client

User = get_user_model()
user = User.objects.filter(role='consultancy').first()
if not user:
    user = User.objects.create_user(username='test_consultancy_for_debug', email='debug@example.com', password='pass1234', role='consultancy')
    user.is_verified = True
    user.save()

print('Using consultancy user id=', user.id)

token = str(RefreshToken.for_user(user).access_token)
print('Generated access token (truncated)=', token[:40])

c = Client(HTTP_AUTHORIZATION=f'Bearer {token}')
resp = c.post('/api/notifications/mark-read/')
print('Response status:', resp.status_code)
print('Response content:', resp.content.decode())
