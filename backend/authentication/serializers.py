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
from django.utils.http import urlsafe_base64_decode
from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model

from .models import User

UserModel = get_user_model()

class RegisterSerializer(serializers.ModelSerializer):
    license_number = serializers.CharField(required=False, allow_blank=True)
    office_name = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'password', 'role', 'license_number', 'office_name')
        extra_kwargs = {
            'password': {'write_only': True}
        }

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError('An account with this email already exists.')
        return value

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

        # Create your custom user record using Django's standard manager method
        user = User.objects.create_user(
            username=validated_data['username'],
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


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    role = serializers.ChoiceField(choices=User.ROLE_CHOICES)

    def validate(self, attrs):
        email = attrs.get('email')
        password = attrs.get('password')
        role = attrs.get('role')

        candidates = User.objects.filter(email__iexact=email, role=role)

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

        refresh = RefreshToken.for_user(user)

        return {
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'role': user.role,
                'is_verified': user.is_verified,
            },
        }


class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()


class PasswordResetConfirmSerializer(serializers.Serializer):
    uidb64 = serializers.CharField()
    token = serializers.CharField()
    new_password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        try:
            uid = urlsafe_base64_decode(attrs['uidb64']).decode()
            user = UserModel.objects.get(pk=uid)
        except Exception as exc:
            raise serializers.ValidationError({'detail': 'Invalid reset link.'}) from exc

        if not default_token_generator.check_token(user, attrs['token']):
            raise serializers.ValidationError({'detail': 'Invalid or expired reset token.'})

        validate_password(attrs['new_password'], user=user)

        attrs['user'] = user
        return attrs