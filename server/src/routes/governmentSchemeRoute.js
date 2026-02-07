import { Router } from "express";
import {
  getAllSchemesController,
  getSchemeByIdController,
  searchSchemesController,
  getFilteredSchemesController,
  createSchemeController,
  updateSchemeController,
  updateSchemeDetailsController,
  deleteSchemeController,
  getSchemeDetailsController,
} from "../controllers/governmentSchemeController.js";
import { authenticate, authorize } from "../middleware/auth.js";

const router = Router();

// Public routes
router.get("/", getAllSchemesController); // Get all schemes (with optional query filters)
router.get("/search", searchSchemesController); // Search schemes by title
router.get("/filter", getFilteredSchemesController); // Filter schemes with advanced filters
router.get("/:schemeId/details", getSchemeDetailsController); // Get scheme details only
router.get("/:schemeId", getSchemeByIdController); // Get scheme by ID with details

// Admin routes (authenticated + authorized)
router.post("/", authenticate, authorize("admin"), createSchemeController); // Create new scheme
router.put("/:schemeId", authenticate, authorize("admin"), updateSchemeController); // Update scheme
router.put("/:schemeId/details", authenticate, authorize("admin"), updateSchemeDetailsController); // Update scheme details
router.delete("/:schemeId", authenticate, authorize("admin"), deleteSchemeController); // Delete scheme

export default router;

