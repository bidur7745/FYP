CREATE TABLE "disease_predictions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"crop" text NOT NULL,
	"predicted_disease" text NOT NULL,
	"general_name" text,
	"image_url" text,
	"disease_confidence" numeric(5, 4) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "disease_predictions" ADD CONSTRAINT "disease_predictions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;