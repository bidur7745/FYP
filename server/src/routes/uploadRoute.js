import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { uploadImage } from "../middleware/upload.js";
import { uploadImageController } from "../controllers/uploadController.js";

const router = Router();

// Single image upload (authenticated users only)
router.post("/image", authenticate, uploadImage.single("image"), uploadImageController);

export default router;
