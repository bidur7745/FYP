import { db } from "../config/db.js";
import { cropsTable, plantationGuidesTable, plantingCalendarTable } from "../schema/index.js";
import { eq, and, or, ilike, sql } from "drizzle-orm";
import { getCurrentSeason } from "../utils/seasonUtils.js";

// Centralized validation constants
export const REGIONS = ["Terai", "Hill", "Mountain"];
export const SEASONS = ["Winter", "Spring", "Monsoon", "Autumn"];

/**
 * Infer season from Nepali month names in a period string
 * @param {string} period 
 * @returns {string|null} 
 */
export const inferSeasonFromMonths = (period) => {
  if (!period || typeof period !== "string") return null;

  const periodLower = period.toLowerCase();

  // Monsoon: Asar (June-July), Shrawan (July-August)
  if (periodLower.includes("asar") || periodLower.includes("shrawan")) {
    return "Monsoon";
  }

  // Autumn: Kartik (October-November), Mangsir (November-December)
  if (periodLower.includes("kartik") || periodLower.includes("mangsir")) {
    return "Autumn";
  }

  // Winter: Magh (January-February), Falgun (February-March)
  if (periodLower.includes("magh") || periodLower.includes("falgun")) {
    return "Winter";
  }

  // Spring: Chaitra (March-April), Baisakh (April-May)
  if (periodLower.includes("chaitra") || periodLower.includes("baisakh")) {
    return "Spring";
  }

  return null;
};

/**
 * Get all crops 
 * @returns {Promise<Array>} 
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
 * Get crops filtered by location (region)
 * @param {string} region 
 * @returns {Promise<Array>} 
 */
export const getCropsByLocation = async (region) => {
  try {
    if (!REGIONS.includes(region)) {
      throw new Error(`Invalid region: ${region}. Must be one of: ${REGIONS.join(", ")}`);
    }

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
      .from(cropsTable)
      .where(sql`${cropsTable.regions} @> ARRAY[${region}]::text[]`);

    return crops;
  } catch (error) {
    console.error("Error fetching crops by location:", error);
    throw error;
  }
};

/**
 * Get crops filtered by season
 * @param {string} season 
 * @returns {Promise<Array>} 
 */
export const getCropsBySeason = async (season) => {
  try {
    if (!SEASONS.includes(season)) {
      throw new Error(`Invalid season: ${season}. Must be one of: ${SEASONS.join(", ")}`);
    }

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
      .from(cropsTable)
      .where(eq(cropsTable.season, season));

    return crops;
  } catch (error) {
    console.error("Error fetching crops by season:", error);
    throw error;
  }
};

/**
 * Get crops filtered by both location and season
 * @param {string} region 
 * @param {string} season 
 * @returns {Promise<Array>} 
 */
export const getCropsByLocationAndSeason = async (region, season) => {
  try {
    if (!REGIONS.includes(region)) {
      throw new Error(`Invalid region: ${region}. Must be one of: ${REGIONS.join(", ")}`);
    }
    if (!SEASONS.includes(season)) {
      throw new Error(`Invalid season: ${season}. Must be one of: ${SEASONS.join(", ")}`);
    }

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
      .from(cropsTable)
      .where(
        and(
          sql`${cropsTable.regions} @> ARRAY[${region}]::text[]`,
          eq(cropsTable.season, season)
        )
      );

    return crops;
  } catch (error) {
    console.error("Error fetching crops by location and season:", error);
    throw error;
  }
};

/**
 * Get recommended crops for a user based on their location and current season
 * @param {string} userRegion 
 * @param {string} [currentSeason] 
 * @returns {Promise<Object>} 
 */
export const getRecommendedCropsForUser = async (userRegion, currentSeason = null) => {
  try {
    if (!REGIONS.includes(userRegion)) {
      throw new Error(`Invalid region: ${userRegion}. Must be one of: ${REGIONS.join(", ")}`);
    }

    const season = currentSeason || getCurrentSeason();

    // get perfect matches
    const perfectMatches = await getCropsByLocationAndSeason(userRegion, season);

    // get location-only matches 
    const allLocationCrops = await getCropsByLocation(userRegion);
    const locationMatches = allLocationCrops.filter(
      (crop) => crop.season !== season
    );

    // get season-only matches
    const allSeasonCrops = await getCropsBySeason(season);
    const seasonMatches = allSeasonCrops.filter(
      (crop) => !crop.regions.includes(userRegion)
    );

    return {
      perfectMatches,
      locationMatches,
      seasonMatches,
      userRegion,
      currentSeason: season,
      counts: {
        perfect: perfectMatches.length,
        location: locationMatches.length,
        season: seasonMatches.length,
      },
    };
  } catch (error) {
    console.error("Error fetching recommended crops:", error);
    throw error;
  }
};

