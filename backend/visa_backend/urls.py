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
from django.urls import path, include

from authentication.views import (
    consultancy_signup,
    get_all_consultancies,
    get_consultancy_notifications,
    log_consultancy_visit,
)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('authentication.urls')), 
    path('api/signup/consultancy/', consultancy_signup, name='consultancy_signup'),
    path('api/consultancies/', get_all_consultancies, name='get_all_consultancies'),
    path('api/log-visit/', log_consultancy_visit, name='log_consultancy_visit'),
    path('api/notifications/', get_consultancy_notifications, name='get_consultancy_notifications'),
]
