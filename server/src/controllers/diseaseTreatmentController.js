import {
  getTreatmentByCropAndClass,
  getAllTreatments,
  getTreatmentById,
  createTreatment,
  updateTreatment,
  deleteTreatment,
} from "../services/diseaseTreatmentService.js";

export const getTreatmentsController = async (req, res) => {
  try {
    const { crop, className, lang, all } = req.query;
    const useNe = lang === "ne";
    const mapRow = (r) => ({
      id: r.id,
      crop_key: r.cropName,
      class_name: r.className,
      severity_level: useNe ? r.severityLevelNe : r.severityLevelEn,
      disease_desc: useNe ? r.diseaseDescNe : r.diseaseDescEn,
      preventive_measure: useNe ? r.preventiveMeasureNe : r.preventiveMeasureEn,
      treatment: useNe ? r.treatmentNe : r.treatmentEn,
      recommended_medicine: useNe ? r.recommendedMedicineNe : r.recommendedMedicineEn,
      created_at: r.createdAt,
      updated_at: r.updatedAt,
    });

    if (all === "true" || all === "1") {
      const rows = await getAllTreatments(crop || null);
      return res.status(200).json({ success: true, data: rows.map(mapRow) });
    }
    if (!crop || !className) {
      return res.status(400).json({ success: false, message: "crop and className required (or ?all=true)" });
    }
    const row = await getTreatmentByCropAndClass(String(crop).toLowerCase().trim(), String(className).trim());
    if (!row) {
      return res.status(404).json({ success: false, message: `No treatment for crop=${crop}, className=${className}` });
    }
    return res.status(200).json({ success: true, data: mapRow(row) });
  } catch (error) {
    console.error("getTreatmentsController:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to fetch treatments" });
  }
};

export const listTreatmentsAdminController = async (req, res) => {
  try {
    const { crop, lang } = req.query;
    const rows = await getAllTreatments(crop || null);
    const useNe = lang === "ne";
    const data = rows.map((r) => ({
      id: r.id,
      disease_id: r.diseaseId,
      crop_key: r.cropName,
      class_name: r.className,
      severity_level: useNe ? r.severityLevelNe : r.severityLevelEn,
      severity_level_en: r.severityLevelEn,
      severity_level_ne: r.severityLevelNe,
      disease_desc: useNe ? r.diseaseDescNe : r.diseaseDescEn,
      preventive_measure: useNe ? r.preventiveMeasureNe : r.preventiveMeasureEn,
      treatment: useNe ? r.treatmentNe : r.treatmentEn,
      recommended_medicine: useNe ? r.recommendedMedicineNe : r.recommendedMedicineEn,
      created_at: r.createdAt,
      updated_at: r.updatedAt,
    }));
    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("listTreatmentsAdminController:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to list treatments" });
  }
};

export const createTreatmentController = async (req, res) => {
  try {
    const payload = req.body || {};
    if (!payload.disease_id && !payload.diseaseId) {
      return res.status(400).json({ success: false, message: "disease_id is required" });
    }
    const row = await createTreatment(payload);
    if (!row) return res.status(500).json({ success: false, message: "Failed to create treatment" });
    const full = await getTreatmentById(row.id);
    return res.status(201).json({
      success: true,
      data: {
        id: full.id,
        disease_id: full.diseaseId,
        crop_key: full.cropName,
        class_name: full.className,
        severity_level_en: full.severityLevelEn,
        severity_level_ne: full.severityLevelNe,
        disease_desc_en: full.diseaseDescEn,
        disease_desc_ne: full.diseaseDescNe,
        preventive_measure_en: full.preventiveMeasureEn,
        preventive_measure_ne: full.preventiveMeasureNe,
        treatment_en: full.treatmentEn,
        treatment_ne: full.treatmentNe,
        recommended_medicine_en: full.recommendedMedicineEn,
        recommended_medicine_ne: full.recommendedMedicineNe,
        created_at: full.createdAt,
        updated_at: full.updatedAt,
      },
    });
  } catch (error) {
    console.error("createTreatmentController:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to create treatment" });
  }
};

export const updateTreatmentController = async (req, res) => {
  try {
    const { id } = req.params;
    const row = await updateTreatment(id, req.body || {});
    if (!row) return res.status(404).json({ success: false, message: `Treatment ${id} not found` });
    const full = await getTreatmentById(id);
    return res.status(200).json({
      success: true,
      data: {
        id: full.id,
        disease_id: full.diseaseId,
        crop_key: full.cropName,
        class_name: full.className,
        severity_level_en: full.severityLevelEn,
        severity_level_ne: full.severityLevelNe,
        updated_at: full.updatedAt,
      },
    });
  } catch (error) {
    console.error("updateTreatmentController:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to update treatment" });
  }
};

export const deleteTreatmentController = async (req, res) => {
  try {
    await deleteTreatment(req.params.id);
    return res.status(200).json({ success: true, message: "Treatment deleted" });
  } catch (error) {
    console.error("deleteTreatmentController:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to delete treatment" });
  }
};
