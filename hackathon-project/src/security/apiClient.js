import {
    clearAuthSession,
    getAccessToken,
    isJwtExpired,
} from "./auth";

const DEFAULT_LOCAL_API_BASE_URL = "http://127.0.0.1:8000/api";
const DEFAULT_PROD_API_BASE_URL = "https://agrosmart-backend.onrender.com/api";

const API_BASE_URL = (
    import.meta.env.VITE_API_BASE_URL ||
    (import.meta.env.PROD ? DEFAULT_PROD_API_BASE_URL : DEFAULT_LOCAL_API_BASE_URL)
).replace(/\/$/, "");

const ALLOW_HTTP_IN_PROD = import.meta.env.VITE_ALLOW_HTTP_IN_PROD === "true";
const ENABLE_AUTH_GUARD = import.meta.env.VITE_ENABLE_AUTH_GUARD === "true";
const LOGIN_ENDPOINT = import.meta.env.VITE_AUTH_LOGIN_PATH || "/auth/token";
const SIGNUP_ENDPOINT = import.meta.env.VITE_AUTH_SIGNUP_PATH || "/auth/register";

export const AUTH_REQUIRED_EVENT = "agrosmart:auth-required";

function emitAuthRequired(details = {}) {
    window.dispatchEvent(new CustomEvent(AUTH_REQUIRED_EVENT, { detail: details }));
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

    const token = getAccessToken();
    const headers = new Headers(options.headers || {});

    headers.set("Accept", "application/json");
    headers.set("X-Requested-With", "XMLHttpRequest");

    if (!headers.has("Content-Type") && options.body && !(options.body instanceof FormData)) {
        headers.set("Content-Type", "application/json");
    }

    if (token && !isJwtExpired(token)) {
        headers.set("Authorization", `Bearer ${token}`);
    }

    const response = await fetch(buildUrl(path), {
        ...options,
        headers,
    });

    if (response.status === 401) {
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
