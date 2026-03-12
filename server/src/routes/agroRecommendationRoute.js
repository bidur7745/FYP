import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { getAgroRecommendationController } from "../controllers/agroRecommendationController.js";

const router = Router();

router.get("/:cropId", authenticate, getAgroRecommendationController);

export default router;
