from django.conf import settings as django_settings
from django.core.cache import cache
from django.db.models import Q
from django.utils import timezone
from datetime import datetime, timezone as dt_timezone
from urllib.parse import parse_qs, urlparse
from rest_framework import serializers, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .image_generation import generate_crop_image, generate_fallback_crop_image, ImageGenerationError


_CACHE_TTL = getattr(django_settings, 'CACHE_TTL', {})


def _bust(*keys):
    """Delete cache entries by key name."""
    cache.delete_many(keys)


def _crop_image_cache_key(crop_name):
	return f"agrosmart:crop-image:{crop_name.strip().lower()}"


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


def _usable_image_url(image_url):
	return image_url if image_url and not _is_expired_signed_image_url(image_url) else ''

from .models import (
	Alert,
	Category,
	CropOption,
	FarmerProfile,
	Guide,
	Notification,
	QuickReply,
	SupportMessage,
)
from .serializers import (
	AlertSerializer,
	CategorySerializer,
	CropOptionSerializer,
	FarmerProfileSerializer,
	GuideSerializer,
	SupportMessageSerializer,
)
from .permissions import IsFarmerOfficerOrAdmin
from .security import decrypt_value, encrypt_value


def _has_staff_role(user):
	if user.is_superuser or user.is_staff:
		return True
	roles = {group.name.lower() for group in user.groups.all()}
	return bool(roles & {'officer', 'admin'})


class OnboardingProfileView(APIView):
	permission_classes = [IsAuthenticated, IsFarmerOfficerOrAdmin]

	def get_permissions(self):
		if self.request.method == 'GET':
			return [AllowAny()]
		return [permission() for permission in self.permission_classes]

	def get(self, request):
		if not request.user.is_authenticated:
			return Response(
				{
					'full_name': '',
					'location': '',
					'crop': '',
					'farm_size': None,
				}
			)
		profile = FarmerProfile.objects.filter(owner=request.user).order_by('id').first()
		if not profile and _has_staff_role(request.user):
			profile = FarmerProfile.objects.order_by('id').first()
		if not profile:
			return Response(
				{
					'full_name': '',
					'location': '',
					'crop': '',
					'farm_size': None,
				}
			)
		return Response(FarmerProfileSerializer(profile).data)

	def post(self, request):
		profile = FarmerProfile.objects.filter(owner=request.user).order_by('id').first()
		serializer = FarmerProfileSerializer(instance=profile, data=request.data)
		serializer.is_valid(raise_exception=True)
		created = profile is None
		serializer.save(owner=request.user)
		_bust('agrosmart:dashboard')
		return Response(
			serializer.data,
			status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
		)


class CropOptionListView(APIView):
	permission_classes = [AllowAny]

	def get(self, request):
		cached = cache.get('agrosmart:crops')
		if cached is not None:
			return Response(cached)
		data = CropOptionSerializer(CropOption.objects.all(), many=True).data
		cache.set('agrosmart:crops', data, _CACHE_TTL.get('crops', 3600))
		return Response(data)


class DashboardSummaryView(APIView):
	permission_classes = [AllowAny]

	def get(self, request):
		cached = cache.get('agrosmart:dashboard')
		if cached is not None:
			return Response(cached)

		new_alert_count = Alert.objects.count()
		summary = {
			'weather': {
				'temp': {'value': '28°C', 'note': '+2°C vs yesterday'},
				'humidity': {'value': '65%', 'note': '-5% dropping'},
				'rain': {'value': '10%', 'note': 'Clear skies'},
			},
			'task': {
				'title': 'Best time to plant',
				'description': 'Soil moisture is optimal for corn seeding today. Weather conditions are stable for the next 48 hours.',
			},
			'cropStatus': [
				{
					'id': 'wheat-a',
					'name': 'Wheat - Sector A',
					'stage': 'Vegetative Stage • 45 days left',
					'status': 'Healthy',
					'score': 85,
					'statusColor': 'primary',
					'icon': 'grass',
				},
				{
					'id': 'corn-b',
					'name': 'Corn - Sector B',
					'stage': 'Seedling Stage • Needs Water',
					'status': 'Warning',
					'score': 30,
					'statusColor': 'orange',
					'icon': 'psychology_alt',
				},
			],
			'newAlertCount': new_alert_count,
			'libraryHint': 'Pest Guides',
		}
		cache.set('agrosmart:dashboard', summary, _CACHE_TTL.get('dashboard', 60))
		return Response(summary)


