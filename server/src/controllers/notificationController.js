import {
  getNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "../services/notificationService.js";

export const getNotificationsController = async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = req.query.limit ? parseInt(req.query.limit, 10) : 50;
    const notifications = await getNotifications(userId, { limit });
    return res.status(200).json({
      success: true,
      count: notifications.length,
      notifications,
    });
  } catch (error) {
    console.error("Get notifications error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to get notifications",
    });
  }
};

export const getUnreadCountController = async (req, res) => {
  try {
    const userId = req.user.id;
    const count = await getUnreadNotificationCount(userId);
    return res.status(200).json({
      success: true,
      count,
    });
  } catch (error) {
    console.error("Get unread count error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to get unread count",
    });
  }
};

export const markReadController = async (req, res) => {
  try {
    const userId = req.user.id;
    const notificationId = parseInt(req.params.id, 10);
    const updated = await markNotificationAsRead(userId, notificationId);
    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }
    return res.status(200).json({
      success: true,
      message: "Marked as read",
      notification: updated,
    });
  } catch (error) {
    console.error("Mark read error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to mark as read",
    });
  }
};

export const markAllReadController = async (req, res) => {
  try {
    const userId = req.user.id;
    await markAllNotificationsAsRead(userId);
    return res.status(200).json({
      success: true,
      message: "All notifications marked as read",
    });
  } catch (error) {
    console.error("Mark all read error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to mark all as read",
    });
  }
};
