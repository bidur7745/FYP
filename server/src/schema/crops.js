import { pgTable, serial, text } from "drizzle-orm/pg-core";

export const cropsTable = pgTable("crops", {
  cropId: serial("crop_id").primaryKey(),
  cropName: text("crop_name").notNull(), 
  cropCategory: text("crop_category"), 
  regions: text("regions").array().notNull(), 
  season: text("season").notNull(), 
  soilType: text("soil_type"), 
  waterRequirement: text("water_requirement"), 
  climate: text("climate"), 
  notes: text("notes"),
  imageUrl: text("image_url"), 
});
// added new column imageUrl and change the region to regionss