class AlertListView(APIView):
	permission_classes = [IsAuthenticated, IsFarmerOfficerOrAdmin]

	def get(self, request):
		cached = cache.get('agrosmart:alerts')
		if cached is not None:
			return Response(cached)
		data = AlertSerializer(Alert.objects.all(), many=True).data
		cache.set('agrosmart:alerts', data, _CACHE_TTL.get('alerts', 120))
		return Response(data)


class CategoryListView(APIView):
	permission_classes = [AllowAny]

	def get(self, request):
		cached = cache.get('agrosmart:categories')
		if cached is not None:
			return Response(cached)
		data = CategorySerializer(Category.objects.all(), many=True).data
		cache.set('agrosmart:categories', data, _CACHE_TTL.get('categories', 3600))
		return Response(data)


class GuideListView(APIView):
	permission_classes = [AllowAny]

	def get(self, request):
		category = request.query_params.get('category', '')
		search = request.query_params.get('search', '')
		cache_key = f'agrosmart:guides:{category}:{search}'
		cached = cache.get(cache_key)
		if cached is not None:
			return Response(cached)

		guides = Guide.objects.select_related('category').all()
		if category:
			guides = guides.filter(category__title__iexact=category)
		if search:
			guides = guides.filter(
				Q(title__icontains=search)
				| Q(summary__icontains=search)
				| Q(details__icontains=search)
				| Q(category__title__icontains=search)
			)
		data = GuideSerializer(guides, many=True).data
		cache.set(cache_key, data, _CACHE_TTL.get('guides', 300))
		return Response(data)


class NotificationListView(APIView):
	permission_classes = [AllowAny]

	def get(self, request):
		cached = cache.get('agrosmart:notifications')
		if cached is not None:
			return Response(cached)
		data = list(Notification.objects.values_list('message', flat=True))
		cache.set('agrosmart:notifications', data, _CACHE_TTL.get('notifications', 300))
		return Response(data)


class SupportMessageListView(APIView):
	permission_classes = [IsAuthenticated, IsFarmerOfficerOrAdmin]

	def get(self, request):
		if _has_staff_role(request.user):
			messages = SupportMessage.objects.all()
		else:
			messages = SupportMessage.objects.filter(Q(owner=request.user) | Q(owner__isnull=True))
		return Response(SupportMessageSerializer(messages, many=True).data)


class QuickReplyListView(APIView):
	permission_classes = [IsAuthenticated, IsFarmerOfficerOrAdmin]

	def get(self, request):
		cached = cache.get('agrosmart:quick_replies')
		if cached is not None:
			return Response(cached)
		data = list(QuickReply.objects.values_list('text', flat=True))
		cache.set('agrosmart:quick_replies', data, _CACHE_TTL.get('quick_replies', 3600))
		return Response(data)


class SupportReplyView(APIView):
	permission_classes = [IsAuthenticated, IsFarmerOfficerOrAdmin]
	throttle_scope = 'support_reply'

	class InputSerializer(serializers.Serializer):
		message = serializers.CharField(allow_blank=False, trim_whitespace=True)

	def post(self, request):
		serializer = self.InputSerializer(data=request.data)
		serializer.is_valid(raise_exception=True)

		message = serializer.validated_data['message']
		reply, quick_replies = generate_officer_reply(message)
		current_time = timezone.localtime().strftime('%H:%M')

		SupportMessage.objects.create(
			owner=request.user,
			sender='user',
			content=encrypt_value(message),
			time=current_time,
			is_encrypted=True,
		)
		SupportMessage.objects.create(
			owner=request.user,
			sender='officer',
			content=encrypt_value(reply),
			time=current_time,
			is_encrypted=True,
		)

		return Response(
			{
				'reply': reply,
				'time': current_time,
				'quick_replies': quick_replies,
			}
		)


