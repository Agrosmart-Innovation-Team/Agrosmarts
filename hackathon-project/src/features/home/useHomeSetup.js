import { useEffect, useMemo, useRef, useState } from "react";
import { apiFetch } from "../../security/apiClient";

const NOMINATIM_BASE_URL = "https://nominatim.openstreetmap.org";

const DEFAULT_CROP_OPTIONS = [
  { icon: "grass", label: "Maize" },
  { icon: "rice_bowl", label: "Rice" },
  { icon: "coffee", label: "Coffee" },
  { icon: "more_horiz", label: "Other" },
];

function buildExactAddress(address = {}, displayName = "") {
  // Try to build from detailed address parts first
  const parts = [];

  // Add street level detail
  const streetLine = [
    address.house_number,
    address.road || address.street || address.street_name,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();
  if (streetLine) {
    parts.push(streetLine);
  }

  // Add locality/area
  const area =
    address.residential ||
    address.estate ||
    address.hamlet ||
    address.suburb ||
    address.neighbourhood ||
    address.quarter ||
    address.district ||
    address.village ||
    address.town ||
    address.city ||
    address.county ||
    "";
  if (area) {
    parts.push(area);
  }

  // Add state and postcode if available
  if (address.state) {
    parts.push(address.state);
  }
  if (address.postcode) {
    parts.push(address.postcode);
  }

  // Add country if available
  if (address.country && address.country !== "Local") {
    parts.push(address.country);
  }

  const exact = parts.filter(Boolean).join(", ").trim();
  if (exact) {
    return exact;
  }

  // Fallback to display_name if no structured parts worked
  return String(displayName || "").trim();
}

async function resolveNearbyPlaceLabel(latitude, longitude) {
  const reverseUrl =
    `${NOMINATIM_BASE_URL}/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`;

  const [reverseResult] = await Promise.allSettled([
    fetch(reverseUrl, {
      headers: {
        Accept: "application/json",
      },
    }),
  ]);

  let address = {};
  let displayName = "";

  if (
    reverseResult.status === "fulfilled" &&
    reverseResult.value.ok
  ) {
    const reversePayload = await reverseResult.value.json();
    address = reversePayload?.address || {};
    displayName = reversePayload?.display_name || "";
  }

  const exactAddress = buildExactAddress(address, displayName);

  if (exactAddress) {
    return exactAddress;
  }

  return (
    displayName ||
    `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
  );
}

async function resolveCoordinatesFromText(query) {
  const normalized = String(query || "").trim();
  if (!normalized || normalized.length < 4) {
    return null;
  }

  const searchUrl =
    `${NOMINATIM_BASE_URL}/search?format=jsonv2&q=${encodeURIComponent(normalized)}&limit=1&addressdetails=1`;

  const response = await fetch(searchUrl, {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    return null;
  }

  const results = await response.json();
  const top = Array.isArray(results) ? results[0] : null;
  if (!top) {
    return null;
  }

  const latitude = Number(top.lat);
  const longitude = Number(top.lon);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }

  return { latitude, longitude };
}

function getCurrentPositionAsync(options = {}) {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      resolve,
      (error) => {
        const err = new Error(error?.message || "Geolocation error");
        err.code = error?.code;
        reject(err);
      },
      {
        enableHighAccuracy: options.enableHighAccuracy ?? true,
        timeout: options.timeout ?? 20000,
        maximumAge: options.maximumAge ?? 0,
      },
    );
  });
}

export default function useHomeSetup() {
  const totalSteps = 4;
  const [fullName, setFullName] = useState("");
  const [location, setLocation] = useState("");
  const [coordinates, setCoordinates] = useState(null);
  const [geoStatus, setGeoStatus] = useState("");
  const [selectedCrop, setSelectedCrop] = useState("");
  const [customCrop, setCustomCrop] = useState("");
  const [farmSize, setFarmSize] = useState("");
  const [cropOptions, setCropOptions] = useState(DEFAULT_CROP_OPTIONS);
  const [isLoadingSetup, setIsLoadingSetup] = useState(false);
  const [isSavingSetup, setIsSavingSetup] = useState(false);
  const [apiStatus, setApiStatus] = useState("");
  const cropImageMapRef = useRef({});

  const resetSetupForm = () => {
    setFullName("");
    setLocation("");
    setCoordinates(null);
    setGeoStatus("");
    setSelectedCrop("");
    setCustomCrop("");
    setFarmSize("");
  };

  useEffect(() => {
    const controller = new AbortController();

    const loadOnboarding = async () => {
      setIsLoadingSetup(true);
      setApiStatus("");

      try {
        const [cropsRes, profileRes] = await Promise.all([
          apiFetch("/onboarding/crops", {
            signal: controller.signal,
          }),
          apiFetch("/onboarding/profile", {
            signal: controller.signal,
          }),
        ]);

        let availableCropLabels = [];
        let availableCropOptions = [];
        if (cropsRes.ok) {
          const crops = await cropsRes.json();
          if (Array.isArray(crops) && crops.length) {
            const normalized = crops
              .map((crop) => {
                if (typeof crop === "string") {
                  return { label: crop, icon: "grass", image_url: null };
                }

                return {
                  label: crop?.label || "",
                  icon: crop?.icon || "grass",
                  image_url: crop?.image_url || null,
                };
              })
              .filter((crop) => crop.label);

            if (normalized.length) {
              const urlMap = {};
              normalized.forEach((crop) => {
                if (crop.image_url) urlMap[crop.label] = crop.image_url;
              });
              cropImageMapRef.current = urlMap;

              const hasOther = normalized.some(
                (crop) => crop.label.toLowerCase() === "other",
              );
              const nextOptions =
                hasOther ? normalized : (
                  [...normalized, { label: "Other", icon: "more_horiz" }]
                );
              setCropOptions(nextOptions);
              availableCropLabels = nextOptions.map((crop) => crop.label.toLowerCase());
              availableCropOptions = nextOptions.map((crop) => crop.label);
            }
          }
        }

        if (profileRes.ok) {
          const profile = await profileRes.json();
          const nextFullName = String(profile?.full_name || "").trim();
          const nextCrop = String(profile?.crop || "").trim();
          const nextFarmSize = profile?.farm_size;

          if (nextFullName) setFullName(nextFullName);
          if (Number.isFinite(Number(nextFarmSize)) && Number(nextFarmSize) > 0) {
            setFarmSize(String(nextFarmSize));
          }

          if (nextCrop) {
            if (availableCropLabels.includes(nextCrop.toLowerCase())) {
              setSelectedCrop(nextCrop);
              setCustomCrop("");
            } else {
              setSelectedCrop("Other");
              setCustomCrop(nextCrop);
            }
          }
        }

      } catch (error) {
        if (error.name !== "AbortError") {
          // Silently fall back to local crop defaults when backend is unavailable.
        }
      } finally {
        setIsLoadingSetup(false);
      }
    };

    loadOnboarding();

    return () => controller.abort();
  }, []);

  const hasCropSelection =
    selectedCrop === "Other" ?
      customCrop.trim().length > 0
      : selectedCrop.length > 0;

  useEffect(() => {
    const cropToSave =
      selectedCrop === "Other" ? customCrop.trim() : selectedCrop;
    if (cropToSave) {
      localStorage.setItem("agrosmart_setup_crop", cropToSave);
      const imageUrl = String(cropImageMapRef.current[selectedCrop] || "").trim();
      if (/^https?:\/\//i.test(imageUrl) || /^data:image\//i.test(imageUrl)) {
        localStorage.setItem("agrosmart_setup_crop_image", imageUrl);
      } else {
        localStorage.removeItem("agrosmart_setup_crop_image");
      }
    }
  }, [selectedCrop, customCrop]);

  useEffect(() => {
    const query = location.trim();
    if (!query) {
      return;
    }

    const coordinatePattern = /^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/;
    const coordinateMatch = query.match(coordinatePattern);
    if (coordinateMatch) {
      const latitude = Number(coordinateMatch[1]);
      const longitude = Number(coordinateMatch[2]);
      if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
        setCoordinates({ latitude, longitude });
      }
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const result = await resolveCoordinatesFromText(query);
        if (result) {
          setCoordinates(result);
        }
      } catch {
        // Keep the current map state if text geocoding fails.
      }
    }, 700);

    return () => clearTimeout(timer);
  }, [location]);

  const hasValidFarmSize = Number.isFinite(Number(farmSize)) && Number(farmSize) > 0;

  const completedSteps = useMemo(
    () =>
      [
        fullName.trim().length > 0,
        location.trim().length > 0,
        hasCropSelection,
        hasValidFarmSize,
      ].filter(Boolean).length,
    [fullName, location, hasCropSelection, hasValidFarmSize],
  );

  const isSetupComplete = completedSteps === totalSteps;
  const currentStep = Math.min(completedSteps + 1, totalSteps);
  const completionPercent = Math.round((completedSteps / totalSteps) * 100);

  const handleGeolocate = () => {
    if (!("geolocation" in navigator)) {
      setGeoStatus("Geolocation is not supported by this browser.");
      return;
    }
    setGeoStatus("Getting current location...");

    (async () => {
      try {
        let position;
        try {
          position = await getCurrentPositionAsync({
            enableHighAccuracy: true,
            timeout: 20000,
            maximumAge: 0,
          });
        } catch {
          // Fallback for devices/browsers that cannot quickly provide high-accuracy GPS.
          position = await getCurrentPositionAsync({
            enableHighAccuracy: false,
            timeout: 12000,
            maximumAge: 120000,
          });
        }

        const { latitude, longitude, accuracy } = position.coords;
        setCoordinates({ latitude, longitude });

        try {
          const placeLabel = await resolveNearbyPlaceLabel(latitude, longitude);
          setLocation(placeLabel);
          if (Number.isFinite(Number(accuracy)) && Number(accuracy) > 100) {
            setGeoStatus(
              `Location found (approx ±${Math.round(accuracy)}m). You can type your full address to refine the map.`,
            );
          } else {
            setGeoStatus("Location found and filled with your exact address.");
          }
        } catch {
          const formatted = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
          setLocation(formatted);
          setGeoStatus(
            "GPS found. Coordinates were filled because nearby place lookup was unavailable.",
          );
        }
      } catch (error) {
        switch (error.code) {
          case 1:
            setGeoStatus(
              "Geolocation permission denied. Allow location in your browser settings.",
            );
            break;
          case 2:
            setGeoStatus("Location information is unavailable. Try again.");
            break;
          case 3:
            setGeoStatus("Location request timed out. Retry.");
            break;
          default:
            setGeoStatus("Unable to retrieve location. Check browser settings.");
            break;
        }
      }
    })();
  };

  const handleAddAddress = async () => {
    if (!("geolocation" in navigator)) {
      setGeoStatus("Geolocation is not supported by this browser.");
      return;
    }

    setGeoStatus("Getting your current location...");

    try {
      const position = await getCurrentPositionAsync({
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 0,
      });
      const { latitude, longitude } = position.coords;
      setCoordinates({ latitude, longitude });

      setGeoStatus("Resolving address...");
      try {
        const placeLabel = await resolveNearbyPlaceLabel(latitude, longitude);
        if (placeLabel && placeLabel.trim()) {
          setLocation(placeLabel);
          setGeoStatus("Address added successfully.");
        } else {
          const fallback = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
          setLocation(fallback);
          setGeoStatus("Address coordinates added. You can refine the address manually.");
        }
      } catch {
        const fallback = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
        setLocation(fallback);
        setGeoStatus("Could not resolve full address. GPS coordinates added instead.");
      }
    } catch (error) {
      const errorCode = error?.code || error?.PERMISSION_DENIED;
      if (errorCode === 1 || error?.message?.includes("permission")) {
        setGeoStatus("Location permission denied. Please allow location access in your browser settings and try again.");
      } else if (errorCode === 2 || error?.message?.includes("unavailable")) {
        setGeoStatus("Location is currently unavailable. Please try again or type your address manually.");
      } else if (errorCode === 3 || error?.message?.includes("timeout")) {
        setGeoStatus("Location request timed out. Please try again or type your address manually.");
      } else {
        setGeoStatus("Could not get your location. Please type your address manually or try again.");
      }
    }
  };

  const handleSubmit = async (event, onSuccess) => {
    event.preventDefault();
    setApiStatus("");

    if (!isSetupComplete) {
      const missing = [];
      if (!fullName.trim()) missing.push("full name");
      if (!location.trim()) missing.push("location");
      if (!hasCropSelection) missing.push("crop type");
      if (!hasValidFarmSize) missing.push("farm size (must be greater than 0)");
      setApiStatus(`Please complete: ${missing.join(", ")}.`);
      return;
    }

    setIsSavingSetup(true);

    const payload = {
      full_name: fullName.trim(),
      location: location.trim(),
      crop:
        selectedCrop === "Other" ? customCrop.trim() : selectedCrop,
      farm_size: hasValidFarmSize ? Number(farmSize) : null,
    };

    try {
      const response = await apiFetch("/onboarding/profile", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        if (response.status === 401) {
          setApiStatus("Session expired. Please sign in again, then continue setup.");
        } else {
          let detail = "";
          try {
            const payload = await response.json();
            if (payload && typeof payload === "object") {
              detail =
                payload.detail ||
                payload.message ||
                Object.values(payload).flat().join(" ");
            }
          } catch {
            detail = "";
          }
          setApiStatus(
            detail ?
              `Profile could not be saved: ${detail}`
              : `Profile could not be saved (status ${response.status}).`,
          );
        }
        return;
      }

      localStorage.setItem("agrosmart_setup_complete", "1");
      resetSetupForm();
      if (typeof onSuccess === "function") {
        onSuccess();
      }
    } catch {
      setApiStatus("Network issue while saving profile. Please try again.");
    } finally {
      setIsSavingSetup(false);
    }
  };

  return {
    totalSteps,
    fullName,
    setFullName,
    location,
    setLocation,
    coordinates,
    geoStatus,
    selectedCrop,
    setSelectedCrop,
    customCrop,
    setCustomCrop,
    farmSize,
    setFarmSize,
    cropOptions,
    isLoadingSetup,
    isSavingSetup,
    apiStatus,
    currentStep,
    completionPercent,
    isSetupComplete,
    handleGeolocate,
    handleAddAddress,
    handleSubmit,
  };
}
