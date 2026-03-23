import axios from "axios";
import { and, desc, eq, ilike, sql } from "drizzle-orm";
import { db } from "../config/db.js";
import {
  cropsTable,
  generatedPlantationGuidesTable,
  plantationGuidesTable,
} from "../schema/index.js";
import { ENV } from "../config/env.js";
import { generateAgroRecommendationFromCropProfile } from "./agroRecommendationService.js";

const DEFAULT_TOP_K = 3;

const normalizeCropName = (name) =>
  String(name || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");

const cropNameAliases = {
  corn: "maize",
  paddy: "rice",
};

function resolveCropLookupName(name) {
  const normalized = normalizeCropName(name);
  return cropNameAliases[normalized] || normalized;
}

async function callCropRecommendationApi(payload) {
  const baseUrl = (ENV.AI_API_BASE_URL || "").replace(/\/$/, "");
  if (!baseUrl) {
    const err = new Error(
      "AI API is not configured (AI_API_BASE_URL)"
    );
    err.statusCode = 503;
    throw err;
  }

  const response = await axios.post(`${baseUrl}/crop-recommend`, payload, {
    timeout: 60000,
  });
  return response.data || {};
}

async function findCropByRecommendedName(recommendedName) {
  const lookupName = resolveCropLookupName(recommendedName);
  const [crop] = await db
    .select()
    .from(cropsTable)
    .where(sql`lower(${cropsTable.cropName}) = ${lookupName}`)
    .limit(1);

  if (crop) return crop;

  const [fuzzy] = await db
    .select()
    .from(cropsTable)
    .where(ilike(cropsTable.cropName, `%${lookupName}%`))
    .limit(1);
  return fuzzy || null;
}

async function getPlantationGuideByCropId(cropId) {
  const [guide] = await db
    .select()
    .from(plantationGuidesTable)
    .where(eq(plantationGuidesTable.cropId, cropId))
    .limit(1);
  return guide || null;
}

export async function getRecommendationsWithGuides(inputPayload) {
  const payload = {
    N: Number(inputPayload.N),
    P: Number(inputPayload.P),
    K: Number(inputPayload.K),
    temperature: Number(inputPayload.temperature),
    humidity: Number(inputPayload.humidity),
    ph: Number(inputPayload.ph),
    rainfall: Number(inputPayload.rainfall),
    top_k: Number(inputPayload.top_k || DEFAULT_TOP_K),
  };

  const aiResult = await callCropRecommendationApi(payload);
  const recommendations = Array.isArray(aiResult.recommendations)
    ? aiResult.recommendations
    : [];

  const enriched = [];
  for (const rec of recommendations) {
    const recommendedCropName = String(rec.cropName || "").trim();
    const crop = await findCropByRecommendedName(recommendedCropName);

    if (!crop) {
      enriched.push({
        cropName: recommendedCropName,
        score: rec.score ?? null,
        foundInDatabase: false,
        message:
          "Recommended crop is not found in our database yet. We will update it soon.",
        actions: {
          canGenerateWithDeepSeek: true,
          buttonLabel: "Generate Guide with DeepSeek",
        },
      });
      continue;
    }

    const guide = await getPlantationGuideByCropId(crop.cropId);
    enriched.push({
      cropName: recommendedCropName,
      score: rec.score ?? null,
      foundInDatabase: true,
      crop: {
        cropId: crop.cropId,
        cropName: crop.cropName,
        cropCategory: crop.cropCategory,
        season: crop.season,
        regions: crop.regions,
        soilType: crop.soilType,
        climate: crop.climate,
        waterRequirement: crop.waterRequirement,
        imageUrl: crop.imageUrl,
      },
      plantationGuide: guide,
      guideAvailable: Boolean(guide),
      guideMessage: guide
        ? null
        : "Crop found, but plantation guide is not available yet.",
    });
  }

  return {
    inputs: payload,
    recommendations: enriched,
  };
}

export async function generateMissingCropGuide({
  cropName,
  language = "en",
  generatedByUserId,
}) {
  const normalizedCropName = normalizeCropName(cropName);
  if (!normalizedCropName) {
    throw new Error("cropName is required");
  }

  const lang = language === "ne" ? "ne" : "en";
  const cropProfile = {
    cropName: normalizedCropName,
    season: "Not specified",
    soilType: "Not specified",
    regions: ["Nepal"],
    climate: "Not specified",
    waterRequirement: "Not specified",
  };

  const generated = await generateAgroRecommendationFromCropProfile(cropProfile, lang);

  const [saved] = await db
    .insert(generatedPlantationGuidesTable)
    .values({
      cropName: cropName.trim(),
      normalizedCropName,
      language: lang,
      responseJson: generated,
      source: "deepseek",
      reviewStatus: "pending",
      generatedByUserId: generatedByUserId || null,
    })
    .returning();

  return saved;
}

export async function listGeneratedPlantationGuides(status) {
  const validStatus =
    status && ["pending", "approved", "rejected"].includes(status) ? status : null;
  const query = db
    .select()
    .from(generatedPlantationGuidesTable)
    .orderBy(desc(generatedPlantationGuidesTable.createdAt));

  if (!validStatus) {
    return query;
  }
  return query.where(eq(generatedPlantationGuidesTable.reviewStatus, validStatus));
}

export async function updateGeneratedGuideReviewStatus({ id, status, reviewedByUserId }) {
  if (!["pending", "approved", "rejected"].includes(status)) {
    throw new Error("Invalid review status");
  }

  const [updated] = await db
    .update(generatedPlantationGuidesTable)
    .set({
      reviewStatus: status,
      reviewedByUserId: reviewedByUserId || null,
      updatedAt: new Date(),
    })
    .where(eq(generatedPlantationGuidesTable.id, id))
    .returning();

  if (!updated) {
    throw new Error("Generated guide not found");
  }
  return updated;
}

export async function attachGeneratedGuideToExistingCrop({
  generatedGuideId,
  cropId,
  reviewedByUserId,
}) {
  const [generatedGuide] = await db
    .select()
    .from(generatedPlantationGuidesTable)
    .where(eq(generatedPlantationGuidesTable.id, generatedGuideId))
    .limit(1);

  if (!generatedGuide) {
    throw new Error("Generated guide not found");
  }

  const [crop] = await db.select().from(cropsTable).where(eq(cropsTable.cropId, cropId)).limit(1);
  if (!crop) {
    throw new Error("Crop not found");
  }

  const [existingGuide] = await db
    .select()
    .from(plantationGuidesTable)
    .where(eq(plantationGuidesTable.cropId, cropId))
    .limit(1);

  const data = generatedGuide.responseJson || {};
  const schedule = Array.isArray(data.schedule) ? data.schedule : [];
  const processActions = schedule.flatMap((stage) =>
    Array.isArray(stage?.actions) ? stage.actions : []
  );

  if (existingGuide) {
    await db
      .update(plantationGuidesTable)
      .set({
        seedPreparation: data.soilPreparation || existingGuide.seedPreparation,
        plantingMethod: data.overview || existingGuide.plantingMethod,
        irrigationSchedule: data.tips?.join(" | ") || existingGuide.irrigationSchedule,
        harvestingTips: data.warnings?.join(" | ") || existingGuide.harvestingTips,
        plantationProcess:
          processActions.length > 0 ? processActions : existingGuide.plantationProcess,
      })
      .where(eq(plantationGuidesTable.guideId, existingGuide.guideId));
  } else {
    await db.insert(plantationGuidesTable).values({
      cropId,
      seedPreparation: data.soilPreparation || null,
      plantingMethod: data.overview || null,
      irrigationSchedule: Array.isArray(data.tips) ? data.tips.join(" | ") : null,
      harvestingTips: Array.isArray(data.warnings) ? data.warnings.join(" | ") : null,
      averageYield: null,
      videoUrl: null,
      spacing: null,
      maturityPeriod: null,
      plantationProcess: processActions,
    });
  }

  const [updatedGenerated] = await db
    .update(generatedPlantationGuidesTable)
    .set({
      reviewStatus: "approved",
      reviewedByUserId: reviewedByUserId || null,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(generatedPlantationGuidesTable.id, generatedGuideId),
        eq(generatedPlantationGuidesTable.reviewStatus, generatedGuide.reviewStatus)
      )
    )
    .returning();

  return { generatedGuide: updatedGenerated || generatedGuide, cropId };
}
