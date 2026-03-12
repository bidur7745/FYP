CREATE TABLE "agro_recommendations" (
	"id" serial PRIMARY KEY NOT NULL,
	"crop_id" integer NOT NULL,
	"language" text DEFAULT 'en' NOT NULL,
	"response_json" jsonb NOT NULL,
	"generated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "agro_recommendations" ADD CONSTRAINT "agro_recommendations_crop_id_crops_crop_id_fk" FOREIGN KEY ("crop_id") REFERENCES "public"."crops"("crop_id") ON DELETE cascade ON UPDATE no action;