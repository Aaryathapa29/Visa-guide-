# # from rest_framework import serializers
# # from django.contrib.auth import get_user_model

# # User = get_user_model()

# # class RegisterSerializer(serializers.ModelSerializer):
# #     password = serializers.CharField(write_only=True)

# #     class Meta:
# #         model = User
# #         fields = ('username', 'email', 'password', 'role')

# #     def validate_role(self, value):
# #         if value not in ['student', 'consultancy']:
# #             raise serializers.ValidationError("Role must be either 'student' or 'consultancy'.")
# #         return value

# #     def create(self, validated_data):
# #         # Create the user using Django's secure create_user method (hashes the password automatically)
# #         user = User.objects.create_user(
# #             username=validated_data['username'],
# #             email=validated_data.get('email', ''),
# #             password=validated_data['password'],
# #             role=validated_data.get('role', 'student')
# #         )
# #         return user

# from rest_framework import serializers
# from .models import User

# class RegisterSerializer(serializers.ModelSerializer):
#     class Meta:
#         model = User
#         fields = ('username', 'email', 'password', 'role', 'license_number')
#         extra_kwargs = {'password': {'write_only': True}}
#
#     def create(self, validated_data):
#         # Extract the role to determine verification state
#         role = validated_data.get('role', 'student')
#
#         user = User.objects.create_user(
#             username=validated_data['username'],
#             email=validated_data['email'],
#             password=validated_data['password'],
#             role=role,
#             license_number=validated_data.get('license_number', ''),
#             # Automatically unverify consultancies so they must be reviewed
#             is_verified=False if role == 'consultancy' else True
#         )
#         return user

from django.contrib.auth.password_validation import validate_password
from django.contrib.auth.tokens import default_token_generator
from django.utils import timezone
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import get_user_model

from .models import Expert, LoginHistory, User

UserModel = get_user_model()

class RegisterSerializer(serializers.ModelSerializer):
    first_name = serializers.CharField(required=False, allow_blank=True)
    full_name = serializers.CharField(required=False, allow_blank=True)
    fullName = serializers.CharField(required=False, allow_blank=True)
    license_number = serializers.CharField(required=False, allow_blank=True)
    office_name = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = User
        fields = (
            'id',
            'username',
            'first_name',
            'full_name',
            'fullName',
            'email',
            'password',
            'role',
            'license_number',
            'office_name',
        )
        extra_kwargs = {
            'password': {'write_only': True}
        }

    def validate_email(self, value):
        normalized_email = value.strip()

        if User.objects.filter(email__iexact=normalized_email).exists():
            raise serializers.ValidationError('An account with this email already exists.')

        if not normalized_email.lower().endswith('@gmail.com'):
            raise serializers.ValidationError('Registration is only permitted using a valid Gmail account.')

        return normalized_email

    def validate_password(self, value):
        validate_password(value)
        return value

    def create(self, validated_data):
        # Extract fields out of the validated submission data bundle
        role = validated_data.get('role', 'student')
        license_number = validated_data.get('license_number', '')
        office_name = validated_data.get('office_name', '')

        if role == 'consultancy' and not license_number:
            raise serializers.ValidationError({
                'license_number': 'License number is required for consultancy accounts.',
            })

        if role == 'consultancy' and not office_name:
            raise serializers.ValidationError({
                'office_name': 'Office name is required for consultancy accounts.',
            })

        first_name = validated_data.get('first_name') or validated_data.get('full_name') or validated_data.get('fullName') or ''

        # Create your custom user record using Django's standard manager method
        user = User.objects.create_user(
            username=validated_data['username'],
            first_name=first_name,
            email=validated_data['email'],
            password=validated_data['password'],
            role=role,
            license_number=license_number,
            office_name=office_name,
        )

        # Logic step: set verification status based on the chosen role
        if role == 'consultancy':
            user.is_verified = False  # Must be approved by admin
        else:
            user.is_verified = True   # Students are instantly active
            
        user.save()
        return user


class UserSerializer(serializers.ModelSerializer):
    display_name = serializers.SerializerMethodField()
    full_name = serializers.SerializerMethodField()
    fullName = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            'id',
            'first_name',
            'username',
            'email',
            'role',
            'is_verified',
            'license_number',
            'office_name',
            'display_name',
            'full_name',
            'fullName',
            'date_joined',
            'last_login',
        )

    def get_display_name(self, obj):
        return self._resolve_name(obj)

    def get_full_name(self, obj):
        return self._resolve_name(obj)

    def get_fullName(self, obj):
        return self._resolve_name(obj)

    def _resolve_name(self, obj):
        return (
            obj.first_name or
            getattr(obj, 'office_name', None) or
            obj.username or
            obj.email or
            ''
        )


