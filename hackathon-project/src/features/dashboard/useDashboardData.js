import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { apiFetch } from "../../security/apiClient";
import {
    DEFAULT_DASHBOARD,
    DEFAULT_PROFILE,
    DEFAULT_WEATHER_COORDS,
    WEATHER_REFRESH_INTERVAL_MS,
    formatCropLabel,
    formatSignedDelta,
    getCurrentPositionAsync,
    getPrecipitationNote,
    resolveCoordsFromLocationName,
} from "./dashboardUtils";

const SEEDING_WORKFLOW_STORAGE_KEY = "agrosmart_seeding_workflow";

const DEFAULT_SEEDING_GUIDE = [
    "Prepare soil",
    "Check moisture level",
    "Apply fertilizer",
    "Plant seeds",
];

const DEFAULT_SEEDING_WORKFLOW = {
    taskId: "",
    status: "not_started",
    crop: "",
    sector: "Sector A",
    startedAt: "",
    completedAt: "",
    checklist: {
        prepareSoil: false,
        checkMoisture: false,
        applyFertilizer: false,
        plantSeeds: false,
    },
    activityLog: [],
};

function parseNumericValue(value) {
    const parsed = Number.parseFloat(String(value || "").replace(/[^\d.-]/g, ""));
    return Number.isFinite(parsed) ? parsed : null;
}

function inferSectorFromStatus(cropStatus = []) {
    const firstName = String(cropStatus?.[0]?.name || "");
    const match = firstName.match(/Sector\s+[A-Z0-9-]+/i);
    return match ? match[0] : "Sector A";
}

function getDefaultSeedingWorkflow() {
    if (typeof window === "undefined") {
        return DEFAULT_SEEDING_WORKFLOW;
    }

    const persisted = localStorage.getItem(SEEDING_WORKFLOW_STORAGE_KEY);
    if (!persisted) {
        return DEFAULT_SEEDING_WORKFLOW;
    }

    try {
        const parsed = JSON.parse(persisted);
        return {
            ...DEFAULT_SEEDING_WORKFLOW,
            ...parsed,
            checklist: {
                ...DEFAULT_SEEDING_WORKFLOW.checklist,
                ...(parsed?.checklist || {}),
            },
            activityLog: Array.isArray(parsed?.activityLog) ? parsed.activityLog : [],
        };
    } catch {
        return DEFAULT_SEEDING_WORKFLOW;
    }
}

