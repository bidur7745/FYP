import { db } from "../config/db.js";
import { subscriptionsTable, userTable } from "../schema/index.js";
import { eq, and, desc, sql, gt, or, isNull } from "drizzle-orm";
import { ENV } from "../config/env.js";
import {
  sendSubscriptionActivatedEmail,
  sendSubscriptionCancelledEmail,
} from "../config/email.js";
import axios from "axios";

const PREMIUM_AMOUNT_PAISA = ENV.PREMIUM_AMOUNT_PAISA || 199900;
const MONTHS_ACTIVE = 1;

/** Public amounts for Premium UI (Khalti = NPR from paise; Stripe = USD — match STRIPE_PRICE_ID in Dashboard). */
export function getPublicSubscriptionPricing() {
  const npr = Math.round(PREMIUM_AMOUNT_PAISA) / 100;
  const usd = Number(ENV.PREMIUM_STRIPE_USD) || 19.99;
  return {
    khalti: {
      currency: "NPR",
      amount: npr,
      amount_paisa: PREMIUM_AMOUNT_PAISA,
    },
    stripe: {
      currency: "USD",
      amount: usd,
    },
  };
}

export async function getSubscriptionByUserId(userId) {
  const rows = await db
    .select()
    .from(subscriptionsTable)
    .where(eq(subscriptionsTable.userId, userId))
    .orderBy(desc(subscriptionsTable.createdAt))
    .limit(1);
  return rows[0] || null;
}

/** List all subscriptions for admin with user name/email */
export async function listAllSubscriptions(limit = 200) {
  const rows = await db
    .select({
      id: subscriptionsTable.id,
      userId: subscriptionsTable.userId,
      plan: subscriptionsTable.plan,
      status: subscriptionsTable.status,
      startedAt: subscriptionsTable.startedAt,
      expiresAt: subscriptionsTable.expiresAt,
      cancelledAt: subscriptionsTable.cancelledAt,
      cancelAtPeriodEnd: subscriptionsTable.cancelAtPeriodEnd,
      paymentProvider: subscriptionsTable.paymentProvider,
      amountPaid: subscriptionsTable.amountPaid,
      createdAt: subscriptionsTable.createdAt,
      updatedAt: subscriptionsTable.updatedAt,
      userName: userTable.name,
      userEmail: userTable.email,
    })
    .from(subscriptionsTable)
    .leftJoin(userTable, eq(subscriptionsTable.userId, userTable.id))
    .orderBy(desc(subscriptionsTable.createdAt))
    .limit(limit);
  return rows;
}

/** Admin stats: premium user count, revenue by currency (active subs only), premium user ids */
export async function getSubscriptionStats() {
  const now = new Date();
  const activeCondition = and(
    eq(subscriptionsTable.status, "active"),
    or(isNull(subscriptionsTable.expiresAt), gt(subscriptionsTable.expiresAt, now))
  );

  const activeRows = await db
    .select({ userId: subscriptionsTable.userId })
    .from(subscriptionsTable)
    .where(activeCondition);
  const premiumUserIds = [...new Set(activeRows.map((r) => r.userId))];

  const revenueRows = await db
    .select({
      amountPaid: subscriptionsTable.amountPaid,
      paymentProvider: subscriptionsTable.paymentProvider,
    })
    .from(subscriptionsTable)
    .where(activeCondition);

  let totalRevenueNpr = 0;
  let totalRevenueUsd = 0;
  for (const r of revenueRows) {
    if (r.amountPaid == null) continue;
    const n = Number(r.amountPaid);
    if (!Number.isFinite(n) || n <= 0) continue;
    const prov = (r.paymentProvider || "khalti").toLowerCase();
    if (prov === "stripe") totalRevenueUsd += n;
    else totalRevenueNpr += n;
  }

  totalRevenueNpr = Math.round(totalRevenueNpr * 100) / 100;
  totalRevenueUsd = Math.round(totalRevenueUsd * 100) / 100;

  return {
    premiumUserCount: premiumUserIds.length,
    totalRevenueNpr,
    totalRevenueUsd,
    premiumUserIds,
  };
}

export function isSubscriptionActive(sub) {
  if (!sub) return false;
  if (sub.status !== "active") return false;
  if (sub.cancelledAt && sub.cancelAtPeriodEnd && sub.expiresAt) {
    return new Date(sub.expiresAt) > new Date();
  }
  if (sub.expiresAt) return new Date(sub.expiresAt) > new Date();
  return true;
}

export async function createPendingSubscription(
  userId,
  plan = "premium_monthly",
  paymentProvider = "khalti"
) {
  const [row] = await db
    .insert(subscriptionsTable)
    .values({
      userId,
      plan,
      status: "pending_payment",
      paymentProvider,
    })
    .returning();
  return row;
}

export async function updatePaymentReference(subscriptionId, pidx) {
  await db
    .update(subscriptionsTable)
    .set({ paymentReference: pidx, updatedAt: new Date() })
    .where(eq(subscriptionsTable.id, subscriptionId));
}

