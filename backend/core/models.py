from django.db import models
from django.contrib.auth import get_user_model


User = get_user_model()


class FarmerProfile(models.Model):
	owner = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True, related_name='farmer_profiles')
	full_name = models.CharField(max_length=512, blank=True)
	location = models.CharField(max_length=2048, blank=True)
	crop = models.CharField(max_length=256, blank=True)
	farm_size = models.FloatField(null=True, blank=True)
	is_encrypted = models.BooleanField(default=False)

	def __str__(self):
		return self.full_name or 'Farmer Profile'


class CropOption(models.Model):
	label = models.CharField(max_length=100)
	icon = models.CharField(max_length=100, default='grass')
	order = models.IntegerField(default=0)
	image_url = models.URLField(blank=True, null=True, help_text='AI-generated image URL for the crop')

	class Meta:
		ordering = ['order', 'id']

	def __str__(self):
		return self.label


class Alert(models.Model):
	SEVERITY_CHOICES = [
		('high', 'High'),
		('medium', 'Medium'),
		('low', 'Low'),
	]

	title = models.CharField(max_length=200)
	severity = models.CharField(max_length=10, choices=SEVERITY_CHOICES)
	level_label = models.CharField(max_length=50)
	action = models.TextField()
	tag = models.CharField(max_length=50)
	icon = models.CharField(max_length=100)
	timestamp = models.CharField(max_length=50)
	crop = models.CharField(max_length=100)

	class Meta:
		ordering = ['id']
		indexes = [
			models.Index(fields=['severity'], name='alert_severity_idx'),
			models.Index(fields=['crop'],     name='alert_crop_idx'),
			models.Index(fields=['tag'],      name='alert_tag_idx'),
		]

	def __str__(self):
		return self.title


class Category(models.Model):
	title = models.CharField(max_length=100)
	count = models.IntegerField(default=0)
	icon = models.CharField(max_length=100)
	description = models.CharField(max_length=300, blank=True)

	class Meta:
		ordering = ['id']

	def __str__(self):
		return self.title


class Guide(models.Model):
	title = models.CharField(max_length=200)
	badge = models.CharField(max_length=50, blank=True)
	category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True)
	summary = models.CharField(max_length=300)
	details = models.CharField(max_length=300, blank=True)
	image = models.URLField(blank=True)
	content = models.JSONField(default=list)

	class Meta:
		ordering = ['id']
		indexes = [
			models.Index(fields=['category'], name='guide_category_idx'),
			models.Index(fields=['badge'],    name='guide_badge_idx'),
		]

	def __str__(self):
		return self.title


class Notification(models.Model):
	message = models.CharField(max_length=300)
	created_at = models.DateTimeField(auto_now_add=True)

	class Meta:
		ordering = ['-created_at', '-id']

	def __str__(self):
		return self.message


class SupportMessage(models.Model):
	SENDER_CHOICES = [
		('user', 'User'),
		('officer', 'Officer'),
	]

	owner = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True, related_name='support_messages')
	sender = models.CharField(max_length=10, choices=SENDER_CHOICES)
	content = models.TextField()
	time = models.CharField(max_length=10)
	is_encrypted = models.BooleanField(default=False)

	class Meta:
		ordering = ['id']
		indexes = [
			models.Index(fields=['owner',  'sender'], name='sm_owner_sender_idx'),
			models.Index(fields=['sender'],           name='sm_sender_idx'),
		]

	def __str__(self):
		return f'{self.sender}: {self.content[:40]}'


class QuickReply(models.Model):
	text = models.CharField(max_length=200)
	order = models.IntegerField(default=0)

	class Meta:
		ordering = ['order', 'id']

	def __str__(self):
		return self.text
