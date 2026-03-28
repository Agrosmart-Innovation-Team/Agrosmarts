import { useEffect, useState } from "react";
import { apiFetch } from "../../security/apiClient";
import {
    DEFAULT_CATEGORIES,
    DEFAULT_GUIDES,
    DEFAULT_NOTIFICATIONS,
} from "./constants";
import {
    normalizeCategories,
    normalizeGuides,
    normalizeNotifications,
} from "./utils";

export default function useLibraryContent() {
    const [notifications, setNotifications] = useState(DEFAULT_NOTIFICATIONS);
    const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
    const [guides, setGuides] = useState(DEFAULT_GUIDES);
    const [profileCrop, setProfileCrop] = useState(
        () => String(localStorage.getItem("agrosmart_setup_crop") || "").trim().toLowerCase(),
    );
    const [isLoadingContent, setIsLoadingContent] = useState(false);
    const [apiError, setApiError] = useState("");

    useEffect(() => {
        const controller = new AbortController();

        const loadLibraryContent = async () => {
            setIsLoadingContent(true);
            setApiError("");

            try {
                const [categoriesResult, guidesResult, notificationsResult, profileResult] = await Promise.allSettled([
                    apiFetch("/categories", { signal: controller.signal }),
                    apiFetch("/guides", { signal: controller.signal }),
                    apiFetch("/notifications", { signal: controller.signal }),
                    apiFetch("/onboarding/profile", { signal: controller.signal }),
                ]);

                let successfulSections = 0;
                let fallbackSections = 0;

                if (categoriesResult.status === "fulfilled" && categoriesResult.value.ok) {
                    const categoriesData = await categoriesResult.value.json();
                    setCategories(normalizeCategories(categoriesData));
                    successfulSections += 1;
                } else {
                    setCategories(DEFAULT_CATEGORIES);
                    fallbackSections += 1;
                }

                if (guidesResult.status === "fulfilled" && guidesResult.value.ok) {
                    const guidesData = await guidesResult.value.json();
                    setGuides(normalizeGuides(guidesData));
                    successfulSections += 1;
                } else {
                    setGuides(DEFAULT_GUIDES);
                    fallbackSections += 1;
                }

                if (
                    notificationsResult.status === "fulfilled" &&
                    notificationsResult.value.ok
                ) {
                    const notificationsData = await notificationsResult.value.json();
                    setNotifications(normalizeNotifications(notificationsData));
                    successfulSections += 1;
                } else {
                    setNotifications(DEFAULT_NOTIFICATIONS);
                    fallbackSections += 1;
                }

                if (profileResult.status === "fulfilled" && profileResult.value.ok) {
                    const profileData = await profileResult.value.json();
                    const resolvedCrop = String(
                        profileData?.crop || localStorage.getItem("agrosmart_setup_crop") || "",
                    )
                        .trim()
                        .toLowerCase();
                    setProfileCrop(resolvedCrop);
                } else {
                    setProfileCrop(
                        String(localStorage.getItem("agrosmart_setup_crop") || "")
                            .trim()
                            .toLowerCase(),
                    );
                }

                if (successfulSections === 0) {
                    setApiError("Live backend content is unavailable. Showing local sample content.");
                } else if (fallbackSections > 0) {
                    setApiError("Some library sections are using sample content while backend data syncs.");
                } else {
                    setApiError("");
                }
            } catch (error) {
                if (error.name !== "AbortError") {
                    setApiError("Could not reach backend API. Showing local sample content.");
                }
            } finally {
                setIsLoadingContent(false);
            }
        };

        loadLibraryContent();

        return () => controller.abort();
    }, []);

    return {
        notifications,
        categories,
        guides,
        profileCrop,
        isLoadingContent,
        apiError,
    };
}
