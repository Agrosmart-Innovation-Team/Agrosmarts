import logging
import re

from django.conf import settings
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth.models import Group, User
from django.contrib.auth.tokens import default_token_generator
from django.core.exceptions import ValidationError as DjangoValidationError
from django.core.mail import send_mail
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token as google_id_token
from rest_framework import serializers, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView

from .models import FarmerProfile
from .security import encrypt_value


def get_user_role(user):
    if user.is_superuser or user.is_staff:
        return 'admin'
    role_names = [group.name.lower() for group in user.groups.all()]
    return role_names[0] if role_names else 'farmer'


def _make_unique_username(seed):
    base = re.sub(r'[^a-zA-Z0-9_]+', '_', seed).strip('_').lower() or 'user'
    candidate = base[:150]
    suffix = 1
    while User.objects.filter(username__iexact=candidate).exists():
        suffix_str = f'_{suffix}'
        candidate = f"{base[:150 - len(suffix_str)]}{suffix_str}"
        suffix += 1
    return candidate


def _assign_role(user, role):
    group, _ = Group.objects.get_or_create(name=role)
    user.groups.add(group)


def _token_payload_for(user):
    refresh = RefreshToken.for_user(user)
    role = get_user_role(user)
    refresh['role'] = role
    access = refresh.access_token
    access['role'] = role
    return {
        'refresh': str(refresh),
        'access': str(access),
        'username': user.username,
        'role': role,
    }


class AgroSmartTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['role'] = get_user_role(user)
        return token

    def validate(self, attrs):
        # Accept email in the username field from clients and resolve to actual username.
        identifier = (attrs.get('username') or '').strip()
        if identifier and '@' in identifier:
            matched_user = User.objects.filter(email__iexact=identifier).first()
            if matched_user:
                attrs['username'] = matched_user.username

        data = super().validate(attrs)
        data['role'] = get_user_role(self.user)
        data['username'] = self.user.username
        return data


class AgroSmartTokenObtainPairView(TokenObtainPairView):
    serializer_class = AgroSmartTokenObtainPairSerializer
    permission_classes = [AllowAny]
    throttle_scope = 'auth'


class RegisterSerializer(serializers.Serializer):
    username = serializers.CharField(min_length=3, max_length=150)
    email = serializers.EmailField(required=False, allow_blank=True)
    phone = serializers.CharField(required=False, allow_blank=True, max_length=64)
    full_name = serializers.CharField(required=False, allow_blank=True, max_length=512)
    password = serializers.CharField(min_length=8, write_only=True)
    role = serializers.ChoiceField(choices=['farmer', 'officer', 'agronomist'])


class RegisterView(APIView):
    permission_classes = [AllowAny]
    throttle_scope = 'auth'

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        username = serializer.validated_data['username'].strip()
        if User.objects.filter(username__iexact=username).exists():
            return Response({'detail': 'Username already exists.'}, status=status.HTTP_400_BAD_REQUEST)

        user = User.objects.create_user(
            username=username,
            email=serializer.validated_data.get('email', '').strip().lower(),
            password=serializer.validated_data['password'],
        )

        role = serializer.validated_data['role']
        if role == 'agronomist':
            role = 'officer'
        _assign_role(user, role)

        # Initialize a profile row at signup so onboarding updates an existing record.
        profile, _ = FarmerProfile.objects.get_or_create(owner=user)
        full_name = serializer.validated_data.get('full_name', '').strip()
        phone = serializer.validated_data.get('phone', '').strip()
        if full_name or phone:
            if full_name:
                profile.full_name = encrypt_value(full_name)
            if phone:
                profile.phone = encrypt_value(phone)
            profile.is_encrypted = True
            profile.save(update_fields=['full_name', 'phone', 'is_encrypted'])

        token_data = _token_payload_for(user)
        return Response(
            {
                'id': user.id,
                'username': user.username,
                'role': role,
                'refresh': token_data['refresh'],
                'access': token_data['access'],
            },
            status=status.HTTP_201_CREATED,
        )


