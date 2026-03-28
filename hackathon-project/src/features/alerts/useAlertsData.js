import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../../security/apiClient";

const SEVERITY_PRIORITY = {
  high: 3,
  medium: 2,
  low: 1,
};

function timestampToSortableValue(timestamp) {
  if (!timestamp) {
    return 0;
  }

  const normalized = String(timestamp).trim().toLowerCase();
  const now = Date.now();

  const directDate = Date.parse(timestamp);
  if (!Number.isNaN(directDate)) {
    return directDate;
  }

  if (normalized === "yesterday") {
    return now - 24 * 60 * 60 * 1000;
  }

  const relativeMatch = normalized.match(/^(\d+)\s*([mhdw])\s*ago$/);
  if (relativeMatch) {
    const amount = Number(relativeMatch[1]);
    const unit = relativeMatch[2];
    const unitMs = {
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000,
      w: 7 * 24 * 60 * 60 * 1000,
    }[unit];

    return now - amount * unitMs;
  }

  return 0;
}

export const DEFAULT_ALERTS = [
  {
    id: "fall-armyworm",
    title: "Fall Armyworm",
    severity: "high",
    levelLabel: "Urgent • High Severity",
    action:
      "Apply recommended biopesticides and monitor egg masses immediately. Secondary scouting required in 48 hours.",
    tag: "Regional Advisory",
    icon: "bug_report",
    timestamp: "2h ago",
    crop: "maize",
  },
  {
    id: "maize-necrosis",
    title: "Maize Lethal Necrosis",
    severity: "medium",
    levelLabel: "Warning • Medium Severity",
    action:
      "Uproot infected plants and burn them. Control insect vectors (aphids/thrips) in surrounding fields.",
    tag: "Regional Advisory",
    icon: "potted_plant",
    timestamp: "5h ago",
    crop: "maize",
  },
  {
    id: "blight-risk",
    title: "Blight Risk (Weather)",
    severity: "low",
    levelLabel: "Info • Low Probability",
    action:
      "High humidity forecast. Increase spacing between plants to improve airflow and reduce fungal growth risk.",
    tag: "Climate Alert",
    icon: "cloud",
    timestamp: "Yesterday",
    crop: "general",
  },
];

export const stylesBySeverity = {
  high: {
    iconBg: "bg-red-100 dark:bg-red-900/30",
    iconText: "text-red-600 dark:text-red-400",
    levelText: "text-red-600 dark:text-red-400",
    border: "border-red-500",
  },
  medium: {
    iconBg: "bg-amber-100 dark:bg-amber-900/30",
    iconText: "text-amber-600 dark:text-amber-400",
    levelText: "text-amber-600 dark:text-amber-400",
    border: "border-amber-500",
  },
  low: {
    iconBg: "bg-green-100 dark:bg-green-900/30",
    iconText: "text-green-600 dark:text-green-400",
    levelText: "text-green-600 dark:text-green-400",
    border: "border-green-500",
  },
};

export default function useAlertsData() {
  const [alerts, setAlerts] = useState(DEFAULT_ALERTS);
  const [profileCrop, setProfileCrop] = useState("");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [cropFilter, setCropFilter] = useState("all");
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [isLoadingAlerts, setIsLoadingAlerts] = useState(false);
  const [apiError, setApiError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    const normalizeAlerts = (items) => {
      if (!Array.isArray(items)) {
        return DEFAULT_ALERTS;
      }

      const normalized = items
        .map((item) => ({
          id: item?.id || `${Date.now()}-${Math.random()}`,
          title: item?.title || "Untitled Alert",
          severity:
            ["high", "medium", "low"].includes(item?.severity) ?
              item.severity
            : "low",
          levelLabel: item?.levelLabel || item?.level_label || "Info",
          action: item?.action || item?.recommendation || "No action provided.",
          tag: item?.tag || "Advisory",
          icon: item?.icon || "warning",
          timestamp: item?.timestamp || "Now",
          crop: item?.crop || "general",
        }))
        .filter((item) => item.title);

      return normalized.length ? normalized : DEFAULT_ALERTS;
    };

    const loadAlerts = async () => {
      setIsLoadingAlerts(true);
      setApiError("");

      try {
        const [response, profileResponse] = await Promise.all([
          apiFetch("/alerts", {
            signal: controller.signal,
          }),
          apiFetch("/onboarding/profile", {
            signal: controller.signal,
          }),
        ]);

        if (response.status === 401) {
          setApiError(
            "Please sign in to load live alerts. Showing sample alerts instead.",
          );
          return;
        }

        if (!response.ok) {
          throw new Error(`Alerts request failed with status ${response.status}.`);
        }

        const data = await response.json();
        setAlerts(normalizeAlerts(data));

        if (profileResponse.ok) {
          const profilePayload = await profileResponse.json();
          setProfileCrop(String(profilePayload?.crop || "").toLowerCase());
        }
      } catch (error) {
        if (error.name !== "AbortError") {
          setApiError(
            error?.message || "Backend alerts unavailable. Showing sample alerts.",
          );
        }
      } finally {
        setIsLoadingAlerts(false);
      }
    };

    loadAlerts();

    return () => controller.abort();
  }, []);

  const filteredAlerts = useMemo(() => {
    return alerts
      .filter((alert) => {
        const severityMatch =
          severityFilter === "all" || alert.severity === severityFilter;
        const cropMatch = cropFilter === "all" || alert.crop === cropFilter;
        return severityMatch && cropMatch;
      })
      .sort((left, right) => {
        const severityDelta =
          (SEVERITY_PRIORITY[right.severity] || 0) -
          (SEVERITY_PRIORITY[left.severity] || 0);

        if (severityDelta !== 0) {
          return severityDelta;
        }

        return (
          timestampToSortableValue(right.timestamp) -
          timestampToSortableValue(left.timestamp)
        );
      });
  }, [alerts, severityFilter, cropFilter]);

  const cropOptions = useMemo(() => {
    const uniqueCrops = [...new Set(alerts.map((alert) => alert.crop).filter(Boolean))];
    return uniqueCrops.sort((left, right) => left.localeCompare(right));
  }, [alerts]);

  const hasHighRisk = filteredAlerts.some((item) => item.severity === "high");

  return {
    profileCrop,
    severityFilter,
    setSeverityFilter,
    cropFilter,
    setCropFilter,
    selectedAlert,
    setSelectedAlert,
    isLoadingAlerts,
    apiError,
    filteredAlerts,
    cropOptions,
    hasHighRisk,
  };
}
