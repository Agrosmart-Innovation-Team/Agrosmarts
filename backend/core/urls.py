from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .auth_views import AgroSmartTokenObtainPairView, GoogleAuthView, LogoutView, MeView, RegisterView

from .views import (
    AlertListView,
    CategoryListView,
    CropImageView,
    CropOptionListView,
    DashboardSummaryView,
    GenerateCropImageView,
    GuideListView,
    NotificationListView,
    OnboardingProfileView,
    QuickReplyListView,
    SupportMessageListView,
    PrivacyDeleteView,
    PrivacyExportView,
    SupportReplyView,
)


urlpatterns = [
    # Accept slashless auth URLs from clients that do not normalize trailing slashes.
    path('auth/login', AgroSmartTokenObtainPairView.as_view()),
    path('auth/login/', AgroSmartTokenObtainPairView.as_view(), name='auth-login'),
    path('auth/register', RegisterView.as_view()),
    path('auth/register/', RegisterView.as_view(), name='auth-register'),
    path('auth/token', AgroSmartTokenObtainPairView.as_view()),
    path('auth/token/', AgroSmartTokenObtainPairView.as_view(), name='auth-token'),
    path('auth/token/refresh', TokenRefreshView.as_view()),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='auth-token-refresh'),
    path('auth/logout', LogoutView.as_view()),
    path('auth/logout/', LogoutView.as_view(), name='auth-logout'),
    path('auth/google', GoogleAuthView.as_view()),
    path('auth/google/', GoogleAuthView.as_view(), name='auth-google'),
    path('auth/me', MeView.as_view()),
    path('auth/me/', MeView.as_view(), name='auth-me'),
    path('onboarding/profile', OnboardingProfileView.as_view()),
    path('onboarding/profile/', OnboardingProfileView.as_view(), name='onboarding-profile'),
    path('onboarding/crops', CropOptionListView.as_view()),
    path('onboarding/crops/', CropOptionListView.as_view(), name='onboarding-crops'),
    path('crops/generate-image', GenerateCropImageView.as_view()),
    path('crops/generate-image/', GenerateCropImageView.as_view(), name='generate-crop-image'),
    path('crops/<str:crop_name>/image', CropImageView.as_view()),
    path('crops/<str:crop_name>/image/', CropImageView.as_view(), name='crop-image'),
    path('dashboard/summary/', DashboardSummaryView.as_view(), name='dashboard-summary'),
    path('alerts/', AlertListView.as_view(), name='alerts'),
    path('categories/', CategoryListView.as_view(), name='categories'),
    path('guides/', GuideListView.as_view(), name='guides'),
    path('notifications/', NotificationListView.as_view(), name='notifications'),
    path('support/messages/', SupportMessageListView.as_view(), name='support-messages'),
    path('support/quick-replies/', QuickReplyListView.as_view(), name='support-quick-replies'),
    path('support/reply/', SupportReplyView.as_view(), name='support-reply'),
    path('privacy/export/', PrivacyExportView.as_view(), name='privacy-export'),
    path('privacy/delete-account/', PrivacyDeleteView.as_view(), name='privacy-delete-account'),
]