/**
 * search crops by name
 * @param {string} query 
 * @returns {Promise<Array>} 
 */
export const searchCrops = async (query) => {
  try {
    if (!query || typeof query !== "string" || query.trim() === "") {
      throw new Error("Search query is required");
    }

    const searchTerm = `%${query.trim()}%`;

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
      .from(cropsTable)
      .where(ilike(cropsTable.cropName, searchTerm));

    return crops;
  } catch (error) {
    console.error("Error searching crops:", error);
    throw error;
  }
};

/**
 * get crops with advanced filtering
 * @param {Object} filters 
 * @returns {Promise<Array>} 
 */
export const getFilteredCrops = async (filters = {}) => {
  try {
    const { region, season, category } = filters;
    const conditions = [];

    // filter by region
    if (region && REGIONS.includes(region)) {
      conditions.push(sql`${cropsTable.regions} @> ARRAY[${region}]::text[]`);
    }

    // filter by season
    if (season && SEASONS.includes(season)) {
      conditions.push(eq(cropsTable.season, season));
    }

    // filter by category
    if (category && category.trim() !== "") {
      conditions.push(ilike(cropsTable.cropCategory, `%${category.trim()}%`));
    }

    let query = db
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

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const crops = await query;
    return crops;
  } catch (error) {
    console.error("Error fetching filtered crops:", error);
    throw error;
  }
};

/**
 * create a new crop
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

    // validate required fields
    if (!cropName || !regions || !season) {
      throw new Error("Crop name, regions, and season are required");
    }

    // validate regions is an array
    if (!Array.isArray(regions) || regions.length === 0) {
      throw new Error("Regions must be a non-empty array");
    }

    // validate each region
    for (const region of regions) {
      if (!REGIONS.includes(region)) {
        throw new Error(`Invalid region: ${region}. Must be one of: ${REGIONS.join(", ")}`);
      }
    }

    // validate season
    if (!SEASONS.includes(season)) {
      throw new Error(`Invalid season. Must be one of: ${SEASONS.join(", ")}`);
    }

    // insert crop into database
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

/**
 * update an existing crop
 * @param {number} cropId 
 * @param {Object} cropData 
 * @returns {Promise<Object>} 
 */
export const updateCrop = async (cropId, cropData) => {
  try {
    const {
      cropName,
      regions,
      season,
      cropCategory,
      soilType,
      waterRequirement,
      climate,
      notes,
      imageUrl,
    } = cropData;

    // build update object
    const updateFields = {};

    // validate and add cropName if provided
    if (cropName !== undefined) {
      if (!cropName || typeof cropName !== "string" || cropName.trim() === "") {
        throw new Error("Crop name must be a non-empty string");
      }
      updateFields.cropName = cropName.trim();
    }

    // validate and add regions if provided
    if (regions !== undefined) {
      if (!Array.isArray(regions) || regions.length === 0) {
        throw new Error("Regions must be a non-empty array");
      }
      for (const region of regions) {
        if (!REGIONS.includes(region)) {
          throw new Error(
            `Invalid region: ${region}. Must be one of: ${REGIONS.join(", ")}`
          );
        }
      }
      updateFields.regions = regions;
    }

    // validate and add season if provided
    if (season !== undefined) {
      if (!SEASONS.includes(season)) {
        throw new Error(
          `Invalid season. Must be one of: ${SEASONS.join(", ")}`
        );
      }
      updateFields.season = season;
    }

    // optional fields - only update if provided
    if (cropCategory !== undefined) {
      updateFields.cropCategory = cropCategory || null;
    }
    if (soilType !== undefined) {
      updateFields.soilType = soilType || null;
    }
    if (waterRequirement !== undefined) {
      updateFields.waterRequirement = waterRequirement || null;
    }
    if (climate !== undefined) {
      updateFields.climate = climate || null;
    }
    if (notes !== undefined) {
      updateFields.notes = notes || null;
    }
    if (imageUrl !== undefined) {
      updateFields.imageUrl = imageUrl || null;
    }

    // check if there are any fields to update
    if (Object.keys(updateFields).length === 0) {
      throw new Error("No valid fields provided for update");
    }

    const [updatedCrop] = await db
      .update(cropsTable)
      .set(updateFields)
      .where(eq(cropsTable.cropId, cropId))
      .returning();

    if (!updatedCrop) {
      throw new Error("Crop not found");
    }

    return updatedCrop;
  } catch (error) {
    console.error("Error updating crop:", error);
    throw error;
  }
};

/**
  * delete a crop and its related plantation guide and planting calendar
 * @param {number} cropId 
 * @returns {Promise<void>}
 */
