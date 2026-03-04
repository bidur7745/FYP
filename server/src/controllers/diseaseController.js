import { uploadToCloudinary } from "../services/uploadService.js";
import { callDiseasePredict, saveDiseasePrediction } from "../services/diseasePredictionService.js";

/**
 * POST /api/disease/predict
 * Multipart: file (image), crop (string)
 */
export const predictDiseaseController = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { crop } = req.body || {};
    const file = req.file;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    if (!file) {
      return res.status(400).json({
        success: false,
        message: "Image file is required",
      });
    }

    const allowedCrops = ["tomato", "maize", "potato"];
    const normalizedCrop = (crop || "").toLowerCase().trim();
    if (!allowedCrops.includes(normalizedCrop)) {
      return res.status(400).json({
        success: false,
        message: `Invalid crop. Choose one of: ${allowedCrops.join(", ")}`,
      });
    }

    // Upload image first so we can save URL with prediction
    const uploadResult = await uploadToCloudinary(
      file.buffer,
      file.mimetype,
      "disease-detection"
    );

    // Call FastAPI microservice
    const mlResult = await callDiseasePredict(
      file.buffer,
      file.mimetype,
      normalizedCrop
    );

    const predictedDisease = mlResult.class || mlResult.predictedDisease || "unknown";
    const generalName = mlResult.generalName || predictedDisease;
    const diseaseConfidence =
      typeof mlResult.confidence === "number"
        ? mlResult.confidence
        : Number(mlResult.confidence || 0);

    const saved = await saveDiseasePrediction({
      userId,
      crop: normalizedCrop,
      predictedDisease,
      generalName,
      imageUrl: uploadResult.url,
      diseaseConfidence,
    });

    return res.status(200).json({
      success: true,
      predictionId: saved.id,
      crop: saved.crop,
      predictedDisease: saved.predictedDisease,
      generalName: saved.generalName,
      diseaseConfidence: Number(saved.diseaseConfidence),
      imageUrl: saved.imageUrl,
      leafCheck: mlResult.leaf_check || null,
      probabilities: mlResult.probabilities || {},
    });
  } catch (error) {
    if (error.statusCode && error.statusCode >= 400 && error.statusCode < 500) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to run disease prediction",
    });
  }
};

