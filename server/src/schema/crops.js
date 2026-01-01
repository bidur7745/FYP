import { pgTable, serial, text } from "drizzle-orm/pg-core";

export const cropsTable = pgTable("crops", {
  cropId: serial("crop_id").primaryKey(),

  cropName: text("crop_name").notNull(), // e.g., Rice, Wheat, Maize
  cropCategory: text("crop_category"), // Cereal, Vegetable, Fruit, Pulse

  region: text("region").notNull(), // Terai / Hill / Mountain
  season: text("season").notNull(), // Winter / Spring / Monsoon / Autumn

  soilType: text("soil_type"), // Loamy, Sandy loam, Clay
  waterRequirement: text("water_requirement"), // Low / Medium / High

  climate: text("climate"), // Temperature, rainfall needs
  notes: text("notes"), // Extra advisory remarks
});
