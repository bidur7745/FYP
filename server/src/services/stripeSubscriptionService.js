import Stripe from "stripe";
import { db } from "../config/db.js";
import { subscriptionsTable, userTable } from "../schema/index.js";
import { ENV } from "../config/env.js";
import { eq } from "drizzle-orm";
import { createPendingSubscription, getSubscriptionByUserId } from "./subscriptionService.js";
import { sendSubscriptionActivatedEmail } from "../config/email.js";

function getStripe() {
  if (!ENV.STRIPE_SECRET_KEY) return null;
  return new Stripe(ENV.STRIPE_SECRET_KEY);
}

/**
 * Period end may live on the Subscription (older APIs), on SubscriptionItems (newer APIs),
 */
function resolveSubscriptionPeriodEndUnix(stripeSub) {
  if (!stripeSub || typeof stripeSub !== "object") return null;

  const top = stripeSub.current_period_end;
  if (typeof top === "number" && top > 0) return top;

  const item0 = stripeSub.items?.data?.[0];
  const fromItem = item0?.current_period_end;
  if (typeof fromItem === "number" && fromItem > 0) return fromItem;

  const inv = stripeSub.latest_invoice;
  if (inv && typeof inv === "object" && typeof inv.period_end === "number" && inv.period_end > 0) {
    return inv.period_end;
  }

  return null;
}

/**
 * Create Stripe Checkout Session (subscription mode) 
 */
