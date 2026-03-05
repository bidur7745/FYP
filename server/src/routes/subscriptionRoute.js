import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth.js";
import {
  getSubscriptionController,
  createSubscriptionController,
  verifySubscriptionController,
  cancelSubscriptionController,
  listSubscriptionsAdminController,
  getSubscriptionStatsAdminController,
} from "../controllers/subscriptionController.js";

const router = Router();

router.get("/", authenticate, authorize("user"), getSubscriptionController);
router.get("/admin/stats", authenticate, authorize("admin"), getSubscriptionStatsAdminController);
router.get("/admin", authenticate, authorize("admin"), listSubscriptionsAdminController);
router.post("/", authenticate, authorize("user"), createSubscriptionController);
router.post("/verify", verifySubscriptionController);
router.post("/cancel", authenticate, authorize("user"), cancelSubscriptionController);

export default router;
