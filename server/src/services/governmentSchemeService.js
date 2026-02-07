import { db } from "../config/db.js";
import { governmentSchemesTable, schemeDetailsTable } from "../schema/index.js";
import { eq, and, ilike, desc } from "drizzle-orm";

/**
 * Get all government schemes
 * @param {Object} filters - Optional filters (status, level, province, district)
 * @returns {Promise<Array>} Array of schemes
 */
export const getAllSchemes = async (filters = {}) => {
  try {
    const { status, level, provinceName, districtName, schemeType } = filters;
    const conditions = [];

    if (status) {
      conditions.push(eq(governmentSchemesTable.status, status));
    }

    if (level) {
      conditions.push(eq(governmentSchemesTable.level, level));
    }

    if (provinceName) {
      conditions.push(eq(governmentSchemesTable.provinceName, provinceName));
    }

    if (districtName) {
      conditions.push(eq(governmentSchemesTable.districtName, districtName));
    }

    if (schemeType) {
      conditions.push(eq(governmentSchemesTable.schemeType, schemeType));
    }

    let query = db
      .select()
      .from(governmentSchemesTable)
      .orderBy(desc(governmentSchemesTable.createdAt));

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const schemes = await query;
    return schemes;
  } catch (error) {
    console.error("Error fetching all schemes:", error);
    throw new Error("Failed to fetch schemes");
  }
};

/**
 * Get scheme by ID with details
 * @param {string} schemeId - Scheme UUID
 * @returns {Promise<Object|null>} Scheme with details
 */
export const getSchemeById = async (schemeId) => {
  try {
    // Fetch scheme first
    const scheme = await db
      .select()
      .from(governmentSchemesTable)
      .where(eq(governmentSchemesTable.id, schemeId))
      .limit(1);

    if (scheme.length === 0) {
      return null;
    }

    // Fetch details separately using schemeId
    const details = await db
      .select()
      .from(schemeDetailsTable)
      .where(eq(schemeDetailsTable.schemeId, schemeId))
      .limit(1);

    return {
      ...scheme[0],
      details: details.length > 0 ? details[0] : null,
    };
  } catch (error) {
    console.error("Error fetching scheme by ID:", error);
    throw new Error("Failed to fetch scheme");
  }
};

/**
 * Search schemes by title
 * @param {string} searchTerm - Search term
 * @returns {Promise<Array>} Array of matching schemes
 */
export const searchSchemes = async (searchTerm) => {
  try {
    if (!searchTerm || searchTerm.trim() === "") {
      return [];
    }

    const schemes = await db
      .select()
      .from(governmentSchemesTable)
      .where(ilike(governmentSchemesTable.title, `%${searchTerm.trim()}%`))
      .orderBy(desc(governmentSchemesTable.createdAt));

    return schemes;
  } catch (error) {
    console.error("Error searching schemes:", error);
    throw new Error("Failed to search schemes");
  }
};

/**
 * Filter schemes with advanced filters
 * @param {Object} filters - Filter options
 * @returns {Promise<Array>} Array of filtered schemes
 */
export const getFilteredSchemes = async (filters = {}) => {
  try {
    const {
      status,
      level,
      provinceName,
      districtName,
      schemeType,
      regionScope,
      localBodyType,
    } = filters;
    const conditions = [];

    if (status) {
      conditions.push(eq(governmentSchemesTable.status, status));
    }

    if (level) {
      conditions.push(eq(governmentSchemesTable.level, level));
    }

    if (provinceName) {
      conditions.push(eq(governmentSchemesTable.provinceName, provinceName));
    }

    if (districtName) {
      conditions.push(eq(governmentSchemesTable.districtName, districtName));
    }

    if (schemeType) {
      conditions.push(eq(governmentSchemesTable.schemeType, schemeType));
    }

    if (regionScope) {
      conditions.push(eq(governmentSchemesTable.regionScope, regionScope));
    }

    if (localBodyType) {
      conditions.push(eq(governmentSchemesTable.localBodyType, localBodyType));
    }

    let query = db
      .select()
      .from(governmentSchemesTable)
      .orderBy(desc(governmentSchemesTable.createdAt));

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const schemes = await query;
    return schemes;
  } catch (error) {
    console.error("Error fetching filtered schemes:", error);
    throw new Error("Failed to fetch filtered schemes");
  }
};

