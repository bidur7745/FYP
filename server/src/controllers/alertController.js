import { getUserAlerts, getUnreadAlertCount, markAlertAsRead } from "../services/alertService.js";

/**
 * Get user alerts
 * GET /api/alerts?severity=...&type=...
 */
export const getUserAlertsController = async (req, res) => {
  try {
    const userId = req.user.id;
    const { severity, type } = req.query;

    const filters = {};
    if (severity) filters.severity = severity;
    if (type) filters.type = type;

    const alerts = await getUserAlerts(userId, filters);

    return res.status(200).json({
      success: true,
      count: alerts.length,
      alerts: alerts,
    });
  } catch (error) {
    console.error("Get User Alerts Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to get alerts",
      error: error.message,
    });
  }
};

/**
 * Get unread alert count
 * GET /api/alerts/unread-count
 */
export const getUnreadAlertCountController = async (req, res) => {
  try {
    const userId = req.user.id;

    const count = await getUnreadAlertCount(userId);

    return res.status(200).json({
      success: true,
      count: count,
    });
  } catch (error) {
    console.error("Get Unread Alert Count Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to get unread alert count",
      error: error.message,
    });
  }
};

/**
 * Mark alert as read
 * PUT /api/alerts/:alertId/read
 */
export const markAlertReadController = async (req, res) => {
  try {
    const userId = req.user.id;
    const { alertId } = req.params;

    if (!alertId || isNaN(parseInt(alertId))) {
      return res.status(400).json({
        success: false,
        message: "Valid alert ID is required",
      });
    }

    const alert = await markAlertAsRead(parseInt(alertId), userId);

    return res.status(200).json({
      success: true,
      message: "Alert marked as read",
      alert: alert,
    });
  } catch (error) {
    console.error("Mark Alert Read Error:", error.message);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to mark alert as read",
      error: error.message,
    });
  }
};

