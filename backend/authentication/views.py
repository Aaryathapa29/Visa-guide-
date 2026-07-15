import json
import os

import resend
from django.conf import settings
from django.db import IntegrityError
from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import default_token_generator
from django.http import JsonResponse
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode
from django.views.decorators.csrf import csrf_exempt
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.authentication import JWTAuthentication

from .models import ConsultancyCountryProfile, ConsultancyNotification, ConsultancyVisitNotification, User
from .serializers import (
    LoginSerializer,
    PasswordResetConfirmSerializer,
    PasswordResetRequestSerializer,
    RegisterSerializer,
)

# Import Socket.IO client for real-time notifications
try:
    from socketio_client import emit_notification_to_consultancy
    socketio_available = True
except ImportError:
    socketio_available = False


UserModel = get_user_model()


def get_authenticated_user(request):
    try:
        jwt_user = JWTAuthentication().authenticate(request)
    except Exception:
        return None

    if jwt_user:
        return jwt_user[0]
    return request.user if getattr(request, 'user', None) and request.user.is_authenticated else None


@csrf_exempt
def consultancy_signup(request):
    if request.method != 'POST':
        return JsonResponse({'detail': 'Method not allowed.'}, status=405)

    try:
        payload = json.loads(request.body.decode('utf-8') or '{}')
    except json.JSONDecodeError:
        return JsonResponse({'detail': 'Invalid JSON payload.'}, status=400)

    username = (payload.get('username') or '').strip()
    email = (payload.get('email') or '').strip()
    password = payload.get('password') or ''
    office_name = (payload.get('office_name') or '').strip()

    if not username or not email or not password:
        return JsonResponse(
            {'detail': 'username, email, and password are required.'},
            status=400,
        )

    if not office_name:
        return JsonResponse({'detail': 'office_name is required for consultancy signup.'}, status=400)

    if UserModel.objects.filter(username__iexact=username).exists():
        return JsonResponse({'detail': 'A user with this username already exists.'}, status=400)

    if UserModel.objects.filter(email__iexact=email).exists():
        return JsonResponse({'detail': 'An account with this email already exists.'}, status=400)

    try:
        user = UserModel.objects.create_user(
            username=username,
            email=email,
            password=password,
            role='consultancy',
            office_name=office_name,
        )
    except IntegrityError:
        return JsonResponse({'detail': 'Unable to create consultancy account.'}, status=400)

    user.is_verified = False
    user.save(update_fields=['is_verified'])

    return JsonResponse(
        {
            'detail': 'Consultancy account created successfully.',
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'office_name': user.office_name,
                'role': user.role,
            },
        },
        status=201,
    )


def get_all_consultancies(request):
    if request.method != 'GET':
        return JsonResponse({'detail': 'Method not allowed.'}, status=405)

    consultancies = list(
        UserModel.objects.filter(role='consultancy').values(
            'id',
            'username',
            'email',
            'office_name',
        )
    )

    return JsonResponse(consultancies, safe=False, status=200)


@csrf_exempt
def country_profiles(request):
    user = get_authenticated_user(request)

    if request.method == 'GET':
        if user and getattr(user, 'role', None) == 'consultancy':
            profiles = ConsultancyCountryProfile.objects.filter(consultancy=user)
        else:
            profiles = ConsultancyCountryProfile.objects.select_related('consultancy').all()

        return JsonResponse([
            {
                'id': profile.id,
                'country': profile.country,
                'documents': profile.documents,
                'instructions': profile.instructions,
                'consultancy_id': profile.consultancy_id,
                'consultancy_name': profile.consultancy.office_name or profile.consultancy.username,
            }
            for profile in profiles
        ], safe=False, status=200)

    if request.method != 'PUT':
        return JsonResponse({'detail': 'Method not allowed.'}, status=405)

    if not user or getattr(user, 'role', None) != 'consultancy':
        return JsonResponse({'detail': 'Only consultancy accounts can save country profiles.'}, status=403)

    try:
        payload = json.loads(request.body.decode('utf-8') or '{}')
        profiles = payload.get('profiles', [])
    except json.JSONDecodeError:
        return JsonResponse({'detail': 'Invalid JSON payload.'}, status=400)

    if not isinstance(profiles, list):
        return JsonResponse({'detail': 'profiles must be a list.'}, status=400)

    ConsultancyCountryProfile.objects.filter(consultancy=user).delete()
    rows = []
    for profile in profiles:
        country = str(profile.get('country') or '').strip()
        if country:
            rows.append(ConsultancyCountryProfile(
                consultancy=user,
                country=country,
                documents=str(profile.get('documents') or '').strip(),
                instructions=str(profile.get('instructions') or '').strip(),
            ))
    ConsultancyCountryProfile.objects.bulk_create(rows)
    return JsonResponse({'detail': 'Country profiles saved.', 'count': len(rows)}, status=200)

