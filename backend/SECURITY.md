# AgroSmart Security Baseline

This document captures the implemented security controls and recurring tasks.

## Implemented Controls

- HTTPS/TLS enforcement in production via `SECURE_SSL_REDIRECT`, secure cookies, and HSTS.
- JWT authentication using `djangorestframework-simplejwt`.
- Role-based access control using roles: `farmer`, `officer`, `admin`.
- Sensitive data encryption at rest for profile identity/location fields and support chat content.
- API rate limiting enabled globally and with stricter scoped throttles for auth, support reply, and privacy endpoints.
- GDPR-focused user data endpoints:
  - `GET /api/privacy/export/`
  - `DELETE /api/privacy/delete-account/`

## RBAC Contract

- `farmer`: access mobile app APIs and own profile/chat data.
- `officer`: access API data and support conversations for assistance operations.
- `admin`: full administrative access and Django admin access.

## Operational Security Checklist

Run these controls regularly:

1. `python manage.py security_audit`
2. Dependency vulnerability scan (`pip-audit` recommended)
3. Quarterly penetration test against staging/production
4. Review authentication events and suspicious request spikes
5. Verify GDPR export/delete request handling and retention logs

## Production Deployment Notes

- Always set `DEBUG=False`.
- Set a strong `SECRET_KEY`.
- Set `ENCRYPTION_KEY` to a Fernet key.
- Use reverse proxy TLS termination (Nginx/Cloud provider) with `X-Forwarded-Proto`.
- Restrict `ALLOWED_HOSTS` to real domains.
