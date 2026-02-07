CREATE TYPE "public"."role" AS ENUM('user', 'admin', 'expert');--> statement-breakpoint
CREATE TABLE "crops" (
	"crop_id" serial PRIMARY KEY NOT NULL,
	"crop_name" text NOT NULL,
	"crop_category" text,
	"regions" text[] NOT NULL,
	"season" text NOT NULL,
	"soil_type" text,
	"water_requirement" text,
	"climate" text,
	"notes" text,
	"image_url" text
);
--> statement-breakpoint
CREATE TABLE "plantation_guides" (
	"guide_id" serial PRIMARY KEY NOT NULL,
	"crop_id" integer NOT NULL,
	"seed_preparation" text,
	"planting_method" text,
	"irrigation_schedule" text,
	"harvesting_tips" text,
	"average_yield" text,
	"video_url" text,
	"spacing" text,
	"maturity_period" text,
	"plantation_process" text[]
);
--> statement-breakpoint
CREATE TABLE "planting_calendar" (
	"calendar_id" serial PRIMARY KEY NOT NULL,
	"crop_id" integer NOT NULL,
	"region" text NOT NULL,
	"season" text NOT NULL,
	"sowing_period" text,
	"transplanting_period" text,
	"harvesting_period" text,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "userDetails" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"address" text,
	"farmLocation" text,
	"bio" text,
	"profileImage" text,
	"phone" text,
	"skills" text,
	"yearsOfExperience" integer,
	"education" text,
	"licenseImage" text,
	"isVerifiedExpert" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"password" text NOT NULL,
	"role" "role" DEFAULT 'user' NOT NULL,
	"isVerified" boolean DEFAULT false NOT NULL,
	"verificationCode" text,
	"verificationExpires" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "plantation_guides" ADD CONSTRAINT "plantation_guides_crop_id_crops_crop_id_fk" FOREIGN KEY ("crop_id") REFERENCES "public"."crops"("crop_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "planting_calendar" ADD CONSTRAINT "planting_calendar_crop_id_crops_crop_id_fk" FOREIGN KEY ("crop_id") REFERENCES "public"."crops"("crop_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "userDetails" ADD CONSTRAINT "userDetails_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;