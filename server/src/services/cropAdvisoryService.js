import { db } from "../config/db.js";
import { cropsTable, plantationGuidesTable, plantingCalendarTable } from "../schema/index.js";
import { eq, and, sql } from "drizzle-orm";

/**
 * Identify region based on elevation
 * @param {number} elevation 
 * @returns {string}
 */
export const identifyRegionByElevation = (elevation) => {
  if (elevation < 600) {
    return "Terai";
  } else if (elevation < 3000) {
    return "Hill";
  } else {
    return "Mountain";
  }
};

/**

 * @returns {string} 
 */
export const getCurrentSeason = () => {
  const month = new Date().getMonth() + 1;
  if (month === 12 || month <= 2) {
    return "Winter";
  } else if (month <= 5) {
    return "Spring";
  } else if (month <= 9) {
    return "Monsoon";
  } else {
    return "Autumn";
  }
};
/**

 * @param {string} region
 * @param {string} season 
 * @returns {Promise<Array>} 
 */
export const getRecommendedCrops = async (region, season) => {
  try {
    const crops = await db
      .select({
        cropId: cropsTable.cropId,
        cropName: cropsTable.cropName,
        cropCategory: cropsTable.cropCategory,
        regions: cropsTable.regions,
        soilType: cropsTable.soilType,
        waterRequirement: cropsTable.waterRequirement,
        climate: cropsTable.climate,
        notes: cropsTable.notes,
        imageUrl: cropsTable.imageUrl,
      })
      .from(cropsTable)
      .where(
        and(
          sql`${sql.raw(`'${region.replace(/'/g, "''")}'`)} = ANY(${cropsTable.regions})`, 
          eq(cropsTable.season, season)
        )
      );

    return crops;
  } catch (error) {
    console.error("Error fetching recommended crops:", error);
    throw new Error("Failed to fetch recommended crops");
  }
};

/**
 * Get plantation guide for a specific crop
 * @param {number} cropId - Crop ID
 * @returns {Promise<Object>} - Plantation guide details
 */
export const getPlantationGuide = async (cropId) => {
  try {
    const guide = await db
      .select({
        guideId: plantationGuidesTable.guideId,
        cropId: plantationGuidesTable.cropId,
        seedPreparation: plantationGuidesTable.seedPreparation,
        plantingMethod: plantationGuidesTable.plantingMethod,
        irrigationSchedule: plantationGuidesTable.irrigationSchedule,
        harvestingTips: plantationGuidesTable.harvestingTips,
        averageYield: plantationGuidesTable.averageYield,
        videoUrl: plantationGuidesTable.videoUrl,
        spacing: plantationGuidesTable.spacing,
        maturityPeriod: plantationGuidesTable.maturityPeriod,
        plantationProcess: plantationGuidesTable.plantationProcess,
      })
      .from(plantationGuidesTable)
      .where(eq(plantationGuidesTable.cropId, cropId))
      .limit(1);

    if (guide.length === 0) {
      return null;
    }

    // Get crop name
    const crop = await db
      .select({
        cropName: cropsTable.cropName,
      })
      .from(cropsTable)
      .where(eq(cropsTable.cropId, cropId))
      .limit(1);

    return {
      ...guide[0],
      crop: crop.length > 0 ? crop[0].cropName : null,
    };
  } catch (error) {
    console.error("Error fetching plantation guide:", error);
    throw new Error("Failed to fetch plantation guide");
  }
};

/**
 * Get planting calendar for a specific crop and region
 * @param {number} cropId
 * @param {string} region 
 * @returns {Promise<Object>} 
 */
export const getPlantingCalendar = async (cropId, region) => {
  try {
    const calendar = await db
      .select({
        calendarId: plantingCalendarTable.calendarId,
        cropId: plantingCalendarTable.cropId,
        region: plantingCalendarTable.region,
        season: plantingCalendarTable.season,
        sowingPeriod: plantingCalendarTable.sowingPeriod,
        transplantingPeriod: plantingCalendarTable.transplantingPeriod,
        harvestingPeriod: plantingCalendarTable.harvestingPeriod,
        notes: plantingCalendarTable.notes,
      })
      .from(plantingCalendarTable)
      .where(
        and(
          eq(plantingCalendarTable.cropId, cropId),
          eq(plantingCalendarTable.region, region)
        )
      )
      .limit(1);

    if (calendar.length === 0) {
      return null;
    }

    return calendar[0];
  } catch (error) {
    console.error("Error fetching planting calendar:", error);
    throw new Error("Failed to fetch planting calendar");
  }
};

/**
 * Get all crops from the database
 * @returns {Promise<Array>} - Array of all crops
 */
export const getAllCrops = async () => {
  try {
    const crops = await db
      .select({
        cropId: cropsTable.cropId,
        cropName: cropsTable.cropName,
        cropCategory: cropsTable.cropCategory,
        regions: cropsTable.regions,
        season: cropsTable.season,
        soilType: cropsTable.soilType,
        waterRequirement: cropsTable.waterRequirement,
        climate: cropsTable.climate,
        notes: cropsTable.notes,
        imageUrl: cropsTable.imageUrl,
      })
      .from(cropsTable);

    return crops;
  } catch (error) {
    console.error("Error fetching all crops:", error);
    throw new Error("Failed to fetch crops");
  }
};

/**
 * Create a new crop in the database
 * @param {Object} cropData 
 * @param {string} cropData.cropName 
 * @param {string[]} cropData.regions
 * @param {string} cropData.season
 * @param {string} [cropData.cropCategory] 
 * @param {string} [cropData.soilType] 
 * @param {string} [cropData.waterRequirement] 
 * @param {string} [cropData.climate]
 * @param {string} [cropData.notes] 
 * @param {string} [cropData.imageUrl] 
 * @returns {Promise<Object>} 
 */
export const createCrop = async (cropData) => {
  try {
    const { cropName, regions, season, cropCategory, soilType, waterRequirement, climate, notes, imageUrl } = cropData;

    // Validate required fields
    if (!cropName || !regions || !season) {
      throw new Error("Crop name, regions, and season are required");
    }

    // Validate regions is an array
    if (!Array.isArray(regions) || regions.length === 0) {
      throw new Error("Regions must be a non-empty array");
    }

    // Validate each region
    const validRegions = ["Terai", "Hill", "Mountain"];
    for (const region of regions) {
      if (!validRegions.includes(region)) {
        throw new Error(`Invalid region: ${region}. Must be one of: Terai, Hill, Mountain`);
      }
    }

    // Validate season
    if (!["Winter", "Spring", "Monsoon", "Autumn"].includes(season)) {
      throw new Error("Invalid season. Must be one of: Winter, Spring, Monsoon, Autumn");
    }

    // Insert crop into database
    const [newCrop] = await db
      .insert(cropsTable)
      .values({
        cropName,
        regions,
        season,
        cropCategory: cropCategory || null,
        soilType: soilType || null,
        waterRequirement: waterRequirement || null,
        climate: climate || null,
        notes: notes || null,
        imageUrl: imageUrl || null,
      })
      .returning();

    return newCrop;
  } catch (error) {
    console.error("Error creating crop:", error);
    throw error;
  }
};