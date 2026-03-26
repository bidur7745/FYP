import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth.js";
import { uploadImage } from "../middleware/upload.js";
import {
  predictDiseaseController,
  getDiseaseScanQuotaController,
} from "../controllers/diseaseController.js";
import {
  getTreatmentsController,
  listTreatmentsAdminController,
  createTreatmentController,
  updateTreatmentController,
  deleteTreatmentController,
} from "../controllers/diseaseTreatmentController.js";
import {
  listDiseasesController,
  getDiseaseController,
  createDiseaseController,
  updateDiseaseController,
  deleteDiseaseController,
} from "../controllers/diseaseCatalogController.js";

const router = Router();

const handleDiseaseUploadError = (err, res) => {
  return res.status(400).json({
    success: false,
    message: err?.message || "Invalid image file.",
  });
};

// Predict crop disease from leaf image (authenticated)
router.post(
  "/predict",
  authenticate,
  (req, res, next) => {
    uploadImage.single("file")(req, res, (err) => {
      if (err) return handleDiseaseUploadError(err, res);
      next();
    });
  },
  predictDiseaseController
);
router.get("/quota", authenticate, getDiseaseScanQuotaController);

// ---------- Disease catalog (public GET; admin CRUD) ----------
// List diseases (public or admin), optional ?crop= & lang=
router.get("/catalog", listDiseasesController);
// Get one disease by id or ?crop= & className= (public or admin)
router.get("/catalog/by", getDiseaseController);
router.get("/catalog/:id", getDiseaseController);
// Admin only: create, update, delete disease
router.post("/catalog", authenticate, authorize("admin"), createDiseaseController);
router.patch("/catalog/:id", authenticate, authorize("admin"), updateDiseaseController);
router.delete("/catalog/:id", authenticate, authorize("admin"), deleteDiseaseController);

// ---------- Disease treatments ----------
// Farmers (user): get treatment by crop+className or all with ?all=true
router.get(
  "/treatments",
  authenticate,
  authorize("user"),
  getTreatmentsController
);
// Admin: list all treatments (optional ?crop= & lang=)
router.get(
  "/treatments/list",
  authenticate,
  authorize("admin"),
  listTreatmentsAdminController
);
// Admin: create, update, delete treatment
router.post("/treatments", authenticate, authorize("admin"), createTreatmentController);
router.patch("/treatments/:id", authenticate, authorize("admin"), updateTreatmentController);
router.delete("/treatments/:id", authenticate, authorize("admin"), deleteTreatmentController);

export default router;

