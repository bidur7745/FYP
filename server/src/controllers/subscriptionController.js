import {
  getSubscriptionByUserId,
  isSubscriptionActive,
  initiateKhaltiPayment,
  verifyKhaltiAndActivate,
  cancelSubscription,
  listAllSubscriptions,
  getSubscriptionStats,
  getPublicSubscriptionPricing,
} from "../services/subscriptionService.js";
import {
  createStripeCheckoutSession,
  verifyStripeCheckoutSession,
  verifyStripeWebhookSignature,
  handleStripeWebhookEvent,
} from "../services/stripeSubscriptionService.js";

/** Public: Khalti (NPR) vs Stripe (USD) amounts for Premium page */
export async function getSubscriptionPricingController(req, res) {
  try {
    const pricing = getPublicSubscriptionPricing();
    return res.status(200).json({
      success: true,
      ...pricing,
    });
  } catch (error) {
    console.error("getSubscriptionPricing error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to load pricing",
    });
  }
}

export async function getSubscriptionController(req, res) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const sub = await getSubscriptionByUserId(userId);
    if (!sub) {
      return res.status(200).json({
        success: true,
        subscription: null,
        active: false,
      });
    }
    const active = isSubscriptionActive(sub);
    return res.status(200).json({
      success: true,
      subscription: {
        id: sub.id,
        user_id: sub.userId,
        plan: sub.plan,
        status: sub.status,
        started_at: sub.startedAt,
        expires_at: sub.expiresAt,
        cancelled_at: sub.cancelledAt,
        cancel_at_period_end: sub.cancelAtPeriodEnd,
        payment_provider: sub.paymentProvider,
        amount_paid: sub.amountPaid,
        created_at: sub.createdAt,
        updated_at: sub.updatedAt,
      },
      active,
    });
  } catch (error) {
    console.error("getSubscription error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to get subscription",
    });
  }
}

export async function createSubscriptionController(req, res) {
  try {
    const userId = req.user?.id;
    const name = req.user?.name;
    const email = req.user?.email;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const result = await initiateKhaltiPayment(userId, name, email);
    return res.status(200).json({
      success: true,
      payment_url: result.payment_url,
      subscription_id: result.subscription_id,
      pidx: result.pidx,
      amount_paisa: result.amount_paisa,
    });
  } catch (error) {
    console.error("createSubscription (Khalti initiate) error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to initiate payment",
    });
  }
}

export async function verifySubscriptionController(req, res) {
  try {
    const { pidx, amount: amountPaisa } = req.body;
    if (!pidx) {
      return res.status(400).json({
        success: false,
        message: "Missing pidx (payment token)",
      });
    }
    const amount = parseInt(amountPaisa, 10);
    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid amount",
      });
    }

    const result = await verifyKhaltiAndActivate(pidx, amount);
    return res.status(200).json({
      success: true,
      subscription: {
        id: result.subscription.id,
        status: result.subscription.status,
        expires_at: result.subscription.expiresAt,
      },
      already_active: result.alreadyActive,
    });
  } catch (error) {
    console.error("verifySubscription error:", error);
    return res.status(400).json({
      success: false,
      message: error.message || "Payment verification failed",
    });
  }
}

export async function cancelSubscriptionController(req, res) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const cancelAtPeriodEnd = req.body?.cancel_at_period_end !== false;
    const sub = await cancelSubscription(userId, cancelAtPeriodEnd);
    return res.status(200).json({
      success: true,
      subscription: {
        id: sub.id,
        status: sub.status,
        cancelled_at: sub.cancelledAt,
        expires_at: sub.expiresAt,
        cancel_at_period_end: sub.cancelAtPeriodEnd,
      },
    });
  } catch (error) {
    console.error("cancelSubscription error:", error);
    return res.status(400).json({
      success: false,
      message: error.message || "Failed to cancel subscription",
    });
  }
}

/** Admin: list all subscriptions with user info */
export async function listSubscriptionsAdminController(req, res) {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 200, 500);
    const rows = await listAllSubscriptions(limit);
    const subscriptions = rows.map((r) => ({
      id: r.id,
      user_id: r.userId,
      user_name: r.userName,
      user_email: r.userEmail,
      plan: r.plan,
      status: r.status,
      started_at: r.startedAt,
      expires_at: r.expiresAt,
      cancelled_at: r.cancelledAt,
      cancel_at_period_end: r.cancelAtPeriodEnd,
      payment_provider: r.paymentProvider,
      amount_paid: r.amountPaid,
      created_at: r.createdAt,
      updated_at: r.updatedAt,
    }));
    return res.status(200).json({
      success: true,
      subscriptions,
      total: subscriptions.length,
    });
  } catch (error) {
    console.error("listSubscriptionsAdmin error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to list subscriptions",
    });
  }
}

/** Admin: subscription stats (premium count, revenue, premium user ids) */
/** Stripe Checkout (test): returns checkout_url */
export async function createStripeCheckoutController(req, res) {
  try {
    const userId = req.user?.id;
    const email = req.user?.email;
    const name = req.user?.name;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const result = await createStripeCheckoutSession(userId, email, name);
    return res.status(200).json({
      success: true,
      checkout_url: result.checkout_url,
      subscription_id: result.subscription_id,
      stripe_session_id: result.stripe_session_id,
    });
  } catch (error) {
    console.error("createStripeCheckout error:", error);
    const msg = error.message || "Failed to start Stripe checkout";
    const code = msg.includes("already have an active") ? 400 : 500;
    return res.status(code).json({ success: false, message: msg });
  }
}

/** After Stripe redirect: idempotent activate (webhook may have run first) */
export async function verifyStripeSessionController(req, res) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const sessionId = req.body?.session_id || req.query?.session_id;
    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: "Missing session_id",
      });
    }
    const result = await verifyStripeCheckoutSession(sessionId, userId);
    return res.status(200).json({
      success: true,
      subscription: {
        id: result.subscription.id,
        status: result.subscription.status,
        expires_at: result.subscription.expiresAt,
      },
      already_active: result.alreadyActive,
    });
  } catch (error) {
    console.error("verifyStripeSession error:", error);
    return res.status(400).json({
      success: false,
      message: error.message || "Stripe session verification failed",
    });
  }
}

/** Raw body webhook — mounted in server.js before express.json() */
export async function stripeWebhookController(req, res) {
  const sig = req.headers["stripe-signature"];
  if (!sig) {
    return res.status(400).send("Missing stripe-signature");
  }
  let event;
  try {
    event = verifyStripeWebhookSignature(req.body, sig);
  } catch (err) {
    console.error("Stripe webhook signature error:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  try {
    await handleStripeWebhookEvent(event);
  } catch (err) {
    console.error("Stripe webhook handler error:", err);
    return res.status(500).json({ error: "handler_failed" });
  }
  return res.json({ received: true });
}

export async function getSubscriptionStatsAdminController(req, res) {
  try {
    const stats = await getSubscriptionStats();
    return res.status(200).json({
      success: true,
      ...stats,
    });
  } catch (error) {
    console.error("getSubscriptionStatsAdmin error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to get subscription stats",
    });
  }
}
