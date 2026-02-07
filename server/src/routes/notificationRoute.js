import express from "express";
import { authenticate } from "../middleware/auth.js";
import {
  getNotificationsController,
  getUnreadCountController,
  markReadController,
  markAllReadController,
} from "../controllers/notificationController.js";

const router = express.Router();

router.get("/", authenticate, getNotificationsController);
router.get("/unread-count", authenticate, getUnreadCountController);
router.put("/read-all", authenticate, markAllReadController);
router.put("/:id/read", authenticate, markReadController);

export default router;
