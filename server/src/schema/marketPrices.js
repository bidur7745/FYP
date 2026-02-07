import { pgTable, serial, text, date, numeric, timestamp } from "drizzle-orm/pg-core";

export const marketPricesTable = pgTable("market_prices", {
  id: serial("id").primaryKey(),
  // Crop: both languages (Kalimati shows Nepali by default; switch to English to get both)
  cropNameEn: text("crop_name_en").notNull(),
  cropNameNe: text("crop_name_ne"),
  // Market/location (e.g. Kalimati)
  marketNameEn: text("market_name_en").notNull(),
  marketNameNe: text("market_name_ne"),
  // Price
  price: numeric("price", { precision: 12, scale: 2 }).notNull(),
  minPrice: numeric("min_price", { precision: 12, scale: 2 }).notNull(),
  maxPrice: numeric("max_price", { precision: 12, scale: 2 }).notNull(),
  averagePrice: numeric("average_price", { precision: 12, scale: 2 }).notNull(),
  unit: text("unit").notNull(), // e.g. "kg", "quintal"
  priceDate: date("price_date").notNull(),
  // Source (e.g. "Kalimati FVM")
  source: text("source"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});