import { Link, useNavigate, useParams } from "react-router-dom";
import { useState } from "react";
import { resetPasswordConfirm } from "../security/apiClient";

export default function ResetPassword() {
  const { uidb64, token } = useParams();
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage("");

    if (newPassword !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await resetPasswordConfirm({
        uidb64,
        token,
        new_password: newPassword,
      });
      setSuccessMessage(response?.detail || "Password reset successfully.");
      setTimeout(() => navigate("/login", { replace: true }), 2000);
    } catch (error) {
      setErrorMessage(
        error?.message ||
          "Reset link is invalid or has expired. Please request a new one.",
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
          <h1 className="mt-2 text-3xl font-bold">Reset password</h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Choose a new password for your account.
          </p>
        </div>

        {errorMessage && (
          <p className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300">
            {errorMessage}
          </p>
        )}

        {successMessage ?
          <div className="rounded-2xl border border-primary/20 bg-primary/5 px-4 py-6 text-center">
            <p className="text-sm font-semibold text-primary">
              {successMessage}
            </p>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Redirecting to sign in…
            </p>
          </div>
        : <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label
                htmlFor="reset-new-password"
                className="mb-2 block text-sm font-semibold"
              >
                New password
              </label>
              <input
                id="reset-new-password"
                name="new_password"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full rounded-2xl border border-primary/15 bg-background-light px-4 py-3 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 dark:bg-background-dark"
                placeholder="At least 8 characters"
              />
            </div>

            <div>
              <label
                htmlFor="reset-confirm-password"
                className="mb-2 block text-sm font-semibold"
              >
                Confirm new password
              </label>
              <input
                id="reset-confirm-password"
                name="confirm_password"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-2xl border border-primary/15 bg-background-light px-4 py-3 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 dark:bg-background-dark"
                placeholder="Repeat your new password"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-2xl bg-primary px-4 py-3 font-bold text-gray-900 transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Resetting…" : "Reset password"}
            </button>
          </form>
        }

        {!successMessage && (
          <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
            <Link
              className="font-semibold text-primary hover:underline"
              to="/forgot-password"
            >
              Request a new reset link
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
