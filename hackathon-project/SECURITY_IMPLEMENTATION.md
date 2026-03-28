# Security Implementation Map

This project now includes frontend integration hooks for backend security controls.

## Implemented in Frontend

- HTTPS/TLS enforcement hook:
  - `src/security/apiClient.js` blocks non-HTTPS API URLs in production unless `VITE_ALLOW_HTTP_IN_PROD=true` is explicitly set.
- JWT token support:
  - `src/security/auth.js` manages access/refresh tokens and JWT role extraction.
- RBAC route guard:
  - `src/security/ProtectedRoute.jsx` supports role-based page protection when `VITE_ENABLE_AUTH_GUARD=true`.
- API hardening defaults:
  - `apiFetch` adds `Authorization` (Bearer token), `Accept`, and `X-Requested-With` headers.
  - Handles `401` by clearing local auth session.
  - Handles `429` rate-limit responses with explicit error messaging.

## Backend Responsibilities (Cannot be fully implemented in frontend)

- Data encryption at rest:
  - Must be implemented in database/storage configuration (disk encryption, KMS, encrypted backups).
- Secure API endpoint rate limiting:
  - Must be enforced by backend gateway/framework middleware.
- GDPR/data privacy compliance:
  - Requires backend data lifecycle controls (consent records, retention policies, deletion/export APIs, breach process).
- Regular security audits and penetration testing:
  - Operational process outside app runtime.

## Environment Flags

- `VITE_API_BASE_URL`: Backend API base URL.
- `VITE_ENABLE_AUTH_GUARD`: Set to `true` to enforce route auth/RBAC checks in frontend.
- `VITE_ALLOW_HTTP_IN_PROD`: Emergency override; keeps insecure HTTP API URLs allowed in production. Keep `false` unless absolutely required.

## Recommended Next Backend Checks

- Confirm JWT claims include `roles` (array) or `role` (string).
- Ensure CORS policy allows only trusted origins.
- Ensure API rate limiting is enabled and returns `429` with `Retry-After`.
- Ensure token expiration and refresh endpoints are active.
- Ensure at-rest encryption and backup encryption are documented.
