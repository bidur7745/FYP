CREATE TABLE "diseases" (
	"id" serial PRIMARY KEY NOT NULL,
	"crop_id" integer NOT NULL,
	"class_name" text NOT NULL,
	"general_name_en" text,
	"general_name_ne" text,
	"category_en" text,
	"category_ne" text,
	"scientific_name" text,
	"symptoms_en" text,
	"symptoms_ne" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "disease_treatments" ADD COLUMN "disease_id" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "diseases" ADD CONSTRAINT "diseases_crop_id_crops_crop_id_fk" FOREIGN KEY ("crop_id") REFERENCES "public"."crops"("crop_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "diseases_crop_class_unique" ON "diseases" USING btree ("crop_id","class_name");--> statement-breakpoint
ALTER TABLE "disease_treatments" ADD CONSTRAINT "disease_treatments_disease_id_diseases_id_fk" FOREIGN KEY ("disease_id") REFERENCES "public"."diseases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "disease_treatments" DROP COLUMN "crop_key";--> statement-breakpoint
ALTER TABLE "disease_treatments" DROP COLUMN "class_name";