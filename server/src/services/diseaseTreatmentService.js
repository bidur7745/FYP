import { db } from "../config/db.js";
import { diseaseTreatmentsTable, diseasesTable, cropsTable } from "../schema/index.js";
import { eq, and, asc, sql } from "drizzle-orm";
import { getCropIdByCropName } from "./diseaseService.js";

function normalizeKey(val) {
  return String(val ?? "").trim();
}

const treatmentSelect = {
  id: diseaseTreatmentsTable.id,
  diseaseId: diseaseTreatmentsTable.diseaseId,
  cropName: cropsTable.cropName,
  className: diseasesTable.className,
  severityLevelEn: diseaseTreatmentsTable.severityLevelEn,
  severityLevelNe: diseaseTreatmentsTable.severityLevelNe,
  diseaseDescEn: diseaseTreatmentsTable.diseaseDescEn,
  diseaseDescNe: diseaseTreatmentsTable.diseaseDescNe,
  preventiveMeasureEn: diseaseTreatmentsTable.preventiveMeasureEn,
  preventiveMeasureNe: diseaseTreatmentsTable.preventiveMeasureNe,
  treatmentEn: diseaseTreatmentsTable.treatmentEn,
  treatmentNe: diseaseTreatmentsTable.treatmentNe,
  recommendedMedicineEn: diseaseTreatmentsTable.recommendedMedicineEn,
  recommendedMedicineNe: diseaseTreatmentsTable.recommendedMedicineNe,
  createdAt: diseaseTreatmentsTable.createdAt,
  updatedAt: diseaseTreatmentsTable.updatedAt,
};

export const getAllTreatments = async (cropKey = null) => {
  const base = db
    .select(treatmentSelect)
    .from(diseaseTreatmentsTable)
    .innerJoin(diseasesTable, eq(diseaseTreatmentsTable.diseaseId, diseasesTable.id))
    .innerJoin(cropsTable, eq(diseasesTable.cropId, cropsTable.cropId));
  if (cropKey) {
    const cropId = await getCropIdByKey(cropKey);
    if (!cropId) return [];
    return base.where(eq(diseasesTable.cropId, cropId)).orderBy(asc(diseaseTreatmentsTable.id));
  }
  return base.orderBy(asc(diseaseTreatmentsTable.id));
};

export const getTreatmentByCropAndClass = async (cropNameOrId, className) => {
  const cropId = await getCropIdByCropName(cropNameOrId);
  const cls = normalizeKey(className);
  if (!cropId || !cls) return null;
  const [row] = await db
    .select(treatmentSelect)
    .from(diseaseTreatmentsTable)
    .innerJoin(diseasesTable, eq(diseaseTreatmentsTable.diseaseId, diseasesTable.id))
    .innerJoin(cropsTable, eq(diseasesTable.cropId, cropsTable.cropId))
    .where(and(eq(diseasesTable.cropId, cropId), sql`TRIM(${diseasesTable.className}) = ${cls}`))
    .limit(1);
  return row ?? null;
};

export const getTreatmentById = async (id) => {
  const [row] = await db
    .select(treatmentSelect)
    .from(diseaseTreatmentsTable)
    .innerJoin(diseasesTable, eq(diseaseTreatmentsTable.diseaseId, diseasesTable.id))
    .innerJoin(cropsTable, eq(diseasesTable.cropId, cropsTable.cropId))
    .where(eq(diseaseTreatmentsTable.id, Number(id)))
    .limit(1);
  return row ?? null;
};

export const createTreatment = async (payload) => {
  const diseaseId = payload.disease_id ?? payload.diseaseId;
  if (!diseaseId) return null;
  const [row] = await db
    .insert(diseaseTreatmentsTable)
    .values({
      diseaseId: Number(diseaseId),
      severityLevelEn: payload.severity_level_en ?? payload.severityLevelEn ?? null,
      severityLevelNe: payload.severity_level_ne ?? payload.severityLevelNe ?? null,
      diseaseDescEn: payload.disease_desc_en ?? payload.diseaseDescEn ?? null,
      diseaseDescNe: payload.disease_desc_ne ?? payload.diseaseDescNe ?? null,
      preventiveMeasureEn: payload.preventive_measure_en ?? payload.preventiveMeasureEn ?? null,
      preventiveMeasureNe: payload.preventive_measure_ne ?? payload.preventiveMeasureNe ?? null,
      treatmentEn: payload.treatment_en ?? payload.treatmentEn ?? null,
      treatmentNe: payload.treatment_ne ?? payload.treatmentNe ?? null,
      recommendedMedicineEn: payload.recommended_medicine_en ?? payload.recommendedMedicineEn ?? null,
      recommendedMedicineNe: payload.recommended_medicine_ne ?? payload.recommendedMedicineNe ?? null,
    })
    .returning();
  return row ?? null;
};

export const updateTreatment = async (id, payload) => {
  const updates = { updatedAt: new Date() };
  if (payload.disease_id !== undefined) updates.diseaseId = payload.disease_id;
  if (payload.severity_level_en !== undefined) updates.severityLevelEn = payload.severity_level_en;
  if (payload.severity_level_ne !== undefined) updates.severityLevelNe = payload.severity_level_ne;
  if (payload.disease_desc_en !== undefined) updates.diseaseDescEn = payload.disease_desc_en;
  if (payload.disease_desc_ne !== undefined) updates.diseaseDescNe = payload.disease_desc_ne;
  if (payload.preventive_measure_en !== undefined) updates.preventiveMeasureEn = payload.preventive_measure_en;
  if (payload.preventive_measure_ne !== undefined) updates.preventiveMeasureNe = payload.preventive_measure_ne;
  if (payload.treatment_en !== undefined) updates.treatmentEn = payload.treatment_en;
  if (payload.treatment_ne !== undefined) updates.treatmentNe = payload.treatment_ne;
  if (payload.recommended_medicine_en !== undefined) updates.recommendedMedicineEn = payload.recommended_medicine_en;
  if (payload.recommended_medicine_ne !== undefined) updates.recommendedMedicineNe = payload.recommended_medicine_ne;
  const [row] = await db
    .update(diseaseTreatmentsTable)
    .set(updates)
    .where(eq(diseaseTreatmentsTable.id, Number(id)))
    .returning();
  return row ?? null;
};

export const deleteTreatment = async (id) => {
  await db.delete(diseaseTreatmentsTable).where(eq(diseaseTreatmentsTable.id, Number(id)));
  return true;
};
