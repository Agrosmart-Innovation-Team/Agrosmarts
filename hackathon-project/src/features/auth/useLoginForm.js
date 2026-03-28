import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { loginRequest } from "../../security/apiClient";
import { setAuthSession } from "../../security/auth";

export default function useLoginForm() {
  const location = useLocation();
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const authMessage = location.state?.authMessage || "";

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const authPayload = await loginRequest({
        email: identifier,
        username: identifier,
        phone: identifier,
        password,
      });

      if (!authPayload.accessToken) {
        throw new Error("Login succeeded but no access token was returned.");
      }

      setAuthSession(authPayload);
      navigate("/", { replace: true });
    } catch (error) {
      setErrorMessage(error?.message || "Unable to sign in right now.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
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
  };
}
