import { uploadToCloudinary } from "../services/uploadService.js";

/**
 * POST /api/upload/image
 * Expects multipart/form-data with field "image"
 * Returns { success, url, publicId }
 */
export const uploadImageController = async (req, res) => {
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({
        success: false,
        message: "No image file provided. Use form field 'image'.",
      });
    }

    const folder = req.body.folder || "krishimitra"; // e.g. "licenses" or "profiles"
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
