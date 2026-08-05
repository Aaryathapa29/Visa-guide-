"""
URL configuration for visa_backend project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.http import HttpResponse, JsonResponse
from django.urls import include, path, re_path

from authentication.views import (
    cancel_session,
    consultancy_signup,
    country_profiles,
    get_all_consultancies,
    consultancy_available_slots,
    consultancy_booked_slots,
    consultancy_sessions,
    log_consultancy_visit,
    ConsultancyNotificationsView,
    MarkNotificationsReadView,
)
from chat.views import ChatRoomViewSet, room_messages
from chat.views import get_or_create_room_for_current_user
from rest_framework.routers import DefaultRouter

router = DefaultRouter()
router.register(r'rooms', ChatRoomViewSet, basename='chat-room')

def home(request):
    return JsonResponse({
        'status': 'ok',
        'message': 'Visa Guide API is running',
    })


def docs(request):
    html = """
    <html>
      <body>
        <h1>Visa Guide API Docs</h1>
        <ul>
          <li>GET /</li>
          <li>POST /api/auth/login/</li>
          <li>POST /api/signup/consultancy/</li>
          <li>GET /api/consultancies/</li>
          <li>POST /api/log-visit/</li>
          <li>GET /api/notifications/</li>
        </ul>
      </body>
    </html>
    """
    return HttpResponse(html)


def orders(request):
    return JsonResponse({
        'status': 'ok',
        'message': 'Orders endpoint is available',
        'orders': [],
    })


urlpatterns = [
    path('', home, name='home'),
    re_path(r'^docs(?:/(?:GET|POST|PUT|DELETE|PATCH).*)?/?$', docs, name='docs'),
    path('orders', orders, name='orders'),
    path('admin/', admin.site.urls),
    path('api/auth/', include('authentication.urls')),
    path('api/chatbot/', include('chatbot.urls')),
    path('api/signup/consultancy/', consultancy_signup, name='consultancy_signup'),
    path('api/consultancies/', get_all_consultancies, name='get_all_consultancies'),
    path('api/country-profiles/', country_profiles, name='country_profiles'),
    path('api/country-profiles/<int:profile_id>/', country_profiles, name='country_profile_detail'),
    path('api/log-visit/', log_consultancy_visit, name='log_consultancy_visit'),
    path('api/notifications/', ConsultancyNotificationsView.as_view(), name='get_consultancy_notifications'),
    path('api/notifications/mark-read/', MarkNotificationsReadView.as_view(), name='mark_notifications_read'),
    path('api/consultancy/sessions/', consultancy_sessions, name='consultancy_sessions'),
    path('api/consultancy/<int:consultancy_id>/booked-slots/', consultancy_booked_slots, name='consultancy_booked_slots'),
    path('api/consultancy/<int:consultancy_id>/available-slots/', consultancy_available_slots, name='consultancy_available_slots'),
    path('api/sessions/<int:session_id>/cancel/', cancel_session, name='cancel_session'),
    path('api/chat/', include(router.urls)),
    path('api/chat/rooms/ensure-current/', get_or_create_room_for_current_user, name='ensure_chat_room_current'),
    path('api/chat/rooms/<int:room_id>/messages/', room_messages, name='room_messages'),
]
