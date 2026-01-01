ALTER TABLE "users" ADD COLUMN "verificationCode" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "verificationExpires" timestamp;