import {
  getAllCrops,
  createCrop,
  createPlantationGuideForCrop,
  createPlantingCalendarForCrop,
  updateCrop,
  deleteCrop,
  getPlantationGuide,
  getAllPlantingCalendarsForCrop,
  getRecommendedCropsForUser,
  getCropsByLocation,
  getCropsBySeason,
  searchCrops,
  getFilteredCrops,
} from "../services/cropAdvisoryService.js";
import { getUserProfile } from "../services/userService.js";
  
 
  // get all crops
   
  export const getAllCropsController = async (req, res) => {
    try {
      const crops = await getAllCrops();

      return res.status(200).json({
        success: true,
        count: crops.length,
        crops: crops,
      });
    } catch (error) {
      console.error("Get All Crops Error:", error.message);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch crops",
        error: error.message,
      });
    }
  };

// create a new crop
export const createCropController = async (req, res) => {
  try {
    const {
      cropName,
      cropCategory,
      regions,
      season,
      soilType,
      waterRequirement,
      climate,
      notes,
      imageUrl,
      plantationGuide,
      plantingCalendar,
    } = req.body;

    // Validate required fields
    if (!cropName || !regions || !season) {
      return res.status(400).json({
        success: false,
        message: "Crop name, regions (array), and season are required.",
      });
    }

    // Validate regions is an array
    if (!Array.isArray(regions) || regions.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Regions must be a non-empty array.",
      });
    }

    // Validate season
    if (!["Winter", "Spring", "Monsoon", "Autumn"].includes(season)) {
      return res.status(400).json({
        success: false,
        message: "Invalid season. Must be one of: Winter, Spring, Monsoon, Autumn",
      });
    }

    // Create crop
    const newCrop = await createCrop({
      cropName,
      cropCategory,
      regions,
      season,
      soilType,
      waterRequirement,
      climate,
      notes,
      imageUrl,
    });

    let createdGuide = null;
    let createdCalendars = [];

    // Optionally create plantation guide
    if (plantationGuide && typeof plantationGuide === "object") {
      createdGuide = await createPlantationGuideForCrop(newCrop.cropId, plantationGuide);
    }

    // Optionally create planting calendar entries
    if (Array.isArray(plantingCalendar) && plantingCalendar.length > 0) {
      createdCalendars = await createPlantingCalendarForCrop(newCrop.cropId, plantingCalendar);
    }

    return res.status(201).json({
      success: true,
      message: "Crop created successfully",
      crop: {
        cropId: newCrop.cropId,
        cropName: newCrop.cropName,
        cropCategory: newCrop.cropCategory,
        regions: newCrop.regions,
        season: newCrop.season,
        soilType: newCrop.soilType,
        waterRequirement: newCrop.waterRequirement,
        climate: newCrop.climate,
        notes: newCrop.notes,
        imageUrl: newCrop.imageUrl,
      },
      plantationGuide: createdGuide,
      plantingCalendar: createdCalendars,
    });
  } catch (error) {
    console.error("Create Crop Error:", error.message);

    // Handle validation errors
    if (
      error.message.includes("Invalid") ||
      error.message.includes("required") ||
      error.message.includes("array")
    ) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to create crop",
      error: error.message,
    });
  }
};

// update a crop
export const updateCropController = async (req, res) => {
  try {
    const { cropId } = req.params;
    const {
      cropName,
      cropCategory,
      regions,
      season,
      soilType,
      waterRequirement,
      climate,
      notes,
      imageUrl,
    } = req.body;

    if (!cropId || isNaN(parseInt(cropId))) {
      return res.status(400).json({
        success: false,
        message: "Valid crop ID is required.",
      });
    }

    if (!cropName || !regions || !season) {
      return res.status(400).json({
        success: false,
        message: "Crop name, regions (array), and season are required.",
      });
    }

    if (!Array.isArray(regions) || regions.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Regions must be a non-empty array.",
      });
    }

    if (!["Winter", "Spring", "Monsoon", "Autumn"].includes(season)) {
      return res.status(400).json({
        success: false,
        message: "Invalid season. Must be one of: Winter, Spring, Monsoon, Autumn",
      });
    }

    const updated = await updateCrop(parseInt(cropId), {
      cropName,
      cropCategory,
      regions,
      season,
      soilType,
      waterRequirement,
      climate,
      notes,
      imageUrl,
    });

    return res.status(200).json({
      success: true,
      message: "Crop updated successfully",
      crop: updated,
    });
  } catch (error) {
    console.error("Update Crop Error:", error.message);

    if (
      error.message.includes("Invalid") ||
      error.message.includes("required") ||
      error.message.includes("array")
    ) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to update crop",
      error: error.message,
    });
  }
};

