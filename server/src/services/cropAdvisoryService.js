import { db } from "../config/db.js";
import { cropsTable, plantationGuidesTable, plantingCalendarTable } from "../schema/index.js";
import { eq, and, or, ilike, sql } from "drizzle-orm";
import { getCurrentSeason } from "../utils/seasonUtils.js";

// Centralized validation constants
export const REGIONS = ["Terai", "Hill", "Mountain"];


export const SEASONS = [
  "Spring",
  "Summer",
  "Rainy",
  "Autumn",
  "Pre-winter",
  "Winter",
];

/**
 * Normalize a season string to one of the canonical SEASONS.
 * Accepts old labels like "Monsoon" and Nepali names like "Basanta", "Barsha".
 */
export const normalizeSeason = (season) => {
  if (!season) return null;
  const raw = String(season).trim();
  if (!raw) return null;
  const lower = raw.toLowerCase();

  // Nepali Ritu names
  if (lower.includes("basanta")) return "Spring";
  if (lower.includes("grishma") || lower.includes("grisma")) return "Summer";
  if (lower.includes("barsha") || lower.includes("barsa")) return "Rainy";
  if (lower.includes("sharad")) return "Autumn";
  if (lower.includes("hemanta")) return "Pre-winter";
  if (lower.includes("shishir")) return "Winter";

  // Old four-season labels
  if (lower === "monsoon") return "Rainy";

  // Already canonical?
  if (SEASONS.includes(raw)) return raw;

  const capitalized = raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
  if (SEASONS.includes(capitalized)) return capitalized;

  return raw;
};

/**
 * Infer season from Nepali month names in a period string
 * @param {string} period 
 * @returns {string|null} 
 */
