import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { uploadImage, uploadFile } from "../middleware/upload.js";
import { uploadImageController, uploadFileController } from "../controllers/uploadController.js";

const router = Router();

const handleUploadError = (err, res) => {
  return res.status(400).json({
    success: false,
    message: err?.message || "File upload failed",
  });
};

router.post("/image", authenticate, (req, res, next) => {
  uploadImage.single("image")(req, res, (err) => {
    if (err) return handleUploadError(err, res);
    next();
  });
}, uploadImageController);

router.post("/file", authenticate, (req, res, next) => {
  uploadFile.single("file")(req, res, (err) => {
    if (err) return handleUploadError(err, res);
    next();
  });
}, uploadFileController);

export default router;
