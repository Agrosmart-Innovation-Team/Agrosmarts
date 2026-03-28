import { Link } from "react-router-dom";
import useSignupForm, { ROLE_OPTIONS } from "../features/auth/useSignupForm";

export default function Signup() {
  const {
    fullName,
    setFullName,
    email,
    setEmail,
    phone,
    setPhone,
    role,
    setRole,
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    showPassword,
    setShowPassword,
    showConfirmPassword,
    setShowConfirmPassword,
    isSubmitting,
    errorMessage,
    handleSubmit,
  } = useSignupForm();

  return (
    <div className="min-h-screen bg-background-light px-4 py-10 text-gray-900 dark:bg-background-dark dark:text-white">
      <div className="mx-auto w-full max-w-md rounded-3xl border border-primary/10 bg-white p-6 shadow-sm dark:bg-background-dark/70">
        <div className="mb-6">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
            AgroSmart Access
          </p>
          <h1 className="mt-2 text-3xl font-bold">Create account</h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Register as a farmer or agronomist to save your farm profile and
            access protected tools.
          </p>
        </div>

        {errorMessage && (
          <p className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300">
            {errorMessage}
          </p>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label
              htmlFor="signup-full-name"
              className="mb-2 block text-sm font-semibold"
            >
              Full name
            </label>
            <input
              id="signup-full-name"
              name="full_name"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              className="w-full rounded-2xl border border-primary/15 bg-background-light px-4 py-3 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 dark:bg-background-dark"
              placeholder="Ada Farmer"
              type="text"
              autoComplete="name"
            />
          </div>

          <div>
            <label
              htmlFor="signup-email"
              className="mb-2 block text-sm font-semibold"
            >
              Email
            </label>
            <input
              id="signup-email"
              name="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-2xl border border-primary/15 bg-background-light px-4 py-3 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 dark:bg-background-dark"
              placeholder="farmer@example.com"
              type="email"
              autoComplete="email"
            />
          </div>

          <div>
            <label
              htmlFor="signup-phone"
              className="mb-2 block text-sm font-semibold"
            >
              Phone
            </label>
            <input
              id="signup-phone"
              name="phone"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              className="w-full rounded-2xl border border-primary/15 bg-background-light px-4 py-3 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 dark:bg-background-dark"
              placeholder="08000000000"
              type="tel"
              autoComplete="tel"
            />
          </div>

          <div>
            <label
              htmlFor="signup-role"
              className="mb-2 block text-sm font-semibold"
            >
              Role
            </label>
            <select
              id="signup-role"
              name="role"
              value={role}
              onChange={(event) => setRole(event.target.value)}
              className="w-full rounded-2xl border border-primary/15 bg-background-light px-4 py-3 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 dark:bg-background-dark"
            >
              {ROLE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option.charAt(0).toUpperCase() + option.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="signup-password"
              className="mb-2 block text-sm font-semibold"
            >
              Password
            </label>
            <div className="relative">
              <input
                id="signup-password"
                name="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-2xl border border-primary/15 bg-background-light px-4 py-3 pr-14 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 dark:bg-background-dark"
                placeholder="Create password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
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
          </div>

          <div>
            <label
              htmlFor="signup-confirm-password"
              className="mb-2 block text-sm font-semibold"
            >
              Confirm password
            </label>
            <div className="relative">
              <input
                id="signup-confirm-password"
                name="confirm_password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="w-full rounded-2xl border border-primary/15 bg-background-light px-4 py-3 pr-14 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 dark:bg-background-dark"
                placeholder="Confirm password"
                type={showConfirmPassword ? "text" : "password"}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((current) => !current)}
                aria-label={
                  showConfirmPassword ?
                    "Hide confirm password"
                  : "Show confirm password"
                }
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-primary hover:bg-primary/10"
              >
                <span className="material-symbols-outlined text-base leading-none">
                  {showConfirmPassword ? "visibility_off" : "visibility"}
                </span>
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-2xl bg-primary px-4 py-3 font-bold text-gray-900 transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
          Already have an account?{" "}
          <Link className="font-semibold text-primary" to="/login">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
