from rest_framework.permissions import BasePermission


class IsFarmerOfficerOrAdmin(BasePermission):
    message = 'A valid farmer, officer, or admin role is required.'

    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False

        if user.is_superuser or user.is_staff:
            return True

        roles = {group.name.lower() for group in user.groups.all()}
        return bool(roles & {'farmer', 'officer', 'admin'})


class IsOfficerOrAdmin(BasePermission):
    message = 'Officer or admin role required.'

    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False

        if user.is_superuser or user.is_staff:
            return True

        roles = {group.name.lower() for group in user.groups.all()}
        return bool(roles & {'officer', 'admin'})
