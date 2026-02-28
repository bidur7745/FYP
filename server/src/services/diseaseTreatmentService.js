import { db } from "../config/db.js";
import { diseaseTreatmentsTable } from "../schema/index.js";
import { eq, and } from "drizzle-orm";

/**
 * Get treatment by crop_key and class_name.
 * @param {string} cropKey - tomato, potato, maize
 * @returns treatment row or null
 */
export const getTreatmentByCropAndClass = async (cropKey, className) => {
  const [row] = await db
    .select()
    .from(diseaseTreatmentsTable)
    .where(
      and(
        eq(diseaseTreatmentsTable.cropKey, cropKey),
        eq(diseaseTreatmentsTable.className, className)
      )
    )
    .limit(1);

  return row ?? null;
};

/**
 * Get all treatments (optionally filter by crop).
 */
export const getAllTreatments = async (cropKey = null) => {
  let q = db.select().from(diseaseTreatmentsTable);
  if (cropKey) q = q.where(eq(diseaseTreatmentsTable.cropKey, cropKey));
  return q.orderBy(diseaseTreatmentsTable.id);
};

/**
 * Create a new treatment record.
 */
export const createTreatment = async (data) => {
  const [row] = await db
    .insert(diseaseTreatmentsTable)
    .values({
      cropKey: data.crop_key ?? data.cropKey,
      className: data.class_name ?? data.className,
      severityLevelEn: data.severity_level_en ?? data.severityLevelEn ?? null,
      severityLevelNe: data.severity_level_ne ?? data.severityLevelNe ?? null,
      diseaseDescEn: data.disease_desc_en ?? data.diseaseDescEn ?? null,
      diseaseDescNe: data.disease_desc_ne ?? data.diseaseDescNe ?? null,
      preventiveMeasureEn: data.preventive_measure_en ?? data.preventiveMeasureEn ?? null,
      preventiveMeasureNe: data.preventive_measure_ne ?? data.preventiveMeasureNe ?? null,
      treatmentEn: data.treatment_en ?? data.treatmentEn ?? null,
      treatmentNe: data.treatment_ne ?? data.treatmentNe ?? null,
      recommendedMedicineEn: data.recommended_medicine_en ?? data.recommendedMedicineEn ?? null,
      recommendedMedicineNe: data.recommended_medicine_ne ?? data.recommendedMedicineNe ?? null,
    })
    .returning();

  return row;
};

/**
 * Create multiple treatments (bulk upload).
 */
export const createTreatmentsBulk = async (items) => {
  const values = items.map((data) => ({
    cropKey: data.crop_key ?? data.cropKey,
    className: data.class_name ?? data.className,
    severityLevelEn: data.severity_level_en ?? data.severityLevelEn ?? null,
    severityLevelNe: data.severity_level_ne ?? data.severityLevelNe ?? null,
    diseaseDescEn: data.disease_desc_en ?? data.diseaseDescEn ?? null,
    diseaseDescNe: data.disease_desc_ne ?? data.diseaseDescNe ?? null,
    preventiveMeasureEn: data.preventive_measure_en ?? data.preventiveMeasureEn ?? null,
    preventiveMeasureNe: data.preventive_measure_ne ?? data.preventiveMeasureNe ?? null,
    treatmentEn: data.treatment_en ?? data.treatmentEn ?? null,
    treatmentNe: data.treatment_ne ?? data.treatmentNe ?? null,
    recommendedMedicineEn: data.recommended_medicine_en ?? data.recommendedMedicineEn ?? null,
    recommendedMedicineNe: data.recommended_medicine_ne ?? data.recommendedMedicineNe ?? null,
  }));

  const rows = await db.insert(diseaseTreatmentsTable).values(values).returning();
  return rows;
};
