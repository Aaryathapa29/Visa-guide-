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
#         fields = ('username', 'email', 'password', 'role', 'organisation_type', 'license_number')
#         extra_kwargs = {'password': {'write_only': True}}

#     def create(self, validated_data):
#         # Extract the role to determine verification state
#         role = validated_data.get('role', 'student')
        
#         user = User.objects.create_user(
#             username=validated_data['username'],
#             email=validated_data['email'],
#             password=validated_data['password'],
#             role=role,
#             organisation_type=validated_data.get('organisation_type', ''),
#             license_number=validated_data.get('license_number', ''),
#             # Automatically unverify consultancies so they must be reviewed
#             is_verified=False if role == 'consultancy' else True 
#         )
#         return user

from django.contrib.auth import authenticate
from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken

from .models import User

class RegisterSerializer(serializers.ModelSerializer):
    # Explicitly include the new consultancy fields here
    organisation_type = serializers.CharField(required=False, allow_blank=True)
    license_number = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'password', 'role', 'organisation_type', 'license_number')
        extra_kwargs = {
            'password': {'write_only': True}
        }

    def create(self, validated_data):
        # Extract fields out of the validated submission data bundle
        role = validated_data.get('role', 'student')
        organisation_type = validated_data.get('organisation_type', '')
        license_number = validated_data.get('license_number', '')

        if role == 'consultancy' and (not organisation_type or not license_number):
            raise serializers.ValidationError({
                'organisation_type': 'Organisation type is required for consultancy accounts.',
                'license_number': 'License number is required for consultancy accounts.',
            })

        # Create your custom user record using Django's standard manager method
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            role=role,
            organisation_type=organisation_type,
            license_number=license_number
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

        try:
            user = User.objects.get(email__iexact=email)
        except User.DoesNotExist as exc:
            raise serializers.ValidationError({'detail': 'Invalid email or password.'}) from exc

        authenticated_user = authenticate(username=user.username, password=password)
        if authenticated_user is None:
            raise serializers.ValidationError({'detail': 'Invalid email or password.'})

        if user.role != role:
            raise serializers.ValidationError({'detail': 'Selected role does not match this account.'})

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