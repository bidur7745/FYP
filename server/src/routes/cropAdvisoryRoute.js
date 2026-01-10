import { Router } from "express";
import {
  getAllCropsController,
  createCropController,
  updateCropController,
  deleteCropController,
  getPlantationGuideController,
  getAllPlantingCalendarsController,
  getRecommendedCropsController,
  getFilteredCropsController,
  searchCropsController,
} from "../controllers/cropAdvisoryController.js";
import { authenticate, authorize } from "../middleware/auth.js";

const router = Router();

// public routes
router.get("/crops", getAllCropsController); // get all crops
router.get("/plantation-guide/:cropId", getPlantationGuideController); // plantation guide for selceted crop
router.get("/planting-calendar/:cropId", getAllPlantingCalendarsController); //farming calendar for selected crop 


// admin routes
router.post("/crops/upload", authenticate, authorize("admin"), createCropController); // upload a new crop
router.put("/crops/:cropId", authenticate, authorize("admin"), updateCropController); // update a crop
router.delete("/crops/:cropId", authenticate, authorize("admin"), deleteCropController); // delete a crop


// user routes
router.get("/crops/recommended", authenticate, getRecommendedCropsController); // personalized crop based on user location and season
router.get("/crops/filter", authenticate, getFilteredCropsController); // filter crops by region, season, or category
router.get("/crops/search", authenticate, searchCropsController); // search crops by name

export default router;