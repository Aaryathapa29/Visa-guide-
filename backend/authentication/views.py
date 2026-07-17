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
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication

from .models import ConsultancyCountryProfile, ConsultancyNotification, ConsultancyVisitNotification, LoginHistory, User
from .serializers import (
    LoginSerializer,
    LoginHistorySerializer,
    UserSerializer,
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
    auth_header = request.META.get("HTTP_AUTHORIZATION", "")
    token_value = None

    if auth_header.startswith("Bearer "):
        token_value = auth_header[len("Bearer "):].strip()
    elif auth_header:
        token_value = auth_header.strip()

    if token_value:
        try:
            jwt_auth = JWTAuthentication()
            validated_token = jwt_auth.get_validated_token(token_value)
            user = jwt_auth.get_user(validated_token)

            if not getattr(user, "is_active", True):
                return None

            payload = getattr(validated_token, "payload", {}) or {}
            role_from_token = payload.get("role", getattr(user, "role", "student"))
            if role_from_token:
                user.role = role_from_token

            return user
        except Exception as exc:
            print(f"JWT auth failed: {exc}")

    user = request.user if getattr(request, "user", None) else None
    if user and getattr(user, "is_authenticated", False) and getattr(user, "is_active", True):
        return user

    return None


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

    display_name = user.office_name or user.username or user.email or ''

    return JsonResponse(
        {
            'detail': 'Consultancy account created successfully.',
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'office_name': user.office_name,
                'role': user.role,
                'display_name': display_name,
                'full_name': display_name,
                'fullName': display_name,
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

    return JsonResponse(consultancies, safe=False, status=200)


@csrf_exempt
def country_profiles(request, profile_id=None):
    user = get_authenticated_user(request)
    print(f"DEBUG country_profiles - user: {user}, role: {getattr(user, 'role', 'NONE')}")

    if request.method == 'GET':
        # Support an explicit owner-only query for consultancy dashboards.
        owner_only = request.GET.get('owner_only')

        if owner_only and owner_only.lower() in ('1', 'true', 'yes'):
            # When owner_only requested, require an authenticated consultancy user.
            if not user or getattr(user, 'role', None) != 'consultancy':
                return JsonResponse({'detail': 'Authentication required for owner-only country profiles.'}, status=401)
            profiles = ConsultancyCountryProfile.objects.filter(consultancy=user)
        else:
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

    if request.method == 'DELETE':
        if profile_id is None:
            return JsonResponse({'detail': 'Country profile ID is required.'}, status=400)

        if not user or getattr(user, 'role', None) != 'consultancy':
            return JsonResponse({'detail': 'Authentication required.'}, status=401)

        try:
            profile = ConsultancyCountryProfile.objects.get(pk=profile_id)
        except ConsultancyCountryProfile.DoesNotExist:
            return JsonResponse({'detail': 'Country profile not found.'}, status=404)

        if profile.consultancy_id != getattr(user, 'id', None):
            return JsonResponse({'detail': 'You do not have permission to delete this country profile.'}, status=403)

        profile.delete()
        return JsonResponse({'detail': 'Country profile deleted.'}, status=204)

    if request.method != 'PUT':
        return JsonResponse({'detail': 'Method not allowed.'}, status=405)

    user_role = getattr(user, 'role', None)
    print(f"DEBUG PUT check - user: {user}, user_role: {user_role}, check result: {user_role != 'consultancy'}")
    
    if not user or user_role != 'consultancy':
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


@csrf_exempt
def users_list(request):
    if request.method != 'GET':
        return JsonResponse({'detail': 'Method not allowed.'}, status=405)

    users = list(UserModel.objects.values(
        'id',
        'username',
        'email',
        'role',
        'is_verified',
        'license_number',
        'office_name',
        'date_joined',
        'last_login',
    ))

    return JsonResponse(users, safe=False, status=200)


@csrf_exempt
def login_history(request):
    if request.method != 'GET':
        return JsonResponse({'detail': 'Method not allowed.'}, status=405)

    history = list(LoginHistory.objects.select_related('user').values(
        'id',
        'user__id',
        'user__username',
        'login_time',
        'ip_address',
        'user_agent',
    ).order_by('-login_time'))

    return JsonResponse(history, safe=False, status=200)

class RegisterView(APIView):
    permission_classes = [AllowAny]  # Anyone can sign up

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            return Response(
                {
                    "message": "User registered successfully!",
                    "user": UserSerializer(user).data,
                },
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data, context={'request': request})
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
    # Debug logging to help diagnose missing visit records (e.g., incognito requests)
    try:
        print(f"DEBUG log_consultancy_visit - headers Authorization: {request.META.get('HTTP_AUTHORIZATION')}")
        print(f"DEBUG log_consultancy_visit - remote addr: {request.META.get('REMOTE_ADDR')}")
        print(f"DEBUG log_consultancy_visit - resolved visitor: {getattr(visitor, 'id', None)}")

        notification = ConsultancyVisitNotification.objects.create(
            consultancy=consultancy,
            visitor=visitor,
        )
        # Ensure the object is written and refreshed from DB
        notification.refresh_from_db()
    except Exception as e:
        print(f"ERROR: Failed to create ConsultancyVisitNotification: {e}")
        return JsonResponse({'detail': 'Failed to log visit.'}, status=500)

    # Emit real-time notification via Socket.IO
    if socketio_available:
        try:
            notification_data = {
                'id': notification.id,
                'visitor_name': 'Anonymous visitor',
                'message': 'A user visited your profile page.',
                'timestamp': notification.timestamp.isoformat(),
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
                'timestamp': notification.timestamp.isoformat(),
            },
        },
        status=201,
    )


@csrf_exempt
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
            'visitor_name': 'Anonymous visitor',
            'message': 'A user visited your profile page.',
            'timestamp': notification.timestamp.isoformat(),
            'is_read': notification.is_read,
        }
        for notification in notifications
    ]

    return JsonResponse({'notifications': payload, 'unread_count': sum(not item['is_read'] for item in payload)}, status=200)
    
