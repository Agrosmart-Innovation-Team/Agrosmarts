These are what have been built so far.

Home Page — A multi-step farm setup form where farmers can enter their name, detect their GPS location, select their crop type (Maize, Rice, Coffee, or Other), and input farm size. Includes an interactive map preview with a visible location marker.
Dashboard — Displays weather info, a daily farming task, crop status, and quick navigation links.
Alerts Page — Lists pest and disease alerts with severity indicators; "View Details" buttons navigate to the Support page.
Library Page — A knowledge base with farming guides organised by category.
Support Page — A chat interface connecting farmers to an agricultural officer.

Security integration added:

- Centralized API client with JWT bearer token support in `src/security/apiClient.js`.
- Auth token and JWT role utilities in `src/security/auth.js`.
- Optional RBAC route protection in `src/security/ProtectedRoute.jsx`.
- Security configuration template in `.env.example`.
- Backend/frontend security responsibility map in `SECURITY_IMPLEMENTATION.md`.

Environment flags:

- `VITE_API_BASE_URL`
- `VITE_ENABLE_AUTH_GUARD`
- `VITE_ALLOW_HTTP_IN_PROD`
