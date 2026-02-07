import { pgTable, serial, text, integer } from "drizzle-orm/pg-core";
import { cropsTable } from "./crops.js";

export const plantingCalendarTable = pgTable("planting_calendar", {
  calendarId: serial("calendar_id").primaryKey(),

  cropId: integer("crop_id")
    .references(() => cropsTable.cropId, { onDelete: "cascade" })
    .notNull(),
  region: text("region").notNull(),
  season: text("season").notNull(), 
  sowingPeriod: text("sowing_period"),
  transplantingPeriod: text("transplanting_period"), 
  harvestingPeriod: text("harvesting_period"), 
  notes: text("notes"), 
});
