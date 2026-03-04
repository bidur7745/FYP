import { pgTable, serial, text, timestamp, jsonb, integer } from "drizzle-orm/pg-core";
import { diseasesTable } from "./diseases.js";

export const diseaseTreatmentsTable = pgTable("disease_treatments", {
  id: serial("id").primaryKey(),
  diseaseId: integer("disease_id").references(() => diseasesTable.id, { onDelete: "cascade" }).notNull(),
  severityLevelEn: text("severity_level_en"),
  severityLevelNe: text("severity_level_ne"),
  diseaseDescEn: text("disease_desc_en"),
  diseaseDescNe: text("disease_desc_ne"),
  preventiveMeasureEn: jsonb("preventive_measure_en"),
  preventiveMeasureNe: jsonb("preventive_measure_ne"),
  treatmentEn: jsonb("treatment_en"),
  treatmentNe: jsonb("treatment_ne"),
  recommendedMedicineEn: jsonb("recommended_medicine_en"),
  recommendedMedicineNe: jsonb("recommended_medicine_ne"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
