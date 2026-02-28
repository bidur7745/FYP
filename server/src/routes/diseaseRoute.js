import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { uploadImage } from "../middleware/upload.js";
import { predictDiseaseController } from "../controllers/diseaseController.js";
import {
  getTreatmentsController,
  createTreatmentController,
} from "../controllers/diseaseTreatmentController.js";

const router = Router();

// Predict crop disease from leaf image (authenticated)
router.post(
  "/predict",
  authenticate,
  uploadImage.single("file"),
  predictDiseaseController
);


router.get("/treatments", getTreatmentsController);
router.post("/treatments", createTreatmentController);

export default router;

