import { pgTable, serial, text, integer, jsonb, timestamp } from "drizzle-orm/pg-core";
import { cropsTable } from "./crops.js";

export const agroRecommendationsTable = pgTable("agro_recommendations", {
  id: serial("id").primaryKey(),
  cropId: integer("crop_id")
    .references(() => cropsTable.cropId, { onDelete: "cascade" })
    .notNull(),
  language: text("language").notNull().default("en"),
  responseJson: jsonb("response_json").notNull(),
  generatedAt: timestamp("generated_at").defaultNow().notNull(),
});