class RegisterView(APIView):
    permission_classes = [AllowAny]  # Anyone can sign up

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(
                {"message": "User registered successfully!"}, 
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        return Response(serializer.validated_data, status=status.HTTP_200_OK)


class PasswordResetRequestView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data['email']

        user = User.objects.filter(email__iexact=email).first()

        if user:
            uidb64 = urlsafe_base64_encode(force_bytes(user.pk))
            token = default_token_generator.make_token(user)
            reset_url = (
                f"{getattr(settings, 'FRONTEND_URL', 'http://localhost:5173').rstrip('/')}"
                f"/?uidb64={uidb64}&token={token}"
            )

            resend.api_key = os.environ.get('RESEND_API_KEY')
            if not resend.api_key:
                return Response(
                    {'detail': 'Password reset email service is not configured.'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )

            resend.Emails.send(
                {
                    'from': 'onboarding@resend.dev',
                    'to': [user.email],
                    'subject': 'Reset your Visa Guide password',
                    'html': (
                        '<p>We received a request to reset your password.</p>'
                        f'<p><a href="{reset_url}">Reset your password</a></p>'
                        '<p>If you did not request this, you can ignore this email.</p>'
                    ),
                }
            )

        return Response(
            {'message': 'If an account exists, a reset link has been sent.'},
            status=status.HTTP_200_OK,
        )


class PasswordResetConfirmView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = serializer.validated_data['user']
        user.set_password(serializer.validated_data['new_password'])
        user.save(update_fields=['password'])

        return Response({'message': 'Password updated successfully.'}, status=status.HTTP_200_OK)


@csrf_exempt
def log_consultancy_visit(request):
    if request.method != 'POST':
        return JsonResponse({'detail': 'Method not allowed.'}, status=405)

    try:
        payload = json.loads(request.body.decode('utf-8') or '{}')
    except json.JSONDecodeError:
        return JsonResponse({'detail': 'Invalid JSON payload.'}, status=400)

    consultancy_id = payload.get('consultancy_id')
    if not consultancy_id:
        return JsonResponse({'detail': 'consultancy_id is required.'}, status=400)

    try:
        consultancy = UserModel.objects.get(pk=consultancy_id, role='consultancy')
    except UserModel.DoesNotExist:
        return JsonResponse({'detail': 'Consultancy not found.'}, status=404)

    visitor = get_authenticated_user(request)

    notification = ConsultancyVisitNotification.objects.create(
        consultancy=consultancy,
        visitor=visitor,
    )

    # Emit real-time notification via Socket.IO
    if socketio_available:
        try:
            notification_data = {
                'id': notification.id,
                'visitor_name': notification.visitor.username if notification.visitor else 'Anonymous visitor',
                'message': (
                    f"{notification.visitor.username if notification.visitor else 'An anonymous user'} visited your profile page."
                ),
                'timestamp': notification.timestamp.strftime('%Y-%m-%d %H:%M:%S'),
            }
            emit_notification_to_consultancy(consultancy_id, notification_data)
        except Exception as e:
            print(f'Warning: Failed to emit Socket.IO notification: {e}')

    return JsonResponse(
        {
            'detail': 'Visit logged successfully.',
            'notification': {
                'id': notification.id,
                'consultancy_id': notification.consultancy_id,
                'visitor_id': notification.visitor_id,
                'timestamp': notification.timestamp.strftime('%Y-%m-%d %H:%M:%S'),
            },
        },
        status=201,
    )


def get_consultancy_notifications(request):
    if request.method not in ('GET', 'POST'):
        return JsonResponse({'detail': 'Method not allowed.'}, status=405)

    user = get_authenticated_user(request)
    if not user or getattr(user, 'role', None) != 'consultancy':
        return JsonResponse({'detail': 'Only consultancy accounts can access notifications.'}, status=403)

    if request.method == 'POST':
        ConsultancyVisitNotification.objects.filter(consultancy=user, is_read=False).update(is_read=True)

    notifications = ConsultancyVisitNotification.objects.filter(consultancy=user).order_by('-timestamp')

    payload = [
        {
            'id': notification.id,
            'visitor_name': notification.visitor.username if notification.visitor else 'Anonymous visitor',
            'message': (
                f"{notification.visitor.username if notification.visitor else 'An anonymous user'} visited your profile page."
            ),
            'timestamp': notification.timestamp.strftime('%Y-%m-%d %H:%M:%S'),
            'is_read': notification.is_read,
        }
        for notification in notifications
    ]

    return JsonResponse({'notifications': payload, 'unread_count': sum(not item['is_read'] for item in payload)}, status=200)
