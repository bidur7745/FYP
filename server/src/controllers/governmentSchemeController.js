import {
  getAllSchemes,
  getSchemeById,
  searchSchemes,
  getFilteredSchemes,
  createScheme,
  updateScheme,
  updateSchemeDetails,
  deleteScheme,
  getSchemeDetails,
} from "../services/governmentSchemeService.js";

/**
 * Get all schemes controller
 * GET /api/government-schemes
 */
export const getAllSchemesController = async (req, res) => {
  try {
    const filters = {
      status: req.query.status,
      level: req.query.level,
      provinceName: req.query.province,
      districtName: req.query.district,
      schemeType: req.query.schemeType,
    };

    // Remove undefined filters
    Object.keys(filters).forEach(
      (key) => filters[key] === undefined && delete filters[key]
    );

    const schemes = await getAllSchemes(filters);

    return res.status(200).json({
      success: true,
      count: schemes.length,
      schemes: schemes,
    });
  } catch (error) {
    console.error("Get All Schemes Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch schemes",
      error: error.message,
    });
  }
};

/**
 * Get scheme by ID controller
 * GET /api/government-schemes/:schemeId
 */
export const getSchemeByIdController = async (req, res) => {
  try {
    const { schemeId } = req.params;

    if (!schemeId) {
      return res.status(400).json({
        success: false,
        message: "Scheme ID is required",
      });
    }

    const scheme = await getSchemeById(schemeId);

    if (!scheme) {
      return res.status(404).json({
        success: false,
        message: "Scheme not found",
      });
    }

    return res.status(200).json({
      success: true,
      scheme: scheme,
    });
  } catch (error) {
    console.error("Get Scheme By ID Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch scheme",
      error: error.message,
    });
  }
};

/**
 * Search schemes controller
 * GET /api/government-schemes/search?q=searchterm
 */
export const searchSchemesController = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Search query is required",
      });
    }

    const schemes = await searchSchemes(q);

    return res.status(200).json({
      success: true,
      count: schemes.length,
      schemes: schemes,
    });
  } catch (error) {
    console.error("Search Schemes Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to search schemes",
      error: error.message,
    });
  }
};

/**
 * Filter schemes controller
 * GET /api/government-schemes/filter?status=active&level=Central
 */
export const getFilteredSchemesController = async (req, res) => {
  try {
    const filters = {
      status: req.query.status,
      level: req.query.level,
      provinceName: req.query.province,
      districtName: req.query.district,
      schemeType: req.query.schemeType,
      regionScope: req.query.regionScope,
      localBodyType: req.query.localBodyType,
    };

    // Remove undefined filters
    Object.keys(filters).forEach(
      (key) => filters[key] === undefined && delete filters[key]
    );

    const schemes = await getFilteredSchemes(filters);

    return res.status(200).json({
      success: true,
      count: schemes.length,
      schemes: schemes,
    });
  } catch (error) {
    console.error("Get Filtered Schemes Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch filtered schemes",
      error: error.message,
    });
  }
};

/**
 * Create scheme controller (Admin only)
 * POST /api/government-schemes
 */
export const createSchemeController = async (req, res) => {
  try {
    const {
      title,
      description,
      schemeType,
      sector,
      level,
      provinceName,
      districtName,
      localBodyType,
      localBodyName,
      regionScope,
      sourceUrl,
      documentUrl,
      status,
      publishedDate,
      expiryDate,
      details,
    } = req.body;

    // Validate required fields
    if (!title) {
      return res.status(400).json({
        success: false,
        message: "Title is required",
      });
    }

    const newScheme = await createScheme(
      {
        title,
        description,
        schemeType,
        sector,
        level,
        provinceName,
        districtName,
        localBodyType,
        localBodyName,
        regionScope,
        sourceUrl,
        documentUrl,
        status,
        publishedDate,
        expiryDate,
      },
      details
    );

    return res.status(201).json({
      success: true,
      message: "Scheme created successfully",
      scheme: newScheme,
    });
  } catch (error) {
    console.error("Create Scheme Error:", error.message);

    // Extract meaningful error message from database errors
    let errorMessage = "Failed to create scheme";
    
    if (error.message.includes("required")) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    // Parse database validation errors
    if (error.cause) {
      const dbError = error.cause;
      
      if (dbError.code === '22P02') {
        // Invalid enum value
        if (dbError.message.includes('local_body_type')) {
          errorMessage = "Invalid local body type. Please select a valid option or leave it empty.";
        } else if (dbError.message.includes('scheme_status')) {
          errorMessage = "Invalid scheme status. Please select a valid status.";
        } else if (dbError.message.includes('scheme_level')) {
          errorMessage = "Invalid scheme level. Please select a valid level.";
        } else if (dbError.message.includes('region_scope')) {
          errorMessage = "Invalid region scope. Please select a valid scope.";
        } else {
          errorMessage = "Invalid value for one of the dropdown fields. Please check your selections.";
        }
      } else if (dbError.code === '22007') {
        // Invalid date format
        if (dbError.message.includes('date')) {
          errorMessage = "Invalid date format. Please enter a valid date or leave it empty.";
        } else {
          errorMessage = "Invalid date format. Please check the date fields.";
        }
      } else if (dbError.message) {
        errorMessage = dbError.message;
      }
    } else if (error.message) {
      errorMessage = error.message;
    }

    return res.status(400).json({
      success: false,
      message: errorMessage,
      error: error.message,
    });
  }
};