export async function initiateKhaltiPayment(userId, userName, userEmail) {
  const secret = ENV.KHALTI_SECRET_KEY;
  const baseUrl = ENV.FRONTEND_URL || "http://localhost:5173";
  if (!secret) {
    throw new Error("Khalti is not configured (KHALTI_SECRET_KEY missing)");
  }

  const sub = await createPendingSubscription(userId);
  const purchaseOrderId = String(sub.id);

  const payload = {
    return_url: `${baseUrl}/premium/success`,
    website_url: baseUrl,
    amount: PREMIUM_AMOUNT_PAISA,
    purchase_order_id: purchaseOrderId,
    purchase_order_name: "KrishiMitra Premium Monthly",
    customer_info: {
      name: userName || "Customer",
      email: userEmail || "",
    },
  };

  const response = await axios.post(ENV.KHALTI_EPAYMENT_INITIATE_URL, payload, {
    headers: {
      Authorization: `Key ${secret}`,
      "Content-Type": "application/json",
    },
  });

  const pidx = response.data?.pidx;
  const paymentUrl = response.data?.payment_url || response.data?.redirect?.payment_url;
  if (!pidx || !paymentUrl) {
    throw new Error("Khalti did not return payment URL or pidx");
  }

  await updatePaymentReference(sub.id, pidx);
  return {
    subscription_id: sub.id,
    payment_url: paymentUrl,
    pidx,
    amount_paisa: PREMIUM_AMOUNT_PAISA,
  };
}

function getKhaltiLookupUrl() {
  const initiate = ENV.KHALTI_EPAYMENT_INITIATE_URL || "";
  const base = initiate.replace(/\/api\/v2\/epayment\/initiate\/?$/, "");
  if (base) return `${base}/api/v2/epayment/lookup/`;
  return "https://dev.khalti.com/api/v2/epayment/lookup/";
}

export async function verifyKhaltiAndActivate(pidx, _amountPaisa) {
  const secret = ENV.KHALTI_SECRET_KEY;
  if (!secret) throw new Error("Khalti is not configured");

  const lookupUrl = getKhaltiLookupUrl();
  const lookupRes = await axios.post(
    lookupUrl,
    { pidx },
    {
      headers: {
        Authorization: `Key ${secret}`,
        "Content-Type": "application/json",
      },
    }
  );

  const data = lookupRes.data;
  if (!data || data.status !== "Completed") {
    const reason = data?.status || data?.detail || "not completed";
    throw new Error(`Payment verification failed: ${reason}`);
  }

  const subs = await db
    .select()
    .from(subscriptionsTable)
    .where(eq(subscriptionsTable.paymentReference, pidx))
    .limit(1);
  const sub = subs[0];
  if (!sub) throw new Error("Subscription not found for this payment");

  if (sub.status === "active") {
    return { subscription: sub, alreadyActive: true };
  }

  const startedAt = new Date();
  const expiresAt = new Date(startedAt);
  expiresAt.setMonth(expiresAt.getMonth() + MONTHS_ACTIVE);

  const totalAmountPaisa = data.total_amount != null ? Number(data.total_amount) : PREMIUM_AMOUNT_PAISA;
  await db
    .update(subscriptionsTable)
    .set({
      status: "active",
      startedAt,
      expiresAt,
      paymentProvider: "khalti",
      amountPaid: String(totalAmountPaisa / 100),
      updatedAt: new Date(),
    })
    .where(eq(subscriptionsTable.id, sub.id));

  const [updated] = await db
    .select()
    .from(subscriptionsTable)
    .where(eq(subscriptionsTable.id, sub.id))
    .limit(1);

  const [user] = await db
    .select({ email: userTable.email, name: userTable.name })
    .from(userTable)
    .where(eq(userTable.id, sub.userId))
    .limit(1);

  if (user?.email) {
    try {
      await sendSubscriptionActivatedEmail(
        user.email,
        user.name || "User",
        sub.plan,
        expiresAt
      );
    } catch (e) {
      console.error("Subscription activation email failed:", e);
    }
  }

  return { subscription: updated || sub, alreadyActive: false };
}

export async function cancelSubscription(userId, cancelAtPeriodEnd = true) {
  const sub = await getSubscriptionByUserId(userId);
  if (!sub) throw new Error("No subscription found");
  if (sub.status !== "active") throw new Error("Subscription is not active");

  if (sub.paymentProvider === "stripe" && sub.paymentReference && cancelAtPeriodEnd) {
    try {
      const { cancelStripeSubscriptionAtPeriodEnd } = await import(
        "./stripeSubscriptionService.js"
      );
      await cancelStripeSubscriptionAtPeriodEnd(sub.paymentReference);
    } catch (e) {
      console.error("Stripe cancel_at_period_end failed:", e);
      throw new Error(
        e?.message || "Could not cancel Stripe subscription. Check STRIPE_SECRET_KEY or try again."
      );
    }
  }

  await db
    .update(subscriptionsTable)
    .set({
      cancelledAt: new Date(),
      cancelAtPeriodEnd: !!cancelAtPeriodEnd,
      updatedAt: new Date(),
    })
    .where(eq(subscriptionsTable.id, sub.id));

  const [user] = await db
    .select({ email: userTable.email, name: userTable.name })
    .from(userTable)
    .where(eq(userTable.id, userId))
    .limit(1);

  if (user?.email) {
    try {
      await sendSubscriptionCancelledEmail(
        user.email,
        user.name || "User",
        sub.expiresAt
      );
    } catch (e) {
      console.error("Subscription cancelled email failed:", e);
    }
  }

  const [updated] = await db
    .select()
    .from(subscriptionsTable)
    .where(eq(subscriptionsTable.id, sub.id))
    .limit(1);
  return updated;
}
