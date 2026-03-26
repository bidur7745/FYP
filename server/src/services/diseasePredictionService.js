import axios from "axios";
import FormData from "form-data";
import { db } from "../config/db.js";
import { ENV } from "../config/env.js";
import { diseasePredictionsTable } from "../schema/index.js";
import { and, eq, gte, lt, sql } from "drizzle-orm";

function formatLeafValidationMessage(rawMessage) {
  if (!rawMessage) return "";
  const match = rawMessage.match(/leaf_confidence\s*=\s*([0-9]*\.?[0-9]+)/i);
  if (!match) return rawMessage;
  const n = Number(match[1]);
  if (Number.isNaN(n)) return rawMessage;
  const percent = n <= 1 ? n * 100 : n;
  const rounded = Math.max(0, Math.min(100, Math.round(percent * 10) / 10));
  const label = /predicted\s*=\s*['"]?other['"]?/i.test(rawMessage)
    ? "non-leaf confidence"
    : "leaf confidence";
  return rawMessage.replace(match[0], `${label}=${rounded}%`);
}

/**
 * Call ML microservice to predict disease from leaf image.
 * @param {Buffer} imageBuffer
 * @param {string} mimetype
 * @param {string} crop - tomato, maize, potato
 * @returns {Promise<{ class, predictedDisease, generalName, confidence, leaf_check, probabilities }>}
 */
export const callDiseasePredict = async (imageBuffer, mimetype, crop) => {
  const baseUrl = (ENV.AI_API_BASE_URL || "").replace(/\/$/, "");
  if (!baseUrl) {
    const err = new Error("AI API is not configured (AI_API_BASE_URL)");
    err.statusCode = 503;
    throw err;
  }
  const form = new FormData();
  form.append("file", imageBuffer, { filename: "leaf.jpg", contentType: mimetype || "image/jpeg" });
  form.append("crop", crop);
  try {
    const response = await axios.post(`${baseUrl}/predict`, form, {
      headers: form.getHeaders(),
      maxBodyLength: Infinity,
      timeout: 60000,
    });
    const data = response.data || {};
    return {
      class: data.class ?? data.predicted_disease ?? data.predictedDisease,
      predictedDisease: data.predicted_disease ?? data.predictedDisease ?? data.class,
      generalName: data.general_name ?? data.generalName,
      confidence: data.confidence ?? data.disease_confidence ?? 0,
      leaf_check: data.leaf_check ?? data.leafCheck,
      probabilities: data.probabilities ?? {},
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const detail = error.response?.data?.detail;
      const message =
        (typeof detail === "string" && detail) ||
        (Array.isArray(detail) && detail.length && detail[0]?.msg) ||
        error.response?.data?.message ||
        "";
      const friendlyMessage = formatLeafValidationMessage(message);

      const err = new Error(
        friendlyMessage || "Unable to analyze this image. Please upload a clear crop leaf image."
      );
      err.statusCode = status && status >= 400 && status < 500 ? status : 502;
      throw err;
    }
    throw error;
  }
};

/**
 * Save prediction to disease_predictions table.
 */
export const saveDiseasePrediction = async (payload) => {
  const [row] = await db
    .insert(diseasePredictionsTable)
    .values({
      userId: payload.userId,
      crop: payload.crop,
      predictedDisease: payload.predictedDisease,
      generalName: payload.generalName ?? null,
      imageUrl: payload.imageUrl ?? null,
      diseaseConfidence: String(payload.diseaseConfidence ?? 0),
    })
    .returning();
  return row;
};

export const countPredictionsByUserInRange = async (userId, startDate, endDate) => {
  const [row] = await db
    .select({ count: sql`count(*)::int` })
    .from(diseasePredictionsTable)
    .where(
      and(
        eq(diseasePredictionsTable.userId, Number(userId)),
        gte(diseasePredictionsTable.createdAt, startDate),
        lt(diseasePredictionsTable.createdAt, endDate)
      )
    );
  return Number(row?.count ?? 0);
};
