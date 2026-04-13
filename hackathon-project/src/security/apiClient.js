import {
    clearAuthSession,
    getAccessToken,
    getRefreshToken,
    isJwtExpired,
    setAuthSession,
} from "./auth";

const DEFAULT_LOCAL_API_BASE_URL = "http://127.0.0.1:8000/api";
const DEFAULT_PROD_API_BASE_URL = "https://hackathon-project-production-05d6.up.railway.app/api";

const API_BASE_URL = (
    import.meta.env.VITE_API_BASE_URL ||
    (import.meta.env.PROD ? DEFAULT_PROD_API_BASE_URL : DEFAULT_LOCAL_API_BASE_URL)
).replace(/\/$/, "");

const ALLOW_HTTP_IN_PROD = import.meta.env.VITE_ALLOW_HTTP_IN_PROD === "true";
const ENABLE_AUTH_GUARD = import.meta.env.VITE_ENABLE_AUTH_GUARD === "true";
const LOGIN_ENDPOINT = import.meta.env.VITE_AUTH_LOGIN_PATH || "/auth/token";
const SIGNUP_ENDPOINT = import.meta.env.VITE_AUTH_SIGNUP_PATH || "/auth/register";
const FORGOT_PASSWORD_ENDPOINT =
    import.meta.env.VITE_AUTH_FORGOT_PASSWORD_PATH || "/auth/forgot-password";
const RESET_PASSWORD_ENDPOINT =
    import.meta.env.VITE_AUTH_RESET_PASSWORD_PATH || "/auth/reset-password";

const REFRESH_ENDPOINT =
    import.meta.env.VITE_AUTH_REFRESH_PATH || "/auth/token/refresh";

export const AUTH_REQUIRED_EVENT = "agrosmart:auth-required";

let _refreshPromise = null;

function emitAuthRequired(details = {}) {
    window.dispatchEvent(new CustomEvent(AUTH_REQUIRED_EVENT, { detail: details }));
}

async function refreshAccessToken() {
    const refresh = getRefreshToken();
    if (!refresh) {
        return false;
    }

    // Deduplicate concurrent refresh attempts
    if (_refreshPromise) {
        return _refreshPromise;
    }

    _refreshPromise = (async () => {
        try {
            const response = await fetch(buildUrl(REFRESH_ENDPOINT), {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                },
                body: JSON.stringify({ refresh }),
            });

            if (!response.ok) {
                return false;
            }

            const data = await response.json();
            const newAccess = data.access || data.access_token || "";
            const newRefresh = data.refresh || data.refresh_token || "";

            if (!newAccess) {
                return false;
            }

            setAuthSession({
                accessToken: newAccess,
                refreshToken: newRefresh || refresh,
            });
            return true;
        } catch {
            return false;
        } finally {
            _refreshPromise = null;
        }
    })();

    return _refreshPromise;
}

function ensureSecureTransport() {
    if (
        import.meta.env.PROD &&
        API_BASE_URL.startsWith("http://") &&
        !ALLOW_HTTP_IN_PROD
    ) {
        throw new Error(
            "Blocked insecure API base URL in production. Use HTTPS or set VITE_ALLOW_HTTP_IN_PROD=true explicitly.",
        );
    }
}

