from unittest.mock import patch

from django.contrib.auth.models import Group, User
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from .models import FarmerProfile, QuickReply


class ApiSmokeTests(APITestCase):
	fixtures = []

	def setUp(self):
		self.user = User.objects.create_user(username='tester', password='StrongPass123!')
		farmer_group, _ = Group.objects.get_or_create(name='farmer')
		self.user.groups.add(farmer_group)
		self.client.force_authenticate(user=self.user)

	def test_profile_defaults_when_empty(self):
		response = self.client.get(reverse('onboarding-profile'))

		self.assertEqual(response.status_code, status.HTTP_200_OK)
		self.assertEqual(
			response.json(),
			{
				'full_name': '',
				'location': '',
				'crop': '',
				'farm_size': None,
			},
		)

	def test_profile_post_without_trailing_slash(self):
		response = self.client.post(
			'/api/onboarding/profile',
			{
				'full_name': 'Slashless User',
				'location': 'Kano',
				'crop': 'Rice',
				'farm_size': 3,
			},
			format='json',
		)

		self.assertIn(response.status_code, [status.HTTP_200_OK, status.HTTP_201_CREATED])
		self.assertEqual(response.json().get('full_name'), 'Slashless User')

	def test_support_reply_returns_expected_shape(self):
		QuickReply.objects.create(text='My crops are wilting', order=1)
		response = self.client.post(
			reverse('support-reply'),
			{'message': 'My maize leaves are turning yellow'},
			format='json',
		)

		self.assertEqual(response.status_code, status.HTTP_200_OK)
		self.assertIn('reply', response.json())
		self.assertIn('time', response.json())
		self.assertIn('quick_replies', response.json())

	def test_favicon_request_does_not_404(self):
		response = self.client.get('/favicon.ico')

		self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)


class AuthTests(APITestCase):
	def test_register_and_token_login(self):
		register_response = self.client.post(
			reverse('auth-register'),
			{
				'username': 'newfarmer',
				'password': 'StrongPass123!',
				'role': 'farmer',
			},
			format='json',
		)

		self.assertEqual(register_response.status_code, status.HTTP_201_CREATED)
		self.assertIn('access', register_response.json())
		self.assertIn('refresh', register_response.json())
		self.assertTrue(FarmerProfile.objects.filter(owner__username='newfarmer').exists())

		token_response = self.client.post(
			reverse('auth-token'),
			{'username': 'newfarmer', 'password': 'StrongPass123!'},
			format='json',
		)

		self.assertEqual(token_response.status_code, status.HTTP_200_OK)
		self.assertIn('access', token_response.json())
		self.assertIn('refresh', token_response.json())
		self.assertEqual(token_response.json().get('role'), 'farmer')

		login_alias_response = self.client.post(
			reverse('auth-login'),
			{'username': 'newfarmer', 'password': 'StrongPass123!'},
			format='json',
		)
		self.assertEqual(login_alias_response.status_code, status.HTTP_200_OK)
		self.assertIn('access', login_alias_response.json())
		self.assertIn('refresh', login_alias_response.json())

		me_response = self.client.get(
			reverse('auth-me'),
			HTTP_AUTHORIZATION=f"Bearer {token_response.json()['access']}",
		)
		self.assertEqual(me_response.status_code, status.HTTP_200_OK)

		logout_response = self.client.post(
			reverse('auth-logout'),
			{'refresh': token_response.json()['refresh']},
			format='json',
			HTTP_AUTHORIZATION=f"Bearer {token_response.json()['access']}",
		)
		self.assertEqual(logout_response.status_code, status.HTTP_205_RESET_CONTENT)

	@patch('core.auth_views.google_id_token.verify_oauth2_token')
	def test_google_auth_creates_user_and_tokens(self, mock_verify):
		mock_verify.return_value = {
			'email': 'googlefarmer@example.com',
			'name': 'Google Farmer',
		}

		from django.conf import settings
		settings.GOOGLE_CLIENT_ID = 'test-client-id.apps.googleusercontent.com'

		response = self.client.post(
			reverse('auth-google'),
			{'id_token': 'fake-google-token', 'role': 'farmer'},
			format='json',
		)

		self.assertEqual(response.status_code, status.HTTP_200_OK)
		self.assertIn('access', response.json())
		self.assertIn('refresh', response.json())
		self.assertEqual(response.json().get('role'), 'farmer')
		self.assertTrue(User.objects.filter(email='googlefarmer@example.com').exists())
		self.assertTrue(FarmerProfile.objects.filter(owner__email='googlefarmer@example.com').exists())

# Create your tests here.
