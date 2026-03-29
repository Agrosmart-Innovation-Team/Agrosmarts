import { Link } from "react-router-dom";
import { useState } from "react";
import { forgotPasswordRequest } from "../security/apiClient";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      await forgotPasswordRequest({ email: email.trim() });
      setSent(true);
    } catch (error) {
      setErrorMessage(
        error?.message ||
          "Unable to send reset email right now. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background-light px-4 py-10 text-gray-900 dark:bg-background-dark dark:text-white">
      <div className="mx-auto w-full max-w-md rounded-3xl border border-primary/10 bg-white p-6 shadow-sm dark:bg-background-dark/70">
        <div className="mb-6">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
            AgroSmart Access
          </p>
          <h1 className="mt-2 text-3xl font-bold">Forgot password</h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Enter your email address and we&apos;ll send you a reset link.
          </p>
        </div>

        {errorMessage && (
          <p className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300">
            {errorMessage}
          </p>
        )}

        {sent ?
          <div className="rounded-2xl border border-primary/20 bg-primary/5 px-4 py-6 text-center">
            <p className="text-sm font-semibold text-primary">
              Check your inbox!
            </p>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              If an account exists for <strong>{email}</strong>, a password
              reset link has been sent. Check your spam folder if you don&apos;t
              see it.
            </p>
            <Link
              to="/login"
              className="mt-4 inline-block text-sm font-semibold text-primary hover:underline"
            >
              Back to sign in
            </Link>
          </div>
        : <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label
                htmlFor="forgot-email"
                className="mb-2 block text-sm font-semibold"
              >
                Email address
              </label>
              <input
                id="forgot-email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-2xl border border-primary/15 bg-background-light px-4 py-3 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 dark:bg-background-dark"
                placeholder="you@example.com"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-2xl bg-primary px-4 py-3 font-bold text-gray-900 transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Sending..." : "Send reset link"}
            </button>
          </form>
        }

        {!sent && (
          <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
            Back to{" "}
            <Link className="font-semibold text-primary" to="/login">
              Sign in
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
