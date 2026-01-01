CREATE TYPE "public"."role" AS ENUM('user', 'admin', 'expert');--> statement-breakpoint
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
	"isVerified" boolean DEFAULT false NOT NULL,
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
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "userDetails" ADD CONSTRAINT "userDetails_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;