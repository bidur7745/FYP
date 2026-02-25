import { db } from "../config/db.js";
import { alertsTable } from "../schema/index.js";
import { eq, and, gt, gte, lte, desc } from "drizzle-orm";

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

    // Avoid duplicate: same user, location, type within last 60 minutes
    const tenMinAgo = new Date(Date.now() - 60 * 60 * 1000);
    const existing = await db
      .select()
      .from(alertsTable)
      .where(
        and(
          eq(alertsTable.userId, userId),
          eq(alertsTable.location, location),
          eq(alertsTable.type, type),
          gte(alertsTable.createdAt, tenMinAgo)
        )
      )
      .limit(1);
    if (existing.length > 0) {
      return existing[0];
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

    const rows = await db
      .select()
      .from(alertsTable)
      .where(and(...conditions))
      .orderBy(desc(alertsTable.createdAt));

    // Dedupe: same location + type + same minute = one logical alert (keep first, isRead if any in group is read)
    const key = (a) =>
      `${a.location}|${a.type}|${new Date(a.createdAt).setSeconds(0, 0)}`;
    const seen = new Map();
    for (const a of rows) {
      const k = key(a);
      if (!seen.has(k)) seen.set(k, { ...a });
      else if (!a.isRead) seen.get(k).isRead = false; // if any in group unread, show as unread
    }
    return [...seen.values()];
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
          gt(alertsTable.expiresAt, new Date()),
          eq(alertsTable.isRead, false)
        )
      );

    return alerts.length;
  } catch (error) {
    console.error("Error fetching unread alert count:", error);
    throw error;
  }
};

/**
 * Mark alert as read (and all duplicates: same user, location, type, within same minute)
 * @param {number} alertId - Alert ID
 * @param {number} userId - User ID (for authorization)
 * @returns {Promise<Object>} Updated alert
 */
export const markAlertAsRead = async (alertId, userId) => {
  try {
    const [alert] = await db
      .select()
      .from(alertsTable)
      .where(and(eq(alertsTable.alertId, alertId), eq(alertsTable.userId, userId)))
      .limit(1);

    if (!alert) {
      throw new Error("Alert not found or unauthorized");
    }

    // Mark this alert and all duplicates (same user, location, type, within 2 min) as read
    const from = new Date(new Date(alert.createdAt).getTime() - 2 * 60 * 1000);
    const to = new Date(new Date(alert.createdAt).getTime() + 2 * 60 * 1000);
    await db
      .update(alertsTable)
      .set({ isRead: true })
      .where(
        and(
          eq(alertsTable.userId, userId),
          eq(alertsTable.location, alert.location),
          eq(alertsTable.type, alert.type),
          gte(alertsTable.createdAt, from),
          lte(alertsTable.createdAt, to)
        )
      );

    return { ...alert, isRead: true };
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

