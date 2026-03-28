import { useEffect, useMemo, useRef, useState } from "react";
import GuideImage from "../features/library/GuideImage";
import {
  DEFAULT_CROP_TERMS,
  DEFAULT_TECHNIQUE_TERMS,
} from "../features/library/constants";
import useLibraryContent from "../features/library/useLibraryContent";
import {
  formatCropLabel,
  isGuideRelevantToCrop,
} from "../features/library/utils";
import {
  fetchCropImage,
  getCropImageAlt,
  CROP_IMAGE_FALLBACK,
  resolveCropImageUrl,
} from "../features/crops/cropMedia";

export default function Library() {
  const {
    notifications,
    categories,
    guides,
    profileCrop,
    isLoadingContent,
    apiError,
  } = useLibraryContent();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedGuideId, setSelectedGuideId] = useState("");
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const [showOnlyProfileCropGuides, setShowOnlyProfileCropGuides] =
    useState(false);
  const [selectedCropImage, setSelectedCropImage] = useState(() =>
    resolveCropImageUrl(
      localStorage.getItem("agrosmart_setup_crop_image"),
      "AgroSmart Crop",
    ),
  );
  const [isLoadingCropImage, setIsLoadingCropImage] = useState(false);
  const [cropImageError, setCropImageError] = useState("");
  const cropImageRefreshedRef = useRef(false);

  const categoryTitleById = useMemo(
    () =>
      categories.reduce((acc, category) => {
        acc[category.id] = category.title;
        return acc;
      }, {}),
    [categories],
  );

  const prioritizedGuides = useMemo(() => {
    if (!profileCrop) {
      return guides;
    }

    return [...guides].sort((a, b) => {
      const aRelevant = isGuideRelevantToCrop(a, profileCrop);
      const bRelevant = isGuideRelevantToCrop(b, profileCrop);

      if (aRelevant === bRelevant) {
        return 0;
      }

      return aRelevant ? -1 : 1;
    });
  }, [guides, profileCrop]);

  useEffect(() => {
    if (!prioritizedGuides.length) {
      setSelectedGuideId("");
      return;
    }

    const stillExists = prioritizedGuides.some(
      (guide) => guide.id === selectedGuideId,
    );
    if (!stillExists) {
      setSelectedGuideId(prioritizedGuides[0].id);
    }
  }, [prioritizedGuides, selectedGuideId]);

  const selectedCropLabel = useMemo(
    () => formatCropLabel(profileCrop),
    [profileCrop],
  );
  const selectedCropImageAlt = useMemo(
    () => getCropImageAlt(selectedCropLabel),
    [selectedCropLabel],
  );

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
        setSelectedCropImage(imageUrl || CROP_IMAGE_FALLBACK);
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

  useEffect(() => {
    setShowOnlyProfileCropGuides(Boolean(profileCrop));
  }, [profileCrop]);

  const matchedProfileGuidesCount = useMemo(
    () =>
      prioritizedGuides.filter((guide) =>
        isGuideRelevantToCrop(guide, profileCrop),
      ).length,
    [prioritizedGuides, profileCrop],
  );

  const filteredGuides = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return prioritizedGuides.filter((guide) => {
      const matchesCategory =
        selectedCategory === "all" ||
        query.length > 0 ||
        guide.category === selectedCategory;
      const matchesProfileCrop =
        !showOnlyProfileCropGuides ||
        !profileCrop ||
        isGuideRelevantToCrop(guide, profileCrop);
      const matchesSearch =
        query.length === 0 ||
        guide.title.toLowerCase().includes(query) ||
        guide.summary.toLowerCase().includes(query) ||
        guide.details.toLowerCase().includes(query) ||
        guide.badge.toLowerCase().includes(query) ||
        categoryTitleById[guide.category]?.toLowerCase().includes(query) ||
        guide.content.some((point) => point.toLowerCase().includes(query)) ||
        (guide.tags || []).some((tag) => tag.toLowerCase().includes(query));

      return matchesCategory && matchesProfileCrop && matchesSearch;
    });
  }, [
    prioritizedGuides,
    searchTerm,
    selectedCategory,
    categoryTitleById,
    showOnlyProfileCropGuides,
    profileCrop,
  ]);

  const searchSuggestions = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    if (query.length === 0) {
      return [];
    }

    const categoryMatches = categories
      .filter((category) => category.title.toLowerCase().includes(query))
      .slice(0, 2)
      .map((category) => ({
        id: `category-${category.id}`,
        type: "category",
        title: category.title,
        subtitle: `${category.count} expert guides`,
        categoryId: category.id,
      }));

    const guideMatches = prioritizedGuides
      .filter((guide) => {
        const categoryName = categoryTitleById[guide.category] || "";

        return (
          guide.title.toLowerCase().includes(query) ||
          guide.summary.toLowerCase().includes(query) ||
          guide.details.toLowerCase().includes(query) ||
          guide.badge.toLowerCase().includes(query) ||
          categoryName.toLowerCase().includes(query) ||
          guide.content.some((point) => point.toLowerCase().includes(query)) ||
          (guide.tags || []).some((tag) => tag.toLowerCase().includes(query))
        );
      })
      .slice(0, 5)
      .map((guide) => ({
        id: `guide-${guide.id}`,
        type: "guide",
        title: guide.title,
        subtitle: categoryTitleById[guide.category] || "General",
        guideId: guide.id,
        categoryId: guide.category,
      }));

    const keywordPool = [
      ...DEFAULT_CROP_TERMS,
      ...DEFAULT_TECHNIQUE_TERMS,
      ...prioritizedGuides.flatMap((guide) => guide.tags || []),
    ];

    const uniqueKeywords = [
      ...new Set(keywordPool.map((term) => term.toLowerCase())),
    ];

    const keywordHasGuideMatch = (term) =>
      prioritizedGuides.some((guide) => {
        const categoryName = categoryTitleById[guide.category] || "";

        return (
          guide.title.toLowerCase().includes(term) ||
          guide.summary.toLowerCase().includes(term) ||
          guide.details.toLowerCase().includes(term) ||
          guide.badge.toLowerCase().includes(term) ||
          categoryName.toLowerCase().includes(term) ||
          guide.content.some((point) => point.toLowerCase().includes(term)) ||
          (guide.tags || []).some((tag) => tag.toLowerCase().includes(term))
        );
      });

    const keywordMatches = uniqueKeywords
      .filter((term) => term.includes(query) && keywordHasGuideMatch(term))
      .slice(0, 3)
      .map((term) => ({
        id: `keyword-${term}`,
        type: DEFAULT_CROP_TERMS.includes(term) ? "crop" : "technique",
        title: term
          .split(" ")
          .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
          .join(" "),
        subtitle:
          DEFAULT_CROP_TERMS.includes(term) ? "Crop keyword" : (
            "Technique keyword"
          ),
      }));

    return [...categoryMatches, ...guideMatches, ...keywordMatches].slice(0, 7);
  }, [searchTerm, categories, prioritizedGuides, categoryTitleById]);

  useEffect(() => {
    if (!showSearchSuggestions || searchSuggestions.length === 0) {
      setActiveSuggestionIndex(-1);
      return;
    }

    setActiveSuggestionIndex(0);
  }, [showSearchSuggestions, searchSuggestions]);

  const applySuggestion = (suggestion) => {
    if (suggestion.type === "category") {
      setSelectedCategory(suggestion.categoryId);
      setSearchTerm(suggestion.title);
      setShowSearchSuggestions(false);
      return;
    }

    if (suggestion.type === "crop" || suggestion.type === "technique") {
      setSelectedCategory("all");
      setSearchTerm(suggestion.title);
      setShowSearchSuggestions(false);
      return;
    }

    setSelectedCategory("all");
    setSearchTerm(suggestion.title);
    setSelectedGuideId(suggestion.guideId);
    setShowSearchSuggestions(false);
  };

  const resetLibraryView = () => {
    setSelectedCategory("all");
    setSearchTerm("");
    setShowSearchSuggestions(false);
    setActiveSuggestionIndex(-1);

    if (prioritizedGuides.length > 0) {
      setSelectedGuideId(prioritizedGuides[0].id);
    }
  };

  const selectedGuide =
    filteredGuides.find((guide) => guide.id === selectedGuideId) ??
    filteredGuides[0] ??
    prioritizedGuides[0];
  const hasActiveFilters =
    selectedCategory !== "all" ||
    searchTerm.trim().length > 0 ||
    (showOnlyProfileCropGuides && Boolean(profileCrop));

  return (
    <div className="bg-background-light dark:bg-background-dark text-gray-900 dark:text-white min-h-screen flex flex-col pb-24">
      <header className="bg-white dark:bg-background-dark border-b border-primary/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between p-4">
          <div className="flex items-center gap-2">
            <div className="bg-primary p-2 rounded-lg text-white">
              <span className="material-symbols-outlined block">
                agriculture
              </span>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
              AgroGuide
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setShowNotifications((current) => !current)}
              className="p-2 text-gray-600 dark:text-gray-400"
            >
              <span className="material-symbols-outlined">notifications</span>
            </button>
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden border-2 border-primary">
              <span className="material-symbols-outlined text-primary">
                person
              </span>
            </div>
          </div>
        </div>
        {showNotifications && (
          <div className="absolute right-4 top-18 w-80 rounded-2xl border border-primary/15 bg-white dark:bg-background-dark shadow-xl p-4 z-50">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold">Notifications</h3>
              <button
                type="button"
                onClick={() => setShowNotifications(false)}
                className="text-sm text-primary font-semibold"
              >
                Close
              </button>
            </div>
            <div className="space-y-3">
              {notifications.map((item) => (
                <div
                  key={item}
                  className="rounded-xl border border-primary/10 bg-background-light dark:bg-background-dark/60 px-3 py-3 text-sm text-gray-600 dark:text-gray-300"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        )}
      </header>
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Knowledge Library</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Master the art of sustainable farming with our expert-vetted guides.
          </p>
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-[1fr_240px]">
            <div className="flex flex-wrap items-center gap-2">
              {selectedCropLabel ?
                <>
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                    Personalized for {selectedCropLabel}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setShowOnlyProfileCropGuides((current) => !current)
                    }
                    className="rounded-full border border-primary/20 px-3 py-1 text-xs font-semibold text-primary"
                  >
                    {showOnlyProfileCropGuides ?
                      "Show All Crops"
                    : `Show Only ${selectedCropLabel}`}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchTerm(selectedCropLabel);
                      setSelectedCategory("all");
                    }}
                    className="rounded-full border border-primary/20 px-3 py-1 text-xs font-semibold text-primary"
                  >
                    Show {selectedCropLabel} Guides
                  </button>
                  {matchedProfileGuidesCount > 0 && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {matchedProfileGuidesCount} matched guide
                      {matchedProfileGuidesCount === 1 ? "" : "s"}
                    </span>
                  )}
                </>
              : <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-900/20 dark:text-amber-300">
                  Select a primary crop on Home page to personalize guides.
                </span>
              }
            </div>
            <div className="overflow-hidden rounded-xl border border-primary/15 shadow-sm bg-white dark:bg-background-dark/40">
              {isLoadingCropImage && (
                <div className="px-3 pt-2 text-[11px] text-primary">
                  Loading crop image...
                </div>
              )}
              <img
                src={selectedCropImage}
                alt={selectedCropImageAlt}
                className="h-28 w-full object-cover"
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
              {cropImageError && (
                <p className="px-3 pt-1 text-[11px] text-amber-600 dark:text-amber-400">
                  {cropImageError}
                </p>
              )}
              <p className="px-3 py-2 text-xs font-semibold text-gray-700 dark:text-gray-200">
                {selectedCropLabel || "Crop preview"}
              </p>
            </div>
          </div>
          {isLoadingContent && (
            <p className="text-sm text-primary mt-2">Syncing with backend...</p>
          )}
          {apiError && (
            <p className="text-sm text-amber-600 dark:text-amber-400 mt-2">
              {apiError}
            </p>
          )}
        </div>
        <div className="mb-8">
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-primary">
              <span className="material-symbols-outlined">search</span>
            </div>
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onFocus={() => setShowSearchSuggestions(true)}
              onBlur={() => {
                window.setTimeout(() => setShowSearchSuggestions(false), 120);
              }}
              onKeyDown={(e) => {
                if (e.key === "ArrowDown" && searchSuggestions.length > 0) {
                  e.preventDefault();
                  setShowSearchSuggestions(true);
                  setActiveSuggestionIndex((current) =>
                    current < 0 || current >= searchSuggestions.length - 1 ?
                      0
                    : current + 1,
                  );
                  return;
                }

                if (e.key === "ArrowUp" && searchSuggestions.length > 0) {
                  e.preventDefault();
                  setShowSearchSuggestions(true);
                  setActiveSuggestionIndex((current) =>
                    current <= 0 ? searchSuggestions.length - 1 : current - 1,
                  );
                  return;
                }

                if (e.key === "Escape") {
                  setShowSearchSuggestions(false);
                  return;
                }

                if (e.key === "Enter" && searchSuggestions.length > 0) {
                  e.preventDefault();
                  const selectedSuggestion =
                    activeSuggestionIndex >= 0 ?
                      searchSuggestions[activeSuggestionIndex]
                    : searchSuggestions[0];

                  applySuggestion(selectedSuggestion);
                }
              }}
              className="block w-full pl-12 pr-4 py-4 bg-white dark:bg-background-dark/50 border-none rounded-xl ring-1 ring-primary/20 focus:ring-2 focus:ring-primary focus:outline-none transition-shadow text-lg"
              placeholder="Search guides, crops, or techniques..."
              type="text"
            />

            {showSearchSuggestions && searchSuggestions.length > 0 && (
              <div className="absolute top-[calc(100%+0.5rem)] left-0 right-0 z-40 rounded-xl border border-primary/20 bg-white dark:bg-background-dark shadow-xl overflow-hidden">
                {searchSuggestions.map((suggestion) => (
                  <button
                    key={suggestion.id}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onMouseEnter={() => {
                      const index = searchSuggestions.findIndex(
                        (item) => item.id === suggestion.id,
                      );
                      setActiveSuggestionIndex(index);
                    }}
                    onClick={() => applySuggestion(suggestion)}
                    className={`w-full px-4 py-3 text-left transition-colors border-b border-primary/10 last:border-b-0 ${
                      (
                        searchSuggestions[activeSuggestionIndex]?.id ===
                        suggestion.id
                      ) ?
                        "bg-primary/10"
                      : "hover:bg-primary/5"
                    }`}
                  >
                    <p className="font-semibold text-sm text-gray-900 dark:text-white">
                      {suggestion.title}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {suggestion.type === "category" ?
                        "Category"
                      : suggestion.type === "guide" ?
                        "Guide"
                      : suggestion.type === "crop" ?
                        "Crop"
                      : "Technique"}
                      {" • "}
                      {suggestion.subtitle}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        <section className="mb-10">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold">Categories</h3>
            <button
              type="button"
              onClick={resetLibraryView}
              className="text-primary font-medium hover:underline flex items-center gap-1"
            >
              View All
              <span className="material-symbols-outlined text-sm">
                arrow_forward
              </span>
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {categories.map((category) => {
              const isSelected = selectedCategory === category.id;

              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => setSelectedCategory(category.id)}
                  className={`group bg-white dark:bg-background-dark/40 p-6 rounded-xl border text-left hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 transition-all cursor-pointer ${
                    isSelected ?
                      "border-primary shadow-lg shadow-primary/10"
                    : "border-primary/10"
                  }`}
                >
                  <div
                    className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 transition-colors ${
                      isSelected ?
                        "bg-primary text-gray-900"
                      : "bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white"
                    }`}
                  >
                    <span className="material-symbols-outlined">
                      {category.icon}
                    </span>
                  </div>
                  <h4 className="font-bold text-lg mb-1">{category.title}</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {category.count} expert guides
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
                    {category.description}
                  </p>
                </button>
              );
            })}
          </div>
        </section>
        <section className="mb-20">
          <div className="flex items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="text-xl font-bold">Featured Guides</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {filteredGuides.length} guide
                {filteredGuides.length === 1 ? "" : "s"} available
              </p>
            </div>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetLibraryView}
                className="text-xs font-semibold uppercase tracking-wider text-primary"
              >
                View All
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredGuides.map((guide) => (
              <button
                key={guide.id}
                type="button"
                onClick={() => setSelectedGuideId(guide.id)}
                className={`bg-white dark:bg-background-dark/40 overflow-hidden rounded-xl border flex flex-col sm:flex-row text-left transition-all ${
                  selectedGuideId === guide.id ?
                    "border-primary shadow-lg shadow-primary/10"
                  : "border-primary/10 hover:border-primary/40"
                }`}
              >
                <GuideImage
                  image={guide.image}
                  alt={guide.title}
                  className="sm:w-1/3 h-48 sm:h-auto w-full object-cover"
                />
                <div className="p-6 flex-1">
                  <span className="text-[10px] uppercase tracking-widest font-bold text-primary mb-2 block">
                    {guide.badge}
                  </span>
                  <h5 className="font-bold text-lg mb-2">{guide.title}</h5>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    {guide.summary}
                  </p>
                  <span className="text-primary font-bold text-sm flex items-center gap-1">
                    Read Guide
                    <span className="material-symbols-outlined text-sm">
                      open_in_new
                    </span>
                  </span>
                </div>
              </button>
            ))}
          </div>

          {filteredGuides.length === 0 && (
            <div className="mt-6 rounded-xl border border-primary/10 bg-white dark:bg-background-dark/40 p-6">
              <p className="font-semibold">No guides matched your search.</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                Try another keyword or clear the current category filter.
              </p>
              <button
                type="button"
                onClick={resetLibraryView}
                className="mt-4 rounded-full bg-primary px-4 py-2 text-sm font-bold text-gray-900"
              >
                Reset to View All Guides
              </button>
            </div>
          )}

          {selectedGuide && filteredGuides.length > 0 && (
            <div className="mt-8 rounded-2xl border border-primary/15 bg-white dark:bg-background-dark/40 p-6 shadow-sm">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <span className="text-[10px] uppercase tracking-widest font-bold text-primary mb-2 block">
                    Guide Preview
                  </span>
                  <h4 className="text-2xl font-bold">{selectedGuide.title}</h4>
                </div>
                <button
                  type="button"
                  onClick={() => setIsGuideOpen(true)}
                  className="px-4 py-2 rounded-full bg-primary text-gray-900 font-bold"
                >
                  Open Full Guide
                </button>
              </div>
              <p className="text-gray-600 dark:text-gray-400 mt-4">
                {selectedGuide.details}
              </p>
            </div>
          )}
        </section>
      </main>

      {isGuideOpen && selectedGuide && (
        <div className="fixed inset-0 z-60 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="w-full max-w-2xl rounded-3xl bg-white dark:bg-background-dark border border-primary/15 shadow-2xl overflow-hidden">
            <GuideImage
              image={selectedGuide.image}
              alt={selectedGuide.title}
              className="h-56 w-full object-cover"
            />
            <div className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="text-[10px] uppercase tracking-widest font-bold text-primary mb-2 block">
                    {selectedGuide.badge}
                  </span>
                  <h3 className="text-2xl font-bold">{selectedGuide.title}</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsGuideOpen(false)}
                  className="size-10 rounded-full bg-primary/10 text-primary flex items-center justify-center"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <p className="text-gray-600 dark:text-gray-400 mt-4">
                {selectedGuide.details}
              </p>

              <div className="mt-6 space-y-4">
                {selectedGuide.content.map((point, index) => (
                  <div key={point} className="flex items-start gap-3">
                    <div className="size-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold shrink-0">
                      {index + 1}
                    </div>
                    <p className="text-sm leading-6 text-gray-700 dark:text-gray-300">
                      {point}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-8 flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsGuideOpen(false)}
                  className="px-5 py-2.5 rounded-full bg-primary text-gray-900 font-bold"
                >
                  Done Reading
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
