import {
  getSubscriptionByUserId,
  isSubscriptionActive,
  initiateKhaltiPayment,
  verifyKhaltiAndActivate,
  cancelSubscription,
  listAllSubscriptions,
  getSubscriptionStats,
} from "../services/subscriptionService.js";

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
