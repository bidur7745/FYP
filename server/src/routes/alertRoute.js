import express from "express";
import { authenticate } from "../middleware/auth.js";
import {
  getUserAlertsController,
  getUnreadAlertCountController,
  markAlertReadController,
} from "../controllers/alertController.js";

const router = express.Router();

/**
 * GET /api/alerts
 * Get user's alerts with optional filters
 * Query params: severity, type
 * Protected route - requires authentication
 */
router.get("/", authenticate, getUserAlertsController);

/**
 * GET /api/alerts/unread-count
 * Get count of unread alerts for user
 * Protected route - requires authentication
 */
router.get("/unread-count", authenticate, getUnreadAlertCountController);

/**
 * PUT /api/alerts/:alertId/read
 * Mark an alert as read
 * Protected route - requires authentication
 */
router.put("/:alertId/read", authenticate, markAlertReadController);

export default router;