class ConsultancyNotificationsView(APIView):
    """Notifications endpoint for consultancies.

    Uses JWT authentication and DRF permissions so CSRF is not required.
    """
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        user = request.user
        if not user or getattr(user, 'role', None) != 'consultancy':
            return Response({'detail': 'Only consultancy accounts can access notifications.'}, status=403)

        notifications = ConsultancyVisitNotification.objects.filter(consultancy=user).order_by('-timestamp')

        payload = [
            {
                'id': notification.id,
                'visitor_name': 'Anonymous visitor',
                'message': 'A user visited your profile page.',
                'timestamp': notification.timestamp.isoformat(),
                'is_read': notification.is_read,
            }
            for notification in notifications
        ]

        return Response({'notifications': payload, 'unread_count': sum(not item['is_read'] for item in payload)}, status=200)

    def post(self, request, *args, **kwargs):
        user = request.user
        if not user or getattr(user, 'role', None) != 'consultancy':
            return Response({'detail': 'Only consultancy accounts can access notifications.'}, status=403)

        ConsultancyVisitNotification.objects.filter(consultancy=user, is_read=False).update(is_read=True)

        # Return the updated list
        notifications = ConsultancyVisitNotification.objects.filter(consultancy=user).order_by('-timestamp')
        payload = [
            {
                'id': notification.id,
                'visitor_name': 'Anonymous visitor',
                'message': 'A user visited your profile page.',
                'timestamp': notification.timestamp.isoformat(),
                'is_read': notification.is_read,
            }
            for notification in notifications
        ]

        return Response({'notifications': payload, 'unread_count': sum(not item['is_read'] for item in payload)}, status=200)


class CheckEmailView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email', '').strip()
        
        if not email:
            return Response(
                {'detail': 'Email is required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        
        exists = UserModel.objects.filter(email__iexact=email).exists()
        
        return Response(
            {'exists': exists},
            status=status.HTTP_200_OK,
        )


class UpdateProfileView(APIView):
    def patch(self, request):
        user = get_authenticated_user(request)

        if not user:
            return Response(
                {'detail': 'Authentication required.'},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        name = (request.data.get('name') or '').strip()
        password = (request.data.get('password') or '').strip()
        current_password = (request.data.get('current_password') or '').strip()

        if name:
            if user.role == 'consultancy':
                user.office_name = name
            else:
                user.first_name = name

        if password:
            if not current_password:
                return Response(
                    {'detail': 'Current password is required to change your password.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            if not user.check_password(current_password):
                return Response(
                    {'detail': 'Current password is incorrect.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            user.set_password(password)

        user.save()

        return Response(
            {
                'detail': 'Profile updated successfully.',
                'user': UserSerializer(user).data,
            },
            status=status.HTTP_200_OK,
        )


class DeleteAccountView(APIView):
    def delete(self, request):
        user = get_authenticated_user(request)

        if not user:
            return Response(
                {'detail': 'Authentication required.'},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        requested_user_id = request.data.get('user_id') or request.query_params.get('user_id')
        if requested_user_id is not None:
            try:
                requested_user_id = int(requested_user_id)
            except (ValueError, TypeError):
                return Response(
                    {'detail': 'Invalid user ID provided.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            if requested_user_id != user.id:
                return Response(
                    {'detail': 'You are not authorized to delete this account.'},
                    status=status.HTTP_403_FORBIDDEN,
                )

        try:
            user.is_active = False
            user.is_verified = False
            user.first_name = ''
            user.last_name = ''
            user.office_name = ''
            user.username = f"deleted_user_{user.id}"
            user.email = f"deleted_user_{user.id}@example.invalid"
            user.set_unusable_password()
            user.save(update_fields=[
                'is_active',
                'is_verified',
                'first_name',
                'last_name',
                'office_name',
                'username',
                'email',
                'password',
            ])

            return Response(
                {'detail': 'Account deleted successfully.'},
                status=status.HTTP_200_OK,
            )
        except Exception:
            return Response(
                {'detail': 'An error occurred while deleting the account. Please try again later.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
