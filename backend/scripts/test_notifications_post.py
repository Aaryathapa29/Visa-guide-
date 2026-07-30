import json
from django.contrib.auth import get_user_model
from django.test import Client
from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()
consultancy = User.objects.filter(role='consultancy').first()
aspirant = User.objects.filter(role='student').first()

if not consultancy:
    print('No consultancy user found; cannot run test.')
    raise SystemExit(1)

if not aspirant:
    aspirant = User.objects.create_user(username='tmp_aspirant_test', email='tmp_aspirant_test@example.com', password='password', role='student')
    print('Created temp aspirant:', aspirant.username)

cons_token = str(RefreshToken.for_user(consultancy).access_token)
client_cons = Client(HTTP_AUTHORIZATION=f'Bearer {cons_token}', HTTP_HOST='localhost')
post_resp = client_cons.post('/api/notifications/', content_type='application/json')
print('POST /api/notifications/ ->', post_resp.status_code)
print(post_resp.content.decode())
