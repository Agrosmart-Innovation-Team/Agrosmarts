import { apiFetch } from "../../security/apiClient";

function getSvgFallbackImage(label = "Crop") {
  const safeLabel = String(label || "Crop").replace(/[<>]/g, "").slice(0, 40);
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#c7f9cc"/>
          <stop offset="100%" stop-color="#2d6a4f"/>
        </linearGradient>
      </defs>
      <rect width="1200" height="800" fill="url(#bg)"/>
      <text x="50%" y="46%" dominant-baseline="middle" text-anchor="middle"
            font-family="Arial, sans-serif" font-size="58" font-weight="700" fill="#0b3d2e">
        ${safeLabel}
      </text>
      <text x="50%" y="56%" dominant-baseline="middle" text-anchor="middle"
            font-family="Arial, sans-serif" font-size="30" fill="#0b3d2e">
        Image unavailable, using local fallback
      </text>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

export const CROP_IMAGE_FALLBACK =
  getSvgFallbackImage("AgroSmart Crop");

const CROP_IMAGE_ALIASES = {
  corn: "maize",
  manioc: "cassava",
  yuca: "cassava",
  casssava: "cassava", // common typo
  peanut: "groundnut",
  peanuts: "groundnut",
  groundnuts: "groundnut",
  cocoyam: "yam",
  banana: "plantain",
  soybeans: "soybean",
  chili: "pepper",
  chilies: "pepper",
  "hot pepper": "pepper",
};

const CROP_IMAGE_URLS = {
  // Primary seeded crops
  maize: "https://images.unsplash.com/photo-1551754655-cd27e38d2076?auto=format&fit=crop&w=1200&h=800&q=80",
  rice: "https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6?auto=format&fit=crop&w=1200&h=800&q=80",
  coffee: "https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=1200&h=800&q=80",
  cassava: "https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&w=1200&h=800&q=80",
  // Other common crops
  wheat: "https://images.unsplash.com/photo-1473923899519-b1ba4ba1c7b4?auto=format&fit=crop&w=1200&h=800&q=80",
  tomato: "https://images.unsplash.com/photo-1592078615290-033ee584e267?auto=format&fit=crop&w=1200&h=800&q=80",
  beans: "https://images.unsplash.com/photo-1605197161470-5d5e7d9ea7d2?auto=format&fit=crop&w=1200&h=800&q=80",
  yam: "https://images.unsplash.com/photo-1585518419759-107de4f5ed4d?auto=format&fit=crop&w=1200&h=800&q=80",
  groundnut: "https://images.unsplash.com/photo-1567529692333-de9fd6772897?auto=format&fit=crop&w=1200&h=800&q=80",
  plantain: "https://images.unsplash.com/photo-1481349518771-20055b2a7b24?auto=format&fit=crop&w=1200&h=800&q=80",
  pepper: "https://images.unsplash.com/photo-1526346698789-22fd84314424?auto=format&fit=crop&w=1200&h=800&q=80",
  okra: "https://images.unsplash.com/photo-1628260412297-a3377e45006f?auto=format&fit=crop&w=1200&h=800&q=80",
  soybean: "https://images.unsplash.com/photo-1591189863430-ab87e120f312?auto=format&fit=crop&w=1200&h=800&q=80",
};

function normalizeCropKey(cropName) {
  return String(cropName || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, " ");
}

function isValidImageUrl(value) {
  const candidate = String(value || "").trim();
  return /^https?:\/\//i.test(candidate) || /^data:image\//i.test(candidate);
}

export function resolveCropImageUrl(value, fallbackLabel = "Crop") {
  const candidate = String(value || "").trim();
  return isValidImageUrl(candidate) ? candidate : getSvgFallbackImage(fallbackLabel);
}

export function getCropImage(cropName) {
  const normalized = normalizeCropKey(cropName);
  if (!normalized) {
    return CROP_IMAGE_FALLBACK;
  }

  const alias = CROP_IMAGE_ALIASES[normalized] || normalized;
  return CROP_IMAGE_URLS[alias] || getSvgFallbackImage(alias);
}

export async function fetchCropImage(cropName) {
  if (!cropName) {
    return CROP_IMAGE_FALLBACK;
  }

  try {
    const normalized = normalizeCropKey(cropName);
    const alias = CROP_IMAGE_ALIASES[normalized] || normalized;

    // Use static URLs for known crops — no API call needed, shows real photos instantly.
    if (CROP_IMAGE_URLS[alias]) {
      return CROP_IMAGE_URLS[alias];
    }

    const response = await apiFetch(`/crops/${encodeURIComponent(alias)}/image`);

    if (response.status === 429) {
      const retryAfter = response.headers.get("Retry-After");
      const err = new Error(
        retryAfter
          ? `Image generation is rate-limited. Retry in ${retryAfter}s.`
          : "Image generation is rate-limited. Please try again shortly.",
      );
      err.name = "CropImageThrottleError";
      throw err;
    }

    if (response.ok) {
      const data = await response.json();
      return resolveCropImageUrl(data?.image_url, alias);
    }

    return getSvgFallbackImage(alias);
  } catch (error) {
    if (error.name === "CropImageThrottleError") throw error;
    return getSvgFallbackImage(cropName);
  }
}

export function getCropImageAlt(cropName) {
  const label = String(cropName || "").trim();
  return label ? `${label} crop in the field` : "Featured crop in the field";
}

export function handleCropImageError(event) {
  // Guard against infinite error loops: apply fallback only once.
  if (event.currentTarget.dataset.fallbackApplied === "true") {
    return;
  }

  event.currentTarget.dataset.fallbackApplied = "true";
  event.currentTarget.src = getSvgFallbackImage(event.currentTarget.alt || "Crop");
}
