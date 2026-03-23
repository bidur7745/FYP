import {
  attachGeneratedGuideToExistingCrop,
  generateMissingCropGuide,
  getRecommendationsWithGuides,
  listGeneratedPlantationGuides,
  updateGeneratedGuideReviewStatus,
} from "../services/cropRecommendationService.js";

export const recommendCropsWithGuidesController = async (req, res) => {
  try {
    const result = await getRecommendationsWithGuides(req.body || {});
    return res.status(200).json({
      success: true,
      message: "Crop recommendations retrieved successfully",
      data: result,
    });
  } catch (error) {
    const statusCode = error.statusCode && error.statusCode >= 400 ? error.statusCode : 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || "Failed to fetch crop recommendations",
    });
  }
};

export const generateMissingCropGuideController = async (req, res) => {
  try {
    const { cropName, language } = req.body || {};
    if (!cropName || typeof cropName !== "string") {
      return res.status(400).json({
        success: false,
        message: "cropName is required",
      });
    }

    const generated = await generateMissingCropGuide({
      cropName,
      language,
      generatedByUserId: req.user?.id || null,
    });

    return res.status(201).json({
      success: true,
      message: "Guide generated and submitted for admin review",
      generatedGuide: generated,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to generate guide",
    });
  }
};

export const listGeneratedGuidesController = async (req, res) => {
  try {
    const status = req.query.status;
    const guides = await listGeneratedPlantationGuides(status);
    return res.status(200).json({
      success: true,
      count: guides.length,
      guides,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch generated guides",
    });
  }
};

export const updateGeneratedGuideStatusController = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { status } = req.body || {};
    if (!id || Number.isNaN(id)) {
      return res.status(400).json({ success: false, message: "Valid id is required" });
    }
    if (!status) {
      return res.status(400).json({ success: false, message: "status is required" });
    }

    const updated = await updateGeneratedGuideReviewStatus({
      id,
      status,
      reviewedByUserId: req.user?.id || null,
    });

    return res.status(200).json({
      success: true,
      message: "Guide review status updated",
      guide: updated,
    });
  } catch (error) {
    const statusCode = error.message?.includes("Invalid") ? 400 : 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || "Failed to update guide status",
    });
  }
};

export const attachGeneratedGuideToCropController = async (req, res) => {
  try {
    const generatedGuideId = Number(req.params.id);
    const cropId = Number(req.body?.cropId);
    if (!generatedGuideId || Number.isNaN(generatedGuideId)) {
      return res.status(400).json({
        success: false,
        message: "Valid generated guide id is required",
      });
    }
    if (!cropId || Number.isNaN(cropId)) {
      return res.status(400).json({
        success: false,
        message: "Valid cropId is required",
      });
    }

    const result = await attachGeneratedGuideToExistingCrop({
      generatedGuideId,
      cropId,
      reviewedByUserId: req.user?.id || null,
    });

    return res.status(200).json({
      success: true,
      message: "Generated guide attached to crop successfully",
      data: result,
    });
  } catch (error) {
    const statusCode = error.message?.includes("not found") ? 404 : 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || "Failed to attach generated guide to crop",
    });
  }
};