export const inferSeasonFromMonths = (period) => {
  if (!period || typeof period !== "string") return null;

  const p = period.toLowerCase();

  // Basanta (Spring): Chaitra, Baisakh
  if (p.includes("chaitra") || p.includes("chaitra") || p.includes("baisakh")) {
    return "Spring";
  }

  // Grishma (Summer): Jestha, Ashad
  if (p.includes("jestha") || p.includes("jeshtha") || p.includes("jesth") || p.includes("ashad") || p.includes("asad") || p.includes("ashadh")) {
    return "Summer";
  }

  // Barsha (Rainy): Shrawan, Bhadra
  if (p.includes("shrawan") || p.includes("saun") || p.includes("shravan") || p.includes("bhadra")) {
    return "Rainy";
  }

  // Sharad (Autumn): Ashoj, Asoj, Ashwin, Kartik
  if (p.includes("ashoj") || p.includes("asoj") || p.includes("ashwin") || p.includes("aswin") || p.includes("kartik")) {
    return "Autumn";
  }

  // Hemanta (Pre-winter): Mangsir, Poush
  if (p.includes("mangsir") || p.includes("mangsir") || p.includes("mangshir") || p.includes("poush") || p.includes("paush")) {
    return "Pre-winter";
  }

  // Shishir (Winter): Magh, Falgun
  if (p.includes("magh") || p.includes("falgun")) {
    return "Winter";
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
    const normalizedSeason = normalizeSeason(season);
    if (!normalizedSeason || !SEASONS.includes(normalizedSeason)) {
      throw new Error(`Invalid season: ${season}. Must be one of: ${SEASONS.join(", ")}`);
    }

    // Use planting calendar seasons instead of crops.season.
    // Any crop that has at least one planting_calendar entry for this season is included.
    const rows = await db
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
        calendarSeason: plantingCalendarTable.season,
      })
      .from(cropsTable)
      .innerJoin(
        plantingCalendarTable,
        and(
          eq(plantingCalendarTable.cropId, cropsTable.cropId),
          eq(plantingCalendarTable.season, normalizedSeason)
        )
      );

    // Deduplicate by cropId in case multiple calendar rows exist for the same crop/season.
    const byId = new Map();
    for (const row of rows) {
      if (!byId.has(row.cropId)) {
        const { calendarSeason, ...crop } = row;
        byId.set(row.cropId, crop);
      }
    }

    return Array.from(byId.values());
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
    const normalizedSeason = normalizeSeason(season);
    if (!normalizedSeason || !SEASONS.includes(normalizedSeason)) {
      throw new Error(`Invalid season: ${season}. Must be one of: ${SEASONS.join(", ")}`);
    }

    // Use planting calendar seasons tied to a specific region.
    const rows = await db
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
        calendarSeason: plantingCalendarTable.season,
        calendarRegion: plantingCalendarTable.region,
      })
      .from(cropsTable)
      .innerJoin(
        plantingCalendarTable,
        and(
          eq(plantingCalendarTable.cropId, cropsTable.cropId),
          eq(plantingCalendarTable.region, region),
          eq(plantingCalendarTable.season, normalizedSeason)
        )
      )
      // Ensure crop itself is tagged as suitable for this region.
      .where(sql`${cropsTable.regions} @> ARRAY[${region}]::text[]`);

    const byId = new Map();
    for (const row of rows) {
      if (!byId.has(row.cropId)) {
        const { calendarSeason, calendarRegion, ...crop } = row;
        byId.set(row.cropId, crop);
      }
    }

    return Array.from(byId.values());
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

    // Perfect matches: crops that have planting calendar entries
    // for both the user's region and the current season.
    const perfectMatches = await getCropsByLocationAndSeason(userRegion, season);

    // Location-only matches: crops suitable for the region, regardless of season,
    // excluding ones already in perfectMatches.
    const allLocationCrops = await getCropsByLocation(userRegion);
    const perfectIds = new Set(perfectMatches.map((c) => c.cropId));
    const locationMatches = allLocationCrops.filter(
      (crop) => !perfectIds.has(crop.cropId)
    );

    // Season-only matches: crops that have planting calendar entries
    // for the current season (any region), but are not primarily grown
    // in the user's region.
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

    // filter by season using planting calendar seasons
    const normalizedSeason = season ? normalizeSeason(season) : null;
    if (normalizedSeason && SEASONS.includes(normalizedSeason)) {
      // If region is also provided, restrict calendar season to that region.
      if (region && REGIONS.includes(region)) {
        conditions.push(
          sql`EXISTS (
            SELECT 1 FROM planting_calendar pc
            WHERE pc.crop_id = ${cropsTable.cropId}
              AND pc.region = ${region}
              AND pc.season = ${normalizedSeason}
          )`
        );
      } else {
        conditions.push(
          sql`EXISTS (
            SELECT 1 FROM planting_calendar pc
            WHERE pc.crop_id = ${cropsTable.cropId}
              AND pc.season = ${normalizedSeason}
          )`
        );
      }
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
    const normalizedSeason = normalizeSeason(season);
    if (!normalizedSeason || !SEASONS.includes(normalizedSeason)) {
      throw new Error(`Invalid season. Must be one of: ${SEASONS.join(", ")}`);
    }

    // insert crop into database
    const [newCrop] = await db
      .insert(cropsTable)
      .values({
        cropName,
        regions,
        season: normalizedSeason,
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
      const normalizedSeason = normalizeSeason(season);
      if (!normalizedSeason || !SEASONS.includes(normalizedSeason)) {
        throw new Error(
          `Invalid season. Must be one of: ${SEASONS.join(", ")}`
        );
      }
      updateFields.season = normalizedSeason;
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

      const normalizedSeason = finalSeason ? normalizeSeason(finalSeason) : null;

      if (normalizedSeason && !SEASONS.includes(normalizedSeason)) {
        throw new Error(
          `Invalid season in planting calendar: ${finalSeason}. Must be one of: ${SEASONS.join(", ")}`
        );
      }

      // If still no season, it's optional - allow null
      return {
        cropId,
        region,
        season: normalizedSeason || null,
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