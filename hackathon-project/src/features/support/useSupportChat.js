import { useEffect, useState } from "react";
import { apiFetch } from "../../security/apiClient";

const DEFAULT_MESSAGES = [
    {
        id: 1,
        sender: "officer",
        time: "09:15 AM",
        content:
            "Hello! I'm here to help. Could you please describe the issue you're seeing with your crops?",
    },
    {
        id: 2,
        sender: "farmer",
        time: "09:22 AM",
        content:
            "The leaves on my tomato plants are turning yellow with brown spots. I've attached a photo.",
    },
    {
        id: 3,
        sender: "officer",
        time: "09:25 AM",
        content:
            "Thanks for the photo. This looks like Early Blight. I recommend applying a copper-based fungicide and removing the affected lower leaves immediately.",
    },
];

const DEFAULT_QUICK_REPLIES = [
    "How do I start seeding?",
    "What fertilizer should I use?",
    "How do I control pests?",
    "When should I harvest?",
    "My leaves are yellowing",
];

export default function useSupportChat() {
    const [messageDraft, setMessageDraft] = useState("");
    const [pendingReplies, setPendingReplies] = useState(0);
    const [messages, setMessages] = useState(DEFAULT_MESSAGES);
    const [quickReplies, setQuickReplies] = useState(DEFAULT_QUICK_REPLIES);
    const [apiError, setApiError] = useState("");
    const [isLoadingChat, setIsLoadingChat] = useState(false);

    useEffect(() => {
        const controller = new AbortController();

        const normalizeMessages = (items) => {
            if (!Array.isArray(items)) {
                return DEFAULT_MESSAGES;
            }

            const normalized = items
                .map((item) => ({
                    id: item?.id || Date.now() + Math.random(),
                    sender: item?.sender === "farmer" ? "farmer" : "officer",
                    time: item?.time || "Now",
                    content: item?.content || "",
                }))
                .filter((item) => item.content);

            return normalized.length ? normalized : DEFAULT_MESSAGES;
        };

        const normalizeReplies = (items) => {
            if (!Array.isArray(items)) {
                return DEFAULT_QUICK_REPLIES;
            }

            const normalized = items
                .map((item) => (typeof item === "string" ? item : item?.text || ""))
                .filter(Boolean);

            return normalized.length ? normalized : DEFAULT_QUICK_REPLIES;
        };

        const loadSupportData = async () => {
            setIsLoadingChat(true);
            setApiError("");

            try {
                const [messagesRes, repliesRes] = await Promise.all([
                    apiFetch("/support/messages", { signal: controller.signal }),
                    apiFetch("/support/quick-replies", {
                        signal: controller.signal,
                    }),
                ]);

                if (!messagesRes.ok || !repliesRes.ok) {
                    throw new Error("Failed to load support API");
                }

                const [messagesData, repliesData] = await Promise.all([
                    messagesRes.json(),
                    repliesRes.json(),
                ]);

                setMessages(normalizeMessages(messagesData));
                setQuickReplies(normalizeReplies(repliesData));
            } catch (error) {
                if (error.name !== "AbortError") {
                    setApiError("Backend chat unavailable. Using sample conversation.");
                }
            } finally {
                setIsLoadingChat(false);
            }
        };

        loadSupportData();

        return () => controller.abort();
    }, []);

    const getOfficerReply = (text) => {
        const lower = text.toLowerCase().trim();

        // Greetings
        if (/\b(hi|hello|hey|good morning|good afternoon|good evening)\b/.test(lower)) {
            return "Hello! I'm Officer Sarah, your agricultural extension officer. I'm here to help with any farming questions — seeding, crop health, pest control, fertilizer, irrigation, or anything else. What can I help you with today?";
        }

        // Help / what can you do
        if (/\b(help|what can you|what do you|assist|support)\b/.test(lower)) {
            return "I can help you with: seeding and planting schedules, fertilizer and nutrient advice, pest and disease identification, irrigation and water management, harvest timing, and crop-specific guidance for cassava, maize, rice, wheat, tomatoes, beans, coffee, and more. Just ask your question!";
        }

        // Seeding / planting
        if (/\b(seed|seeding|sow|sowing|plant|planting|germinate|germination|transplant)\b/.test(lower)) {
            if (/\b(cassava)\b/.test(lower)) {
                return "For cassava, plant stem cuttings of 25–30 cm at a 45° angle into well-drained soil. Best time is at the start of the rainy season. Spacing should be 1 m × 1 m for good tuber development. Ensure the soil is loose to at least 30 cm deep.";
            }
            if (/\b(maize|corn)\b/.test(lower)) {
                return "Maize seeds should be planted 2–5 cm deep with a spacing of 75 cm between rows and 25 cm between plants. Plant at the onset of rains for best results. Use certified seeds and treat with a fungicide seed dressing to improve germination.";
            }
            if (/\b(rice)\b/.test(lower)) {
                return "For rice, broadcast or transplant 3–4 week old seedlings at 20 × 20 cm spacing in flooded fields. Maintain 5–10 cm water depth during early growth. Use certified varieties suited to your region.";
            }
            if (/\b(wheat)\b/.test(lower)) {
                return "Wheat is best planted in cool, dry conditions. Sow seeds 3–5 cm deep at 15 cm row spacing. Ensure good soil moisture at planting. Use rust-resistant certified varieties for your region to reduce disease pressure.";
            }
            if (/\b(tomato)\b/.test(lower)) {
                return "Start tomato seedlings in a nursery for 4–6 weeks, then transplant to the field with 60 × 45 cm spacing. Plant in fertile, well-drained soil. Ensure consistent watering after transplant and stake plants early for support.";
            }
            if (/\b(bean|beans)\b/.test(lower)) {
                return "Beans are direct-seeded 3–5 cm deep with 40 × 10 cm spacing. They grow best in well-drained, slightly acidic soil. Avoid waterlogging at all stages. Plant at the start of the rains and ensure the seed bed is weed-free before planting.";
            }
            if (/\b(coffee)\b/.test(lower)) {
                return "Coffee seedlings are raised in a nursery for 6–12 months before transplanting. Space plants 2.5 × 2.5 m under partial shade. The soil must be deep, rich in organic matter, and well drained. Mulch heavily after planting.";
            }
            return "For best seeding results: prepare a firm, weed-free seedbed, plant at the recommended depth for your crop, ensure soil moisture at planting, and use certified seeds. Which crop are you seeding? I can give you specific spacing, depth, and timing advice.";
        }

        // Watering / irrigation
        if (/\b(water|watering|irrigat|drip|drought|dry|moisture)\b/.test(lower)) {
            return "Consistent and appropriate watering is critical. Apply water at the root zone, never on foliage in the evening. Drip irrigation reduces water use by up to 40% and lowers disease risk. During drought, mulch the soil surface and water in the early morning. Check soil moisture by pressing a finger 5 cm into the soil — if dry, it's time to water.";
        }

        // Fertilizer / nutrients
        if (/\b(fertilizer|fertilise|fertilize|nutrient|npk|nitrogen|phosphorus|potassium|compost|manure|top dress|top-dress|basal)\b/.test(lower)) {
            return "Apply basal fertilizer (e.g. NPK 15-15-15) at planting to support root development. Top-dress with nitrogen (e.g. CAN or Urea) at 4–6 weeks after emergence. Avoid over-applying nitrogen as it causes excess leaf growth at the expense of yield. Incorporate organic compost to improve soil structure and long-term fertility.";
        }

        // Pest control
        if (/\b(pest|insect|bug|worm|caterpillar|aphid|locust|grasshopper|mite|weevil|termite|invasion)\b/.test(lower)) {
            return "For pest control: first, identify the pest accurately — I can help if you describe what you see. For sucking pests like aphids, use neem-based or systemic insecticides. For caterpillars, use a pyrethroid spray in the evening when they are active. Always follow label dosage instructions and apply in the morning or evening to protect pollinators.";
        }

        // Disease
        if (/\b(disease|blight|rust|mildew|rot|wilt|fungus|fungal|bacteria|virus|mosaic|lesion|canker)\b/.test(lower)) {
            return "Fungal diseases are most common in humid conditions. Improve airflow by proper spacing, remove infected plant material, and apply copper-based or systemic fungicide every 7–10 days during wet periods. Bacterial diseases require copper-based bactericides. Viral infections have no cure — remove and destroy affected plants immediately to prevent spread.";
        }

        // Yellow leaves / leaf issues
        if (/\b(yellow|yellowing|pale|discolor|brown|spot|spots|leaf|leaves|wilting|wilt|curl|curling|drooping)\b/.test(lower)) {
            return "Leaf symptoms are typically caused by: (1) nutrient deficiency — yellowing between veins suggests iron or magnesium deficiency; overall yellowing suggests nitrogen deficiency; (2) fungal infection — brown or black spots with yellow halos; (3) overwatering — yellowing lower leaves with soft stems; (4) pests — curling or spotted leaves. Please describe the exact pattern and which leaves are affected so I can diagnose more precisely.";
        }

        // Fungicide / spray
        if (/\b(fungicide|spray|brand|chemical|pesticide|herbicide|agrochemical)\b/.test(lower)) {
            return "Use copper-based fungicides like Nordox or Kocide for broad-spectrum fungal and bacterial control. For soil-borne diseases, consider Ridomil or Mancozeb. Rotate between different chemical groups to prevent resistance. Always wear protective gear when spraying and observe the pre-harvest interval stated on the label.";
        }

        // Contagious / spreading
        if (/\b(contagious|spread|infect|transmit|neighbor|nearby)\b/.test(lower)) {
            return "Yes, most fungal and bacterial diseases spread through wind, water splash, contaminated tools, and infected crop debris. Isolate affected plants quickly. Sanitize tools with a 10% bleach solution between plants. Avoid walking through infected areas and then into healthy sections. Remove and burn — do not compost — heavily infected material.";
        }

        // Harvest
        if (/\b(harvest|harvesting|pick|mature|maturity|ready|ripe|yield|post-harvest|storage|store|dry)\b/.test(lower)) {
            return "Harvest when the crop reaches physiological maturity — yellow and dry husks for maize, brown and firm tubers for cassava, dry pods for beans. Harvest in dry weather to reduce post-harvest losses. Sort damaged produce immediately and store in a cool, dry, ventilated area. For long-term storage, treat grain with hermetic bags or approved storage chemicals to prevent weevil damage.";
        }

        // Soil / land preparation
        if (/\b(soil|land|till|tillage|bed|prepare|preparation|pH|acid|alkaline|test|organic matter|erosion)\b/.test(lower)) {
            return "Healthy soil is the foundation of good yields. Plough to 20–30 cm depth for most crops, then harrow to break clods. Test soil pH — most crops prefer pH 5.5–7.0. Apply lime if too acidic. Incorporate compost or green manure to improve structure and organic matter. Avoid tillage on wet soil to prevent compaction.";
        }

        // Weather / rain / climate
        if (/\b(weather|rain|rainfall|flood|wind|temperature|heat|cold|frost|climate|season|dry season|rainy season)\b/.test(lower)) {
            return "Weather greatly affects crop performance. Plant at the onset of rains to ensure good germination moisture. During heavy rains, ensure field drainage to avoid root rot. In dry spells, apply mulch to conserve soil moisture and water early in the morning. Extreme heat stresses crops at flowering — irrigate more frequently and avoid heavy nitrogen application during heat stress.";
        }

        // Cassava-specific
        if (/\b(cassava|manioc|yuca)\b/.test(lower)) {
            return "Cassava is a hardy crop but is sensitive to waterlogging. Key management tips: plant stem cuttings at 45° angle; apply potassium-rich fertilizer after 3 months; control mealybug and cassava mosaic disease early; harvest at 9–18 months depending on variety. Leave 3–4 buds on cuttings to ensure healthy sprouting.";
        }

        // Maize-specific
        if (/\b(maize|corn)\b/.test(lower)) {
            return "Maize requires well-drained fertile soil. Apply DAP at planting and top-dress with CAN or Urea at knee height. Key pests to watch: fall armyworm and maize stalk borer — spray with a pyrethroid + organophosphate mix when you see fresh frass in the whorl. Harvest when husks are dry and golden and kernels are hard.";
        }

        // Rice-specific
        if (/\b(rice)\b/.test(lower)) {
            return "Rice thrives in flooded conditions. Maintain a 5–10 cm water depth during vegetative growth. Apply nitrogen in splits — at transplanting and at tillering. Control weeds early as rice is highly competitive with weeds in the first 30 days. Watch for blast and brown planthopper, which are common in humid conditions.";
        }

        // Wheat-specific
        if (/\b(wheat)\b/.test(lower)) {
            return "Wheat does best in cool, dry climates with well-drained soils. Apply basal phosphorus at planting and top-dress nitrogen at tillering. Rust is the main disease threat — use rust-resistant certified varieties and apply triazole fungicides at first sign of pustules. Harvest when grain moisture drops to 12–14%.";
        }

        // Tomato-specific
        if (/\b(tomato)\b/.test(lower)) {
            return "Tomatoes need consistent moisture and staking support. Common issues: blossom end rot (calcium/water stress), late blight (fungal — spray preventatively), and fruit fly (use protein bait or yellow sticky traps). Apply balanced fertilizer at planting and switch to low-nitrogen, high-potassium fertilizer during fruiting.";
        }

        // Beans-specific
        if (/\b(bean|beans)\b/.test(lower)) {
            return "Beans fix nitrogen and build soil health. Do not over-fertilize with nitrogen. Key threats: bean fly (treat seeds with thiamethoxam), angular leaf spot (use copper fungicide), and bean stem maggot. Harvest when pods are dry and browning. Dry beans well to 12% moisture before storage to prevent mold.";
        }

        // Coffee-specific
        if (/\b(coffee)\b/.test(lower)) {
            return "Coffee needs well-drained, fertile soil with good organic matter. Mulch around trees to retain moisture. Key issues: coffee berry borer (use Beauveria bassiana biological control or endosulfan), coffee leaf rust (spray copper+mancozeb at berry formation), and antestia bug. Prune annually after harvest for better light penetration and yield.";
        }

        // Weed control
        if (/\b(weed|weeding|weedicide|herbicide|grass|clear|compete)\b/.test(lower)) {
            return "Weeds can reduce yields by 30–80% if uncontrolled in the first 4–6 weeks. Weed early and at least twice before canopy closure. Use pre-emergence herbicides immediately after planting and before weeds emerge. For broad-leaf weeds in cereals, use selective post-emergence herbicides. Manual weeding is effective but labor-intensive — combine with mulching to suppress regrowth.";
        }

        // Spacing / distance
        if (/\b(spacing|space|distance|density|plants per)\b/.test(lower)) {
            return "Correct spacing determines yield potential. General guidelines: Maize — 75 × 25 cm; Beans — 40 × 10 cm; Tomatoes — 60 × 45 cm; Cassava — 1 m × 1 m; Rice — 20 × 20 cm; Coffee — 2.5 × 2.5 m. Which crop are you asking about? I can give the exact recommended spacing and population per hectare.";
        }

        // Yield / low yield / productivity
        if (/\b(yield|production|output|low yield|poor harvest|productive|productivity)\b/.test(lower)) {
            return "Low yields are commonly caused by: poor soil fertility, incorrect plant spacing, late planting, uncontrolled weeds in early growth, pest or disease damage, or drought stress at flowering. Diagnose the most limiting factor on your farm and address it first. A soil test before the next season is highly recommended to identify nutrient gaps.";
        }

        // Mulching
        if (/\b(mulch|mulching|cover|plastic cover|straw)\b/.test(lower)) {
            return "Mulching is one of the most cost-effective practices on any farm. It conserves soil moisture, suppresses weeds, regulates soil temperature, and adds organic matter as it decomposes. Use dry grass, crop residue, or black plastic mulch. Apply 5–10 cm thick around plants but keep mulch away from the base of the stem to prevent stem rot.";
        }

        // Organic farming
        if (/\b(organic|natural|chemical-free|no chemical|biologic|compost|green manure)\b/.test(lower)) {
            return "Organic farming builds long-term soil health. Use compost or well-rotted manure at 5–10 tonnes per hectare. For pest control, use neem extract, pyrethrin sprays, or Beauveria bassiana. Practice crop rotation and intercropping to naturally suppress pests and diseases. Certification requires 3 years of chemical-free management — contact your local organic certification body for guidance.";
        }

        // Intercropping / rotation
        if (/\b(intercrop|intercropping|mixed crop|rotation|rotate|fallow)\b/.test(lower)) {
            return "Intercropping maize with beans is a classic combination — beans fix nitrogen while maize provides physical support. For crop rotation, avoid planting the same crop family in the same field in consecutive seasons to break pest and disease cycles. A typical rotation: cereals → legumes → root crops → fallow or cover crop.";
        }

        // Thank you / done
        if (/\b(thank|thanks|appreciate|great|perfect|got it|understood|noted|okay|ok|alright)\b/.test(lower)) {
            return "You're welcome! Feel free to ask any time. I'm available whenever you need crop advice, whether it's planting time, dealing with a new pest, or preparing for harvest. Good luck on your farm!";
        }

        // Goodbye
        if (/\b(bye|goodbye|see you|later|take care)\b/.test(lower)) {
            return "Take care and happy farming! Come back any time you need advice. I wish you a great harvest this season!";
        }

        // Catch-all — intelligent context prompt rather than blank refusal
        const words = lower.split(/\s+/).filter(Boolean);
        const likelyCrop = ["cassava", "maize", "corn", "rice", "wheat", "tomato", "beans", "coffee"].find(
            (c) => words.includes(c)
        );
        const likelyTopic = [
            ["plant", "seed", "grow", "germinate"],
            ["disease", "pest", "insect", "spray"],
            ["water", "irrigate", "drought"],
            ["fertilizer", "nutrient", "manure"],
            ["harvest", "storage", "yield"],
        ].find((group) => group.some((kw) => lower.includes(kw)));

        if (likelyCrop && likelyTopic) {
            return `I want to make sure I give you the right advice for your ${likelyCrop}. Could you tell me: how old are the plants, what exactly are you observing, and has anything changed recently on the farm — such as heavy rain, new fertilizer, or new pests? That will help me respond precisely.`;
        }

        return "Great question! To give you the most accurate answer, could you tell me: (1) which crop you are growing, (2) the plant's current growth stage, and (3) the specific problem or task you need help with? I'm here to help with planting, pest control, fertilizer, irrigation, harvesting, and more.";
    };

    const enqueueOfficerReply = async (userText) => {
        setPendingReplies((count) => count + 1);

        try {
            const response = await apiFetch("/support/reply", {
                method: "POST",
                body: JSON.stringify({ message: userText }),
            });

            if (!response.ok) {
                throw new Error("Reply endpoint unavailable");
            }

            const payload = await response.json();
            const officerTime = new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
            });

            setMessages((prev) => [
                ...prev,
                {
                    id: Date.now() + Math.random(),
                    sender: "officer",
                    time: payload?.time || officerTime,
                    content:
                        payload?.reply ||
                        payload?.content ||
                        "I have received your message and will assist shortly.",
                },
            ]);

            if (Array.isArray(payload?.quick_replies) && payload.quick_replies.length) {
                setQuickReplies(payload.quick_replies);
            }
        } catch {
            // Backend unavailable — try Gemini AI, fall back to local keywords
            const geminiKey = import.meta.env.VITE_GEMINI_API_KEY;
            let replied = false;

            if (geminiKey && geminiKey !== "your_gemini_api_key_here") {
                try {
                    const systemPrompt =
                        "You are Officer Sarah, a friendly and knowledgeable agricultural extension officer. " +
                        "You only answer questions related to farming, crops, soil, pests, diseases, irrigation, fertilizer, harvesting, and related agricultural topics. " +
                        "Keep answers practical, concise (3–6 sentences), and targeted at smallholder farmers in sub-Saharan Africa. " +
                        "If the question is not about farming or agriculture, politely redirect the user to ask an agricultural question. " +
                        "Do not use markdown formatting — reply in plain text only.";

                    const geminiRes = await fetch(
                        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
                        {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                system_instruction: {
                                    parts: [{ text: systemPrompt }],
                                },
                                contents: [
                                    { role: "user", parts: [{ text: userText }] },
                                ],
                                generationConfig: {
                                    temperature: 0.4,
                                    maxOutputTokens: 300,
                                },
                            }),
                        },
                    );

                    if (geminiRes.ok) {
                        const geminiData = await geminiRes.json();
                        const aiText =
                            geminiData?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

                        if (aiText) {
                            const officerTime = new Date().toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                            });
                            setMessages((prev) => [
                                ...prev,
                                {
                                    id: Date.now() + Math.random(),
                                    sender: "officer",
                                    time: officerTime,
                                    content: aiText,
                                },
                            ]);
                            replied = true;
                        }
                    }
                } catch {
                    // Gemini failed — fall through to local keywords
                }
            }

            if (!replied) {
                window.setTimeout(() => {
                    const officerTime = new Date().toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                    });
                    setMessages((prev) => [
                        ...prev,
                        {
                            id: Date.now() + Math.random(),
                            sender: "officer",
                            time: officerTime,
                            content: getOfficerReply(userText),
                        },
                    ]);
                }, 900);
            }
        } finally {
            setPendingReplies((count) => Math.max(0, count - 1));
        }
    };

    const sendMessage = (presetText) => {
        const sourceText = typeof presetText === "string" ? presetText : messageDraft;
        const trimmed = sourceText.trim();
        if (!trimmed) {
            return;
        }

        const now = new Date();
        const nextMessage = {
            id: Date.now(),
            sender: "farmer",
            time: now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            content: trimmed,
        };

        setMessages((prev) => [...prev, nextMessage]);
        setMessageDraft("");
        enqueueOfficerReply(trimmed);
    };

    return {
        messageDraft,
        setMessageDraft,
        pendingReplies,
        messages,
        quickReplies,
        apiError,
        isLoadingChat,
        isOfficerTyping: pendingReplies > 0,
        sendMessage,
    };
}
