import {
  getAllDiseases,
  getDiseaseById,
  getDiseaseByCropAndClass,
  createDisease,
  updateDisease,
  deleteDisease,
} from "../services/diseaseService.js";

function mapDiseaseRow(r, useNe = false) {
  if (!r) return null;
  return {
    id: r.id,
    crop_id: r.cropId,
    crop_key: r.cropName,
    class_name: r.className,
    general_name: useNe ? r.generalNameNe : r.generalNameEn,
    general_name_en: r.generalNameEn,
    general_name_ne: r.generalNameNe,
    category: useNe ? r.categoryNe : r.categoryEn,
    category_en: r.categoryEn,
    category_ne: r.categoryNe,
    scientific_name: r.scientificName,
    symptoms: useNe ? r.symptomsNe : r.symptomsEn,
    symptoms_en: r.symptomsEn,
    symptoms_ne: r.symptomsNe,
    created_at: r.createdAt,
    updated_at: r.updatedAt,
  };
}

export const listDiseasesController = async (req, res) => {
  try {
    const { crop, lang } = req.query;
    const useNe = lang === "ne";
    const rows = await getAllDiseases(crop || null);
    const data = rows.map((r) => mapDiseaseRow(r, useNe));
    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("listDiseasesController:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to list diseases" });
  }
};

export const getDiseaseController = async (req, res) => {
  try {
    const { id } = req.params;
    const { crop, className, lang } = req.query;
    const useNe = lang === "ne";

    if (id && id !== "by") {
      const row = await getDiseaseById(id);
      if (!row) return res.status(404).json({ success: false, message: "Disease not found" });
      return res.status(200).json({ success: true, data: mapDiseaseRow(row, useNe) });
    }
    if (crop && className) {
      const row = await getDiseaseByCropAndClass(crop, className);
      if (!row) return res.status(404).json({ success: false, message: "Disease not found" });
      return res.status(200).json({ success: true, data: mapDiseaseRow(row, useNe) });
    }
    return res.status(400).json({ success: false, message: "Provide id or crop & className" });
  } catch (error) {
    console.error("getDiseaseController:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to get disease" });
  }
};

export const createDiseaseController = async (req, res) => {
  try {
    const payload = req.body || {};
    const row = await createDisease(payload);
    if (!row) return res.status(400).json({ success: false, message: "Failed to create (check crop_id or crop_name)" });
    const full = await getDiseaseById(row.id);
    return res.status(201).json({ success: true, data: mapDiseaseRow(full, false) });
  } catch (error) {
    console.error("createDiseaseController:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to create disease" });
  }
};

export const updateDiseaseController = async (req, res) => {
  try {
    const { id } = req.params;
    const row = await updateDisease(id, req.body || {});
    if (!row) return res.status(404).json({ success: false, message: "Disease not found" });
    const full = await getDiseaseById(id);
    return res.status(200).json({ success: true, data: mapDiseaseRow(full, false) });
  } catch (error) {
    console.error("updateDiseaseController:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to update disease" });
  }
};

export const deleteDiseaseController = async (req, res) => {
  try {
    await deleteDisease(req.params.id);
    return res.status(200).json({ success: true, message: "Disease deleted" });
  } catch (error) {
    console.error("deleteDiseaseController:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to delete disease" });
  }
};
