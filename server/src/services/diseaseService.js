import { db } from "../config/db.js";
import { diseasesTable, cropsTable } from "../schema/index.js";
import { eq, and, asc, sql } from "drizzle-orm";

function normalize(val) {
  return String(val ?? "").trim();
}

export async function getCropIdByCropName(cropName) {
  const name = normalize(cropName);
  if (!name) return null;
  const id = Number(name);
  if (!Number.isNaN(id) && id > 0) return id;
  const [row] = await db
    .select({ cropId: cropsTable.cropId })
    .from(cropsTable)
    .where(sql`LOWER(TRIM(${cropsTable.cropName})) = ${name.toLowerCase()}`)
    .limit(1);
  return row?.cropId ?? null;
}

const diseaseSelect = {
  id: diseasesTable.id,
  cropId: diseasesTable.cropId,
  cropName: cropsTable.cropName,
  className: diseasesTable.className,
  generalNameEn: diseasesTable.generalNameEn,
  generalNameNe: diseasesTable.generalNameNe,
  categoryEn: diseasesTable.categoryEn,
  categoryNe: diseasesTable.categoryNe,
  scientificName: diseasesTable.scientificName,
  symptomsEn: diseasesTable.symptomsEn,
  symptomsNe: diseasesTable.symptomsNe,
  createdAt: diseasesTable.createdAt,
  updatedAt: diseasesTable.updatedAt,
};

export const getAllDiseases = async (cropKey = null) => {
  const base = db.select(diseaseSelect).from(diseasesTable).innerJoin(cropsTable, eq(diseasesTable.cropId, cropsTable.cropId));
  if (cropKey) {
    const cropId = await getCropIdByCropName(cropKey);
    if (!cropId) return [];
    return base.where(eq(diseasesTable.cropId, cropId)).orderBy(asc(diseasesTable.id));
  }
  return base.orderBy(asc(diseasesTable.id));
};

export const getDiseaseById = async (id) => {
  const [row] = await db.select(diseaseSelect).from(diseasesTable).innerJoin(cropsTable, eq(diseasesTable.cropId, cropsTable.cropId)).where(eq(diseasesTable.id, Number(id))).limit(1);
  return row ?? null;
};

export const getDiseaseByCropAndClass = async (cropKey, className) => {
  const cropId = await getCropIdByKey(cropKey);
  const cls = normalizeKey(className);
  if (!cropId || !cls) return null;
  const [row] = await db.select(diseaseSelect).from(diseasesTable).innerJoin(cropsTable, eq(diseasesTable.cropId, cropsTable.cropId)).where(and(eq(diseasesTable.cropId, cropId), sql`TRIM(${diseasesTable.className}) = ${cls}`)).limit(1);
  return row ?? null;
};

export const createDisease = async (payload) => {
  let cropId = payload.crop_id ?? payload.cropId;
  if (!cropId && (payload.crop_name ?? payload.cropName ?? payload.crop_key ?? payload.cropKey)) {
    const name = payload.crop_name ?? payload.cropName ?? payload.crop_key ?? payload.cropKey;
    cropId = await getCropIdByCropName(name);
  }
  if (!cropId) return null;
  const [row] = await db
    .insert(diseasesTable)
    .values({
      cropId: Number(cropId),
      className: payload.class_name ?? payload.className,
      generalNameEn: payload.general_name_en ?? payload.generalNameEn ?? null,
      generalNameNe: payload.general_name_ne ?? payload.generalNameNe ?? null,
      categoryEn: payload.category_en ?? payload.categoryEn ?? null,
      categoryNe: payload.category_ne ?? payload.categoryNe ?? null,
      scientificName: payload.scientific_name ?? payload.scientificName ?? null,
      symptomsEn: payload.symptoms_en ?? payload.symptomsEn ?? null,
      symptomsNe: payload.symptoms_ne ?? payload.symptomsNe ?? null,
    })
    .returning();
  return row ?? null;
};

export const updateDisease = async (id, payload) => {
  const updates = { updatedAt: new Date() };
  if (payload.crop_id !== undefined || payload.cropId !== undefined) updates.cropId = Number(payload.crop_id ?? payload.cropId);
  if (payload.class_name !== undefined) updates.className = payload.class_name;
  if (payload.general_name_en !== undefined) updates.generalNameEn = payload.general_name_en;
  if (payload.general_name_ne !== undefined) updates.generalNameNe = payload.general_name_ne;
  if (payload.category_en !== undefined) updates.categoryEn = payload.category_en;
  if (payload.category_ne !== undefined) updates.categoryNe = payload.category_ne;
  if (payload.scientific_name !== undefined) updates.scientificName = payload.scientific_name;
  if (payload.symptoms_en !== undefined) updates.symptomsEn = payload.symptoms_en;
  if (payload.symptoms_ne !== undefined) updates.symptomsNe = payload.symptoms_ne;
  const [row] = await db.update(diseasesTable).set(updates).where(eq(diseasesTable.id, Number(id))).returning();
  return row ?? null;
};

export const deleteDisease = async (id) => {
  await db.delete(diseasesTable).where(eq(diseasesTable.id, Number(id)));
  return true;
};
