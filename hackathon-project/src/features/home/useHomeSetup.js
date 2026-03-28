import { useEffect, useMemo, useRef, useState } from "react";
import { apiFetch } from "../../security/apiClient";

const NOMINATIM_BASE_URL = "https://nominatim.openstreetmap.org";
const OVERPASS_API_URL = "https://overpass-api.de/api/interpreter";

const DEFAULT_CROP_OPTIONS = [
  { icon: "grass", label: "Maize" },
  { icon: "rice_bowl", label: "Rice" },
  { icon: "coffee", label: "Coffee" },
  { icon: "more_horiz", label: "Other" },
];

function buildReadableLocation(address = {}, nearestStop = "") {
  const areaParts = [
    address.suburb,
    address.neighbourhood,
    address.village,
    address.town,
    address.city,
    address.county,
    address.state,
  ].filter(Boolean);

  const uniqueAreaParts = [...new Set(areaParts)];

  if (nearestStop && uniqueAreaParts.length) {
    return `Near ${nearestStop}, ${uniqueAreaParts.slice(0, 3).join(", ")}`;
  }

  if (nearestStop) {
    return `Near ${nearestStop}`;
  }

  const roadLabel = [address.road, address.suburb || address.neighbourhood]
    .filter(Boolean)
    .join(", ");

  if (roadLabel) {
    return roadLabel;
  }

  if (uniqueAreaParts.length) {
    return uniqueAreaParts.slice(0, 3).join(", ");
  }

  return "";
}

async function fetchNearestBusStop(latitude, longitude) {
  const query = `
    [out:json][timeout:10];
    (
      node(around:500,${latitude},${longitude})[highway=bus_stop];
      node(around:500,${latitude},${longitude})[amenity=bus_station];
      way(around:500,${latitude},${longitude})[amenity=bus_station];
    );
    out center 1;
  `;

  const response = await fetch(OVERPASS_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "text/plain;charset=UTF-8",
    },
    body: query,
  });

  if (!response.ok) {
    throw new Error("Bus stop lookup failed");
  }

  const payload = await response.json();
  const nearest = payload?.elements?.find((element) => element?.tags?.name);

  return nearest?.tags?.name || "";
}

async function resolveNearbyPlaceLabel(latitude, longitude) {
  const reverseUrl =
    `${NOMINATIM_BASE_URL}/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`;

  const [reverseResult, busStopResult] = await Promise.allSettled([
    fetch(reverseUrl, {
      headers: {
        Accept: "application/json",
      },
    }),
    fetchNearestBusStop(latitude, longitude),
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

  const nearestBusStop =
    busStopResult.status === "fulfilled" ? busStopResult.value : "";

  return (
    buildReadableLocation(address, nearestBusStop) ||
    displayName ||
    `Lat: ${latitude.toFixed(6)}, Lon: ${longitude.toFixed(6)}`
  );
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
        const cropsRes = await apiFetch("/onboarding/crops", {
          signal: controller.signal,
        });

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
              setCropOptions(
                hasOther ? normalized : (
                  [...normalized, { label: "Other", icon: "more_horiz" }]
                ),
              );
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

  const completedSteps = useMemo(
    () =>
      [
        fullName.trim().length > 0,
        location.trim().length > 0,
        hasCropSelection,
        farmSize.trim().length > 0,
      ].filter(Boolean).length,
    [fullName, location, hasCropSelection, farmSize],
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

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setCoordinates({ latitude, longitude });

        try {
          const placeLabel = await resolveNearbyPlaceLabel(latitude, longitude);
          setLocation(placeLabel);
          setGeoStatus(
            "Location found and filled with the nearest known place or bus stop.",
          );
        } catch {
          const formatted = `Lat: ${latitude.toFixed(6)}, Lon: ${longitude.toFixed(6)}`;
          setLocation(formatted);
          setGeoStatus(
            "GPS found. Exact coordinates were filled because nearby place lookup was unavailable.",
          );
        }
      },
      (error) => {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setGeoStatus(
              "Geolocation permission denied. Allow location in your browser settings.",
            );
            break;
          case error.POSITION_UNAVAILABLE:
            setGeoStatus("Location information is unavailable. Try again.");
            break;
          case error.TIMEOUT:
            setGeoStatus("Location request timed out. Retry.");
            break;
          default:
            setGeoStatus("Unable to retrieve location. Check browser settings.");
            break;
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 },
    );
  };

  const handleSubmit = async (event, onSuccess) => {
    event.preventDefault();
    setApiStatus("");
    setIsSavingSetup(true);

    const payload = {
      full_name: fullName.trim(),
      location: location.trim(),
      crop:
        selectedCrop === "Other" ? customCrop.trim() : selectedCrop,
      farm_size: farmSize ? Number(farmSize) : null,
    };

    try {
      const response = await apiFetch("/onboarding/profile", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        if (response.status === 401) {
          setApiStatus("Please sign in before saving your profile details.");
        } else {
          setApiStatus(`Profile could not be saved (status ${response.status}).`);
        }
        return;
      }

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
    handleSubmit,
  };
}
