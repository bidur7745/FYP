CREATE TYPE "public"."alert_type" AS ENUM('freeze', 'cold', 'heat', 'warm', 'rain', 'heavy-rain', 'drought', 'wind', 'wind-moderate', 'snow', 'freeze-forecast', 'heavy-rain-forecast');--> statement-breakpoint
CREATE TYPE "public"."severity" AS ENUM('low', 'medium', 'high');--> statement-breakpoint
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
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;