import { pgTable, serial, text, integer } from "drizzle-orm/pg-core";
import { cropsTable } from "./crops.js";

export const plantingCalendarTable = pgTable("planting_calendar", {
  calendarId: serial("calendar_id").primaryKey(),

  cropId: integer("crop_id")
    .references(() => cropsTable.cropId, { onDelete: "cascade" })
    .notNull(),

  region: text("region").notNull(), // Terai / Hill / Mountain
  season: text("season").notNull(), // Winter / Spring / Monsoon / Autumn

  sowingPeriod: text("sowing_period"), // e.g., Baishakh – Jestha
  transplantingPeriod: text("transplanting_period"), // Optional
  harvestingPeriod: text("harvesting_period"), // e.g., Kartik – Mangsir

  notes: text("notes"), // Extra regional advice
});
