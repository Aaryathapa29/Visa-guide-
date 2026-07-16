from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    LoginView,
    PasswordResetConfirmView,
    PasswordResetRequestView,
    RegisterView,
    users_list,
    login_history,
    CheckEmailView,
    UpdateProfileView,
    DeleteAccountView,
)

urlpatterns = [
    # Sign-up endpoint
    path('register/', RegisterView.as_view(), name='auth_register'),
    
    # Login endpoint (returns access and refresh JWT tokens)
    path('login/', LoginView.as_view(), name='token_obtain_pair'),

    # Users list and login history endpoints
    path('users/', users_list, name='users_list'),
    path('login-history/', login_history, name='login_history'),
    
    # Endpoint to refresh the access token when it expires
    path('login/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # Password reset flow for React frontend
    path('password-reset/', PasswordResetRequestView.as_view(), name='password_reset_request'),
    path('password-reset/confirm/', PasswordResetConfirmView.as_view(), name='password_reset_confirm'),

    # Profile management endpoints
    path('check-email/', CheckEmailView.as_view(), name='check_email'),
    path('update-profile/', UpdateProfileView.as_view(), name='update_profile'),
    path('delete-account/', DeleteAccountView.as_view(), name='delete_account'),
]