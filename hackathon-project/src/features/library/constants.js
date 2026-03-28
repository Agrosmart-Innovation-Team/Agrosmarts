export const DEFAULT_NOTIFICATIONS = [
  "New irrigation guide added this morning.",
  "Maize disease alert updated for humid regions.",
  "Your saved harvesting checklist is ready offline.",
];

export const DEFAULT_CATEGORIES = [
  {
    id: "soil",
    title: "Soil Preparation",
    count: 12,
    icon: "sledding",
    description: "Land clearing, tillage, soil testing, and bed preparation.",
  },
  {
    id: "irrigation",
    title: "Irrigation",
    count: 8,
    icon: "water_drop",
    description: "Efficient watering systems and drought management practices.",
  },
  {
    id: "fertilization",
    title: "Fertilization",
    count: 15,
    icon: "compost",
    description: "Nutrient planning, manure use, and fertilizer timing.",
  },
  {
    id: "harvesting",
    title: "Harvesting",
    count: 10,
    icon: "eco",
    description: "Harvest timing, post-harvest handling, and storage methods.",
  },
];

export const DEFAULT_CROP_TERMS = [
  "maize",
  "rice",
  "wheat",
  "coffee",
  "tomato",
  "cassava",
  "beans",
];

export const DEFAULT_TECHNIQUE_TERMS = [
  "drip irrigation",
  "no-till",
  "cover cropping",
  "top dressing",
  "soil testing",
  "mulching",
  "post-harvest storage",
];

export const GUIDE_IMAGE_FALLBACK = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800"><defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#d8f3dc"/><stop offset="100%" stop-color="#2d6a4f"/></linearGradient></defs><rect width="1200" height="800" fill="url(#bg)"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="Arial,sans-serif" font-size="50" fill="#0b3d2e">AgroSmart Guide</text></svg>'
)}`;

export const DEFAULT_GUIDES = [
  {
    id: "water-management",
    title: "Sustainable Water Management",
    badge: "New Guide",
    category: "irrigation",
    summary:
      "Learn how to implement drip irrigation systems that save up to 40% more water.",
    details:
      "This guide covers drip layout planning, emitter spacing, pressure checks, and maintenance routines for smallholder farms.",
    content: [
      "Start by mapping the field and grouping crops with similar water demand into the same irrigation zone.",
      "Use low-pressure drip lines where possible to reduce water loss and maintain even delivery across the plot.",
      "Inspect emitters weekly for clogging and flush the lines regularly, especially after applying fertilizer through irrigation.",
    ],
    tags: ["maize", "rice", "drip irrigation", "water conservation"],
    image: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "no-till-soil",
    title: "No-Till Soil Secrets",
    badge: "Popular",
    category: "soil",
    summary:
      "The beginner's guide to maintaining soil structure and preventing erosion naturally.",
    details:
      "This guide explains residue retention, minimum disturbance, cover crops, and how to transition from conventional tillage safely.",
    content: [
      "Retain crop residue on the soil surface to protect against erosion and reduce evaporation.",
      "Minimize ploughing passes so beneficial soil organisms and root channels remain intact.",
      "Introduce cover crops between seasons to suppress weeds and steadily improve organic matter.",
    ],
    tags: ["wheat", "no-till", "cover cropping", "soil health"],
    image: "https://images.unsplash.com/photo-1500651230702-0e2d8a49d4a3?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "fertilizer-timing",
    title: "Fertilizer Timing Essentials",
    badge: "Field Tip",
    category: "fertilization",
    summary:
      "Apply nutrients at the right growth stage to improve uptake and reduce waste.",
    details:
      "You will learn basal application timing, top dressing windows, and how rainfall affects nutrient efficiency.",
    content: [
      "Apply basal fertilizer during planting so roots have early access to starter nutrients.",
      "Split top dressing into planned stages rather than one heavy application to reduce leaching.",
      "Avoid fertilizing immediately before intense rainfall unless the field has strong drainage control.",
    ],
    tags: ["maize", "coffee", "top dressing", "nutrient management"],
    image: "https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "harvest-readiness",
    title: "Harvest Readiness Checklist",
    badge: "Seasonal",
    category: "harvesting",
    summary:
      "Know when to harvest, how to reduce losses, and how to protect quality after picking.",
    details:
      "This guide helps farmers identify maturity signs, prepare labor, and reduce bruising, moisture damage, and storage losses.",
    content: [
      "Use crop-specific maturity indicators instead of relying only on calendar dates.",
      "Prepare clean storage sacks, shade, and transport plans before harvest starts.",
      "Sort and remove damaged produce quickly to prevent quality loss during storage and sale.",
    ],
    tags: ["rice", "beans", "harvesting", "post-harvest storage"],
    image: "https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=1200&q=80",
  },
];
