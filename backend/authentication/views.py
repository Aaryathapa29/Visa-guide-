import json
import logging
import os
import re
from datetime import date, datetime, time
from uuid import uuid4

import resend
from django.conf import settings
from django.db import IntegrityError, connection
from django.contrib.auth import get_user_model
from django.core.files.storage import default_storage
from django.contrib.auth.tokens import default_token_generator
from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.utils.encoding import force_bytes
from django.utils.text import get_valid_filename
from django.utils.http import urlsafe_base64_encode
from django.views.decorators.csrf import csrf_exempt
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.decorators import parser_classes
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication

from .models import (
    Booking,
    ConsultancyCountryProfile,
    ConsultancyNotification,
    ConsultancyVisitNotification,
    Expert,
    LoginHistory,
    Notification,
    User,
)
from .serializers import (
    ExpertSerializer,
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
logger = logging.getLogger(__name__)
STANDARD_TIME_SLOTS = [
    "09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM",
    "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM",
]


def resolve_logo_url(request, logo_url):
    if not logo_url:
        return None

    if isinstance(logo_url, str) and logo_url.startswith(('http://', 'https://')):
        return logo_url

    if request is not None and isinstance(logo_url, str) and logo_url.startswith('/'):
        return request.build_absolute_uri(logo_url)

    return logo_url


def has_user_logo_column():
    table_name = UserModel._meta.db_table
    with connection.cursor() as cursor:
        columns = [column.name for column in connection.introspection.get_table_description(cursor, table_name)]
    return 'logo_url' in columns


def format_booking_time(value):
    if value in (None, ""):
        return ""

    if isinstance(value, str):
        value = value.strip()
        if value.endswith(("AM", "PM")):
            return value

        for pattern in ("%H:%M", "%H:%M:%S"):
            try:
                return datetime.strptime(value, pattern).strftime("%I:%M %p")
            except ValueError:
                continue

    return str(value)


def parse_booking_time(value):
    if value in (None, ''):
        return None

    if isinstance(value, str):
        value = value.strip()
        if not value:
            return None

        if re.match(r'^\d{1,2}:\d{2}\s?(AM|PM)$', value, flags=re.IGNORECASE):
            return datetime.strptime(value.upper(), '%I:%M %p').time()

        for pattern in ('%H:%M', '%H:%M:%S', '%I:%M %p', '%I:%M%p'):
            try:
                return datetime.strptime(value, pattern).time()
            except ValueError:
                continue

    if isinstance(value, time):
        return value

    return None


def get_booking_datetime(booking):
    slot_time = booking.assigned_time or booking.appointment_time
    parsed_time = parse_booking_time(slot_time)
    if parsed_time is None:
        return None

    naive_datetime = datetime.combine(booking.appointment_date, parsed_time)
    return timezone.make_aware(naive_datetime, timezone.get_current_timezone())


def auto_complete_past_confirmed_bookings():
    now = timezone.localtime(timezone.now())
    past_confirmed = []

    for booking in Booking.objects.filter(status='confirmed').select_related('aspirant', 'consultancy', 'expert'):
        booking_dt = get_booking_datetime(booking)
        if booking_dt and booking_dt <= now:
            booking.status = 'completed'
            booking.save(update_fields=['status', 'updated_at'])
            past_confirmed.append(booking.id)

    return past_confirmed


def serialize_booking(booking):
    aspirant_name = booking.aspirant.get_full_name() or booking.aspirant.username or booking.aspirant.email or 'Aspirant'
    consultancy_name = booking.consultancy.office_name or booking.consultancy.get_full_name() or booking.consultancy.username or booking.consultancy.email or 'Consultancy'
    expert_name = booking.expert.name if booking.expert else ''
    expert_specialization = booking.expert.specialization if booking.expert else ''
    session_datetime = get_booking_datetime(booking)

    return {
        'id': booking.id,
        'aspirant_id': booking.aspirant_id,
        'aspirant_name': aspirant_name,
        'consultancy_id': booking.consultancy_id,
        'consultancy_name': consultancy_name,
        'expert_id': booking.expert_id,
        'expert_name': expert_name,
        'expert_specialization': expert_specialization,
        'appointment_date': booking.appointment_date.isoformat(),
        'appointment_time': format_booking_time(booking.appointment_time),
        'booking_date': booking.appointment_date.isoformat(),
        'booking_time': format_booking_time(booking.appointment_time),
        'assigned_time': booking.assigned_time,
        'session_datetime': session_datetime.isoformat() if session_datetime else None,
        'notes': booking.notes,
        'status': booking.status,
        'created_at': booking.created_at.isoformat(),
        'updated_at': booking.updated_at.isoformat(),
    }


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def consultancy_sessions(request):
    user = request.user
    if getattr(user, 'role', None) != 'consultancy':
        return Response({'detail': 'Only consultancy accounts can access session summaries.'}, status=403)

    auto_complete_past_confirmed_bookings()
    queryset = Booking.objects.select_related('aspirant', 'consultancy', 'expert').filter(consultancy=user)
    now = timezone.localtime(timezone.now())

    pending = []
    confirmed = []
    completed = []

    for booking in queryset.order_by('-appointment_date', '-appointment_time'):
        serialized = serialize_booking(booking)
        booking_datetime = get_booking_datetime(booking)

        if booking.status == 'pending':
            pending.append(serialized)
        elif booking.status == 'completed':
            completed.append(serialized)
        elif booking.status == 'confirmed' and booking_datetime and booking_datetime > now:
            confirmed.append(serialized)
        elif booking.status == 'confirmed' and booking_datetime and booking_datetime <= now:
            completed.append(serialized)

    completed_summary = {}
    for item in completed:
        date_key = item['appointment_date']
        completed_summary[date_key] = completed_summary.get(date_key, 0) + 1

    return Response({
        'pending': pending,
        'confirmed': confirmed,
        'completed': completed,
        'completed_summary': [
            {'date': date_key, 'count': count}
            for date_key, count in sorted(completed_summary.items(), reverse=True)
        ],
    }, status=200)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def consultancy_available_slots(request, consultancy_id):
    if not consultancy_id:
        return Response({'detail': 'consultancy_id is required.'}, status=400)

    selected_date = request.query_params.get('date')
    expert_id = request.query_params.get('expert_id')
    if not selected_date:
        return Response({'detail': 'date query parameter is required.'}, status=400)

    try:
        parsed_date = date.fromisoformat(str(selected_date))
    except ValueError:
        return Response({'detail': 'date must be a valid ISO date such as YYYY-MM-DD.'}, status=400)

    queryset = Booking.objects.filter(
        consultancy_id=consultancy_id,
        appointment_date=parsed_date,
    ).exclude(status__in=['cancelled', 'rejected'])

    if expert_id:
        try:
            queryset = queryset.filter(expert_id=int(expert_id))
        except ValueError:
            return Response({'detail': 'expert_id must be an integer.'}, status=400)

    booked_times = set()
    for booking in queryset:
        slot_time = booking.assigned_time or booking.appointment_time
        if slot_time:
            booked_times.add(format_booking_time(slot_time))

    slots = []
    for slot in STANDARD_TIME_SLOTS:
        slots.append({
            'time': slot,
            'is_booked': slot in booked_times,
        })

    return Response({
        'consultancy_id': int(consultancy_id),
        'date': parsed_date.isoformat(),
        'expert_id': int(expert_id) if expert_id else None,
        'slots': slots,
        'booked_times': sorted(booked_times),
    }, status=200)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def consultancy_booked_slots(request, consultancy_id):
    return consultancy_available_slots(request, consultancy_id)


@api_view(['PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def cancel_session(request, session_id):
    user = request.user
    booking = get_object_or_404(Booking.objects.select_related('aspirant', 'consultancy', 'expert'), pk=session_id)

    if getattr(user, 'role', None) != 'consultancy' or booking.consultancy_id != user.id:
        return Response({'detail': 'Only the assigned consultancy can cancel this session.'}, status=403)

    booking.status = 'cancelled'
    booking.save(update_fields=['status', 'updated_at'])
    return Response(serialize_booking(booking), status=200)


@api_view(['GET', 'POST', 'DELETE'])
@permission_classes([IsAuthenticated])
def experts(request, expert_id=None):
    user = request.user

    if request.method == 'GET':
        consultancy_id = request.query_params.get('consultancy_id')
        if consultancy_id:
            queryset = Expert.objects.select_related('consultancy').filter(consultancy_id=int(consultancy_id))
        else:
            queryset = Expert.objects.select_related('consultancy').all()

        return Response([ExpertSerializer(item).data for item in queryset.order_by('name')], status=200)

    if request.method == 'POST':
        if getattr(user, 'role', None) != 'consultancy':
            return Response({'detail': 'Only consultancies can create expert profiles.'}, status=403)

        payload = request.data or {}
        name = str(payload.get('name') or '').strip()
        specialization = str(payload.get('specialization') or '').strip()

        if not name:
            return Response({'detail': 'name is required.'}, status=400)

        expert = Expert.objects.create(
            consultancy=user,
            name=name,
            specialization=specialization,
        )
        return Response(ExpertSerializer(expert).data, status=201)

    if request.method == 'DELETE':
        if expert_id is None:
            return Response({'detail': 'expert_id is required.'}, status=400)

        expert = get_object_or_404(Expert.objects.select_related('consultancy'), pk=expert_id)
        if getattr(user, 'role', None) != 'consultancy' or expert.consultancy_id != user.id:
            return Response({'detail': 'Only the assigned consultancy can delete this expert.'}, status=403)

        Booking.objects.filter(expert=expert).update(expert=None)
        expert.delete()
        return Response({'detail': 'Expert deleted.'}, status=200)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def bookings(request):
    user = request.user

    if request.method == 'GET':
        auto_complete_past_confirmed_bookings()
        queryset = Booking.objects.select_related('aspirant', 'consultancy', 'expert')
        if getattr(user, 'role', None) == 'consultancy':
            queryset = queryset.filter(consultancy=user)
        else:
            queryset = queryset.filter(aspirant=user)

        consultancy_id = request.query_params.get('consultancy_id')
        if consultancy_id:
            queryset = queryset.filter(consultancy_id=int(consultancy_id))

        status_value = request.query_params.get('status')
        if status_value:
            queryset = queryset.filter(status=status_value)

        return Response([serialize_booking(item) for item in queryset.order_by('-created_at')], status=200)

    if getattr(user, 'role', None) != 'student':
        return Response({'detail': 'Only aspirants can create counselling bookings.'}, status=403)

    consultancy_id = request.data.get('consultancy_id')
    appointment_date = request.data.get('appointment_date')
    appointment_time = request.data.get('appointment_time')
    expert_id = request.data.get('expert_id')
    notes = (request.data.get('notes') or '').strip()

    if not consultancy_id or not appointment_date or not appointment_time:
        return Response({'detail': 'consultancy_id, appointment_date, and appointment_time are required.'}, status=400)

    try:
        consultancy = UserModel.objects.get(pk=int(consultancy_id), role='consultancy', is_active=True)
    except (UserModel.DoesNotExist, ValueError, TypeError):
        return Response({'detail': 'Consultancy not found.'}, status=404)

    if int(consultancy_id) == user.id:
        return Response({'detail': 'You cannot book a counselling session with yourself.'}, status=400)

    try:
        parsed_date = date.fromisoformat(str(appointment_date))
    except ValueError:
        return Response({'detail': 'appointment_date must be a valid ISO date such as YYYY-MM-DD.'}, status=400)

    assigned_expert = None
    if expert_id:
        try:
            assigned_expert = Expert.objects.get(pk=int(expert_id), consultancy=consultancy)
        except (Expert.DoesNotExist, ValueError, TypeError):
            return Response({'detail': 'Selected expert does not belong to this consultancy.'}, status=400)

    booking = Booking.objects.create(
        aspirant=user,
        consultancy=consultancy,
        expert=assigned_expert,
        appointment_date=parsed_date,
        appointment_time=str(appointment_time).strip(),
        notes=notes,
        status='pending',
    )

    notification_payload = {
        'id': booking.id,
        'card_id': booking.id,
        'booking_id': booking.id,
        'aspirant_name': user.get_full_name() or user.username or user.email or 'Aspirant',
        'message': f"{user.get_full_name() or user.username or user.email or 'An aspirant'} requested a counselling session for {booking.appointment_date.isoformat()} at {booking.appointment_time}.",
        'timestamp': booking.created_at.isoformat(),
        'is_read': False,
    }

    try:
        from socketio_client import emit_notification_to_consultancy
        emit_notification_to_consultancy(consultancy.id, notification_payload)
    except Exception:
        pass

    return Response(serialize_booking(booking), status=201)


@api_view(['GET', 'PATCH'])
@permission_classes([IsAuthenticated])
def booking_detail(request, booking_id):
    user = request.user
    auto_complete_past_confirmed_bookings()
    booking = get_object_or_404(Booking.objects.select_related('aspirant', 'consultancy', 'expert'), pk=booking_id)

    if user.id not in [booking.aspirant_id, booking.consultancy_id]:
        return Response({'detail': 'You do not have access to this booking.'}, status=403)

    if request.method == 'GET':
        return Response(serialize_booking(booking), status=200)

    if getattr(user, 'role', None) != 'consultancy' or booking.consultancy_id != user.id:
        return Response({'detail': 'Only the assigned consultancy can update this booking.'}, status=403)

    previous_status = booking.status
    new_status = request.data.get('status')
    if new_status in {'pending', 'confirmed', 'completed', 'cancelled', 'rejected'}:
        booking.status = new_status

    assigned_time = request.data.get('assigned_time')
    if assigned_time is not None:
        booking.assigned_time = str(assigned_time).strip()

    if new_status == 'confirmed' and not booking.assigned_time:
        booking.assigned_time = booking.appointment_time

    booking.save()
    create_booking_status_notification(booking, previous_status)
    return Response(serialize_booking(booking), status=200)


def emit_user_notification(user, title, message):
    if not user:
        return None

    notification = Notification.objects.create(
        user=user,
        title=title,
        message=message,
        is_read=False,
    )

    try:
        from socketio_client import emit_notification_to_user
        emit_notification_to_user(user.id, {
            'id': notification.id,
            'title': notification.title,
            'message': notification.message,
            'created_at': notification.created_at.isoformat(),
            'is_read': notification.is_read,
        })
    except Exception:
        pass

    return notification


def create_booking_status_notification(booking, previous_status=None):
    if not booking or not booking.aspirant_id:
        return None

    status = booking.status
    status_labels = {
        'pending': 'Booking pending',
        'confirmed': 'Booking confirmed',
        'completed': 'Booking completed',
        'cancelled': 'Booking cancelled',
        'rejected': 'Booking rejected',
    }

    if status not in status_labels:
        return None

    if previous_status is not None and previous_status == status:
        return None

    consultancy_name = booking.consultancy.office_name or booking.consultancy.get_full_name() or booking.consultancy.username or 'Consultancy'
    status_title = status_labels[status]
    message = (
        f"Your booking with {consultancy_name} was {status} "
        f"for {booking.appointment_date.isoformat()} at {booking.appointment_time}."
    )

    return emit_user_notification(booking.aspirant, status_title, message)


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def update_booking_detail(request, booking_id):
    user = request.user
    booking = get_object_or_404(Booking.objects.select_related('aspirant', 'consultancy'), pk=booking_id)

    if getattr(user, 'role', None) != 'consultancy' or booking.consultancy_id != user.id:
        return Response({'detail': 'Only the assigned consultancy can update this booking.'}, status=403)

    previous_status = booking.status
    previous_date = booking.appointment_date
    previous_time = booking.appointment_time
    raw_date = request.data.get('appointment_date', request.data.get('booking_date'))
    raw_time = request.data.get('appointment_time', request.data.get('booking_time'))
    status_value = request.data.get('status')

    if raw_date is not None:
        try:
            booking.appointment_date = date.fromisoformat(str(raw_date))
        except ValueError:
            return Response({'detail': 'appointment_date must be a valid ISO date such as YYYY-MM-DD.'}, status=400)

    if raw_time is not None:
        booking.appointment_time = str(raw_time).strip()

    if status_value in {'pending', 'confirmed', 'cancelled', 'rejected'}:
        booking.status = status_value

    assigned_time = request.data.get('assigned_time')
    if assigned_time is not None:
        booking.assigned_time = str(assigned_time).strip()

    if booking.status == 'confirmed' and not booking.assigned_time:
        booking.assigned_time = booking.appointment_time

    booking.save()

    if booking.status != previous_status:
        create_booking_status_notification(booking, previous_status)
    elif (booking.appointment_date != previous_date or booking.appointment_time != previous_time):
        consultancy_name = booking.consultancy.office_name or booking.consultancy.get_full_name() or booking.consultancy.username or 'Consultancy'
        emit_user_notification(
            booking.aspirant,
            'Booking Updated',
            f"Your booking with {consultancy_name} was updated to {booking.appointment_date.isoformat()} at {booking.appointment_time}.",
        )

    return Response(serialize_booking(booking), status=200)


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
                'logo_url': resolve_logo_url(request, user.logo_url),
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
        UserModel.objects.filter(role='consultancy', is_active=True).values(
            'id',
            'username',
            'email',
            'office_name',
            'logo_url',
        )
    )

    for consultancy in consultancies:
        consultancy['logo_url'] = resolve_logo_url(request, consultancy.get('logo_url'))

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
        'logo_url',
        'date_joined',
        'last_login',
    ))

    for user in users:
        user['logo_url'] = resolve_logo_url(request, user.get('logo_url'))

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

        try:
            user, uidb64, token = serializer.save()
        except Exception as e:
            print(f'Error in PasswordResetRequestSerializer.save(): {e}')
            return Response(
                {'detail': 'An error occurred processing your request.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        reset_url = (
            f"{getattr(settings, 'FRONTEND_URL', 'http://localhost:5173').rstrip('/')}"
            f"/?uidb64={uidb64}&token={token}"
        )

        # Try to send email, but don't fail if service is unavailable
        resend_api_key = os.environ.get('RESEND_API_KEY')
        if resend_api_key:
            try:
                resend.api_key = resend_api_key
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
                print(f'Password reset email sent to {user.email}')
            except Exception as e:
                print(f'Warning: Failed to send password reset email: {e}')
                # Don't fail the entire request if email sending fails
        else:
            print('Warning: RESEND_API_KEY not configured; password reset email not sent')

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
            is_read=False,
        )
        # Ensure the object is written and refreshed from DB
        notification.refresh_from_db()
    except Exception as e:
        print(f"ERROR: Failed to create ConsultancyVisitNotification: {e}")
        return JsonResponse({'detail': 'Failed to log visit.'}, status=500)

    visitor_name = notification.visitor.username if notification.visitor else 'Anonymous user'
    notification_message = f'{visitor_name} visited your profile page.'
    payload_data = {
        'id': notification.id,
        'visitor_name': visitor_name,
        'message': notification_message,
        'timestamp': notification.timestamp.isoformat(),
        'is_read': notification.is_read,
    }

    # Emit real-time notification via Socket.IO
    if socketio_available:
        try:
            emit_notification_to_consultancy(consultancy_id, payload_data)
        except Exception as e:
            print(f'Warning: Failed to emit Socket.IO notification: {e}')

    return JsonResponse(
        {
            'detail': 'Visit logged successfully.',
            'notification': {
                'id': notification.id,
                'consultancy_id': notification.consultancy_id,
                'visitor_id': notification.visitor_id,
                'visitor_name': visitor_name,
                'message': notification_message,
                'timestamp': notification.timestamp.isoformat(),
                'is_read': notification.is_read,
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
    unread_count = ConsultancyVisitNotification.objects.filter(consultancy=user, is_read=False).count()

    payload = [
        {
            'id': notification.id,
            'visitor_name': notification.visitor.username if notification.visitor else 'Anonymous user',
            'message': f"{notification.visitor.username if notification.visitor else 'Anonymous user'} visited your profile page.",
            'timestamp': notification.timestamp.isoformat(),
            'is_read': notification.is_read,
        }
        for notification in notifications
    ]

    return JsonResponse({'notifications': payload, 'unread_count': unread_count}, status=200)
    
class ConsultancyNotificationsView(APIView):
    """Notifications endpoint for both consultancies and aspirants."""
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        user = request.user
        if not user:
            return Response({'detail': 'Authentication required.'}, status=401)

        if getattr(user, 'role', None) == 'consultancy':
            notifications = ConsultancyVisitNotification.objects.filter(consultancy=user).order_by('-timestamp')
            unread_count = ConsultancyVisitNotification.objects.filter(consultancy=user, is_read=False).count()

            payload = [
                {
                    'id': notification.id,
                    'visitor_name': notification.visitor.username if notification.visitor else 'Anonymous user',
                    'message': f"{notification.visitor.username if notification.visitor else 'Anonymous user'} visited your profile page.",
                    'timestamp': notification.timestamp.isoformat(),
                    'is_read': notification.is_read,
                }
                for notification in notifications
            ]
            return Response({'notifications': payload, 'unread_count': unread_count}, status=200)

        notifications = Notification.objects.filter(user=user).order_by('-created_at')
        unread_count = Notification.objects.filter(user=user, is_read=False).count()

        payload = [
            {
                'id': notification.id,
                'title': notification.title,
                'message': notification.message,
                'created_at': notification.created_at.isoformat(),
                'is_read': notification.is_read,
            }
            for notification in notifications
        ]

        return Response({'notifications': payload, 'unread_count': unread_count}, status=200)

    def post(self, request, *args, **kwargs):
        user = request.user
        if not user:
            return Response({'detail': 'Authentication required.'}, status=401)

        if getattr(user, 'role', None) == 'consultancy':
            ConsultancyVisitNotification.objects.filter(consultancy=user, is_read=False).update(is_read=True)
            notifications = ConsultancyVisitNotification.objects.filter(consultancy=user).order_by('-timestamp')
            unread_count = ConsultancyVisitNotification.objects.filter(consultancy=user, is_read=False).count()
            payload = [
                {
                    'id': notification.id,
                    'visitor_name': notification.visitor.username if notification.visitor else 'Anonymous user',
                    'message': f"{notification.visitor.username if notification.visitor else 'Anonymous user'} visited your profile page.",
                    'timestamp': notification.timestamp.isoformat(),
                    'is_read': notification.is_read,
                }
                for notification in notifications
            ]
            return Response({'notifications': payload, 'unread_count': unread_count}, status=200)

        Notification.objects.filter(user=user, is_read=False).update(is_read=True)
        notifications = Notification.objects.filter(user=user).order_by('-created_at')
        unread_count = Notification.objects.filter(user=user, is_read=False).count()
        payload = [
            {
                'id': notification.id,
                'title': notification.title,
                'message': notification.message,
                'created_at': notification.created_at.isoformat(),
                'is_read': notification.is_read,
            }
            for notification in notifications
        ]
        return Response({'notifications': payload, 'unread_count': unread_count}, status=200)


class MarkNotificationsReadView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        user = request.user
        if not user:
            return Response({'detail': 'Authentication required.'}, status=401)

        if getattr(user, 'role', None) == 'consultancy':
            ConsultancyVisitNotification.objects.filter(consultancy=user, is_read=False).update(is_read=True)
            notifications = ConsultancyVisitNotification.objects.filter(consultancy=user).order_by('-timestamp')
            unread_count = ConsultancyVisitNotification.objects.filter(consultancy=user, is_read=False).count()
            payload = [
                {
                    'id': notification.id,
                    'visitor_name': notification.visitor.username if notification.visitor else 'Anonymous user',
                    'message': f"{notification.visitor.username if notification.visitor else 'Anonymous user'} visited your profile page.",
                    'timestamp': notification.timestamp.isoformat(),
                    'is_read': notification.is_read,
                }
                for notification in notifications
            ]
            return Response({'notifications': payload, 'unread_count': unread_count}, status=200)

        Notification.objects.filter(user=user, is_read=False).update(is_read=True)
        notifications = Notification.objects.filter(user=user).order_by('-created_at')
        unread_count = Notification.objects.filter(user=user, is_read=False).count()
        payload = [
            {
                'id': notification.id,
                'title': notification.title,
                'message': notification.message,
                'created_at': notification.created_at.isoformat(),
                'is_read': notification.is_read,
            }
            for notification in notifications
        ]
        return Response({'notifications': payload, 'unread_count': unread_count}, status=200)


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
                'user': UserSerializer(user, context={'request': request}).data,
            },
            status=status.HTTP_200_OK,
        )


@api_view(['PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser])
def consultancy_profile_picture(request):
    user = request.user

    if getattr(user, 'role', None) != 'consultancy':
        return Response({'detail': 'Only consultancy accounts can update profile pictures.'}, status=403)

    def delete_current_logo_file():
        current_logo = getattr(user, 'logo_url', None)
        if not current_logo:
            return

        storage_path = current_logo
        if isinstance(storage_path, str) and storage_path.startswith(settings.MEDIA_URL):
            storage_path = storage_path[len(settings.MEDIA_URL):]
        if isinstance(storage_path, str) and storage_path.startswith('/'):
            storage_path = storage_path.lstrip('/')

        if storage_path and default_storage.exists(storage_path):
            default_storage.delete(storage_path)

    try:
        if request.method == 'DELETE':
            delete_current_logo_file()
            user.logo_url = None
            user.save(update_fields=['logo_url'])

            return Response(
                {
                    'detail': 'Profile picture removed successfully.',
                    'logo_url': None,
                    'user': UserSerializer(user, context={'request': request}).data,
                },
                status=200,
            )

        if not has_user_logo_column():
            return Response(
                {
                    'message': 'Database schema is missing logo_url column. Run migrations before uploading profile pictures.',
                },
                status=500,
            )

        uploaded_file = request.FILES.get('logo') or request.FILES.get('profile_picture') or request.FILES.get('image')
        if uploaded_file is None:
            return Response({'message': 'No file provided'}, status=400)

        content_type = getattr(uploaded_file, 'content_type', '') or ''
        if not content_type.startswith('image/'):
            return Response({'detail': 'Only image files are allowed.'}, status=400)

        upload_directory = os.path.join(settings.MEDIA_ROOT, 'consultancy-logos', str(user.id))
        os.makedirs(upload_directory, exist_ok=True)

        original_name = get_valid_filename(uploaded_file.name or 'profile-picture')
        file_extension = os.path.splitext(original_name)[1] or '.png'
        storage_path = f'consultancy-logos/{user.id}/{uuid4().hex}{file_extension}'
        saved_path = default_storage.save(storage_path, uploaded_file)

        delete_current_logo_file()
        user.logo_url = default_storage.url(saved_path)
        user.save(update_fields=['logo_url'])

        return Response(
            {
                'detail': 'Profile picture updated successfully.',
                'logo_url': resolve_logo_url(request, user.logo_url),
                'user': UserSerializer(user, context={'request': request}).data,
            },
            status=200,
        )
    except Exception as exc:
        logger.exception('Profile picture upload failed for user_id=%s', getattr(user, 'id', None))
        return Response(
            {
                'message': str(exc),
            },
            status=500,
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
            user.delete()
            return Response(
                {'detail': 'Account deleted successfully.'},
                status=status.HTTP_200_OK,
            )
        except Exception:
            return Response(
                {'detail': 'An error occurred while deleting the account. Please try again later.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
