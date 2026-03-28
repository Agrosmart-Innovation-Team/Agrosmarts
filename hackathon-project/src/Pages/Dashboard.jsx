import { Link } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import useDashboardData from "../features/dashboard/useDashboardData";
import CropStatusCard from "../features/dashboard/components/CropStatusCard";
import DashboardActionTile from "../features/dashboard/components/DashboardActionTile";
import ProfileInfoCard from "../features/dashboard/components/ProfileInfoCard";
import WeatherMetricCard from "../features/dashboard/components/WeatherMetricCard";
import {
  fetchCropImage,
  getCropImageAlt,
  CROP_IMAGE_FALLBACK,
  resolveCropImageUrl,
} from "../features/crops/cropMedia";

export default function Dashboard() {
  const [selectedCropImage, setSelectedCropImage] = useState(() =>
    resolveCropImageUrl(
      localStorage.getItem("agrosmart_setup_crop_image"),
      "AgroSmart Crop",
    ),
  );
  const [isLoadingCropImage, setIsLoadingCropImage] = useState(false);
  const [cropImageError, setCropImageError] = useState("");
  const [showSeedingGuide, setShowSeedingGuide] = useState(false);
  const {
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
  } = useDashboardData();

  const selectedCropImageAlt = getCropImageAlt(selectedCropLabel);
  const cropImageRefreshedRef = useRef(false);

  useEffect(() => {
    cropImageRefreshedRef.current = false;
    setCropImageError("");

    if (!selectedCropLabel) {
      const cachedImage = localStorage.getItem("agrosmart_setup_crop_image");
      setSelectedCropImage(resolveCropImageUrl(cachedImage, "AgroSmart Crop"));
      return;
    }

    const loadCropImage = async () => {
      setIsLoadingCropImage(true);
      try {
        const imageUrl = await fetchCropImage(selectedCropLabel);
        setSelectedCropImage(imageUrl);
      } catch (error) {
        if (error?.name === "CropImageThrottleError") {
          setCropImageError(error.message);
        } else {
          setSelectedCropImage(CROP_IMAGE_FALLBACK);
        }
      } finally {
        setIsLoadingCropImage(false);
      }
    };

    loadCropImage();
  }, [selectedCropLabel]);

  return (
    <main className="flex-1 pb-24">
      {isLoadingDashboard && (
        <p className="px-4 pt-4 text-xs text-primary">Syncing dashboard...</p>
      )}
      {apiError && (
        <p className="px-4 pt-2 text-xs text-amber-600 dark:text-amber-400">
          {apiError}
        </p>
      )}
      <section className="px-4 pt-4">
        <div className="rounded-2xl border border-primary/10 bg-white p-5 shadow-sm dark:bg-background-dark">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold">Profile</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Update your farm and contact details used across the app.
              </p>
            </div>
            {!isEditingProfile && (
              <button
                type="button"
                onClick={() => {
                  setProfileDraft(profileData);
                  setProfileStatus("");
                  setIsEditingProfile(true);
                }}
                className="rounded-full border border-primary/20 px-4 py-2 text-sm font-semibold text-primary"
              >
                Edit Profile
              </button>
            )}
          </div>

          {(isLoadingProfile || profileStatus) && (
            <p
              className={`mb-4 text-sm ${
                profileStatus.includes("success") ? "text-primary" : (
                  "text-amber-600 dark:text-amber-400"
                )
              }`}
            >
              {isLoadingProfile ? "Loading profile..." : profileStatus}
            </p>
          )}

          {isEditingProfile ?
            <form
              className="grid grid-cols-1 gap-4 md:grid-cols-2"
              onSubmit={handleProfileSave}
            >
              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Full Name
                </label>
                <input
                  value={profileDraft.full_name}
                  onChange={(event) =>
                    setProfileDraft((current) => ({
                      ...current,
                      full_name: event.target.value,
                    }))
                  }
                  className="w-full rounded-xl border border-primary/15 bg-background-light px-4 py-3 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 dark:bg-background-dark"
                  type="text"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Location
                </label>
                <input
                  value={profileDraft.location}
                  onChange={(event) =>
                    setProfileDraft((current) => ({
                      ...current,
                      location: event.target.value,
                    }))
                  }
                  className="w-full rounded-xl border border-primary/15 bg-background-light px-4 py-3 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 dark:bg-background-dark"
                  type="text"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Primary Crop
                </label>
                <input
                  value={profileDraft.crop}
                  onChange={(event) =>
                    setProfileDraft((current) => ({
                      ...current,
                      crop: event.target.value,
                    }))
                  }
                  className="w-full rounded-xl border border-primary/15 bg-background-light px-4 py-3 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 dark:bg-background-dark"
                  type="text"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Farm Size (Acres)
                </label>
                <input
                  value={profileDraft.farm_size}
                  onChange={(event) =>
                    setProfileDraft((current) => ({
                      ...current,
                      farm_size: event.target.value,
                    }))
                  }
                  className="w-full rounded-xl border border-primary/15 bg-background-light px-4 py-3 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 dark:bg-background-dark"
                  type="number"
                />
              </div>
              <div className="flex gap-3 md:col-span-2">
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-gray-900 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSavingProfile ? "Saving..." : "Save Changes"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setProfileDraft(profileData);
                    setProfileStatus("");
                    setIsEditingProfile(false);
                  }}
                  className="rounded-full border border-primary/20 px-5 py-2.5 text-sm font-semibold text-gray-600 dark:text-gray-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          : <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <ProfileInfoCard
                label="Full Name"
                value={profileData.full_name || "Not set"}
              />
              <ProfileInfoCard
                label="Location"
                value={profileData.location || "Not set"}
              />
              <ProfileInfoCard
                label="Primary Crop"
                value={profileData.crop || "Not set"}
              />
              <ProfileInfoCard
                label="Farm Size"
                value={
                  profileData.farm_size ?
                    `${profileData.farm_size} Acres`
                  : "Not set"
                }
              />
            </div>
          }
        </div>
      </section>
      <section className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-bold">Real-time Weather</h3>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={refreshLiveWeather}
              disabled={isRefreshingWeather}
              className="text-xs font-semibold text-primary border border-primary/20 rounded-full px-3 py-1 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isRefreshingWeather ? "Refreshing..." : "Refresh Now"}
            </button>
            <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-full">
              Live Updates
            </span>
          </div>
        </div>
        {weatherStatus && (
          <p className="mb-3 text-xs text-gray-500 dark:text-gray-400">
            {weatherStatus}
          </p>
        )}
        <div className="grid grid-cols-3 gap-3">
          <WeatherMetricCard
            icon="thermostat"
            label="Temp"
            value={dashboardData.weather.temp.value}
            note={dashboardData.weather.temp.note}
            noteClassName="text-primary"
          />
          <WeatherMetricCard
            icon="humidity_percentage"
            label="Humidity"
            value={dashboardData.weather.humidity.value}
            note={dashboardData.weather.humidity.note}
            noteClassName="text-red-500"
          />
          <WeatherMetricCard
            icon="cloudy_snowing"
            label="Rain"
            value={dashboardData.weather.rain.value}
            note={dashboardData.weather.rain.note}
          />
        </div>
      </section>
      <section className="px-4 py-2">
        <h3 className="text-lg font-bold mb-3">Task for Today</h3>
        <div className="relative overflow-hidden rounded-xl bg-white dark:bg-background-dark border border-primary/10 shadow-sm">
          <div className="flex flex-col md:flex-row p-4 gap-4">
            <div className="flex flex-1 flex-col gap-3">
              <div className="flex items-center gap-2">
                <span className="flex size-8 items-center justify-center rounded-full bg-primary text-white">
                  <span className="material-symbols-outlined text-sm">
                    event_available
                  </span>
                </span>
                <p className="text-gray-900 dark:text-white text-base font-bold">
                  {personalizedTask.title}
                </p>
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                {personalizedTask.description}
              </p>
              {seedingStatusMessage && (
                <p className="text-xs text-primary">{seedingStatusMessage}</p>
              )}
              <div className="flex flex-wrap gap-2">
                <button
                  className="w-full sm:w-fit px-6 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  onClick={
                    seedingWorkflow.status === "not_started" ?
                      handleStartSeedingTask
                    : seedingWorkflow.status === "in_progress" ?
                      handleCompleteSeedingTask
                    : undefined
                  }
                  disabled={
                    isUpdatingSeeding || seedingWorkflow.status === "completed"
                  }
                  type="button"
                >
                  {isUpdatingSeeding ?
                    "Updating..."
                  : seedingWorkflow.status === "not_started" ?
                    "Start Seeding Task"
                  : seedingWorkflow.status === "in_progress" ?
                    "Complete Task"
                  : "Task Completed ✓"}
                </button>
                {seedingWorkflow.status === "completed" && (
                  <button
                    className="w-full sm:w-fit px-6 py-2 border border-primary/30 text-primary text-sm font-semibold rounded-lg hover:bg-primary/5 transition-colors"
                    onClick={handleResetSeedingWorkflow}
                    type="button"
                  >
                    Start New Seeding Task
                  </button>
                )}
                <button
                  className="w-full sm:w-fit px-6 py-2 border border-primary/30 text-primary text-sm font-semibold rounded-lg hover:bg-primary/5 transition-colors"
                  onClick={() => setShowSeedingGuide((current) => !current)}
                  type="button"
                >
                  {showSeedingGuide ?
                    "Hide Seeding Guide"
                  : "Open Seeding Guide"}
                </button>
              </div>
              <div className="mt-2 rounded-lg border border-primary/10 bg-primary/5 px-3 py-2">
                <div className="flex items-center justify-between text-xs font-semibold text-primary">
                  <span>Seeding Progress</span>
                  <span>{seedingProgressPercent}%</span>
                </div>
                <div className="mt-2 h-2 rounded-full bg-primary/15 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${seedingProgressPercent}%` }}
                  ></div>
                </div>
                <p className="mt-1 text-xs text-gray-600 dark:text-gray-300">
                  {seedingCompletedSteps} of {seedingChecklistItems.length}{" "}
                  steps done
                </p>
              </div>
              <div
                className={`rounded-lg border px-3 py-2 ${
                  smartSeedingRecommendation.severity === "warning" ?
                    "border-amber-300 bg-amber-50 dark:bg-amber-900/20"
                  : "border-emerald-300 bg-emerald-50 dark:bg-emerald-900/20"
                }`}
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-700 dark:text-gray-200">
                  Smart Recommendations
                </p>
                <ul className="mt-1 space-y-1">
                  {smartSeedingRecommendation.notes.map((note) => (
                    <li
                      key={note}
                      className="text-xs text-gray-600 dark:text-gray-300"
                    >
                      {note}
                    </li>
                  ))}
                </ul>
              </div>
              {showSeedingGuide && (
                <div className="rounded-lg border border-primary/15 bg-white dark:bg-background-dark p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">
                    Seeding Guide
                  </p>
                  <div className="mt-2 space-y-2">
                    {seedingChecklistItems.map((item) => (
                      <label
                        key={item.key}
                        className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200"
                      >
                        <input
                          type="checkbox"
                          checked={Boolean(seedingWorkflow.checklist[item.key])}
                          disabled={seedingWorkflow.status === "not_started"}
                          onChange={() =>
                            handleToggleSeedingChecklist(item.key)
                          }
                          className="accent-primary"
                        />
                        <span>{item.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
              {seedingWorkflow.activityLog.length > 0 && (
                <div className="rounded-lg border border-primary/10 bg-white dark:bg-background-dark p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">
                    Activity Log
                  </p>
                  <div className="mt-2 space-y-1">
                    {seedingWorkflow.activityLog
                      .slice(0, 5)
                      .map((entry, index) => (
                        <p
                          key={`${entry.timestamp}-${entry.type}-${index}`}
                          className="text-xs text-gray-600 dark:text-gray-300"
                        >
                          {new Date(entry.timestamp).toLocaleString()} -{" "}
                          {entry.type} - {entry.crop} ({entry.sector})
                        </p>
                      ))}
                  </div>
                </div>
              )}
            </div>
            <div className="w-full md:w-1/3 shrink-0 flex flex-col gap-2">
              <div className="overflow-hidden rounded-lg relative bg-gray-100 dark:bg-gray-800">
                {isLoadingCropImage && (
                  <div className="absolute inset-0 flex items-center justify-center z-10 bg-white/50 dark:bg-black/50">
                    <span className="text-xs text-gray-600 dark:text-gray-300">
                      Loading...
                    </span>
                  </div>
                )}
                <img
                  src={selectedCropImage}
                  alt={selectedCropImageAlt}
                  className="h-full w-full object-cover aspect-video min-h-36"
                  loading="lazy"
                  onError={(event) => {
                    if (cropImageRefreshedRef.current) {
                      event.currentTarget.src = CROP_IMAGE_FALLBACK;
                      return;
                    }
                    cropImageRefreshedRef.current = true;
                    if (!selectedCropLabel) {
                      event.currentTarget.src = CROP_IMAGE_FALLBACK;
                      return;
                    }
                    fetchCropImage(selectedCropLabel)
                      .then((freshUrl) => setSelectedCropImage(freshUrl))
                      .catch(() => setSelectedCropImage(CROP_IMAGE_FALLBACK));
                  }}
                />
              </div>
              {cropImageError && (
                <p className="text-xs text-amber-600 dark:text-amber-400 text-center px-1">
                  {cropImageError}
                </p>
              )}
              {selectedCropLabel && (
                <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 text-center truncate">
                  {selectedCropLabel}
                </p>
              )}
            </div>
          </div>
        </div>
      </section>
      <section className="px-4 py-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-lg font-bold">Crop Status Summary</h3>
            {selectedCropLabel && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Focused on {selectedCropLabel}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {selectedCropLabel && (
              <button
                type="button"
                onClick={() =>
                  setShowOnlyProfileCropStatus((current) => !current)
                }
                className="rounded-full border border-primary/20 px-3 py-1 text-xs font-semibold text-primary"
              >
                {showOnlyProfileCropStatus ?
                  "Show All Crops"
                : `Show Only ${selectedCropLabel}`}
              </button>
            )}
            <Link className="text-primary text-sm font-semibold" to="/alerts">
              View All
            </Link>
          </div>
        </div>
        {selectedCropLabel &&
          showOnlyProfileCropStatus &&
          profileCropMatchesCount > 0 && (
            <p className="mb-3 text-xs text-gray-500 dark:text-gray-400">
              {profileCropMatchesCount} card
              {profileCropMatchesCount === 1 ? "" : "s"} match your primary
              crop.
            </p>
          )}
        <div className="flex flex-col gap-3">
          {visibleCropStatus.map((crop) => (
            <CropStatusCard key={crop.id} crop={crop} />
          ))}
        </div>
      </section>
      <section className="px-4 py-2 grid grid-cols-2 gap-4">
        <DashboardActionTile
          to="/alerts"
          icon="warning"
          title="Alerts"
          subtitle={`${dashboardData.newAlertCount} New Reports`}
        />
        <DashboardActionTile
          to="/library"
          icon="auto_stories"
          title="Library"
          subtitle={personalizedLibraryHint}
        />
      </section>
    </main>
  );
}
