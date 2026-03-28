import { Navigate, useLocation } from "react-router-dom";
import { getAccessToken, getUserRoles, hasRequiredRole } from "./auth";

const ENABLE_AUTH_GUARD = import.meta.env.VITE_ENABLE_AUTH_GUARD !== "false";

export default function ProtectedRoute({ children, requiredRoles = [] }) {
  const location = useLocation();

  if (!ENABLE_AUTH_GUARD) {
    return children;
  }

  const token = getAccessToken();
  if (!token) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          authMessage: "Sign in required to access that page.",
          from: location.pathname,
        }}
      />
    );
  }

  const roles = getUserRoles();
  if (!hasRequiredRole(requiredRoles, roles)) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          authMessage: "You do not have permission for that page.",
          from: location.pathname,
        }}
      />
    );
  }

  return children;
}