class PrivacyExportView(APIView):
	permission_classes = [IsAuthenticated, IsFarmerOfficerOrAdmin]
	throttle_scope = 'privacy'

	def get(self, request):
		profile = FarmerProfile.objects.filter(owner=request.user).first()
		messages = SupportMessage.objects.filter(owner=request.user).order_by('id')

		profile_data = {
			'full_name': '',
			'location': '',
			'crop': '',
			'farm_size': None,
		}
		if profile:
			profile_data = {
				'full_name': decrypt_value(profile.full_name) or '',
				'location': decrypt_value(profile.location) or '',
				'crop': decrypt_value(profile.crop) or '',
				'farm_size': profile.farm_size,
			}

		message_data = [
			{
				'id': message.id,
				'sender': message.sender,
				'time': message.time,
				'content': decrypt_value(message.content),
			}
			for message in messages
		]

		return Response(
			{
				'user': {
					'id': request.user.id,
					'username': request.user.username,
				},
				'profile': profile_data,
				'support_messages': message_data,
			}
		)


class PrivacyDeleteView(APIView):
	permission_classes = [IsAuthenticated, IsFarmerOfficerOrAdmin]
	throttle_scope = 'privacy'

	def delete(self, request):
		FarmerProfile.objects.filter(owner=request.user).delete()
		SupportMessage.objects.filter(owner=request.user).delete()
		request.user.delete()
		return Response({'detail': 'User data deleted successfully.'}, status=status.HTTP_200_OK)


class GenerateCropImageView(APIView):
	"""
	Generate an AI image for a crop using the configured image generation provider.
	The generated image URL is cached in the CropOption model for future requests.
	"""
	permission_classes = [IsAuthenticated, IsFarmerOfficerOrAdmin]
	throttle_scope = 'crop_image_generation'

	class InputSerializer(serializers.Serializer):
		crop_name = serializers.CharField(max_length=256, allow_blank=False, trim_whitespace=True)
		provider = serializers.CharField(max_length=50, required=False, allow_blank=True)

	def post(self, request):
		"""
		Generate an image for a crop
		
		Request body:
		{
			"crop_name": "tomato",
			"provider": "openai"  # optional, defaults to env var or 'openai'
		}
		
		Response:
		{
			"image_url": "https://..."
		}
		"""
		serializer = self.InputSerializer(data=request.data)
		serializer.is_valid(raise_exception=True)

		crop_name = serializer.validated_data['crop_name'].strip()
		provider = serializer.validated_data.get('provider', '').strip() or None

		try:
			# Try to find existing CropOption with cached image
			crop_option = CropOption.objects.filter(
				label__iexact=crop_name
			).first()

			if crop_option and crop_option.image_url:
				crop_option.image_url = _usable_image_url(crop_option.image_url)
				if not crop_option.image_url:
					crop_option.save(update_fields=['image_url'])
					_bust('agrosmart:crops')
				else:
				return Response(
					{
						'image_url': crop_option.image_url,
						'cached': True,
					},
					status=status.HTTP_200_OK,
				)

			# Generate new image
			image_url = generate_crop_image(crop_name, provider=provider)

			# Cache the URL in the CropOption if it exists
			if crop_option:
				crop_option.image_url = image_url
				crop_option.save()
				_bust('agrosmart:crops')

			return Response(
				{
					'image_url': image_url,
					'cached': False,
				},
				status=status.HTTP_200_OK,
			)

		except ImageGenerationError as e:
			image_url = generate_fallback_crop_image(crop_name)
			return Response(
				{
					'image_url': image_url,
					'cached': False,
					'fallback': True,
					'warning': str(e),
				},
				status=status.HTTP_200_OK,
			)
		except Exception as e:
			image_url = generate_fallback_crop_image(crop_name)
			return Response(
				{
					'image_url': image_url,
					'cached': False,
					'fallback': True,
					'warning': f'Unexpected error: {e}',
				},
				status=status.HTTP_200_OK,
			)


