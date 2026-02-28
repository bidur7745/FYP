import {
  getTreatmentByCropAndClass,
  getAllTreatments,
  createTreatment,
  createTreatmentsBulk,
} from "../services/diseaseTreatmentService.js";

/**
 * GET /api/disease/treatments?crop=tomato&className=Spider_mites&lang=en
 * No auth. Returns treatment for crop + className. Lang selects _en or _ne fields.
 */
export const getTreatmentsController = async (req, res) => {
  try {
    const { crop, className, lang, all } = req.query;

    if (all === "true" || all === "1") {
      const rows = await getAllTreatments(crop || null);
      return res.status(200).json({ success: true, data: rows });
    }

    if (!crop || !className) {
      return res.status(400).json({
        success: false,
        message: "Query params 'crop' and 'className' are required (or use ?all=true)",
      });
    }

    const row = await getTreatmentByCropAndClass(
      String(crop).toLowerCase().trim(),
      String(className).trim()
    );

    if (!row) {
      return res.status(404).json({
        success: false,
        message: `No treatment found for crop=${crop}, className=${className}`,
      });
    }

    const useNe = lang === "ne";
    const data = {
      id: row.id,
      crop_key: row.cropKey,
      class_name: row.className,
      severity_level: useNe ? row.severityLevelNe : row.severityLevelEn,
      disease_desc: useNe ? row.diseaseDescNe : row.diseaseDescEn,
      preventive_measure: useNe ? row.preventiveMeasureNe : row.preventiveMeasureEn,
      treatment: useNe ? row.treatmentNe : row.treatmentEn,
      recommended_medicine: useNe ? row.recommendedMedicineNe : row.recommendedMedicineEn,
      created_at: row.createdAt,
      updated_at: row.updatedAt,
    };

    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("getTreatmentsController:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch treatments",
    });
  }
};

/**
 * POST /api/disease/treatments
 * No auth. Body: single treatment object. Easy for Postman.
 */
export const createTreatmentController = async (req, res) => {
  try {
    const body = req.body;

    if (Array.isArray(body)) {
      const rows = await createTreatmentsBulk(body);
      return res.status(201).json({ success: true, data: rows, count: rows.length });
    }

    const row = await createTreatment(body);
    return res.status(201).json({ success: true, data: row });
  } catch (error) {
    console.error("createTreatmentController:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to create treatment",
    });
  }
};
