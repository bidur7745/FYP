CREATE TYPE "public"."alert_type" AS ENUM('freeze', 'cold', 'heat', 'warm', 'rain', 'heavy-rain', 'drought', 'wind', 'wind-moderate', 'snow', 'freeze-forecast', 'heavy-rain-forecast');--> statement-breakpoint
CREATE TYPE "public"."severity" AS ENUM('low', 'medium', 'high');--> statement-breakpoint
CREATE TYPE "public"."local_body_type" AS ENUM('Municipality', 'Metro', 'Rural Municipality');--> statement-breakpoint
CREATE TYPE "public"."region_scope" AS ENUM('specific', 'district-wide', 'province-wide', 'national');--> statement-breakpoint
CREATE TYPE "public"."scheme_level" AS ENUM('Central', 'Provincial', 'Local');--> statement-breakpoint
CREATE TYPE "public"."scheme_status" AS ENUM('active', 'expired', 'upcoming');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('user', 'admin', 'expert');--> statement-breakpoint
CREATE TYPE "public"."expert_verification_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TABLE "alerts" (
	"alert_id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"location" text NOT NULL,
	"latitude" real,
	"longitude" real,
	"type" "alert_type" NOT NULL,
	"severity" "severity" NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"icon" text,
	"recommended_actions" text[] DEFAULT '{}',
	"weather_data" jsonb[] DEFAULT '{}',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp NOT NULL
);
--> statement-breakpoint
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
CREATE TABLE "government_schemes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"scheme_type" text,
	"sector" text DEFAULT 'Agriculture',
	"level" "scheme_level",
	"province_name" text,
	"district_name" text,
	"local_body_type" "local_body_type",
	"local_body_name" text,
	"region_scope" "region_scope",
	"source_url" text,
	"document_url" text,
	"status" "scheme_status",
	"published_date" date,
	"expiry_date" date,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "market_prices" (
	"id" serial PRIMARY KEY NOT NULL,
	"crop_name_en" text NOT NULL,
	"crop_name_ne" text,
	"market_name_en" text NOT NULL,
	"market_name_ne" text,
	"price" numeric(12, 2) NOT NULL,
	"min_price" numeric(12, 2) NOT NULL,
	"max_price" numeric(12, 2) NOT NULL,
	"average_price" numeric(12, 2) NOT NULL,
	"unit" text NOT NULL,
	"price_date" date NOT NULL,
	"source" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"body" text,
	"read" boolean DEFAULT false NOT NULL,
	"reference_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
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
CREATE TABLE "scheme_details" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"scheme_id" uuid NOT NULL,
	"eligibility" text,
	"benefits" text,
	"application_process" text[],
	"required_documents" text[],
	"usage_conditions" text,
	CONSTRAINT "scheme_details_scheme_id_unique" UNIQUE("scheme_id")
);
--> statement-breakpoint
CREATE TABLE "support_queries" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"message" text NOT NULL,
	"user_id" integer,
	"status" text DEFAULT 'open' NOT NULL,
	"admin_reply" text,
	"answered_at" timestamp,
	"answered_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
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
	"isVerifiedExpert" "expert_verification_status" DEFAULT 'pending' NOT NULL,
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
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plantation_guides" ADD CONSTRAINT "plantation_guides_crop_id_crops_crop_id_fk" FOREIGN KEY ("crop_id") REFERENCES "public"."crops"("crop_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "planting_calendar" ADD CONSTRAINT "planting_calendar_crop_id_crops_crop_id_fk" FOREIGN KEY ("crop_id") REFERENCES "public"."crops"("crop_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scheme_details" ADD CONSTRAINT "scheme_details_scheme_id_government_schemes_id_fk" FOREIGN KEY ("scheme_id") REFERENCES "public"."government_schemes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_queries" ADD CONSTRAINT "support_queries_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_queries" ADD CONSTRAINT "support_queries_answered_by_users_id_fk" FOREIGN KEY ("answered_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "userDetails" ADD CONSTRAINT "userDetails_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;