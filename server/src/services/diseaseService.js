import { ENV } from "../config/env.js";
import { db } from "../config/db.js";
import { diseasePredictionsTable } from "../schema/index.js";

/**
 * Call the FastAPI disease prediction service.
 * Expects FastAPI running at ENV.DISEASE_API_BASE_URL with /predict endpoint.
 */
export const callDiseasePredict = async (buffer, mimetype, crop) => {
  if (!ENV.DISEASE_API_BASE_URL) {
    throw new Error("DISEASE_API_BASE_URL is not configured");
  }

  // Normalize base URL to avoid '//' when concatenating paths
  const baseUrl = ENV.DISEASE_API_BASE_URL.replace(/\/+$/, "");

  const formData = new FormData();
  const fileName = `leaf-${Date.now()}.jpg`;
  const blob = new Blob([buffer], { type: mimetype || "image/jpeg" });
  formData.append("file", blob, fileName);
  formData.append("crop", crop);

  const response = await fetch(`${baseUrl}/predict`, {
    method: "POST",
    body: formData,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message =
      data?.detail ||
      data?.message ||
      data?.error ||
      "Disease prediction failed";
    const err = new Error(message);
    // Preserve original status so controller can return proper 4xx/5xx
    err.statusCode = response.status;
    throw err;
  }

  return data;
};

/**
 * Save a prediction record to the database.
 */
export const saveDiseasePrediction = async (payload) => {
  const {
    userId,
    crop,
    predictedDisease,
    generalName,
    imageUrl,
    diseaseConfidence,
  } = payload;

  const [row] = await db
    .insert(diseasePredictionsTable)
    .values({
      userId,
      crop,
      predictedDisease,
      generalName,
      imageUrl,
      diseaseConfidence: String(
        typeof diseaseConfidence === "number"
          ? diseaseConfidence.toFixed(4)
          : diseaseConfidence
      ),
    })
    .returning();

  return row;
};

