import axios from "axios";
import FormData from "form-data";
import { db } from "../config/db.js";
import { ENV } from "../config/env.js";
import { diseasePredictionsTable } from "../schema/index.js";

/**
 * Call ML microservice to predict disease from leaf image.
 * @param {Buffer} imageBuffer
 * @param {string} mimetype
 * @param {string} crop - tomato, maize, potato
 * @returns {Promise<{ class, predictedDisease, generalName, confidence, leaf_check, probabilities }>}
 */
export const callDiseasePredict = async (imageBuffer, mimetype, crop) => {
  const baseUrl = (ENV.DISEASE_API_BASE_URL || "").replace(/\/$/, "");
  if (!baseUrl) {
    const err = new Error("Disease prediction API is not configured (DISEASE_API_BASE_URL)");
    err.statusCode = 503;
    throw err;
  }
  const form = new FormData();
  form.append("file", imageBuffer, { filename: "leaf.jpg", contentType: mimetype || "image/jpeg" });
  form.append("crop", crop);
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
