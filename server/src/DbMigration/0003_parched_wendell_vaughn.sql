CREATE TABLE "disease_treatments" (
	"id" serial PRIMARY KEY NOT NULL,
	"crop_key" text NOT NULL,
	"class_name" text NOT NULL,
	"severity_level_en" text,
	"severity_level_ne" text,
	"disease_desc_en" text,
	"disease_desc_ne" text,
	"preventive_measure_en" jsonb,
	"preventive_measure_ne" jsonb,
	"treatment_en" jsonb,
	"treatment_ne" jsonb,
	"recommended_medicine_en" jsonb,
	"recommended_medicine_ne" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
