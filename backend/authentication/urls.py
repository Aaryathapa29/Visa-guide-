from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import LoginView, RegisterView

urlpatterns = [
    # Sign-up endpoint
    path('register/', RegisterView.as_view(), name='auth_register'),
    
    # Login endpoint (returns access and refresh JWT tokens)
    path('login/', LoginView.as_view(), name='token_obtain_pair'),
    
    # Endpoint to refresh the access token when it expires
    path('login/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]