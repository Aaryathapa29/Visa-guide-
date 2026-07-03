import os

import resend
from django.conf import settings
from django.contrib.auth.tokens import default_token_generator
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny

from .models import User
from .serializers import (
    LoginSerializer,
    PasswordResetConfirmSerializer,
    PasswordResetRequestSerializer,
    RegisterSerializer,
)

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