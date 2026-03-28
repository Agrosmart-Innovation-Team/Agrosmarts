from django.contrib import admin

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


@admin.register(FarmerProfile)
class FarmerProfileAdmin(admin.ModelAdmin):
	list_display = ('full_name', 'crop', 'location', 'farm_size')
	search_fields = ('full_name', 'crop', 'location')


@admin.register(CropOption)
class CropOptionAdmin(admin.ModelAdmin):
	list_display = ('label', 'icon', 'order')
	list_editable = ('icon', 'order')
	ordering = ('order', 'id')
	search_fields = ('label', 'icon')


@admin.register(Alert)
class AlertAdmin(admin.ModelAdmin):
	list_display = ('title', 'severity', 'level_label', 'tag', 'crop', 'timestamp')
	list_filter = ('severity', 'tag', 'crop')
	search_fields = ('title', 'action', 'crop', 'tag')


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
	list_display = ('title', 'count', 'icon', 'description')
	search_fields = ('title', 'description', 'icon')


@admin.register(Guide)
class GuideAdmin(admin.ModelAdmin):
	list_display = ('title', 'category', 'badge')
	list_filter = ('category', 'badge')
	search_fields = ('title', 'summary', 'details')
	autocomplete_fields = ('category',)


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
	list_display = ('message', 'created_at')
	ordering = ('-created_at', '-id')
	search_fields = ('message',)


@admin.register(SupportMessage)
class SupportMessageAdmin(admin.ModelAdmin):
	list_display = ('sender', 'time', 'short_content')
	list_filter = ('sender',)
	search_fields = ('content', 'time')

	@admin.display(description='content')
	def short_content(self, obj):
		return obj.content[:80]


@admin.register(QuickReply)
class QuickReplyAdmin(admin.ModelAdmin):
	list_display = ('text', 'order')
	list_editable = ('order',)
	ordering = ('order', 'id')
	search_fields = ('text',)
