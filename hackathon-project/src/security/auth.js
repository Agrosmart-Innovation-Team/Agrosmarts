const ACCESS_TOKEN_KEY = "agrosmart_access_token";
const REFRESH_TOKEN_KEY = "agrosmart_refresh_token";
export const AUTH_STATE_CHANGE_EVENT = "agrosmart:auth-state-change";

function emitAuthStateChange() {
  window.dispatchEvent(new CustomEvent(AUTH_STATE_CHANGE_EVENT));
}

function decodeBase64Url(value) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");

  return atob(padded);
}

function parseJwtPayload(token) {
  if (!token || typeof token !== "string") {
    return null;
  }

  const parts = token.split(".");
  if (parts.length < 2) {
    return null;
  }

  try {
    return JSON.parse(decodeBase64Url(parts[1]));
  } catch {
    return null;
  }
}

export function setAuthSession({ accessToken = "", refreshToken = "" } = {}) {
  if (accessToken) {
    sessionStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  }

  if (refreshToken) {
    sessionStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }

  emitAuthStateChange();
}

export function clearAuthSession() {
  sessionStorage.removeItem(ACCESS_TOKEN_KEY);
  sessionStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem("agrosmart_setup_complete");
  emitAuthStateChange();
}

export function getAccessToken() {
  return sessionStorage.getItem(ACCESS_TOKEN_KEY) || "";
}

export function getRefreshToken() {
  return sessionStorage.getItem(REFRESH_TOKEN_KEY) || "";
}

export function isJwtExpired(token) {
  const payload = parseJwtPayload(token);
  const exp = Number(payload?.exp || 0);

  if (!exp) {
    return false;
  }

  return Date.now() >= exp * 1000;
}

export function isAuthenticated() {
  const token = getAccessToken();

  return Boolean(token) && !isJwtExpired(token);
}

export function getAuthUser() {
  const token = getAccessToken();
  const payload = parseJwtPayload(token);

  if (!payload) {
    return null;
  }

  return {
    id: payload.sub || payload.user_id || payload.id || "",
    name: payload.name || payload.full_name || payload.username || payload.email || "Farmer",
    email: payload.email || "",
    roles: Array.isArray(payload.roles) ? payload.roles : payload.role ? [payload.role] : [],
  };
}

export function getUserRoles() {
  const token = getAccessToken();
  const payload = parseJwtPayload(token);

  if (!payload) {
    return [];
  }

  if (Array.isArray(payload.roles)) {
    return payload.roles.map((role) => String(role).toLowerCase());
  }

  if (payload.role) {
    return [String(payload.role).toLowerCase()];
  }

  return [];
}

export function hasRequiredRole(requiredRoles = [], userRoles = []) {
  if (!requiredRoles.length) {
    return true;
  }

  const normalizedUserRoles = userRoles.map((role) => String(role).toLowerCase());

  return requiredRoles.some((role) =>
    normalizedUserRoles.includes(String(role).toLowerCase()),
  );
}