// delete a crop
export const deleteCropController = async (req, res) => {
  try {
    const { cropId } = req.params;

    if (!cropId || isNaN(parseInt(cropId))) {
      return res.status(400).json({
        success: false,
        message: "Valid crop ID is required.",
      });
    }

    await deleteCrop(parseInt(cropId));

    return res.status(200).json({
      success: true,
      message: "Crop deleted successfully",
    });
  } catch (error) {
    console.error("Delete Crop Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to delete crop",
      error: error.message,
    });
  }
};

// get plantation guide for a specific crop
export const getPlantationGuideController = async (req, res) => {
  try {
    const { cropId } = req.params;

    if (!cropId || isNaN(parseInt(cropId))) {
      return res.status(400).json({
        success: false,
        message: "Valid crop ID is required.",
      });
    }

    const guide = await getPlantationGuide(parseInt(cropId));

    if (!guide) {
      return res.status(404).json({
        success: false,
        message: "Plantation guide not found for this crop.",
      });
    }

    return res.status(200).json({
      success: true,
      crop: guide.crop,
      cropId: guide.cropId,
      spacing: guide.spacing,
      maturityPeriod: guide.maturityPeriod,
      seedPreparation: guide.seedPreparation,
      plantingMethod: guide.plantingMethod,
      irrigationSchedule: guide.irrigationSchedule,
      harvestingTips: guide.harvestingTips,
      averageYield: guide.averageYield,
      videoUrl: guide.videoUrl,
      plantationProcess: guide.plantationProcess || [],
    });
  } catch (error) {
    console.error("Get Plantation Guide Error:", error.message);
    // Check if it's a database connection error
    if (error.message?.includes("connection") || error.message?.includes("fetch failed")) {
      return res.status(503).json({
        success: false,
        message: "Database connection failed. Please check your database configuration.",
        error: error.message,
      });
    }
    return res.status(500).json({
      success: false,
      message: "Failed to get plantation guide",
      error: error.message,
    });
  }
};

// get all planting calendar entries for a specific crop
export const getAllPlantingCalendarsController = async (req, res) => {
  try {
    const { cropId } = req.params;

    if (!cropId || isNaN(parseInt(cropId))) {
      return res.status(400).json({
        success: false,
        message: "Valid crop ID is required.",
      });
    }

    const calendars = await getAllPlantingCalendarsForCrop(parseInt(cropId));

    return res.status(200).json({
      success: true,
      count: calendars.length,
      calendars: calendars,
    });
  } catch (error) {
    console.error("Get Planting Calendars Error:", error.message);
    // Check if it's a database connection error
    if (error.message?.includes("connection") || error.message?.includes("fetch failed")) {
      return res.status(503).json({
        success: false,
        message: "Database connection failed. Please check your database configuration.",
        error: error.message,
      });
    }
    return res.status(500).json({
      success: false,
      message: "Failed to get planting calendars",
      error: error.message,
    });
  }
};

// get personalized crop recommendations for logged-in user
export const getRecommendedCropsController = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user profile to get farm location
    const userProfile = await getUserProfile(userId);
    const farmLocation = userProfile.userDetails?.farmLocation;

    if (!farmLocation) {
      return res.status(400).json({
        success: false,
        message: "Farm location not set. Please complete your profile.",
      });
    }

    // Get recommended crops
    const recommendations = await getRecommendedCropsForUser(farmLocation);

    return res.status(200).json({
      success: true,
      message: "Recommended crops retrieved successfully",
      data: recommendations,
    });
  } catch (error) {
    console.error("Get Recommended Crops Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to get recommended crops",
      error: error.message,
    });
  }
};

// get crops filtered by region, season, or both
export const getFilteredCropsController = async (req, res) => {
  try {
    const { region, season, category } = req.query;

    const filters = {};
    if (region) filters.region = region;
    if (season) filters.season = season;
    if (category) filters.category = category;

    const crops = await getFilteredCrops(filters);

    return res.status(200).json({
      success: true,
      count: crops.length,
      filters: filters,
      crops: crops,
    });
  } catch (error) {
    console.error("Get Filtered Crops Error:", error.message);

    if (error.message.includes("Invalid region") || error.message.includes("Invalid season")) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to get filtered crops",
      error: error.message,
    });
  }
};

// search crops by name
export const searchCropsController = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Search query is required. Use ?q=your_search_term",
      });
    }

    const crops = await searchCrops(q);

    return res.status(200).json({
      success: true,
      count: crops.length,
      query: q,
      crops: crops,
    });
  } catch (error) {
    console.error("Search Crops Error:", error.message);

    if (error.message.includes("Search query is required")) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to search crops",
      error: error.message,
    });
  }
};