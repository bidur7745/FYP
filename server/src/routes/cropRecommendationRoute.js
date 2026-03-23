import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth.js";
import {
  attachGeneratedGuideToCropController,
  generateMissingCropGuideController,
  listGeneratedGuidesController,
  recommendCropsWithGuidesController,
  updateGeneratedGuideStatusController,
} from "../controllers/cropRecommendationController.js";

const router = Router();

// User: Recommend crops from soil/climate and merge with plantation guide availability.
router.post("/recommend-with-guides", authenticate, recommendCropsWithGuidesController);

// User: Generate missing crop guide via DeepSeek (stored in separate review queue table).
router.post("/generate-guide", authenticate, generateMissingCropGuideController);

// Admin: Review queue for generated guides.
router.get("/generated-guides", authenticate, authorize("admin"), listGeneratedGuidesController);
router.patch(
  "/generated-guides/:id/status",
  authenticate,
  authorize("admin"),
  updateGeneratedGuideStatusController
);
router.post(
  "/generated-guides/:id/attach",
  authenticate,
  authorize("admin"),
  attachGeneratedGuideToCropController
);

export default router;
