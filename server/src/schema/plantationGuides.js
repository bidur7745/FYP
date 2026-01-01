import { pgTable, serial, text, integer } from "drizzle-orm/pg-core";
import { cropsTable } from "./crops.js";

export const plantationGuidesTable = pgTable("plantation_guides", {
  guideId: serial("guide_id").primaryKey(),

  cropId: integer("crop_id")
    .references(() => cropsTable.cropId, { onDelete: "cascade" })
    .notNull(),

  seedPreparation: text("seed_preparation"), //process to prepare seeds before planting
  plantingMethod: text("planting_method"),
  irrigationSchedule: text("irrigation_schedule"),

  harvestingTips: text("harvesting_tips"),
  averageYield: text("average_yield"),

  videoUrl: text("video_url"),
  spacing: text("spacing"),
  maturityPeriod: text("maturity_period"),

  plantationProcess: text("plantation_process").array(), 
});
