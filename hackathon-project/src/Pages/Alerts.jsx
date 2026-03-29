import { useNavigate } from "react-router-dom";
import useAlertsData, {
  stylesBySeverity,
} from "../features/alerts/useAlertsData";

export default function Alerts() {
  const navigate = useNavigate();
  const {
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
  } = useAlertsData();

  const highCount = filteredAlerts.filter((a) => a.severity === "high").length;
  const riskPercent =
    filteredAlerts.length > 0 ?
      Math.round((highCount / filteredAlerts.length) * 100)
    : 0;

  return (
    <div className="bg-background-light dark:bg-background-dark text-gray-900 dark:text-white min-h-screen">
      <div className="relative flex h-auto min-h-screen w-full flex-col overflow-x-hidden">
        <div className="flex items-center bg-background-light dark:bg-background-dark p-4 pb-2 justify-between sticky top-0 z-10 border-b border-primary/10">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="text-gray-900 dark:text-white flex size-12 shrink-0 items-center"
            aria-label="Go back"
          >
            <span className="material-symbols-outlined cursor-pointer">
              arrow_back
            </span>
          </button>
          <h2 className="text-gray-900 dark:text-white text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center">
            Pest &amp; Disease Alerts
          </h2>
          <div className="flex w-12 items-center justify-end">
            <button
              type="button"
              onClick={() => {
                setSeverityFilter("high");
                setCropFilter("all");
              }}
              aria-label="Show high severity alerts"
              className="flex cursor-pointer items-center justify-center rounded-lg h-12 bg-transparent text-gray-900 dark:text-white"
            >
              <span className="material-symbols-outlined">notifications</span>
            </button>
          </div>
        </div>

        {isLoadingAlerts && (
          <p className="px-4 pt-4 text-sm text-primary">Syncing alerts...</p>
        )}
        {apiError && (
          <p className="px-4 pt-2 text-sm text-amber-600 dark:text-amber-400">
            {apiError}
          </p>
        )}

        <div className="p-4">
          <div
            className={`border rounded-xl p-4 flex flex-col gap-3 ${hasHighRisk ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800" : "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"}`}
          >
            <div
              className={`flex items-center gap-2 ${hasHighRisk ? "text-red-700 dark:text-red-400" : "text-green-700 dark:text-green-400"}`}
            >
              <span className="material-symbols-outlined fill-icon">
                {hasHighRisk ? "warning" : "check_circle"}
              </span>
              <span className="font-bold text-sm uppercase tracking-wider">
                {hasHighRisk ? "High Risk Area" : "Stable Conditions"}
              </span>
            </div>
            <p className="text-gray-800 dark:text-gray-200 text-base font-medium">
              {hasHighRisk ?
                `${highCount} high-severity alert${highCount !== 1 ? "s" : ""} detected in your current filters.`
              : "No severe outbreak detected in your selected filters."}
            </p>
            <div
              className={`w-full rounded-full h-2 ${hasHighRisk ? "bg-red-200 dark:bg-red-800/40" : "bg-green-200 dark:bg-green-800/40"}`}
            >
              <div
                className={`h-2 rounded-full transition-all duration-500 ${hasHighRisk ? "bg-red-600" : "bg-green-600"}`}
                style={{
                  width: `${hasHighRisk ? Math.max(riskPercent, 20) : Math.max(100 - riskPercent, 20)}%`,
                }}
              ></div>
            </div>
          </div>
        </div>

        <div className="flex gap-3 px-4 py-2 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => {
              setSeverityFilter("all");
              setCropFilter("all");
            }}
            className={`flex h-9 shrink-0 items-center justify-center gap-x-2 rounded-full px-4 ${
              severityFilter === "all" && cropFilter === "all" ?
                "bg-primary text-gray-900"
              : "bg-primary/10 dark:bg-primary/20 text-gray-900 dark:text-white border border-primary/20"
            }`}
          >
            <span className="text-sm font-medium">All Alerts</span>
          </button>
          <button
            type="button"
            onClick={() => setSeverityFilter("high")}
            className={`flex h-9 shrink-0 items-center justify-center gap-x-2 rounded-full px-4 ${
              severityFilter === "high" ?
                "bg-primary text-gray-900"
              : "bg-primary/10 dark:bg-primary/20 text-gray-900 dark:text-white border border-primary/20"
            }`}
          >
            <span className="text-sm font-medium">High Severity</span>
          </button>
          {cropOptions.map((crop) => (
            <button
              key={crop}
              type="button"
              onClick={() => setCropFilter(crop)}
              className={`flex h-9 shrink-0 items-center justify-center gap-x-2 rounded-full px-4 ${
                cropFilter === crop ?
                  "bg-primary text-gray-900"
                : "bg-primary/10 dark:bg-primary/20 text-gray-900 dark:text-white border border-primary/20"
              }`}
            >
              <span className="text-sm font-medium">
                {crop.charAt(0).toUpperCase() + crop.slice(1)}
              </span>
            </button>
          ))}
        </div>

        <h2 className="text-gray-900 dark:text-white text-xl font-bold leading-tight tracking-tight px-4 pb-3 pt-6">
          Recent Alerts
        </h2>

        <div className="flex flex-col gap-1 px-4 pb-24">
          {filteredAlerts.map((alert) => {
            const style =
              stylesBySeverity[alert.severity] || stylesBySeverity.low;
            const matchesProfileCrop =
              Boolean(profileCrop) &&
              String(alert.crop).toLowerCase() === profileCrop;

            return (
              <div
                key={alert.id}
                className={`flex flex-col gap-3 bg-white dark:bg-background-dark/50 p-4 rounded-xl border shadow-sm mb-3 ${
                  matchesProfileCrop ?
                    "border-primary ring-1 ring-primary/20"
                  : "border-primary/5"
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex items-center justify-center rounded-lg size-12 shrink-0 ${style.iconBg} ${style.iconText}`}
                    >
                      <span className="material-symbols-outlined fill-icon">
                        {alert.icon}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-gray-900 dark:text-white font-bold text-lg leading-none">
                        {alert.title}
                      </h3>
                      <span
                        className={`text-xs font-semibold uppercase mt-1 inline-block ${style.levelText}`}
                      >
                        {alert.levelLabel}
                      </span>
                    </div>
                  </div>
                  <span className="text-gray-400 text-xs">
                    {alert.timestamp}
                  </span>
                </div>

                <div
                  className={`bg-background-light dark:bg-primary/5 rounded-lg p-3 border-l-4 ${style.border}`}
                >
                  <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                    <strong className="text-gray-900 dark:text-white">
                      Action:
                    </strong>
                    {` ${alert.action}`}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-gray-500 text-xs italic">
                    {alert.tag}
                  </span>
                  {matchesProfileCrop && (
                    <span className="rounded-full bg-primary/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-primary">
                      Matches Your Crop
                    </span>
                  )}
                  <button
                    className="text-primary font-bold text-sm flex items-center gap-1"
                    type="button"
                    onClick={() => setSelectedAlert(alert)}
                  >
                    View Details
                    <span className="material-symbols-outlined text-sm">
                      chevron_right
                    </span>
                  </button>
                </div>
              </div>
            );
          })}

          {filteredAlerts.length === 0 && (
            <div className="bg-white dark:bg-background-dark/50 p-4 rounded-xl border border-primary/5 shadow-sm mb-3">
              <p className="font-semibold text-gray-900 dark:text-white">
                No alerts matched the selected filters.
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Try clearing filters to view all active advisories.
              </p>
            </div>
          )}
        </div>

        {selectedAlert && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 backdrop-blur-sm sm:items-center">
            <div className="w-full max-w-2xl rounded-3xl border border-primary/10 bg-white p-6 shadow-2xl dark:bg-background-dark">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                    Alert Details
                  </p>
                  <h3 className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
                    {selectedAlert.title}
                  </h3>
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    {selectedAlert.levelLabel} • {selectedAlert.timestamp}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedAlert(null)}
                  className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl bg-background-light p-4 dark:bg-background-dark/70">
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Crop
                  </p>
                  <p className="mt-2 font-bold text-gray-900 dark:text-white">
                    {selectedAlert.crop}
                  </p>
                </div>
                <div className="rounded-2xl bg-background-light p-4 dark:bg-background-dark/70">
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Advisory Type
                  </p>
                  <p className="mt-2 font-bold text-gray-900 dark:text-white">
                    {selectedAlert.tag}
                  </p>
                </div>
              </div>

              <div className="mt-6 rounded-2xl border-l-4 border-primary bg-background-light p-4 dark:bg-background-dark/70">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Recommended Action
                </p>
                <p className="mt-3 text-sm leading-7 text-gray-700 dark:text-gray-300">
                  {selectedAlert.action}
                </p>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => navigate("/support")}
                  className="rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-gray-900"
                >
                  Contact Support
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedAlert(null)}
                  className="rounded-full border border-primary/20 px-5 py-2.5 text-sm font-semibold text-gray-600 dark:text-gray-300"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
