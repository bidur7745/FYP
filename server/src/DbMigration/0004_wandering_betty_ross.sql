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
