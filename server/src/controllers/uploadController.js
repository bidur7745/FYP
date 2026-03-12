import { uploadToCloudinary } from "../services/uploadService.js";

/**
 * POST /api/upload/image
 * Expects multipart/form-data with field "image"
 */
export const uploadImageController = async (req, res) => {
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({
        success: false,
        message: "No image file provided. Use form field 'image'.",
      });
    }

    const folder = req.body.folder || "krishimitra";
    const { url, publicId } = await uploadToCloudinary(req.file.buffer, req.file.mimetype, folder);

    return res.status(200).json({
      success: true,
      message: "Image uploaded successfully",
      url,
      publicId,
    });
  } catch (error) {
    console.error("Upload image error:", error.message);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to upload image",
    });
  }
};

/**
 * POST /api/upload/file
 * Accepts images and documents (PDF, DOC, DOCX, XLS, XLSX, TXT)
 */
export const uploadFileController = async (req, res) => {
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({
        success: false,
        message: "No file provided. Use form field 'file'.",
      });
    }

    const folder = req.body.folder || "krishimitra";
    const isImage = req.file.mimetype.startsWith("image/");
    const resourceType = isImage ? "image" : "raw";

    const { url, publicId } = await uploadToCloudinary(
      req.file.buffer,
      req.file.mimetype,
      folder,
      resourceType,
      req.file.originalname
    );

    return res.status(200).json({
      success: true,
      message: "File uploaded successfully",
      url,
      publicId,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
    });
  } catch (error) {
    console.error("Upload file error:", error.message);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to upload file",
    });
  }
};
