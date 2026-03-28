import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginRequest, signupRequest } from "../../security/apiClient";
import { setAuthSession } from "../../security/auth";

export const ROLE_OPTIONS = ["farmer", "agronomist"];

export default function useSignupForm() {
    const navigate = useNavigate();
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [role, setRole] = useState("farmer");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    const handleSubmit = async (event) => {
        event.preventDefault();
        setErrorMessage("");

        if (password !== confirmPassword) {
            setErrorMessage("Passwords do not match.");
            return;
        }

        setIsSubmitting(true);

        try {
            const signupPayload = await signupRequest({
                full_name: fullName,
                username: email || phone || fullName,
                email,
                phone,
                role,
                password,
            });

            let finalAuthPayload = signupPayload;

            if (!signupPayload.accessToken) {
                finalAuthPayload = await loginRequest({
                    email,
                    username: email || phone,
                    phone,
                    password,
                });
            }

            if (finalAuthPayload.accessToken) {
                setAuthSession(finalAuthPayload);
            }

            setErrorMessage("");

            navigate(finalAuthPayload.accessToken ? "/" : "/login", {
                replace: true,
            });
        } catch (error) {
            setErrorMessage(error?.message || "Unable to create account right now.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return {
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
    };
}