/**
 * Create a new government scheme
 * @param {Object} schemeData - Scheme data
 * @param {Object} detailsData - Optional scheme details data
 * @returns {Promise<Object>} Created scheme with details
 */
export const createScheme = async (schemeData, detailsData = null) => {
  try {
    const {
      title,
      description,
      schemeType,
      sector,
      level,
      provinceName,
      districtName,
      localBodyType,
      localBodyName,
      regionScope,
      sourceUrl,
      documentUrl,
      status,
      publishedDate,
      expiryDate,
    } = schemeData;

    // Validate required fields
    if (!title) {
      throw new Error("Title is required");
    }

    // Sanitize data: convert empty strings to null for enum and date fields
    const sanitizedData = {
      title,
      // Enum fields - convert empty string to null
      level: level && level.trim() !== '' ? level : null,
      localBodyType: localBodyType && localBodyType.trim() !== '' ? localBodyType : null,
      regionScope: regionScope && regionScope.trim() !== '' ? regionScope : null,
      status: status && status.trim() !== '' ? (status || "active") : "active",
      // Date fields - convert empty string to null
      publishedDate: publishedDate && publishedDate.trim() !== '' ? publishedDate : null,
      expiryDate: expiryDate && expiryDate.trim() !== '' ? expiryDate : null,
      // Text fields - convert empty string to null
      description: description && description.trim() !== '' ? description : null,
      schemeType: schemeType && schemeType.trim() !== '' ? schemeType : null,
      sector: sector && sector.trim() !== '' ? (sector || "Agriculture") : "Agriculture",
      provinceName: provinceName && provinceName.trim() !== '' ? provinceName : null,
      districtName: districtName && districtName.trim() !== '' ? districtName : null,
      localBodyName: localBodyName && localBodyName.trim() !== '' ? localBodyName : null,
      sourceUrl: sourceUrl && sourceUrl.trim() !== '' ? sourceUrl : null,
      documentUrl: documentUrl && documentUrl.trim() !== '' ? documentUrl : null,
    };

    // Create scheme
    const [newScheme] = await db
      .insert(governmentSchemesTable)
      .values(sanitizedData)
      .returning();

    // Create details if provided
    let details = null;
    if (detailsData) {
      const [newDetails] = await db
        .insert(schemeDetailsTable)
        .values({
          schemeId: newScheme.id,
          eligibility: detailsData.eligibility || null,
          benefits: detailsData.benefits || null,
          applicationProcess: detailsData.applicationProcess || [],
          requiredDocuments: detailsData.requiredDocuments || [],
          usageConditions: detailsData.usageConditions || null,
        })
        .returning();

      details = newDetails;
    }

    return {
      ...newScheme,
      details,
    };
  } catch (error) {
    console.error("Error creating scheme:", error);
    throw error;
  }
};

/**
 * Update a government scheme
 * @param {string} schemeId - Scheme UUID
 * @param {Object} schemeData - Updated scheme data
 * @returns {Promise<Object>} Updated scheme
 */
