import {
  pgTable,
  serial,
  integer,
  text,
  timestamp,
  boolean,
  pgEnum,
  numeric,
} from "drizzle-orm/pg-core";
import { userTable } from "./user.js";

export const subscriptionStatusEnum = pgEnum("subscription_status", [
  "active",
  "cancelled",
  "expired",
  "pending_payment",
]);

export const subscriptionsTable = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => userTable.id, { onDelete: "cascade" })
    .notNull(),
  plan: text("plan").default("premium_monthly").notNull(),
  status: subscriptionStatusEnum("status").default("pending_payment").notNull(),
  startedAt: timestamp("started_at"),
  expiresAt: timestamp("expires_at"),
  cancelledAt: timestamp("cancelled_at"),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").default(true).notNull(),
  paymentProvider: text("payment_provider"),
  paymentReference: text("payment_reference"),
  amountPaid: numeric("amount_paid", { precision: 10, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
