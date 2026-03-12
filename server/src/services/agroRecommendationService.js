import { db } from "../config/db.js";
import { agroRecommendationsTable, cropsTable } from "../schema/index.js";
import { eq, and } from "drizzle-orm";
import { ENV } from "../config/env.js";

const CACHE_MAX_AGE_DAYS = 7;

function buildPrompt(crop, lang) {
  const { cropName, season, soilType, regions, climate, waterRequirement } = crop;
  const regionStr = Array.isArray(regions) ? regions.join(", ") : regions || "Nepal";

  const langInstruction =
    lang === "ne"
      ? `IMPORTANT: Write ALL text values (overview, soilPreparation, all name/nepaliName/dosage/timing/method/actions/tips/warnings/estimatedCostNPR/safetyPeriod fields) in Nepali (नेपाली) language.
Keep JSON keys in English exactly as specified above.
Use Nepali units where appropriate (e.g., "रोपनी" alongside "hectare", "केजी" instead of "kg").
Product names can remain in English/scientific form but always fill the nepaliName field in Nepali.`
      : `Write all text values in English. Fill the nepaliName field with the Nepali name of each product where known, otherwise leave it empty.`;

  return `You are an expert agricultural advisor specializing in fertilizer, pesticide, herbicide, and organic manure recommendations for small-scale farmers in Nepal.

Crop Details:
- Crop: ${cropName}
- Season: ${season || "Not specified"}
- Soil Type: ${soilType || "Not specified"}
- Region: ${regionStr}
- Climate: ${climate || "Not specified"}
- Water Requirement: ${waterRequirement || "Not specified"}

Provide a detailed, comprehensive recommendation for growing "${cropName}" in the ${regionStr} region of Nepal during ${season || "the appropriate"} season, ensuring it includes the use of fertilizers, organic manure, pesticides, insecticides, and herbicides, tailored for farmers with limited resources.

Your response MUST be a valid JSON object with exactly these fields:

{
  "cropName": "${cropName}",
  "overview": "2-3 sentence overview of the crop's nutrient needs, pest issues, and specific considerations for its growth in Nepal.",
  "soilPreparation": "How to prepare the soil before planting, including local practices (2-3 sentences).",
  "fertilizers": [
    {
      "name": "Fertilizer name (e.g., Urea, DAP, Compost)",
      "nepaliName": "नेपाली नाम",
      "type": "Chemical | Organic | Bio",
      "dosage": "Amount per hectare or per ropani",
      "timing": "When to apply",
      "method": "How to apply",
      "estimatedCostNPR": "Approximate cost in Nepali Rupees (e.g., Rs 2,500 per 50kg bag)"
    }
  ],
  "pesticides_and_insecticides": [
    {
      "name": "Product name",
      "nepaliName": "नेपाली नाम",
      "type": "Chemical | Organic",
      "targetPest": "Which pest or insect it targets",
      "dosage": "Amount per hectare or concentration",
      "timing": "When to apply",
      "method": "How to apply",
      "safetyPeriod": "Minimum days between last application and harvest",
      "estimatedCostNPR": "Approximate cost"
    }
  ],
  "herbicides_and_weedicides": [
    {
      "name": "Product name",
      "nepaliName": "नेपाली नाम",
      "type": "Chemical | Organic",
      "targetWeed": "Which weeds it controls",
      "dosage": "Amount per hectare or concentration",
      "timing": "When to apply",
      "method": "How to apply",
      "estimatedCostNPR": "Approximate cost"
    }
  ],
  "schedule": [
    {
      "stage": "Stage name relative to crop lifecycle (e.g., Soil Preparation, Planting, Vegetative Growth, Flowering, Pre-Harvest)",
      "timing": "When this stage occurs (e.g., 1-2 weeks before planting, At transplanting, 30 DAP)",
      "actions": ["Action 1 with specific product and dosage", "Action 2"]
    }
  ],
  "tips": [
    "Practical, actionable tip for small-scale Nepali farmers"
  ],
  "warnings": [
    "Important safety or cautionary warning"
  ]
}

Provide at least 3 fertilizer recommendations (including at least 1 organic manure), at least 2 pesticide/insecticide entries, at least 1 herbicide, and at least 4 stages in the schedule. Include estimated costs in NPR where possible.

${langInstruction}

Respond ONLY with the JSON object, no extra text, no markdown fences.`;
}

async function callDeepSeek(prompt) {
  const res = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${ENV.DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      max_tokens: 4096,
    }),
  });

  if (!res.ok) {
    const errBody = await res.text().catch(() => "");
    throw new Error(`DeepSeek API error ${res.status}: ${errBody}`);
  }

  const data = await res.json();
  const raw = data.choices?.[0]?.message?.content?.trim();
  if (!raw) throw new Error("Empty response from DeepSeek");

  const cleaned = raw.replace(/^```json?\s*/i, "").replace(/```\s*$/i, "").trim();
  return JSON.parse(cleaned);
}

export async function getAgroRecommendation(cropId, lang = "en") {
  const validLang = lang === "ne" ? "ne" : "en";

  const [cached] = await db
    .select()
    .from(agroRecommendationsTable)
    .where(
      and(
        eq(agroRecommendationsTable.cropId, cropId),
        eq(agroRecommendationsTable.language, validLang)
      )
    )
    .limit(1);

  if (cached) {
    const age = Date.now() - new Date(cached.generatedAt).getTime();
    if (age < CACHE_MAX_AGE_DAYS * 24 * 60 * 60 * 1000) {
      return { source: "cache", data: cached.responseJson };
    }
  }

  const [crop] = await db
    .select()
    .from(cropsTable)
    .where(eq(cropsTable.cropId, cropId))
    .limit(1);

  if (!crop) throw new Error("Crop not found");

  const prompt = buildPrompt(crop, validLang);
  const parsed = await callDeepSeek(prompt);

  if (cached) {
    await db
      .update(agroRecommendationsTable)
      .set({ responseJson: parsed, generatedAt: new Date() })
      .where(eq(agroRecommendationsTable.id, cached.id));
  } else {
    await db.insert(agroRecommendationsTable).values({
      cropId,
      language: validLang,
      responseJson: parsed,
    });
  }

  return { source: "ai", data: parsed };
}
