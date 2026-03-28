import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AUTH_REQUIRED_EVENT } from "./apiClient";

export default function AuthRedirectHandler() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthRequired = () => {
      if (location.pathname === "/login" || location.pathname === "/signup") {
        return;
      }

      navigate("/login", {
        replace: true,
        state: {
          authMessage:
            "Your session expired or you do not have access. Please sign in again.",
          from: location.pathname,
        },
      });
    };

    window.addEventListener(AUTH_REQUIRED_EVENT, handleAuthRequired);

    return () => {
      window.removeEventListener(AUTH_REQUIRED_EVENT, handleAuthRequired);
    };
  }, [location.pathname, navigate]);

  return null;
}
