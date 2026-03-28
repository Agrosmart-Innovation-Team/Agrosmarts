import re

from django.conf import settings
from django.contrib.auth.models import Group, User
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
    password = serializers.CharField(min_length=8, write_only=True)
    role = serializers.ChoiceField(choices=['farmer', 'officer'])


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
        _assign_role(user, role)

        # Initialize a profile row at signup so onboarding updates an existing record.
        FarmerProfile.objects.get_or_create(owner=user)

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
