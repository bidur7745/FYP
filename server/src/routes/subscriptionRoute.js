import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth.js";
import {
  getSubscriptionController,
  createSubscriptionController,
  verifySubscriptionController,
  cancelSubscriptionController,
  listSubscriptionsAdminController,
  getSubscriptionStatsAdminController,
  createStripeCheckoutController,
  verifyStripeSessionController,
  getSubscriptionPricingController,
} from "../controllers/subscriptionController.js";

const router = Router();

router.get("/pricing", getSubscriptionPricingController);
router.get("/", authenticate, authorize("user"), getSubscriptionController);
router.get("/admin/stats", authenticate, authorize("admin"), getSubscriptionStatsAdminController);
router.get("/admin", authenticate, authorize("admin"), listSubscriptionsAdminController);
router.post("/", authenticate, authorize("user"), createSubscriptionController);
router.post("/verify", verifySubscriptionController);
router.post("/stripe/checkout", authenticate, authorize("user"), createStripeCheckoutController);
router.post("/stripe/verify-session", authenticate, authorize("user"), verifyStripeSessionController);
router.post("/cancel", authenticate, authorize("user"), cancelSubscriptionController);

export default router;
