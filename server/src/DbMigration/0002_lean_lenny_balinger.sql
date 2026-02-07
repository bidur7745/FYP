CREATE TYPE "public"."local_body_type" AS ENUM('Municipality', 'Metro', 'Rural Municipality');--> statement-breakpoint
CREATE TYPE "public"."region_scope" AS ENUM('specific', 'district-wide', 'province-wide', 'national');--> statement-breakpoint
CREATE TYPE "public"."scheme_level" AS ENUM('Central', 'Provincial', 'Local');--> statement-breakpoint
CREATE TYPE "public"."scheme_status" AS ENUM('active', 'expired', 'upcoming');--> statement-breakpoint
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
ALTER TABLE "scheme_details" ADD CONSTRAINT "scheme_details_scheme_id_government_schemes_id_fk" FOREIGN KEY ("scheme_id") REFERENCES "public"."government_schemes"("id") ON DELETE cascade ON UPDATE no action;