/**
 * Update scheme controller (Admin only)
 * PUT /api/government-schemes/:schemeId
 */
export const updateSchemeController = async (req, res) => {
  try {
    const { schemeId } = req.params;
    const schemeData = req.body;

    if (!schemeId) {
      return res.status(400).json({
        success: false,
        message: "Scheme ID is required",
      });
    }

    const updatedScheme = await updateScheme(schemeId, schemeData);

    return res.status(200).json({
      success: true,
      message: "Scheme updated successfully",
      scheme: updatedScheme,
    });
  } catch (error) {
    console.error("Update Scheme Error:", error.message);

    // Extract meaningful error message from database errors
    let errorMessage = "Failed to update scheme";
    
    if (error.message.includes("not found")) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    // Parse database validation errors
    if (error.cause) {
      const dbError = error.cause;
      
      if (dbError.code === '22P02') {
        // Invalid enum value
        if (dbError.message.includes('local_body_type')) {
          errorMessage = "Invalid local body type. Please select a valid option or leave it empty.";
        } else if (dbError.message.includes('scheme_status')) {
          errorMessage = "Invalid scheme status. Please select a valid status.";
        } else if (dbError.message.includes('scheme_level')) {
          errorMessage = "Invalid scheme level. Please select a valid level.";
        } else if (dbError.message.includes('region_scope')) {
          errorMessage = "Invalid region scope. Please select a valid scope.";
        } else {
          errorMessage = "Invalid value for one of the dropdown fields. Please check your selections.";
        }
      } else if (dbError.code === '22007') {
        // Invalid date format
        if (dbError.message.includes('date')) {
          errorMessage = "Invalid date format. Please enter a valid date or leave it empty.";
        } else {
          errorMessage = "Invalid date format. Please check the date fields.";
        }
      } else if (dbError.message) {
        errorMessage = dbError.message;
      }
    } else if (error.message) {
      errorMessage = error.message;
    }

    return res.status(400).json({
      success: false,
      message: errorMessage,
      error: error.message,
    });
  }
};

/**
 * Update scheme details controller (Admin only)
 * PUT /api/government-schemes/:schemeId/details
 */
export const updateSchemeDetailsController = async (req, res) => {
  try {
    const { schemeId } = req.params;
    const detailsData = req.body;

    if (!schemeId) {
      return res.status(400).json({
        success: false,
        message: "Scheme ID is required",
      });
    }

    const updatedDetails = await updateSchemeDetails(schemeId, detailsData);

    return res.status(200).json({
      success: true,
      message: "Scheme details updated successfully",
      details: updatedDetails,
    });
  } catch (error) {
    console.error("Update Scheme Details Error:", error.message);

    if (error.message.includes("not found")) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to update scheme details",
      error: error.message,
    });
  }
};

/**
 * Delete scheme controller (Admin only)
 * DELETE /api/government-schemes/:schemeId
 */
export const deleteSchemeController = async (req, res) => {
  try {
    const { schemeId } = req.params;

    if (!schemeId) {
      return res.status(400).json({
        success: false,
        message: "Scheme ID is required",
      });
    }

    await deleteScheme(schemeId);

    return res.status(200).json({
      success: true,
      message: "Scheme deleted successfully",
    });
  } catch (error) {
    console.error("Delete Scheme Error:", error.message);

    if (error.message.includes("not found")) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to delete scheme",
      error: error.message,
    });
  }
};

/**
 * Get scheme details controller
 * GET /api/government-schemes/:schemeId/details
 */
export const getSchemeDetailsController = async (req, res) => {
  try {
    const { schemeId } = req.params;

    if (!schemeId) {
      return res.status(400).json({
        success: false,
        message: "Scheme ID is required",
      });
    }

    const details = await getSchemeDetails(schemeId);

    if (!details) {
      return res.status(404).json({
        success: false,
        message: "Scheme details not found",
      });
    }

    return res.status(200).json({
      success: true,
      details: details,
    });
  } catch (error) {
    console.error("Get Scheme Details Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch scheme details",
      error: error.message,
    });
  }
};

