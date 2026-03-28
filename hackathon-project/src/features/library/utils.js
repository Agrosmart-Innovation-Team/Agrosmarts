import {
    DEFAULT_CATEGORIES,
    DEFAULT_GUIDES,
    DEFAULT_NOTIFICATIONS,
    GUIDE_IMAGE_FALLBACK,
} from "./constants";

export function formatCropLabel(cropName) {
    return String(cropName || "")
        .trim()
        .split(" ")
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
        .join(" ");
}

export function isGuideRelevantToCrop(guide, cropTerm) {
    if (!cropTerm) {
        return false;
    }

    const token = cropTerm.toLowerCase();
    return (
        guide.title.toLowerCase().includes(token) ||
        guide.summary.toLowerCase().includes(token) ||
        guide.details.toLowerCase().includes(token) ||
        guide.content.some((point) => point.toLowerCase().includes(token)) ||
        (guide.tags || []).some((tag) => String(tag).toLowerCase().includes(token))
    );
}

export function resolveGuideImageUrl(imageValue) {
    const raw = String(imageValue || "").trim();
    if (!raw) {
        return GUIDE_IMAGE_FALLBACK;
    }

    const unwrapped = raw
        .replace(/^url\(["']?/i, "")
        .replace(/["']?\)$/i, "")
        .trim();
    const candidate = unwrapped || raw;

    if (/^https?:\/\//i.test(candidate) || /^data:image\//i.test(candidate)) {
        return candidate;
    }

    return GUIDE_IMAGE_FALLBACK;
}

export function normalizeNotifications(items) {
    if (!Array.isArray(items)) {
        return DEFAULT_NOTIFICATIONS;
    }

    const normalized = items
        .map((item) => {
            if (typeof item === "string") {
                return item;
            }

            return item?.message || item?.title || "";
        })
        .filter(Boolean);

    return normalized.length ? normalized : DEFAULT_NOTIFICATIONS;
}

export function normalizeCategories(items) {
    if (!Array.isArray(items)) {
        return DEFAULT_CATEGORIES;
    }

    const normalized = items
        .map((item) => ({
            id: item?.id || "",
            title: item?.title || "Untitled",
            count: Number(item?.count ?? 0),
            icon: item?.icon || "menu_book",
            description: item?.description || "",
        }))
        .filter((item) => item.id);

    return normalized.length ? normalized : DEFAULT_CATEGORIES;
}

export function normalizeGuides(items) {
    if (!Array.isArray(items)) {
        return DEFAULT_GUIDES;
    }

    const normalized = items
        .map((item) => ({
            id: item?.id || "",
            title: item?.title || "Untitled Guide",
            badge: item?.badge || "Guide",
            category: item?.category || "general",
            summary: item?.summary || "",
            details: item?.details || "",
            content:
                Array.isArray(item?.content) ? item.content.map((point) => String(point)) :
                    [],
            tags: [
                ...(Array.isArray(item?.tags) ? item.tags : []),
                ...(Array.isArray(item?.crops) ? item.crops : []),
                ...(Array.isArray(item?.techniques) ? item.techniques : []),
            ]
                .map((value) => String(value).trim())
                .filter(Boolean),
            image:
                item?.image ?
                    `url("${String(item.image).replace(/^url\(["']?|["']?\)$/g, "")}")`
                    : `url("${GUIDE_IMAGE_FALLBACK}")`,
        }))
        .filter((item) => item.id);

    return normalized.length ? normalized : DEFAULT_GUIDES;
}
