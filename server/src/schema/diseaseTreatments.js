import { pgTable, serial, text, timestamp, jsonb } from "drizzle-orm/pg-core";

export const diseaseTreatmentsTable = pgTable("disease_treatments", {
  id: serial("id").primaryKey(),
  cropKey: text("crop_key").notNull(),
  className: text("class_name").notNull(),
  severityLevelEn: text("severity_level_en"),
  severityLevelNe: text("severity_level_ne"),
  diseaseDescEn: text("disease_desc_en"),
  diseaseDescNe: text("disease_desc_ne"),
  preventiveMeasureEn: jsonb("preventive_measure_en").$type<string[]>(),
  preventiveMeasureNe: jsonb("preventive_measure_ne").$type<string[]>(),
  treatmentEn: jsonb("treatment_en").$type<string[]>(),
  treatmentNe: jsonb("treatment_ne").$type<string[]>(),
  recommendedMedicineEn: jsonb("recommended_medicine_en").$type<string[]>(),
  recommendedMedicineNe: jsonb("recommended_medicine_ne").$type<string[]>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
