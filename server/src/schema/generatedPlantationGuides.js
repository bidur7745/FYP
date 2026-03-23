import { pgTable, serial, text, jsonb, integer, timestamp } from "drizzle-orm/pg-core";
import { userTable } from "./user.js";

export const generatedPlantationGuidesTable = pgTable("generated_plantation_guides", {
  id: serial("id").primaryKey(),
  cropName: text("crop_name").notNull(),
  normalizedCropName: text("normalized_crop_name").notNull(),
  language: text("language").notNull().default("en"),
  responseJson: jsonb("response_json").notNull(),
  source: text("source").notNull().default("deepseek"),
  reviewStatus: text("review_status").notNull().default("pending"), // pending | approved | rejected
  generatedByUserId: integer("generated_by_user_id").references(() => userTable.id, {
    onDelete: "set null",
  }),
  reviewedByUserId: integer("reviewed_by_user_id").references(() => userTable.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
