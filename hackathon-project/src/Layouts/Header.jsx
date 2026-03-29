import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  AUTH_STATE_CHANGE_EVENT,
  clearAuthSession,
  getAuthUser,
  isAuthenticated,
} from "../security/auth";

export default function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const [signedIn, setSignedIn] = useState(isAuthenticated());
  const [authUser, setAuthUser] = useState(getAuthUser());

  useEffect(() => {
    const syncAuthState = () => {
      setSignedIn(isAuthenticated());
      setAuthUser(getAuthUser());
    };

    window.addEventListener(AUTH_STATE_CHANGE_EVENT, syncAuthState);

    return () => {
      window.removeEventListener(AUTH_STATE_CHANGE_EVENT, syncAuthState);
    };
  }, []);

  const hideBackButton = ["/", "/login", "/signup"].includes(location.pathname);

  const PAGE_TITLES = {
    "/": "Farm Setup",
    "/dashboard": "AgroSmart",
    "/alerts": "Pest & Disease Alerts",
    "/library": "Farming Library",
    "/support": "Advisory Support",
  };
  const pageTitle = PAGE_TITLES[location.pathname] ?? "AgroSmart";

  return (
    <header className="w-full bg-background-light border-b border-primary/10 shadow-sm">
      <div className="relative max-w-7xl mx-auto px-4 py-4 flex items-center justify-center">
        {!hideBackButton && (
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="absolute left-4 flex items-center justify-center text-black"
            aria-label="Go back"
          >
            <span className="material-symbols-outlined text-2xl">
              arrow_back
            </span>
          </button>
        )}
        <span className="text-black text-xl font-bold tracking-wide">
          {pageTitle}
        </span>
        <div className="absolute right-4 flex items-center gap-2">
          {signedIn ?
            <>
              <span className="hidden text-xs font-semibold text-gray-500 sm:block">
                {authUser?.name || "Signed in"}
              </span>
              <button
                type="button"
                onClick={() => {
                  clearAuthSession();
                  navigate("/login");
                }}
                className="rounded-full border border-primary/20 px-3 py-1.5 text-xs font-semibold text-primary"
              >
                Logout
              </button>
            </>
          : location.pathname !== "/login" && (
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="rounded-full border border-primary/20 px-3 py-1.5 text-xs font-semibold text-primary"
              >
                Sign In
              </button>
            )
          }
        </div>
      </div>
    </header>
  );
}