class LogoutSerializer(serializers.Serializer):
    refresh = serializers.CharField()


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]
    throttle_scope = 'auth'

    def post(self, request):
        serializer = LogoutSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            token = RefreshToken(serializer.validated_data['refresh'])
            token.blacklist()
        except TokenError:
            return Response({'detail': 'Invalid refresh token.'}, status=status.HTTP_400_BAD_REQUEST)

        return Response({'detail': 'Logged out successfully.'}, status=status.HTTP_205_RESET_CONTENT)


class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()


class PasswordResetRequestView(APIView):
    permission_classes = [AllowAny]
    throttle_scope = 'auth'

    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data['email'].strip().lower()
        user = User.objects.filter(email__iexact=email).first()

        if user:
            token = default_token_generator.make_token(user)
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173').rstrip('/')
            reset_link = f"{frontend_url}/reset-password/{uid}/{token}"
            try:
                send_mail(
                    subject='AgroSmart – Password Reset Request',
                    message=(
                        f"Hi {user.get_full_name() or user.username},\n\n"
                        f"Click the link below to reset your AgroSmart password:\n\n"
                        f"{reset_link}\n\n"
                        "This link expires in 1 hour.\n"
                        "If you did not request a password reset, you can ignore this email."
                    ),
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[user.email],
                    fail_silently=False,
                )
            except Exception:
                logging.getLogger(__name__).exception('Password reset email failed for user %s', user.pk)

        # Always return success to prevent account enumeration.
        return Response(
            {'detail': 'If an account with that email exists, a reset link has been sent.'},
            status=status.HTTP_200_OK,
        )


class PasswordResetConfirmSerializer(serializers.Serializer):
    uidb64 = serializers.CharField()
    token = serializers.CharField()
    new_password = serializers.CharField(min_length=8, write_only=True)


class PasswordResetConfirmView(APIView):
    permission_classes = [AllowAny]
    throttle_scope = 'auth'

    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        uidb64 = serializer.validated_data['uidb64']
        token = serializer.validated_data['token']
        new_password = serializer.validated_data['new_password']

        try:
            uid = force_str(urlsafe_base64_decode(uidb64))
            user = User.objects.get(pk=uid)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            return Response(
                {'detail': 'Invalid reset link.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not default_token_generator.check_token(user, token):
            return Response(
                {'detail': 'Reset link is invalid or has expired. Please request a new one.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            validate_password(new_password, user=user)
        except DjangoValidationError as exc:
            message = exc.messages[0] if exc.messages else 'Password is not strong enough.'
            return Response({'detail': message}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(new_password)
        user.save(update_fields=['password'])

        return Response(
            {'detail': 'Password reset successfully. You can sign in now.'},
            status=status.HTTP_200_OK,
        )


class GoogleAuthSerializer(serializers.Serializer):
    id_token = serializers.CharField()
    role = serializers.ChoiceField(choices=['farmer', 'officer'], required=False, default='farmer')


class GoogleAuthView(APIView):
    permission_classes = [AllowAny]
    throttle_scope = 'auth'

    def post(self, request):
        serializer = GoogleAuthSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        client_id = getattr(settings, 'GOOGLE_CLIENT_ID', '')
        if not client_id:
            return Response({'detail': 'Google auth is not configured.'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        try:
            claims = google_id_token.verify_oauth2_token(
                serializer.validated_data['id_token'],
                google_requests.Request(),
                client_id,
            )
        except Exception:
            return Response({'detail': 'Invalid Google token.'}, status=status.HTTP_400_BAD_REQUEST)

        email = (claims.get('email') or '').strip().lower()
        if not email:
            return Response({'detail': 'Google account has no email.'}, status=status.HTTP_400_BAD_REQUEST)

        user = User.objects.filter(email__iexact=email).first()
        if not user:
            seed = email.split('@')[0]
            user = User.objects.create_user(
                username=_make_unique_username(seed),
                email=email,
                password=None,
            )
            user.set_unusable_password()
            user.save(update_fields=['password'])

        if not user.groups.exists():
            _assign_role(user, serializer.validated_data['role'])

        FarmerProfile.objects.get_or_create(owner=user)

        data = _token_payload_for(user)
        return Response(data, status=status.HTTP_200_OK)


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(
            {
                'id': request.user.id,
                'username': request.user.username,
                'role': get_user_role(request.user),
            }
        )
