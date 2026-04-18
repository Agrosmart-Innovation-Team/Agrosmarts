import { Link } from "react-router-dom";
import useLoginForm from "../features/auth/useLoginForm";

export default function Login() {
  const {
    identifier,
    setIdentifier,
    password,
    setPassword,
    showPassword,
    setShowPassword,
    isSubmitting,
    errorMessage,
    authMessage,
    handleSubmit,
  } = useLoginForm();

  return (
    <div className="min-h-screen bg-background-light px-4 py-10 text-gray-900 dark:bg-background-dark dark:text-white">
      <div className="mx-auto w-full max-w-md rounded-3xl border border-primary/10 bg-white p-6 shadow-sm dark:bg-background-dark/70">
        <div className="mb-6">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
            AgroSmart Access
          </p>
          <h1 className="mt-2 text-3xl font-bold">Sign in</h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Use your account to access live dashboard data, alerts, guides, and
            support.
          </p>
        </div>

        {authMessage && (
          <p className="mb-4 rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-primary">
            {authMessage}
          </p>
        )}

        {errorMessage && (
          <p className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300">
            {errorMessage}
          </p>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label
              htmlFor="login-identifier"
              className="mb-2 block text-sm font-semibold"
            >
              Email or username
            </label>
            <input
              id="login-identifier"
              name="identifier"
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
              className="w-full rounded-2xl border border-primary/15 bg-background-light px-4 py-3 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 dark:bg-background-dark"
              placeholder="farmer@example.com"
              type="text"
              autoComplete="username"
            />
          </div>

          <div>
            <label
              htmlFor="login-password"
              className="mb-2 block text-sm font-semibold"
            >
              Password
            </label>
            <div className="relative">
              <input
                id="login-password"
                name="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-2xl border border-primary/15 bg-background-light px-4 py-3 pr-14 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 dark:bg-background-dark"
                placeholder="Enter password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-primary hover:bg-primary/10"
              >
                <span className="material-symbols-outlined text-base leading-none">
                  {showPassword ? "visibility_off" : "visibility"}
                </span>
              </button>
            </div>
            <div className="mt-2 text-right">
              <Link
                className="text-sm font-semibold text-primary"
                to="/forgot-password"
              >
                Forgot password?
              </Link>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-2xl bg-primary px-4 py-3 font-bold text-gray-900 transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
          Need an account?{" "}
          <Link className="font-semibold text-primary" to="/signup">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
