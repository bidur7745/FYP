import { v2 as cloudinary } from "cloudinary";
import { ENV } from "../config/env.js";

cloudinary.config({
  cloud_name: ENV.CLOUDINARY_CLOUD_NAME,
  api_key: ENV.CLOUDINARY_API_KEY,
  api_secret: ENV.CLOUDINARY_API_SECRET,
});

/**
 * Upload a file buffer to Cloudinary
 * @param {Buffer} buffer - File buffer from multer
 * @param {string} folder - Cloudinary folder (e.g. "profiles", "licenses")
 * @param {string} [resourceType="image"] - image, raw, video
 * @returns {Promise<{ url: string, publicId: string }>}
 */
export const uploadToCloudinary = async (buffer, mimetype, folder = "krishimitra", resourceType = "image", originalFilename) => {
  if (!ENV.CLOUDINARY_CLOUD_NAME || !ENV.CLOUDINARY_API_KEY || !ENV.CLOUDINARY_API_SECRET) {
    throw new Error("Cloudinary is not configured. Set cloudname, cloudkey, cloudsecret in .env");
  }

  const dataUri = `data:${mimetype || "image/jpeg"};base64,${buffer.toString("base64")}`;

  const opts = { folder, resource_type: resourceType };
  if (resourceType === "raw" && originalFilename) {
    const sanitized = originalFilename.replace(/[^a-zA-Z0-9._-]/g, "_");
    opts.public_id = `${Date.now()}_${sanitized}`;
  }

  const result = await cloudinary.uploader.upload(dataUri, opts);

  return {
    url: result.secure_url,
    publicId: result.public_id,
  };
};
