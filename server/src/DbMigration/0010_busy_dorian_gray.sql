CREATE TABLE "generated_plantation_guides" (
	"id" serial PRIMARY KEY NOT NULL,
	"crop_name" text NOT NULL,
	"normalized_crop_name" text NOT NULL,
	"language" text DEFAULT 'en' NOT NULL,
	"response_json" jsonb NOT NULL,
	"source" text DEFAULT 'deepseek' NOT NULL,
	"review_status" text DEFAULT 'pending' NOT NULL,
	"generated_by_user_id" integer,
	"reviewed_by_user_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "generated_plantation_guides" ADD CONSTRAINT "generated_plantation_guides_generated_by_user_id_users_id_fk" FOREIGN KEY ("generated_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "generated_plantation_guides" ADD CONSTRAINT "generated_plantation_guides_reviewed_by_user_id_users_id_fk" FOREIGN KEY ("reviewed_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;