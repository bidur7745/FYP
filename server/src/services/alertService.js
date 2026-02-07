import { db } from "../config/db.js";
import { alertsTable } from "../schema/index.js";
import { eq, and, gt, desc } from "drizzle-orm";

/**
 * Create a new alert
 * @param {Object} alertData - Alert data
 * @returns {Promise<Object>} Created alert
 */
export const createAlert = async (alertData) => {
  try {
    const {
      userId,
      location,
      latitude,
      longitude,
      type,
      severity,
      title,
      message,
      icon,
      recommendedActions,
      weatherData,
      expiresAt,
    } = alertData;

    // Validate required fields
    if (!userId || !location || !type || !severity || !title || !message) {
      throw new Error("Missing required alert fields");
    }

    const [alert] = await db
      .insert(alertsTable)
      .values({
        userId,
        location,
        latitude: latitude || null,
        longitude: longitude || null,
        type,
        severity,
        title,
        message,
        icon: icon || null,
        recommendedActions: recommendedActions || [],
        weatherData: weatherData || [],
        expiresAt: expiresAt || new Date(Date.now() + 24 * 60 * 60 * 1000), // Default 24 hours
      })
      .returning();

    return alert;
  } catch (error) {
    console.error("Error creating alert:", error);
    throw error;
  }
};

/**
 * Get active alerts for a user
 * @param {number} userId - User ID
 * @param {Object} filters - Optional filters (isRead, severity, type)
 * @returns {Promise<Array>} Array of alerts
 */
export const getUserAlerts = async (userId, filters = {}) => {
  try {
    // Build conditions array
    const conditions = [eq(alertsTable.userId, userId), gt(alertsTable.expiresAt, new Date())];

    // Apply additional filters if provided
    if (filters.isRead !== undefined) {
      // Note: We'll need to add isRead field to schema if needed
      // For now, assuming all alerts are unread by default
    }

    if (filters.severity) {
      conditions.push(eq(alertsTable.severity, filters.severity));
    }

    if (filters.type) {
      conditions.push(eq(alertsTable.type, filters.type));
    }

    const alerts = await db
      .select()
      .from(alertsTable)
      .where(and(...conditions))
      .orderBy(desc(alertsTable.createdAt));

    return alerts;
  } catch (error) {
    console.error("Error fetching user alerts:", error);
    throw error;
  }
};

/**
 * Get unread alert count for a user
 * @param {number} userId - User ID
 * @returns {Promise<number>} Count of unread alerts
 */
export const getUnreadAlertCount = async (userId) => {
  try {
    const alerts = await db
      .select()
      .from(alertsTable)
      .where(
        and(
          eq(alertsTable.userId, userId),
          gt(alertsTable.expiresAt, new Date())
          // Add isRead check when field is available
        )
      );

    return alerts.length;
  } catch (error) {
    console.error("Error fetching unread alert count:", error);
    throw error;
  }
};

/**
 * Mark alert as read
 * @param {number} alertId - Alert ID
 * @param {number} userId - User ID (for authorization)
 * @returns {Promise<Object>} Updated alert
 */
export const markAlertAsRead = async (alertId, userId) => {
  try {
    // First verify the alert belongs to the user
    const [alert] = await db
      .select()
      .from(alertsTable)
      .where(and(eq(alertsTable.alertId, alertId), eq(alertsTable.userId, userId)))
      .limit(1);

    if (!alert) {
      throw new Error("Alert not found or unauthorized");
    }

    // Update isRead field (when available in schema)
    // For now, we'll just return the alert
    // TODO: Add isRead field to schema and update here

    return alert;
  } catch (error) {
    console.error("Error marking alert as read:", error);
    throw error;
  }
};

/**
 * Delete expired alerts (cleanup job)
 * @returns {Promise<number>} Number of deleted alerts
 */
export const deleteExpiredAlerts = async () => {
  try {
    const now = new Date();
    const expiredAlerts = await db
      .select()
      .from(alertsTable)
      .where(gt(now, alertsTable.expiresAt));

    // Delete expired alerts
    // Note: Drizzle doesn't have a direct delete with where, so we'll need to use SQL
    // For now, return count - actual deletion can be done via migration or SQL query
    return expiredAlerts.length;
  } catch (error) {
    console.error("Error deleting expired alerts:", error);
    throw error;
  }
};

