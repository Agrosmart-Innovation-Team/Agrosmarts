import { useNavigate } from "react-router-dom";
import useHomeSetup from "../features/home/useHomeSetup";

export default function Home() {
  const navigate = useNavigate();
  const {
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
  } = useHomeSetup();

  const mapQuery =
    location.trim() ||
    (coordinates ? `${coordinates.latitude},${coordinates.longitude}` : "");
  const mapSrc =
    mapQuery ?
      `https://www.google.com/maps?q=${encodeURIComponent(mapQuery)}&z=18&output=embed`
    : "";

  return (
    <div className="bg-background-light dark:bg-background-dark font-display text-gray-900 dark:text-white transition-colors duration-300">
      <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden">
        <div className="flex flex-col gap-2 px-4 pt-3 pb-2">
          <div className="flex gap-6 justify-between items-center">
            <p className="text-gray-900 dark:text-white text-base font-semibold">
              Step {currentStep} of {totalSteps}
            </p>
            <p className="text-primary text-sm font-bold">
              {completionPercent}% Complete
            </p>
          </div>
          <div className="rounded-full bg-primary/20 h-2 w-full overflow-hidden">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${completionPercent}%` }}
            ></div>
          </div>
        </div>

        <main className="flex-1 w-full max-w-xl mx-auto pb-8">
          <div className="px-4 pt-4 pb-3">
            <h1 className="text-gray-900 dark:text-white text-3xl font-bold leading-tight">
              Welcome to AgroSmart
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-base mt-2">
              Let&apos;s set up your profile to provide personalized
              agricultural advice for your specific needs.
            </p>
          </div>

          <form
            className="flex flex-col gap-5 px-4 py-2"
            onSubmit={(e) => handleSubmit(e, () => navigate("/dashboard"))}
          >
            {isLoadingSetup && (
              <p className="text-xs text-primary">Syncing setup data...</p>
            )}
            {apiStatus && (
              <p className="text-xs text-amber-600 dark:text-amber-400">
                {apiStatus}
              </p>
            )}
            <div className="flex flex-col gap-2">
              <label className="text-gray-900 dark:text-white text-sm font-bold uppercase tracking-wider">
                Full Name
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                  person
                </span>
                <input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 rounded-xl border border-primary/20 bg-gray-50 dark:bg-background-dark focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500"
                  placeholder="e.g. Johnathan Doe"
                  type="text"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-gray-900 dark:text-white text-sm font-bold uppercase tracking-wider">
                Farm Location
              </label>
              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  onClick={handleGeolocate}
                  className="flex items-center gap-3 w-full p-4 rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 hover:bg-primary/10 transition-colors text-primary font-medium"
                >
                  <span className="material-symbols-outlined">my_location</span>
                  <span>Use Current GPS Location</span>
                </button>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                    map
                  </span>
                  <input
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 rounded-xl border border-primary/20 bg-gray-50 dark:bg-background-dark focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500"
                    placeholder="Or enter city, region, or address"
                    type="text"
                  />
                </div>
                {coordinates && (
                  <div className="px-3 py-2 rounded-lg bg-primary/5 border border-primary/15">
                    <p className="text-xs font-semibold text-primary">
                      GPS Coordinates
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 font-mono">
                      {coordinates.latitude.toFixed(6)},{" "}
                      {coordinates.longitude.toFixed(6)}
                    </p>
                  </div>
                )}
                {geoStatus && (
                  <p
                    className={`text-xs mt-2 ${geoStatus.includes("Error") || geoStatus.includes("denied") ? "text-red-500 dark:text-red-300" : "text-gray-500 dark:text-gray-300"}`}
                  >
                    {geoStatus}
                  </p>
                )}
                <p className="text-[11px] text-gray-500 dark:text-gray-400">
                  Type your home or farm address, or use GPS to place the map
                  automatically.
                </p>
                <div className="h-32 w-full rounded-xl overflow-hidden relative border border-primary/10 bg-center bg-cover">
                  {mapSrc ?
                    <iframe
                      title="Farm location map"
                      className="absolute inset-0 h-full w-full"
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      src={mapSrc}
                    ></iframe>
                  : <div
                      className="absolute inset-0 bg-center bg-cover"
                      style={{
                        backgroundImage:
                          'url("https://images.unsplash.com/photo-1517800143959-c9e1f39f1e57?auto=format&fit=crop&w=1600&q=80")',
                      }}
                    ></div>
                  }
                  <div className="pointer-events-none absolute inset-0 bg-black/20"></div>
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center z-10">
                    <div className="size-12 rounded-full bg-white/95 border-2 border-primary shadow-lg shadow-primary/20 flex items-center justify-center">
                      <span className="material-symbols-outlined text-primary text-3xl">
                        location_on
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-gray-900 dark:text-white text-sm font-bold uppercase tracking-wider">
                Primary Crop Type
              </label>
              <div className="grid grid-cols-2 gap-3">
                {cropOptions.map((crop) => (
                  <label key={crop.label} className="cursor-pointer">
                    <input
                      type="radio"
                      name="crop"
                      className="peer hidden"
                      value={crop.label}
                      checked={selectedCrop === crop.label}
                      onChange={() => setSelectedCrop(crop.label)}
                    />
                    <div className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-primary/10 bg-gray-50 dark:bg-background-dark peer-checked:border-primary peer-checked:bg-primary/5 transition-all">
                      <span className="material-symbols-outlined text-3xl text-primary">
                        {crop.icon}
                      </span>
                      <span className="text-sm font-medium">{crop.label}</span>
                    </div>
                  </label>
                ))}
              </div>
              {selectedCrop === "Other" && (
                <div className="mt-3">
                  <label className="text-gray-900 dark:text-white text-xs font-semibold uppercase tracking-wider mb-2 block">
                    Specify Other Crop
                  </label>
                  <input
                    value={customCrop}
                    onChange={(e) => setCustomCrop(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-primary/20 bg-gray-50 dark:bg-background-dark focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500"
                    placeholder="Type crop name (e.g., Cassava)"
                    type="text"
                  />
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-gray-900 dark:text-white text-sm font-bold uppercase tracking-wider">
                Farm Size
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    value={farmSize}
                    onChange={(e) => setFarmSize(e.target.value)}
                    className="w-full pl-4 pr-16 py-4 rounded-xl border border-primary/20 bg-gray-50 dark:bg-background-dark focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500"
                    placeholder="Enter size"
                    type="number"
                    min="0.1"
                    step="0.1"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-primary">
                    Acres
                  </div>
                </div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 px-1">
                Help us calculate irrigation and fertilizer needs.
              </p>
            </div>

            <div className="pt-4 pb-6">
              <button
                disabled={!isSetupComplete || isSavingSetup}
                className="w-full bg-primary hover:bg-primary/90 text-gray-900 font-bold py-4 rounded-xl shadow-lg shadow-primary/20 flex items-center justify-center gap-2 transition-transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
                type="submit"
              >
                <span>
                  {isSavingSetup ?
                    "Saving profile..."
                  : "Continue to Soil Profile"}
                </span>
                <span className="material-symbols-outlined">arrow_forward</span>
              </button>
              {!isSetupComplete && (
                <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-2">
                  Fill in all fields above to continue.
                </p>
              )}
            </div>
          </form>
        </main>

        <div className="h-24 w-full bg-linear-to-t from-primary/10 to-transparent flex items-end justify-center overflow-hidden">
          <div className="flex gap-4 items-end translate-y-4 opacity-30">
            <span className="material-symbols-outlined text-6xl text-primary">
              potted_plant
            </span>
            <span className="material-symbols-outlined text-8xl text-primary">
              nature
            </span>
            <span className="material-symbols-outlined text-6xl text-primary">
              psychiatry
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
