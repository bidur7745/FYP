import { uploadToCloudinary } from "../services/uploadService.js";
import {
  callDiseasePredict,
  saveDiseasePrediction,
  countPredictionsByUserInRange,
} from "../services/diseasePredictionService.js";
import {
  getSubscriptionByUserId,
  isSubscriptionActive,
} from "../services/subscriptionService.js";

const MONTHLY_FREE_SCAN_LIMIT = 10;

function getCurrentMonthWindow() {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return { monthStart, nextMonthStart };
}

export const getDiseaseScanQuotaController = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const sub = await getSubscriptionByUserId(userId);
    const hasPremium = isSubscriptionActive(sub);
    const { monthStart, nextMonthStart } = getCurrentMonthWindow();

    if (hasPremium) {
      return res.status(200).json({
        success: true,
        quota: {
          isPremium: true,
          limit: null,
          used: 0,
          remaining: null,
          resetAt: nextMonthStart.toISOString(),
        },
      });
    }

    const used = await countPredictionsByUserInRange(
      userId,
      monthStart,
      nextMonthStart
    );

    return res.status(200).json({
      success: true,
      quota: {
        isPremium: false,
        limit: MONTHLY_FREE_SCAN_LIMIT,
        used,
        remaining: Math.max(0, MONTHLY_FREE_SCAN_LIMIT - used),
        resetAt: nextMonthStart.toISOString(),
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch scan quota",
    });
  }
};

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

    let hasPremium = false;
    // Limit non-premium farmers to 10 scans per calendar month.
    if (req.user?.role === "user") {
      const sub = await getSubscriptionByUserId(userId);
      hasPremium = isSubscriptionActive(sub);

      if (!hasPremium) {
        const { monthStart, nextMonthStart } = getCurrentMonthWindow();
        const usedThisMonth = await countPredictionsByUserInRange(
          userId,
          monthStart,
          nextMonthStart
        );

        if (usedThisMonth >= MONTHLY_FREE_SCAN_LIMIT) {
          return res.status(429).json({
            success: false,
            message:
              "Monthly free scan limit reached (10). Upgrade to Premium to continue scanning.",
            code: "MONTHLY_SCAN_LIMIT_REACHED",
            used: usedThisMonth,
            limit: MONTHLY_FREE_SCAN_LIMIT,
            resetAt: nextMonthStart.toISOString(),
          });
        }
      }
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

    const { monthStart, nextMonthStart } = getCurrentMonthWindow();
    const usedThisMonth =
      req.user?.role === "user"
        ? await countPredictionsByUserInRange(userId, monthStart, nextMonthStart)
        : 0;

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
      quota:
        req.user?.role === "user"
          ? {
              isPremium: hasPremium,
              limit: hasPremium ? null : MONTHLY_FREE_SCAN_LIMIT,
              used: hasPremium ? 0 : usedThisMonth,
              remaining: hasPremium
                ? null
                : Math.max(0, MONTHLY_FREE_SCAN_LIMIT - usedThisMonth),
              resetAt: nextMonthStart.toISOString(),
            }
          : null,
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

