CREATE TYPE "public"."subscription_status" AS ENUM('active', 'cancelled', 'expired', 'pending_payment');--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"plan" text DEFAULT 'premium_monthly' NOT NULL,
	"status" "subscription_status" DEFAULT 'pending_payment' NOT NULL,
	"started_at" timestamp,
	"expires_at" timestamp,
	"cancelled_at" timestamp,
	"cancel_at_period_end" boolean DEFAULT true NOT NULL,
	"payment_provider" text,
	"payment_reference" text,
	"amount_paid" numeric(10, 2),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;