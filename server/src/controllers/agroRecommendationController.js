import { getAgroRecommendation } from "../services/agroRecommendationService.js";

export const getAgroRecommendationController = async (req, res) => {
  try {
    const cropId = parseInt(req.params.cropId, 10);
    if (!cropId || isNaN(cropId)) {
      return res.status(400).json({ success: false, message: "Valid cropId is required" });
    }

    const lang = req.query.lang === "ne" ? "ne" : "en";
    const result = await getAgroRecommendation(cropId, lang);

    return res.status(200).json({
      success: true,
      source: result.source,
      recommendation: result.data,
    });
  } catch (error) {
    console.error("Agro recommendation error:", error.message);

    if (error.message === "Crop not found") {
      return res.status(404).json({ success: false, message: "Crop not found" });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to get agro recommendation",
      error: error.message,
    });
  }
};
