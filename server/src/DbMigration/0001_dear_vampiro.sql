ALTER TABLE "userDetails" ADD COLUMN "isVerifiedExpert" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "isVerified" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "userDetails" DROP COLUMN "isVerified";