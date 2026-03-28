export const DEFAULT_DASHBOARD = {
    weather: {
        temp: { value: "28°C", note: "+2°C vs yesterday" },
        humidity: { value: "65%", note: "-5% dropping" },
        rain: { value: "10%", note: "Clear skies" },
    },
    task: {
        title: "Best time to plant",
        description:
            "Soil moisture is optimal for corn seeding today. Weather conditions are stable for the next 48 hours.",
    },
    cropStatus: [
        {
            id: "wheat-a",
            name: "Wheat - Sector A",
            stage: "Vegetative Stage • 45 days left",
            status: "Healthy",
            score: 85,
            statusColor: "primary",
            icon: "grass",
        },
        {
            id: "corn-b",
            name: "Corn - Sector B",
            stage: "Seedling Stage • Needs Water",
            status: "Warning",
            score: 30,
            statusColor: "orange",
            icon: "psychology_alt",
        },
    ],
    newAlertCount: 3,
    libraryHint: "Pest Guides",
};

export const WEATHER_REFRESH_INTERVAL_MS = 5 * 60 * 1000;

export const DEFAULT_WEATHER_COORDS = {
    latitude: 6.5244,
    longitude: 3.3792,
    label: "Lagos",
};

export const DEFAULT_PROFILE = {
    full_name: "",
    location: "",
    crop: "",
    farm_size: "",
};

export function formatSignedDelta(value) {
    if (!Number.isFinite(value)) {
        return "No trend";
    }

    const rounded = Math.round(value);
    const sign = rounded > 0 ? "+" : "";
    return `${sign}${rounded}`;
}

export function getPrecipitationNote(probability) {
    if (!Number.isFinite(probability)) {
        return "Forecast unavailable";
    }

    if (probability >= 70) {
        return "High rain chance";
    }
    if (probability >= 40) {
        return "Moderate rain chance";
    }
    if (probability >= 20) {
        return "Low rain chance";
    }
    return "Clear skies likely";
}

export function getCurrentPositionAsync() {
    return new Promise((resolve, reject) => {
        if (!("geolocation" in navigator)) {
            reject(new Error("Geolocation unavailable in this browser."));
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => resolve(position.coords),
            (error) => reject(error),
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 120000 },
        );
    });
}

export async function resolveCoordsFromLocationName(locationName) {
    if (!locationName || !locationName.trim()) {
        return null;
    }

    const encodedName = encodeURIComponent(locationName.trim());
    const geocodingUrl =
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodedName}&count=1&language=en&format=json`;

    const response = await fetch(geocodingUrl);
    if (!response.ok) {
        return null;
    }

    const payload = await response.json();
    const topResult = payload?.results?.[0];

    if (
        !Number.isFinite(topResult?.latitude) ||
        !Number.isFinite(topResult?.longitude)
    ) {
        return null;
    }

    return {
        latitude: topResult.latitude,
        longitude: topResult.longitude,
        label:
            topResult?.name && topResult?.country ?
                `${topResult.name}, ${topResult.country}`
                : topResult?.name || locationName.trim(),
    };
}

export function formatCropLabel(cropName) {
    return String(cropName || "")
        .trim()
        .split(" ")
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
        .join(" ");
}
