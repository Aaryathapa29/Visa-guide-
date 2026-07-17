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
    consultancy_signup,
    country_profiles,
    get_all_consultancies,
    get_consultancy_notifications,
    log_consultancy_visit,
)

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
    path('api/log-visit/', log_consultancy_visit, name='log_consultancy_visit'),
    path('api/notifications/', get_consultancy_notifications, name='get_consultancy_notifications'),
]
