from datetime import datetime, timezone as dt_timezone
from urllib.parse import parse_qs, urlparse

from rest_framework import serializers

from .models import Alert, Category, CropOption, FarmerProfile, Guide, SupportMessage
from .security import decrypt_value, encrypt_value


def _is_expired_signed_image_url(image_url):
    if not image_url:
        return False

    try:
        parsed = urlparse(str(image_url).strip())
        if parsed.scheme not in {'http', 'https'}:
            return False

        expires_at = parse_qs(parsed.query).get('se', [None])[0]
        if not expires_at:
            return False

        expires_at = expires_at.replace('Z', '+00:00')
        return datetime.fromisoformat(expires_at) <= datetime.now(dt_timezone.utc)
    except (TypeError, ValueError):
        return False


class FarmerProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = FarmerProfile
        fields = ['full_name', 'phone', 'location', 'crop', 'farm_size']

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['full_name'] = decrypt_value(instance.full_name) or ''
        data['phone'] = decrypt_value(instance.phone) or ''
        data['location'] = decrypt_value(instance.location) or ''
        data['crop'] = decrypt_value(instance.crop) or ''
        return data

    def create(self, validated_data):
        validated_data['full_name'] = encrypt_value(validated_data.get('full_name', ''))
        validated_data['phone'] = encrypt_value(validated_data.get('phone', ''))
        validated_data['location'] = encrypt_value(validated_data.get('location', ''))
        validated_data['crop'] = encrypt_value(validated_data.get('crop', ''))
        validated_data['is_encrypted'] = True
        return super().create(validated_data)

    def update(self, instance, validated_data):
        if 'full_name' in validated_data:
            validated_data['full_name'] = encrypt_value(validated_data.get('full_name', ''))
        if 'phone' in validated_data:
            validated_data['phone'] = encrypt_value(validated_data.get('phone', ''))
        if 'location' in validated_data:
            validated_data['location'] = encrypt_value(validated_data.get('location', ''))
        if 'crop' in validated_data:
            validated_data['crop'] = encrypt_value(validated_data.get('crop', ''))
        validated_data['is_encrypted'] = True
        return super().update(instance, validated_data)


class CropOptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = CropOption
        fields = ['id', 'label', 'icon', 'image_url']

    def to_representation(self, instance):
        data = super().to_representation(instance)
        if _is_expired_signed_image_url(data.get('image_url')):
            data['image_url'] = None
        return data


class AlertSerializer(serializers.ModelSerializer):
    levelLabel = serializers.CharField(source='level_label')

    class Meta:
        model = Alert
        fields = [
            'id',
            'title',
            'severity',
            'levelLabel',
            'action',
            'tag',
            'icon',
            'timestamp',
            'crop',
        ]


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'title', 'count', 'icon', 'description']


class GuideSerializer(serializers.ModelSerializer):
    category = serializers.SerializerMethodField()

    class Meta:
        model = Guide
        fields = [
            'id',
            'title',
            'badge',
            'category',
            'summary',
            'details',
            'image',
            'content',
        ]

    def get_category(self, obj):
        return obj.category.title if obj.category else ''


class SupportMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = SupportMessage
        fields = ['id', 'sender', 'time', 'content']

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['content'] = decrypt_value(instance.content) or ''
        return data