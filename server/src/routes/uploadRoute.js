import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { uploadImage, uploadFile } from "../middleware/upload.js";
import { uploadImageController, uploadFileController } from "../controllers/uploadController.js";

const router = Router();

router.post("/image", authenticate, uploadImage.single("image"), uploadImageController);
router.post("/file", authenticate, uploadFile.single("file"), uploadFileController);

export default router;