function buildUrl(path) {
    if (path.startsWith("http://") || path.startsWith("https://")) {
        return path;
    }

    return `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export async function apiFetch(path, options = {}) {
    ensureSecureTransport();

    let token = getAccessToken();
    const headers = new Headers(options.headers || {});

    headers.set("Accept", "application/json");
    headers.set("X-Requested-With", "XMLHttpRequest");

    if (!headers.has("Content-Type") && options.body && !(options.body instanceof FormData)) {
        headers.set("Content-Type", "application/json");
    }

    // If access token is expired but we have a refresh token, refresh first
    if (token && isJwtExpired(token)) {
        const refreshed = await refreshAccessToken();
        token = refreshed ? getAccessToken() : "";
    }

    if (token && !isJwtExpired(token)) {
        headers.set("Authorization", `Bearer ${token}`);
    }

    const response = await fetch(buildUrl(path), {
        ...options,
        headers,
    });

    // On 401, try to refresh the token and retry once before giving up
    if (response.status === 401 && !options._retried) {
        const refreshed = await refreshAccessToken();
        if (refreshed) {
            return apiFetch(path, { ...options, _retried: true });
        }
        clearAuthSession();
        if (ENABLE_AUTH_GUARD) {
            emitAuthRequired({ path: buildUrl(path), status: response.status });
        }
    }

    if (response.status === 429) {
        const retryAfter = response.headers.get("Retry-After");
        throw new Error(
            retryAfter ?
                `Rate limit exceeded. Retry in ${retryAfter} seconds.`
                : "Rate limit exceeded. Please retry later.",
        );
    }

    return response;
}

export async function apiGetJson(path, options = {}) {
    const response = await apiFetch(path, options);

    if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
    }

    if (response.status === 204) {
        return null;
    }

    return response.json();
}

function normalizeAuthPayload(payload = {}) {
    const source = payload.data && typeof payload.data === "object" ? payload.data : payload;

    return {
        accessToken:
            source.accessToken ||
            source.access_token ||
            source.access ||
            source.auth_token ||
            source.jwt ||
            source.token ||
            "",
        refreshToken:
            source.refreshToken ||
            source.refresh_token ||
            source.refresh ||
            "",
        user: source.user || payload.user || null,
    };
}

async function getResponseMessage(response, fallbackMessage) {
    let payload = null;

    try {
        payload = await response.json();
    } catch {
        payload = null;
    }

    return (
        payload?.detail ||
        payload?.message ||
        payload?.error ||
        fallbackMessage
    );
}

export async function loginRequest(credentials) {
    const response = await apiFetch(LOGIN_ENDPOINT, {
        method: "POST",
        body: JSON.stringify(credentials),
    });

    if (!response.ok) {
        const message =
            response.status === 401 ?
                "Invalid email/phone or password."
                : response.status === 404 ?
                    "No account found for these details. Please sign up first."
                    : response.status >= 500 ?
                        "Backend auth service error. Please try again shortly."
                        : `Login failed with status ${response.status}.`;

        throw new Error(await getResponseMessage(response, message));
    }

    const payload = await response.json();
    return normalizeAuthPayload(payload);
}

export async function signupRequest(payload) {
    const response = await apiFetch(SIGNUP_ENDPOINT, {
        method: "POST",
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        const message =
            response.status === 400 ?
                "Signup details are invalid. Please check your inputs."
                : response.status === 409 ?
                    "An account with these details already exists. Please sign in."
                    : response.status >= 500 ?
                        "Backend signup service error. Your account was not created."
                        : `Signup failed with status ${response.status}.`;

        throw new Error(await getResponseMessage(response, message));
    }

    const responsePayload = await response.json();
    return normalizeAuthPayload(responsePayload);
}

export async function forgotPasswordRequest(payload) {
    const response = await apiFetch(FORGOT_PASSWORD_ENDPOINT, {
        method: "POST",
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        const message =
            response.status === 400
                ? "Password reset details are invalid."
                : response.status >= 500
                    ? "Backend password reset service error. Please try again shortly."
                    : `Password reset failed with status ${response.status}.`;

        throw new Error(await getResponseMessage(response, message));
    }

    return response.json();
}

export async function resetPasswordConfirm(payload) {
    const response = await apiFetch(RESET_PASSWORD_ENDPOINT, {
        method: "POST",
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        const message =
            response.status === 400
                ? await getResponseMessage(response, "Reset link is invalid or has expired.")
                : response.status >= 500
                    ? "Backend error. Please try again shortly."
                    : `Password reset failed with status ${response.status}.`;

        throw new Error(message);
    }

    return response.json();
}