export const updateScheme = async (schemeId, schemeData) => {
  try {
    // Check if scheme exists
    const existingScheme = await db
      .select()
      .from(governmentSchemesTable)
      .where(eq(governmentSchemesTable.id, schemeId))
      .limit(1);

    if (existingScheme.length === 0) {
      throw new Error("Scheme not found");
    }

    // Sanitize data: convert empty strings to null for enum and date fields
    const sanitizedData = {
      ...schemeData,
      // Enum fields - convert empty string to null
      level: schemeData.level && schemeData.level.trim() !== '' ? schemeData.level : null,
      localBodyType: schemeData.localBodyType && schemeData.localBodyType.trim() !== '' ? schemeData.localBodyType : null,
      regionScope: schemeData.regionScope && schemeData.regionScope.trim() !== '' ? schemeData.regionScope : null,
      status: schemeData.status && schemeData.status.trim() !== '' ? schemeData.status : null,
      // Date fields - convert empty string to null
      publishedDate: schemeData.publishedDate && schemeData.publishedDate.trim() !== '' ? schemeData.publishedDate : null,
      expiryDate: schemeData.expiryDate && schemeData.expiryDate.trim() !== '' ? schemeData.expiryDate : null,
      // Text fields - convert empty string to null
      description: schemeData.description && schemeData.description.trim() !== '' ? schemeData.description : null,
      schemeType: schemeData.schemeType && schemeData.schemeType.trim() !== '' ? schemeData.schemeType : null,
      sector: schemeData.sector && schemeData.sector.trim() !== '' ? schemeData.sector : null,
      provinceName: schemeData.provinceName && schemeData.provinceName.trim() !== '' ? schemeData.provinceName : null,
      districtName: schemeData.districtName && schemeData.districtName.trim() !== '' ? schemeData.districtName : null,
      localBodyName: schemeData.localBodyName && schemeData.localBodyName.trim() !== '' ? schemeData.localBodyName : null,
      sourceUrl: schemeData.sourceUrl && schemeData.sourceUrl.trim() !== '' ? schemeData.sourceUrl : null,
      documentUrl: schemeData.documentUrl && schemeData.documentUrl.trim() !== '' ? schemeData.documentUrl : null,
      updatedAt: new Date(),
    };

    // Update scheme
    const [updatedScheme] = await db
      .update(governmentSchemesTable)
      .set(sanitizedData)
      .where(eq(governmentSchemesTable.id, schemeId))
      .returning();

    return updatedScheme;
  } catch (error) {
    console.error("Error updating scheme:", error);
    throw error;
  }
};

/**
 * Update scheme details
 * @param {string} schemeId - Scheme UUID
 * @param {Object} detailsData - Updated details data
 * @returns {Promise<Object>} Updated details
 */
export const updateSchemeDetails = async (schemeId, detailsData) => {
  try {
    // Check if scheme exists
    const existingScheme = await db
      .select()
      .from(governmentSchemesTable)
      .where(eq(governmentSchemesTable.id, schemeId))
      .limit(1);

    if (existingScheme.length === 0) {
      throw new Error("Scheme not found");
    }

    // Check if details exist
    const existingDetails = await db
      .select()
      .from(schemeDetailsTable)
      .where(eq(schemeDetailsTable.schemeId, schemeId))
      .limit(1);

    let updatedDetails;

    if (existingDetails.length > 0) {
      // Update existing details
      [updatedDetails] = await db
        .update(schemeDetailsTable)
        .set(detailsData)
        .where(eq(schemeDetailsTable.schemeId, schemeId))
        .returning();
    } else {
      // Create new details
      [updatedDetails] = await db
        .insert(schemeDetailsTable)
        .values({
          schemeId,
          ...detailsData,
        })
        .returning();
    }

    return updatedDetails;
  } catch (error) {
    console.error("Error updating scheme details:", error);
    throw error;
  }
};

/**
 * Delete a government scheme (cascade will delete details)
 * @param {string} schemeId - Scheme UUID
 * @returns {Promise<boolean>} Success status
 */
export const deleteScheme = async (schemeId) => {
  try {
    // Check if scheme exists
    const existingScheme = await db
      .select()
      .from(governmentSchemesTable)
      .where(eq(governmentSchemesTable.id, schemeId))
      .limit(1);

    if (existingScheme.length === 0) {
      throw new Error("Scheme not found");
    }

    // Delete scheme (cascade will delete details)
    await db
      .delete(governmentSchemesTable)
      .where(eq(governmentSchemesTable.id, schemeId));

    return true;
  } catch (error) {
    console.error("Error deleting scheme:", error);
    throw error;
  }
};

/**
 * Get scheme details by schemeId
 * @param {string} schemeId - Scheme UUID
 * @returns {Promise<Object|null>} Scheme details
 */
export const getSchemeDetails = async (schemeId) => {
  try {
    const details = await db
      .select()
      .from(schemeDetailsTable)
      .where(eq(schemeDetailsTable.schemeId, schemeId))
      .limit(1);

    return details.length > 0 ? details[0] : null;
  } catch (error) {
    console.error("Error fetching scheme details:", error);
    throw new Error("Failed to fetch scheme details");
  }
};