export const deleteCrop = async (cropId) => {
  try {
    // delete related plantation guides
    await db
      .delete(plantationGuidesTable)
      .where(eq(plantationGuidesTable.cropId, cropId));

    // Delete related planting calendar entries
    await db
      .delete(plantingCalendarTable)
      .where(eq(plantingCalendarTable.cropId, cropId));

    // Delete crop itself
    await db.delete(cropsTable).where(eq(cropsTable.cropId, cropId));
  } catch (error) {
    console.error("Error deleting crop:", error);
    throw error;
  }
};

/**
 * get plantation guide for a specific crop
 * @param {number} cropId 
 * @returns {Promise<Object|null>} 
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
    // provide specific error message
    if (error.message?.includes("fetch failed") || error.message?.includes("connect")) {
      throw new Error("Database connection failed. Please check your DATABASE_URL and network connection.");
    }
    throw new Error(`Failed to fetch plantation guide: ${error.message || "Unknown error"}`);
  }
};

/**
 * Get planting calendar for a specific crop and region
 * @param {number} cropId 
 * @param {string} region 
 * @returns {Promise<Object|null>} 
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
 * Get all planting calendar entries for a crop
 * @param {number} cropId - Crop ID
 * @returns {Promise<Array>} - Array of planting calendar entries
 */
export const getAllPlantingCalendarsForCrop = async (cropId) => {
  try {
    const calendars = await db
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
      .where(eq(plantingCalendarTable.cropId, cropId));

    return calendars;
  } catch (error) {
    console.error("Error fetching planting calendars:", error);
    // Provide more specific error message
    if (error.message?.includes("fetch failed") || error.message?.includes("connect")) {
      throw new Error("Database connection failed. Please check your DATABASE_URL and network connection.");
    }
    throw new Error(`Failed to fetch planting calendars: ${error.message || "Unknown error"}`);
  }
};

/**
 * Create plantation guide for a crop
 * @param {number} cropId
 * @param {Object} guideData
 * @returns {Promise<Object>}
 */
export const createPlantationGuideForCrop = async (cropId, guideData) => {
  try {
    const {
      spacing,
      maturityPeriod,
      seedPreparation,
      plantingMethod,
      irrigationSchedule,
      harvestingTips,
      averageYield,
      videoUrl,
      plantationProcess,
    } = guideData;

    const [guide] = await db
      .insert(plantationGuidesTable)
      .values({
        cropId,
        spacing: spacing || null,
        maturityPeriod: maturityPeriod || null,
        seedPreparation: seedPreparation || null,
        plantingMethod: plantingMethod || null,
        irrigationSchedule: irrigationSchedule || null,
        harvestingTips: harvestingTips || null,
        averageYield: averageYield || null,
        videoUrl: videoUrl || null,
        plantationProcess: Array.isArray(plantationProcess) ? plantationProcess : [],
      })
      .returning();

    return guide;
  } catch (error) {
    console.error("Error creating plantation guide:", error);
    throw new Error("Failed to create plantation guide");
  }
};

/**
 * Create planting calendar entries for a crop
 * @param {number} cropId
 * @param {Array<Object>} calendarEntries
 * @returns {Promise<Array<Object>>}
 */
export const createPlantingCalendarForCrop = async (cropId, calendarEntries) => {
  try {
    if (!Array.isArray(calendarEntries) || calendarEntries.length === 0) {
      throw new Error("Planting calendar entries must be a non-empty array");
    }

    const values = calendarEntries.map((entry) => {
      const {
        region,
        season,
        sowingPeriod,
        transplantingPeriod,
        harvestingPeriod,
        notes,
      } = entry;

      if (!REGIONS.includes(region)) {
        throw new Error(
          `Invalid region in planting calendar: ${region}. Must be one of: ${REGIONS.join(", ")}`
        );
      }

      // Infer season from Nepali months if not provided, or validate if provided
      let finalSeason = season;
      if (!finalSeason && sowingPeriod) {
        finalSeason = inferSeasonFromMonths(sowingPeriod);
      }

      if (finalSeason && !SEASONS.includes(finalSeason)) {
        throw new Error(
          `Invalid season in planting calendar: ${finalSeason}. Must be one of: ${SEASONS.join(", ")}`
        );
      }

      // If still no season, it's optional - allow null
      return {
        cropId,
        region,
        season: finalSeason || null,
        sowingPeriod: sowingPeriod || null,
        transplantingPeriod: transplantingPeriod || null,
        harvestingPeriod: harvestingPeriod || null,
        notes: notes || null,
      };
    });

    const inserted = await db
      .insert(plantingCalendarTable)
      .values(values)
      .returning();

    return inserted;
  } catch (error) {
    console.error("Error creating planting calendar:", error);
    throw error;
  }
};