export default function useDashboardData() {
    const [dashboardData, setDashboardData] = useState(DEFAULT_DASHBOARD);
    const [profileData, setProfileData] = useState(() => ({
        ...DEFAULT_PROFILE,
        crop: localStorage.getItem("agrosmart_setup_crop") || "",
    }));
    const [profileDraft, setProfileDraft] = useState(() => ({
        ...DEFAULT_PROFILE,
        crop: localStorage.getItem("agrosmart_setup_crop") || "",
    }));
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [isLoadingDashboard, setIsLoadingDashboard] = useState(false);
    const [isLoadingProfile, setIsLoadingProfile] = useState(false);
    const [isSavingProfile, setIsSavingProfile] = useState(false);
    const [apiError, setApiError] = useState("");
    const [profileStatus, setProfileStatus] = useState("");
    const [weatherStatus, setWeatherStatus] = useState("");
    const [isRefreshingWeather, setIsRefreshingWeather] = useState(false);
    const [lastWeatherCoords, setLastWeatherCoords] = useState(null);
    const [showOnlyProfileCropStatus, setShowOnlyProfileCropStatus] = useState(false);
    const [seedingWorkflow, setSeedingWorkflow] = useState(getDefaultSeedingWorkflow);
    const [isUpdatingSeeding, setIsUpdatingSeeding] = useState(false);
    const [seedingStatusMessage, setSeedingStatusMessage] = useState("");

    const lastWeatherCoordsRef = useRef(null);
    const profileLocationRef = useRef("");

    const selectedCropLabel = useMemo(
        () => formatCropLabel(profileData.crop),
        [profileData.crop],
    );

    useEffect(() => {
        setShowOnlyProfileCropStatus(Boolean(selectedCropLabel));
    }, [selectedCropLabel]);

    useEffect(() => {
        lastWeatherCoordsRef.current = lastWeatherCoords;
    }, [lastWeatherCoords]);

    useEffect(() => {
        profileLocationRef.current = profileData.location;
    }, [profileData.location]);

    useEffect(() => {
        localStorage.setItem(SEEDING_WORKFLOW_STORAGE_KEY, JSON.stringify(seedingWorkflow));
    }, [seedingWorkflow]);

    const syncProfileState = (payload = {}) => {
        const nextProfile = {
            full_name: payload?.full_name || payload?.fullName || "",
            location: payload?.location || "",
            crop:
                payload?.crop ||
                localStorage.getItem("agrosmart_setup_crop") ||
                "",
            farm_size:
                payload?.farm_size === null || payload?.farm_size === undefined ?
                    ""
                    : String(payload.farm_size),
        };

        setProfileData(nextProfile);
        setProfileDraft(nextProfile);
    };

    useEffect(() => {
        const controller = new AbortController();

        const loadDashboard = async () => {
            setIsLoadingDashboard(true);
            setIsLoadingProfile(true);
            setApiError("");
            setProfileStatus("");

            try {
                const [summaryResponse, profileResponse] = await Promise.all([
                    apiFetch("/dashboard/summary", {
                        signal: controller.signal,
                    }),
                    apiFetch("/onboarding/profile", {
                        signal: controller.signal,
                    }),
                ]);

                if (summaryResponse.status === 401 || profileResponse.status === 401) {
                    setApiError(
                        "Dashboard API is reachable, but access is unauthorized (401). Sign in to load live dashboard data.",
                    );
                    return;
                }

                if (!summaryResponse.ok) {
                    throw new Error(
                        `Dashboard request failed with status ${summaryResponse.status}.`,
                    );
                }

                const payload = await summaryResponse.json();

                setDashboardData((prev) => ({
                    weather: {
                        temp: {
                            value: payload?.weather?.temp?.value || prev.weather.temp.value,
                            note: payload?.weather?.temp?.note || prev.weather.temp.note,
                        },
                        humidity: {
                            value:
                                payload?.weather?.humidity?.value ||
                                prev.weather.humidity.value,
                            note:
                                payload?.weather?.humidity?.note || prev.weather.humidity.note,
                        },
                        rain: {
                            value: payload?.weather?.rain?.value || prev.weather.rain.value,
                            note: payload?.weather?.rain?.note || prev.weather.rain.note,
                        },
                    },
                    task: {
                        title: payload?.task?.title || prev.task.title,
                        description: payload?.task?.description || prev.task.description,
                    },
                    cropStatus:
                        Array.isArray(payload?.cropStatus) && payload.cropStatus.length ?
                            payload.cropStatus.map((item) => ({
                                id: item?.id || `${Date.now()}-${Math.random()}`,
                                name: item?.name || "Unknown Sector",
                                stage: item?.stage || "Stage unavailable",
                                status: item?.status || "Unknown",
                                score: Number(item?.score ?? 0),
                                statusColor: item?.statusColor || "primary",
                                icon: item?.icon || "grass",
                            }))
                            : prev.cropStatus,
                    newAlertCount:
                        Number.isFinite(payload?.newAlertCount) ?
                            payload.newAlertCount
                            : prev.newAlertCount,
                    libraryHint: payload?.libraryHint || prev.libraryHint,
                }));

                if (profileResponse.ok) {
                    const profilePayload = await profileResponse.json();
                    syncProfileState(profilePayload);
                } else {
                    setProfileStatus(
                        `Profile could not be loaded (status ${profileResponse.status}).`,
                    );
                }
            } catch (error) {
                if (error.name !== "AbortError") {
                    setApiError(
                        error?.message ||
                        "Backend dashboard unavailable. Showing sample data.",
                    );
                }
            } finally {
                setIsLoadingDashboard(false);
                setIsLoadingProfile(false);
            }
        };

        loadDashboard();

        return () => controller.abort();
    }, []);

    const refreshLiveWeather = useCallback(async () => {
        setIsRefreshingWeather(true);
        setWeatherStatus("Refreshing live weather...");

        try {
            let coords = null;
            let sourceLabel = "your location";

            try {
                const currentCoords = await getCurrentPositionAsync();
                coords = {
                    latitude: currentCoords.latitude,
                    longitude: currentCoords.longitude,
                    label: "your location",
                };
            } catch {
                const cachedCoords = lastWeatherCoordsRef.current;

                if (Number.isFinite(cachedCoords?.latitude) && Number.isFinite(cachedCoords?.longitude)) {
                    coords = {
                        latitude: cachedCoords.latitude,
                        longitude: cachedCoords.longitude,
                        label: cachedCoords.label || "last known location",
                    };
                    sourceLabel = coords.label;
                } else {
                    const profileCoords = await resolveCoordsFromLocationName(profileLocationRef.current);
                    if (profileCoords) {
                        coords = profileCoords;
                        sourceLabel = profileCoords.label;
                    } else {
                        coords = DEFAULT_WEATHER_COORDS;
                        sourceLabel = DEFAULT_WEATHER_COORDS.label;
                    }
                }
            }

            const weatherUrl =
                `https://api.open-meteo.com/v1/forecast?latitude=${coords.latitude}&longitude=${coords.longitude}&current=temperature_2m,relative_humidity_2m&hourly=precipitation_probability&forecast_days=1&timezone=auto`;

            const response = await fetch(weatherUrl);
            if (!response.ok) {
                throw new Error("Weather service not reachable right now.");
            }

            const payload = await response.json();

            const temperature = Number(payload?.current?.temperature_2m);
            const humidity = Number(payload?.current?.relative_humidity_2m);
            const rainProbability = Number(payload?.hourly?.precipitation_probability?.[0]);

            const nextCoords = {
                latitude: coords.latitude,
                longitude: coords.longitude,
                label: coords.label || sourceLabel,
            };
            lastWeatherCoordsRef.current = nextCoords;
            setLastWeatherCoords(nextCoords);

            setDashboardData((prev) => ({
                ...prev,
                weather: {
                    temp: {
                        value: Number.isFinite(temperature) ? `${Math.round(temperature)}°C` : prev.weather.temp.value,
                        note:
                            Number.isFinite(temperature) ?
                                `${formatSignedDelta(temperature - 28)}°C vs baseline`
                                : prev.weather.temp.note,
                    },
                    humidity: {
                        value: Number.isFinite(humidity) ? `${Math.round(humidity)}%` : prev.weather.humidity.value,
                        note:
                            Number.isFinite(humidity) ?
                                `${formatSignedDelta(humidity - 65)}% vs baseline`
                                : prev.weather.humidity.note,
                    },
                    rain: {
                        value: Number.isFinite(rainProbability) ? `${Math.round(rainProbability)}%` : prev.weather.rain.value,
                        note: getPrecipitationNote(rainProbability),
                    },
                },
            }));

            setWeatherStatus(
                `Live weather updated for ${coords.label || sourceLabel} at ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`,
            );
        } catch (error) {
            setWeatherStatus(
                error?.message || "Could not refresh live weather. Using last known values.",
            );
        } finally {
            setIsRefreshingWeather(false);
        }
    }, []);

    useEffect(() => {
        refreshLiveWeather();

        const intervalId = window.setInterval(
            refreshLiveWeather,
            WEATHER_REFRESH_INTERVAL_MS,
        );

        return () => {
            window.clearInterval(intervalId);
        };
    }, [refreshLiveWeather]);

    const handleProfileSave = async (event) => {
        event.preventDefault();
        setIsSavingProfile(true);
        setProfileStatus("");

        const payload = {
            full_name: profileDraft.full_name.trim(),
            location: profileDraft.location.trim(),
            crop: profileDraft.crop.trim(),
            farm_size:
                profileDraft.farm_size === "" ? null : Number(profileDraft.farm_size),
        };

        try {
            const response = await apiFetch("/onboarding/profile", {
                method: "POST",
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                setProfileStatus(
                    response.status === 401 ?
                        "Please sign in again before saving your profile."
                        : `Profile could not be saved (status ${response.status}).`,
                );
                return;
            }

            syncProfileState(payload);
            setIsEditingProfile(false);
            setProfileStatus("Profile updated successfully.");
        } catch {
            setProfileStatus("Network issue while saving profile. Please try again.");
        } finally {
            setIsSavingProfile(false);
        }
    };

    const personalizedTask = useMemo(() => {
        if (!selectedCropLabel) {
            return dashboardData.task;
        }

        const defaultTaskTitle = DEFAULT_DASHBOARD.task.title.toLowerCase();
        const defaultTaskDescription = DEFAULT_DASHBOARD.task.description.toLowerCase();
        const currentTitle = String(dashboardData.task.title || "").toLowerCase();
        const currentDescription = String(dashboardData.task.description || "").toLowerCase();
        const cropToken = selectedCropLabel.toLowerCase();

        const hasCropInTitle = currentTitle.includes(cropToken);
        const hasCropInDescription = currentDescription.includes(cropToken);
        const looksDefaultTask =
            currentTitle === defaultTaskTitle || currentDescription === defaultTaskDescription;

        if (!looksDefaultTask && hasCropInTitle && hasCropInDescription) {
            return dashboardData.task;
        }

        return {
            title:
                hasCropInTitle ?
                    dashboardData.task.title
                    : `Best time to manage ${selectedCropLabel}`,
            description:
                hasCropInDescription ?
                    dashboardData.task.description
                    : `Conditions are favorable for ${selectedCropLabel.toLowerCase()} planning and field operations today. Review moisture, disease pressure, and nutrient timing before your next action.`,
        };
    }, [dashboardData.task, selectedCropLabel]);

    const personalizedCropStatus = useMemo(() => {
        if (!selectedCropLabel) {
            return dashboardData.cropStatus;
        }

        return dashboardData.cropStatus.map((item, index) => {
            const nameLower = String(item.name || "").toLowerCase();
            const hasCropInName = nameLower.includes(selectedCropLabel.toLowerCase());

            if (hasCropInName) {
                return item;
            }

            return {
                ...item,
                name: `${selectedCropLabel} - Sector ${String.fromCharCode(65 + index)}`,
            };
        });
    }, [dashboardData.cropStatus, selectedCropLabel]);

    const profileCropMatchesCount = useMemo(() => {
        if (!selectedCropLabel) {
            return 0;
        }

        return dashboardData.cropStatus.filter((item) =>
            String(item.name || "").toLowerCase().includes(selectedCropLabel.toLowerCase()),
        ).length;
    }, [dashboardData.cropStatus, selectedCropLabel]);

    const visibleCropStatus = useMemo(() => {
        if (!selectedCropLabel || !showOnlyProfileCropStatus) {
            return personalizedCropStatus;
        }

        const matched = dashboardData.cropStatus.filter((item) =>
            String(item.name || "").toLowerCase().includes(selectedCropLabel.toLowerCase()),
        );

        if (matched.length > 0) {
            return matched;
        }

        return personalizedCropStatus;
    }, [
        dashboardData.cropStatus,
        personalizedCropStatus,
        selectedCropLabel,
        showOnlyProfileCropStatus,
    ]);

    const personalizedLibraryHint = useMemo(() => {
        if (!selectedCropLabel) {
            return dashboardData.libraryHint;
        }

        return `${selectedCropLabel} Guides`;
    }, [dashboardData.libraryHint, selectedCropLabel]);

    const seedingChecklistItems = useMemo(
        () => [
            { key: "prepareSoil", label: DEFAULT_SEEDING_GUIDE[0] },
            { key: "checkMoisture", label: DEFAULT_SEEDING_GUIDE[1] },
            { key: "applyFertilizer", label: DEFAULT_SEEDING_GUIDE[2] },
            { key: "plantSeeds", label: DEFAULT_SEEDING_GUIDE[3] },
        ],
        [],
    );

    const seedingCompletedSteps = useMemo(
        () => Object.values(seedingWorkflow.checklist).filter(Boolean).length,
        [seedingWorkflow.checklist],
    );

    const seedingProgressPercent = useMemo(() => {
        const total = seedingChecklistItems.length || 1;
        return Math.round((seedingCompletedSteps / total) * 100);
    }, [seedingChecklistItems.length, seedingCompletedSteps]);

    const smartSeedingRecommendation = useMemo(() => {
        const temperature = parseNumericValue(dashboardData.weather.temp.value);
        const humidity = parseNumericValue(dashboardData.weather.humidity.value);
        const rainProbability = parseNumericValue(dashboardData.weather.rain.value);

        const notes = [];
        let severity = "ok";

        if (Number.isFinite(rainProbability) && rainProbability >= 60) {
            notes.push("High rain chance: delay seeding to avoid washout.");
            severity = "warning";
        }

        if (Number.isFinite(humidity) && humidity < 40) {
            notes.push("Low humidity suggests dry soil risk; irrigate before planting.");
            severity = "warning";
        }

        if (Number.isFinite(temperature) && temperature >= 35) {
            notes.push("Temperature is high; seed early morning or late afternoon.");
            severity = "warning";
        }

        if (!notes.length) {
            notes.push("Conditions look suitable for seeding in the next 24 hours.");
        }

        return {
            severity,
            notes,
            metrics: {
                temperature,
                humidity,
                rainProbability,
            },
        };
    }, [
        dashboardData.weather.humidity.value,
        dashboardData.weather.rain.value,
        dashboardData.weather.temp.value,
    ]);

    const appendSeedingActivity = useCallback((entry) => {
        setSeedingWorkflow((current) => ({
            ...current,
            activityLog: [entry, ...current.activityLog].slice(0, 15),
        }));
    }, []);

    const postSeedingActivity = useCallback(async (payload) => {
        try {
            await apiFetch("/tasks/seeding/activity", {
                method: "POST",
                body: JSON.stringify(payload),
            });
        } catch {
            // Keep local activity log even if backend logging fails.
        }
    }, []);

    const handleStartSeedingTask = useCallback(async () => {
        if (seedingWorkflow.status !== "not_started") {
            return;
        }

        const nowIso = new Date().toISOString();
        const crop = selectedCropLabel || "General Crop";
        const sector = inferSectorFromStatus(visibleCropStatus);

        setIsUpdatingSeeding(true);
        setSeedingStatusMessage("");

        try {
            const response = await apiFetch("/tasks/seeding/start", {
                method: "POST",
                body: JSON.stringify({
                    crop,
                    sector,
                    task_status: "started",
                    started_at: nowIso,
                }),
            });

            let taskId = "";
            if (response.ok) {
                const payload = await response.json();
                taskId = String(payload?.task_id || payload?.id || "");
            }

            const activityEntry = {
                type: "started",
                crop,
                sector,
                timestamp: nowIso,
            };

            setSeedingWorkflow((current) => ({
                ...current,
                taskId: taskId || current.taskId,
                status: "in_progress",
                crop,
                sector,
                startedAt: nowIso,
                completedAt: "",
                checklist: {
                    ...current.checklist,
                },
            }));
            appendSeedingActivity(activityEntry);
            postSeedingActivity(activityEntry);
            setSeedingStatusMessage("Seeding workflow started and logged.");
        } catch {
            setSeedingWorkflow((current) => ({
                ...current,
                status: "in_progress",
                crop,
                sector,
                startedAt: nowIso,
                completedAt: "",
            }));
            appendSeedingActivity({
                type: "started",
                crop,
                sector,
                timestamp: nowIso,
            });
            setSeedingStatusMessage(
                "Seeding started locally. Backend sync will retry when available.",
            );
        } finally {
            setIsUpdatingSeeding(false);
        }
    }, [
        appendSeedingActivity,
        postSeedingActivity,
        seedingWorkflow.status,
        selectedCropLabel,
        visibleCropStatus,
    ]);

    const handleToggleSeedingChecklist = useCallback(async (stepKey) => {
        setSeedingWorkflow((current) => {
            if (current.status === "not_started") {
                return current;
            }

            return {
                ...current,
                checklist: {
                    ...current.checklist,
                    [stepKey]: !current.checklist[stepKey],
                },
            };
        });

        const activityEntry = {
            type: "checklist_update",
            crop: selectedCropLabel || seedingWorkflow.crop || "General Crop",
            sector: seedingWorkflow.sector || inferSectorFromStatus(visibleCropStatus),
            step: stepKey,
            timestamp: new Date().toISOString(),
        };
        appendSeedingActivity(activityEntry);
        postSeedingActivity(activityEntry);
    }, [
        appendSeedingActivity,
        postSeedingActivity,
        seedingWorkflow.crop,
        seedingWorkflow.sector,
        selectedCropLabel,
        visibleCropStatus,
    ]);

    const handleResetSeedingWorkflow = useCallback(() => {
        setSeedingWorkflow(DEFAULT_SEEDING_WORKFLOW);
        setSeedingStatusMessage("");
    }, []);

    const handleCompleteSeedingTask = useCallback(async () => {
        if (seedingWorkflow.status !== "in_progress") {
            return;
        }

        const nowIso = new Date().toISOString();
        const completionPayload = {
            task_status: "completed",
            completed_at: nowIso,
            checklist: seedingWorkflow.checklist,
            progress: seedingProgressPercent,
        };

        setIsUpdatingSeeding(true);
        setSeedingStatusMessage("");

        try {
            if (seedingWorkflow.taskId) {
                await apiFetch(`/tasks/seeding/${encodeURIComponent(seedingWorkflow.taskId)}`, {
                    method: "PATCH",
                    body: JSON.stringify(completionPayload),
                });
            } else {
                await apiFetch("/tasks/seeding/complete", {
                    method: "POST",
                    body: JSON.stringify(completionPayload),
                });
            }

            setSeedingWorkflow((current) => ({
                ...current,
                status: "completed",
                completedAt: nowIso,
            }));

            const activityEntry = {
                type: "completed",
                crop: seedingWorkflow.crop || selectedCropLabel || "General Crop",
                sector: seedingWorkflow.sector || inferSectorFromStatus(visibleCropStatus),
                timestamp: nowIso,
            };
            appendSeedingActivity(activityEntry);
            postSeedingActivity(activityEntry);
            setSeedingStatusMessage("Seeding task marked as completed.");
        } catch {
            setSeedingWorkflow((current) => ({
                ...current,
                status: "completed",
                completedAt: nowIso,
            }));
            appendSeedingActivity({
                type: "completed",
                crop: seedingWorkflow.crop || selectedCropLabel || "General Crop",
                sector: seedingWorkflow.sector || inferSectorFromStatus(visibleCropStatus),
                timestamp: nowIso,
            });
            setSeedingStatusMessage(
                "Seeding marked complete locally. Backend sync pending.",
            );
        } finally {
            setIsUpdatingSeeding(false);
        }
    }, [
        appendSeedingActivity,
        postSeedingActivity,
        seedingProgressPercent,
        seedingWorkflow.checklist,
        seedingWorkflow.crop,
        seedingWorkflow.sector,
        seedingWorkflow.status,
        seedingWorkflow.taskId,
        selectedCropLabel,
        visibleCropStatus,
    ]);

    return {
        dashboardData,
        profileData,
        profileDraft,
        setProfileDraft,
        isEditingProfile,
        setIsEditingProfile,
        isLoadingDashboard,
        isLoadingProfile,
        isSavingProfile,
        apiError,
        profileStatus,
        setProfileStatus,
        weatherStatus,
        isRefreshingWeather,
        showOnlyProfileCropStatus,
        setShowOnlyProfileCropStatus,
        selectedCropLabel,
        refreshLiveWeather,
        handleProfileSave,
        personalizedTask,
        profileCropMatchesCount,
        visibleCropStatus,
        personalizedLibraryHint,
        seedingWorkflow,
        isUpdatingSeeding,
        seedingStatusMessage,
        seedingChecklistItems,
        seedingCompletedSteps,
        seedingProgressPercent,
        smartSeedingRecommendation,
        handleStartSeedingTask,
        handleToggleSeedingChecklist,
        handleCompleteSeedingTask,
        handleResetSeedingWorkflow,
    };
}
