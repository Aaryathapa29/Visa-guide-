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

asp_token = str(RefreshToken.for_user(aspirant).access_token)
cons_token = str(RefreshToken.for_user(consultancy).access_token)

client = Client(HTTP_AUTHORIZATION=f'Bearer {asp_token}', HTTP_HOST='localhost')
post_resp = client.post('/api/log-visit/', json.dumps({'consultancy_id': consultancy.id}), content_type='application/json')
print('POST /api/log-visit/ ->', post_resp.status_code, post_resp.content.decode())

client_cons = Client(HTTP_AUTHORIZATION=f'Bearer {cons_token}', HTTP_HOST='localhost')
get_resp = client_cons.get('/api/notifications/')
print('GET /api/notifications/ ->', get_resp.status_code)
print(get_resp.content.decode())