export async function createStripeCheckoutSession(userId, userEmail, userName) {
  const stripe = getStripe();
  const priceId = ENV.STRIPE_PRICE_ID;
  if (!stripe) {
    throw new Error("Stripe is not configured (STRIPE_SECRET_KEY missing)");
  }
  if (!priceId) {
    throw new Error("Stripe is not configured (STRIPE_PRICE_ID missing — create a recurring Price in Stripe Dashboard)");
  }

  const existing = await getSubscriptionByUserId(userId);
  if (existing && existing.status === "active") {
    const now = new Date();
    if (!existing.expiresAt || new Date(existing.expiresAt) > now) {
      throw new Error("You already have an active subscription");
    }
  }

  const subRow = await createPendingSubscription(userId, "premium_monthly", "stripe");
  const baseUrl = (ENV.FRONTEND_URL || "http://localhost:5173").replace(/\/+$/, "");

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${baseUrl}/premium/success?session_id={CHECKOUT_SESSION_ID}&provider=stripe`,
    cancel_url: `${baseUrl}/premium?cancelled=stripe`,
    client_reference_id: String(subRow.id),
    customer_email: userEmail || undefined,
    metadata: {
      subscriptionId: String(subRow.id),
      userId: String(userId),
    },
    subscription_data: {
      metadata: {
        subscriptionId: String(subRow.id),
        userId: String(userId),
      },
    },
  });

  if (!session.url) {
    throw new Error("Stripe did not return a checkout URL");
  }

  return {
    checkout_url: session.url,
    subscription_id: subRow.id,
    stripe_session_id: session.id,
  };
}

/**
 * Activate premium from a completed Checkout Session (idempotent).
 * Used by webhook and by success-page verify call.
 */
export async function activateSubscriptionFromStripeSession(session) {
  const stripe = getStripe();
  if (!stripe) throw new Error("Stripe not configured");

  const subscriptionRowId = session.metadata?.subscriptionId;
  const metaUserId = session.metadata?.userId;
  if (!subscriptionRowId) {
    throw new Error("Missing subscription metadata on checkout session");
  }

  if (session.mode !== "subscription") {
    throw new Error("Session is not a subscription checkout");
  }
  if (session.payment_status !== "paid") {
    throw new Error(
      `Payment not complete yet (status: ${session.payment_status}). Wait a moment and refresh.`
    );
  }

  const stripeSubId =
    typeof session.subscription === "string"
      ? session.subscription
      : session.subscription?.id;
  if (!stripeSubId) {
    throw new Error("No Stripe subscription id on session");
  }

  let stripeSub =
    typeof session.subscription === "object" && session.subscription !== null
      ? session.subscription
      : null;

  let periodEndSec = stripeSub ? resolveSubscriptionPeriodEndUnix(stripeSub) : null;

  if (periodEndSec == null) {
    stripeSub = await stripe.subscriptions.retrieve(stripeSubId, {
      expand: ["items.data.price", "latest_invoice"],
    });
    periodEndSec = resolveSubscriptionPeriodEndUnix(stripeSub);
  }

  if (periodEndSec == null) {
    const items = await stripe.subscriptionItems.list({ subscription: stripeSubId, limit: 5 });
    const end = items.data[0]?.current_period_end;
    if (typeof end === "number" && end > 0) periodEndSec = end;
  }

  if (periodEndSec == null) {
    throw new Error(
      "Could not read subscription billing period from Stripe. Wait a moment and try again."
    );
  }

  const expiresAt = new Date(periodEndSec * 1000);
  const startedAt = new Date();

  const amountPaid =
    stripeSub.items?.data?.[0]?.price?.unit_amount != null
      ? String(Number(stripeSub.items.data[0].price.unit_amount) / 100)
      : null;

  const rows = await db
    .select()
    .from(subscriptionsTable)
    .where(eq(subscriptionsTable.id, Number(subscriptionRowId)))
    .limit(1);
  const row = rows[0];
  if (!row) throw new Error("Subscription row not found");

  if (metaUserId && String(row.userId) !== String(metaUserId)) {
    throw new Error("Subscription does not belong to this user");
  }

  if (row.status === "active" && row.paymentReference === stripeSubId) {
    return { subscription: row, alreadyActive: true };
  }

  await db
    .update(subscriptionsTable)
    .set({
      status: "active",
      startedAt,
      expiresAt,
      paymentProvider: "stripe",
      paymentReference: stripeSubId,
      amountPaid: amountPaid ?? row.amountPaid,
      updatedAt: new Date(),
    })
    .where(eq(subscriptionsTable.id, row.id));

  const [updated] = await db
    .select()
    .from(subscriptionsTable)
    .where(eq(subscriptionsTable.id, row.id))
    .limit(1);

  const [user] = await db
    .select({ email: userTable.email, name: userTable.name })
    .from(userTable)
    .where(eq(userTable.id, row.userId))
    .limit(1);

  if (user?.email) {
    try {
      await sendSubscriptionActivatedEmail(
        user.email,
        user.name || "User",
        row.plan,
        expiresAt
      );
    } catch (e) {
      console.error("Stripe subscription activation email failed:", e);
    }
  }

  return { subscription: updated || row, alreadyActive: false };
}

/**
 * Success page: retrieve session from Stripe and activate (same as webhook, idempotent).
 */
export async function verifyStripeCheckoutSession(sessionId, expectedUserId) {
  const stripe = getStripe();
  if (!stripe) throw new Error("Stripe not configured");

  const session = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ["subscription"],
  });

  if (expectedUserId != null && session.metadata?.userId !== String(expectedUserId)) {
    throw new Error("This payment session does not belong to your account");
  }

  return activateSubscriptionFromStripeSession(session);
}

/**
 * Webhook: verify signature and dispatch events.
 */
export function verifyStripeWebhookSignature(rawBody, signature) {
  const secret = ENV.STRIPE_WEBHOOK_SECRET;
  if (!secret) throw new Error("STRIPE_WEBHOOK_SECRET is not set");
  const stripe = getStripe();
  if (!stripe) throw new Error("Stripe not configured");
  return stripe.webhooks.constructEvent(rawBody, signature, secret);
}

/** Cancel Stripe subscription at period end (matches local cancel_at_period_end UX). */
export async function cancelStripeSubscriptionAtPeriodEnd(stripeSubscriptionId) {
  const stripe = getStripe();
  if (!stripe || !stripeSubscriptionId) return;
  await stripe.subscriptions.update(stripeSubscriptionId, {
    cancel_at_period_end: true,
  });
}

export async function handleStripeWebhookEvent(event) {
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      if (session.mode === "subscription") {
        await activateSubscriptionFromStripeSession(session);
      }
      break;
    }
    case "customer.subscription.updated": {
      const stripeSub = event.data.object;
      const subId = stripeSub.id;
      const periodEnd = resolveSubscriptionPeriodEndUnix(stripeSub);
      if (!subId || periodEnd == null) break;

      const rows = await db
        .select()
        .from(subscriptionsTable)
        .where(eq(subscriptionsTable.paymentReference, subId))
        .limit(1);
      const row = rows[0];
      if (!row || row.paymentProvider !== "stripe") break;

      const expiresAt = new Date(periodEnd * 1000);
      const status =
        stripeSub.status === "active"
          ? "active"
          : stripeSub.status === "canceled"
            ? "cancelled"
            : row.status;

      await db
        .update(subscriptionsTable)
        .set({
          status,
          expiresAt,
          updatedAt: new Date(),
        })
        .where(eq(subscriptionsTable.id, row.id));
      break;
    }
    case "customer.subscription.deleted": {
      const stripeSub = event.data.object;
      const subId = stripeSub.id;
      if (!subId) break;
      await db
        .update(subscriptionsTable)
        .set({
          status: "cancelled",
          cancelledAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(subscriptionsTable.paymentReference, subId));
      break;
    }
    default:
      break;
  }
}