class ExpertSerializer(serializers.ModelSerializer):
    class Meta:
        model = Expert
        fields = ('id', 'consultancy_id', 'name', 'specialization', 'created_at', 'updated_at')
        read_only_fields = ('id', 'consultancy_id', 'created_at', 'updated_at')


class LoginHistorySerializer(serializers.ModelSerializer):
    user_id = serializers.IntegerField(source='user.id', read_only=True)
    username = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = LoginHistory
        fields = ('id', 'user_id', 'username', 'login_time', 'ip_address', 'user_agent')


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    role = serializers.ChoiceField(choices=User.ROLE_CHOICES)

    def validate(self, attrs):
        email = attrs.get('email')
        password = attrs.get('password')
        role = attrs.get('role')

        candidates = User.objects.filter(email__iexact=email, role=role, is_active=True)

        if not candidates.exists():
            raise serializers.ValidationError({'detail': 'Invalid email or password.'})

        user = None
        for candidate in candidates:
            if candidate.check_password(password):
                user = candidate
                break

        if user is None:
            raise serializers.ValidationError({'detail': 'Invalid email or password.'})

        if role == 'consultancy' and not user.is_verified:
            raise serializers.ValidationError({'detail': 'Your consultancy account is pending admin verification.'})

        # Record the last login timestamp so Neon can query authenticated users.
        user.last_login = timezone.now()
        user.save(update_fields=['last_login'])

        request = self.context.get('request')
        if request is not None:
            LoginHistory.objects.create(
                user=user,
                ip_address=request.META.get('REMOTE_ADDR', ''),
                user_agent=request.META.get('HTTP_USER_AGENT', ''),
            )

        # Use CustomTokenObtainPairSerializer to include role in token
        refresh = CustomTokenObtainPairSerializer.get_token(user)

        display_name = (
            user.first_name or
            getattr(user, 'office_name', None) or
            user.username or
            user.email or
            ''
        )
        serialized_user = UserSerializer(user).data

        # When the user object is sent to the frontend, ensure a consistent name
        # field exists for the profile dropdown.
        serialized_user.update({
            'display_name': display_name,
            'full_name': display_name,
            'fullName': display_name,
        })

        return {
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'user': serialized_user,
        }


class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate_email(self, value):
        normalized_email = value.strip()

        try:
            user = UserModel.objects.get(email__iexact=normalized_email)
        except UserModel.DoesNotExist as exc:
            raise serializers.ValidationError({'detail': 'No account found for that email address.'}) from exc

        if not self._has_verified_email(user):
            raise serializers.ValidationError({'detail': 'This account does not have a verified email address.'})

        return normalized_email

    def save(self):
        email = self.validated_data['email']
        user = UserModel.objects.get(email__iexact=email)
        uidb64 = urlsafe_base64_encode(force_bytes(user.pk))
        token = default_token_generator.make_token(user)
        return user, uidb64, token

    def _has_verified_email(self, user):
        email_value = getattr(user, 'email', None)
        if not email_value:
            return False

        for attr in ('is_email_verified', 'email_verified', 'email_verified_at'):
            if hasattr(user, attr):
                value = getattr(user, attr)
                return bool(value) if isinstance(value, bool) else value is not None

        return True


class PasswordResetConfirmSerializer(serializers.Serializer):
    uidb64 = serializers.CharField()
    token = serializers.CharField()
    new_password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        try:
            uid = urlsafe_base64_decode(attrs['uidb64']).decode()
            user = UserModel.objects.get(pk=uid)
        except (TypeError, ValueError, OverflowError, UserModel.DoesNotExist) as exc:
            raise serializers.ValidationError({'detail': 'Invalid reset link.'}) from exc

        if not default_token_generator.check_token(user, attrs['token']):
            raise serializers.ValidationError({'detail': 'Invalid or expired reset token.'})

        if not self._has_verified_email(user):
            raise serializers.ValidationError({'detail': 'This account does not have a verified email address.'})

        validate_password(attrs['new_password'], user=user)

        attrs['user'] = user
        return attrs

    def _has_verified_email(self, user):
        email_value = getattr(user, 'email', None)
        if not email_value:
            return False

        for attr in ('is_email_verified', 'email_verified', 'email_verified_at'):
            if hasattr(user, attr):
                value = getattr(user, attr)
                return bool(value) if isinstance(value, bool) else value is not None

        return True


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Custom JWT serializer that includes the user role in token claims"""
    
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        # Add custom claims to the token
        token['role'] = getattr(user, 'role', 'student')
        token['user_id'] = str(user.id)
        return token