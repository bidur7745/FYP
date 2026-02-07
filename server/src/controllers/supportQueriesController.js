import {
  submitSupportQuery,
  listSupportQueries,
  getSupportQueryById,
  replySupportQuery,
  getMySupportQueries,
  createNotification,
} from "../services/supportQueriesService.js";
import { sendSupportReplyEmail } from "../config/email.js";

/**
 * POST /api/support - Submit contact form (public, optional auth)
 */
export const submitSupportController = async (req, res) => {
  try {
    const { name, email, message } = req.body;
    const userId = req.user ? req.user.id : null;
    const query = await submitSupportQuery({ name, email, message, userId });
    return res.status(201).json({
      success: true,
      message: "Your message has been sent. We will get back to you soon.",
      queryId: query.id,
    });
  } catch (error) {
    console.error("Submit support error:", error.message);
    return res.status(400).json({
      success: false,
      message: error.message || "Failed to submit support query",
    });
  }
};

/**
 * GET /api/support - List all queries (admin only)
 */
export const listSupportQueriesController = async (req, res) => {
  try {
    const { status } = req.query;
    const queries = await listSupportQueries({ status });
    return res.status(200).json({
      success: true,
      count: queries.length,
      queries,
    });
  } catch (error) {
    console.error("List support queries error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to list support queries",
    });
  }
};

/**
 * GET /api/support/my-queries - Get current user's queries
 */
export const getMyQueriesController = async (req, res) => {
  try {
    const userId = req.user.id;
    const queries = await getMySupportQueries(userId);
    return res.status(200).json({
      success: true,
      count: queries.length,
      queries,
    });
  } catch (error) {
    console.error("Get my queries error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to get your queries",
    });
  }
};

/**
 * PUT /api/support/:id - Admin reply to a query (sends email + creates notification if user is logged-in)
 */
export const replySupportQueryController = async (req, res) => {
  try {
    const queryId = parseInt(req.params.id, 10);
    const adminId = req.user.id;
    const { adminReply } = req.body;
    if (!adminReply || !adminReply.trim()) {
      return res.status(400).json({ success: false, message: "Reply text is required." });
    }
    const updated = await replySupportQuery(queryId, adminId, adminReply);
    const query = await getSupportQueryById(queryId);
    if (!query) {
      return res.status(500).json({ success: false, message: "Query not found after update." });
    }
    try {
      await sendSupportReplyEmail(query.email, query.name, query.message, query.adminReply);
    } catch (emailErr) {
      console.error("Support reply email failed:", emailErr);
    }
    if (query.userId) {
      try {
        await createNotification({
          userId: query.userId,
          type: "support_reply",
          title: "Support reply",
          body: `We've replied to your support query. ${(query.adminReply || "").slice(0, 100)}...`,
          referenceId: query.id,
        });
      } catch (notifErr) {
        console.error("Create notification failed:", notifErr);
      }
    }
    return res.status(200).json({
      success: true,
      message: "Reply sent successfully.",
      query: updated,
    });
  } catch (error) {
    console.error("Reply support query error:", error.message);
    return res.status(400).json({
      success: false,
      message: error.message || "Failed to reply",
    });
  }
};