class CropImageView(APIView):
	"""
	GET /api/crops/<crop_name>/image
	Returns (and generates if needed) an AI image URL for the given crop.
	"""
	# This endpoint is consumed directly by frontend image tags and should stay public.
	permission_classes = [AllowAny]

	def get(self, request, crop_name):
		crop_name = crop_name.strip()
		cached_url = cache.get(_crop_image_cache_key(crop_name))
		if cached_url and not _is_expired_signed_image_url(cached_url):
			return Response({'image_url': cached_url, 'cached': True})
		if cached_url:
			cache.delete(_crop_image_cache_key(crop_name))

		crop_option = None
		try:
			crop_option = CropOption.objects.filter(label__iexact=crop_name).first()

			if crop_option and crop_option.image_url:
				usable_url = _usable_image_url(crop_option.image_url)
				if usable_url:
					cache.set(_crop_image_cache_key(crop_name), usable_url, 60 * 60 * 24)
					return Response({'image_url': usable_url, 'cached': True})
				crop_option.image_url = None
				crop_option.save(update_fields=['image_url'])
				_bust('agrosmart:crops')

			image_url = generate_crop_image(crop_name)

			if crop_option:
				crop_option.image_url = image_url
				crop_option.save()
				_bust('agrosmart:crops')

			cache.set(_crop_image_cache_key(crop_name), image_url, 60 * 60 * 24)

			return Response({'image_url': image_url, 'cached': False})

		except ImageGenerationError as e:
			image_url = generate_fallback_crop_image(crop_name)
			cache.set(_crop_image_cache_key(crop_name), image_url, 60 * 60 * 24)
			if crop_option and not crop_option.image_url:
				crop_option.image_url = image_url
				crop_option.save(update_fields=['image_url'])
				_bust('agrosmart:crops')
			return Response(
				{'image_url': image_url, 'cached': False, 'fallback': True, 'warning': str(e)},
				status=status.HTTP_200_OK,
			)
		except Exception as e:
			image_url = generate_fallback_crop_image(crop_name)
			cache.set(_crop_image_cache_key(crop_name), image_url, 60 * 60 * 24)
			if crop_option and not crop_option.image_url:
				crop_option.image_url = image_url
				crop_option.save(update_fields=['image_url'])
				_bust('agrosmart:crops')
			return Response(
				{'image_url': image_url, 'cached': False, 'fallback': True, 'warning': f'Unexpected error: {e}'},
				status=status.HTTP_200_OK,
			)


def generate_officer_reply(message):
	normalized_message = message.lower()

	if any(keyword in normalized_message for keyword in ['yellow', 'yellowing', 'nitrogen', 'leaf']):
		return (
			'Yellow leaves can indicate nitrogen deficiency or overwatering. Check the soil moisture first, then inspect whether older leaves are paling before applying fertilizer.',
			[
				'Tell me more about nitrogen',
				'How to test soil moisture',
				'What fertilizer should I use',
			],
		)

	if any(keyword in normalized_message for keyword in ['wilt', 'wilting', 'dry']):
		return (
			'Wilting often points to heat stress, poor root uptake, or low soil moisture. Water early in the morning and inspect the root zone before increasing irrigation volume.',
			[
				'How often should I water',
				'Signs of root disease',
				'Best mulching options',
			],
		)

	if any(keyword in normalized_message for keyword in ['pest', 'bug', 'insect', 'aphid']):
		return (
			'Start by identifying the pest and checking how fast it is spreading. Remove heavily affected leaves and use a crop-safe treatment such as neem-based spray if damage is increasing.',
			[
				'Help identify the pest',
				'Safe organic treatments',
				'When should I spray',
			],
		)

	if any(keyword in normalized_message for keyword in ['weather', 'rain', 'forecast']):
		return (
			'Use the next 48-hour forecast to plan irrigation, spraying, and planting. Avoid spraying right before rainfall and prioritize drainage checks if heavy rain is expected.',
			[
				'Should I irrigate today',
				'When to spray after rain',
				'How to protect seedlings',
			],
		)

	if any(keyword in normalized_message for keyword in ['fertilizer', 'manure', 'nutrient']):
		return (
			'Choose fertilizer based on crop stage and soil condition. A soil test is best, but if that is not available, start with a balanced application and monitor leaf color and growth response.',
			[
				'How to do a soil test',
				'Best fertilizer for maize',
				'Organic fertilizer options',
			],
		)

	return (
		'I can help with crop health, pests, soil fertility, and weather-based decisions. Share the crop, symptoms, and how long the issue has been happening so I can give a more precise recommendation.',
		[
			'My crops are wilting',
			'Pest identification help',
			'Weather advice needed',
		],
	)
