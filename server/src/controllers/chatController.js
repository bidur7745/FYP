import {
  getOrCreateDiscussionHub,
  listConversationsForUser,
  createConversation,
  getConversationById,
  getMessages,
  sendMessage,
  markRead,
  getAvailablePeople,
  getVerifyWithExpertContext,
  setLastVerificationExpert,
  updateConversationMetadata,
  removeConversationMember,
  getTotalUnreadCount,
  deleteMessage,
} from "../services/chatService.js";

export async function getConversationsController(req, res) {
  try {
    const userId = req.user.id;
    const role = req.user.role;
    const type = req.query.type;
    const status = req.query.status;
    const list = await listConversationsForUser(userId, role, { type, status });
    return res.status(200).json({ success: true, data: list });
  } catch (err) {
    console.error("getConversations error:", err);
    return res.status(500).json({ success: false, message: err.message || "Failed to list conversations" });
  }
}

export async function createConversationController(req, res) {
  try {
    const userId = req.user.id;
    const role = req.user.role;
    const { type, participantUserIds, subject, diseasePredictionId, expertId } = req.body;
    if (!type) {
      return res.status(400).json({ success: false, message: "type is required" });
    }
    const conv = await createConversation(userId, role, {
      type,
      participantUserIds,
      subject,
      diseasePredictionId,
      expertId,
    });
    const full = await getConversationById(conv.id, userId);
    return res.status(201).json({ success: true, data: full });
  } catch (err) {
    console.error("createConversation error:", err);
    return res.status(400).json({ success: false, message: err.message || "Failed to create conversation" });
  }
}

export async function getConversationController(req, res) {
  try {
    const userId = req.user.id;
    const conversationId = Number(req.params.id);
    if (!conversationId) {
      return res.status(400).json({ success: false, message: "Invalid conversation id" });
    }
    const conv = await getConversationById(conversationId, userId);
    if (!conv) {
      return res.status(404).json({ success: false, message: "Conversation not found" });
    }
    return res.status(200).json({ success: true, data: conv });
  } catch (err) {
    console.error("getConversation error:", err);
    return res.status(500).json({ success: false, message: err.message || "Failed to get conversation" });
  }
}

export async function updateConversationController(req, res) {
  try {
    const userId = req.user.id;
    const role = req.user.role;
    const conversationId = Number(req.params.id);
    if (!conversationId) {
      return res.status(400).json({ success: false, message: "Invalid conversation id" });
    }
    const { subject, avatarUrl, status } = req.body || {};
    const updated = await updateConversationMetadata(conversationId, userId, role, {
      subject,
      avatarUrl,
      status,
    });
    return res.status(200).json({ success: true, data: updated });
  } catch (err) {
    console.error("updateConversation error:", err);
    const status = err.message && (err.message.includes("permission") || err.message.includes("Only admins"))
      ? 403
      : 400;
    return res.status(status).json({ success: false, message: err.message || "Failed to update conversation" });
  }
}

export async function getMessagesController(req, res) {
  try {
    const userId = req.user.id;
    const conversationId = Number(req.params.id);
    const before = req.query.before ? Number(req.query.before) : undefined;
    const limit = Math.min(Number(req.query.limit) || 50, 100);
    const messages = await getMessages(conversationId, userId, { before, limit });
    return res.status(200).json({ success: true, data: messages });
  } catch (err) {
    console.error("getMessages error:", err);
    return res.status(500).json({ success: false, message: err.message || "Failed to get messages" });
  }
}

export async function sendMessageController(req, res) {
  try {
    const userId = req.user.id;
    const conversationId = Number(req.params.id);
    const { content, contentType, attachmentUrl, meta } = req.body;
    const msg = await sendMessage(conversationId, userId, {
      content,
      contentType: contentType || "text",
      attachmentUrl,
      meta,
    });
    return res.status(201).json({ success: true, data: msg });
  } catch (err) {
    console.error("sendMessage error:", err);
    return res.status(400).json({ success: false, message: err.message || "Failed to send message" });
  }
}

export async function markReadController(req, res) {
  try {
    const userId = req.user.id;
    const conversationId = Number(req.params.id);
    const messageId = Number(req.body.messageId);
    await markRead(conversationId, userId, messageId);
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("markRead error:", err);
    return res.status(500).json({ success: false, message: err.message || "Failed to mark read" });
  }
}

export async function getAvailablePeopleController(req, res) {
  try {
    const userId = req.user.id;
    const search = req.query.search || "";
    const role = req.query.role;
    const people = await getAvailablePeople(userId, search, role);
    return res.status(200).json({ success: true, data: people });
  } catch (err) {
    console.error("getAvailablePeople error:", err);
    return res.status(500).json({ success: false, message: err.message || "Failed to get available people" });
  }
}

export async function getVerifyWithExpertContextController(req, res) {
  try {
    const userId = req.user.id;
    if (req.user.role !== "user") {
      return res.status(403).json({ success: false, message: "Only farmers can use verify with expert" });
    }
    const context = await getVerifyWithExpertContext(userId);
    return res.status(200).json({ success: true, data: context });
  } catch (err) {
    console.error("getVerifyWithExpertContext error:", err);
    return res.status(500).json({ success: false, message: err.message || "Failed to get context" });
  }
}

export async function getTotalUnreadCountController(req, res) {
  try {
    const userId = req.user.id;
    const role = req.user.role;
    const count = await getTotalUnreadCount(userId, role);
    return res.status(200).json({ success: true, count });
  } catch (err) {
    console.error("getTotalUnreadCount error:", err);
    return res.status(500).json({ success: false, message: err.message || "Failed to get unread count" });
  }
}

export async function removeConversationMemberController(req, res) {
  try {
    const userId = req.user.id;
    const role = req.user.role;
    const conversationId = Number(req.params.id);
    const targetUserId = Number(req.params.userId);

    if (!conversationId || !targetUserId) {
      return res.status(400).json({ success: false, message: "Invalid ids" });
    }

    const updated = await removeConversationMember(conversationId, targetUserId, userId, role);
    return res.status(200).json({ success: true, data: updated });
  } catch (err) {
    console.error("removeConversationMember error:", err);
    const status = err.message && (err.message.includes("permission") || err.message.includes("Only"))
      ? 403
      : 400;
    return res.status(status).json({ success: false, message: err.message || "Failed to remove member" });
  }
}

export async function deleteMessageController(req, res) {
  try {
    const userId = req.user.id;
    const role = req.user.role;
    const conversationId = Number(req.params.id);
    const messageId = Number(req.params.msgId);
    const deleted = await deleteMessage(conversationId, messageId, userId, role);
    return res.status(200).json({ success: true, data: deleted });
  } catch (err) {
    console.error("deleteMessage error:", err);
    const status = err.message === "You can only delete your own messages" ? 403 : 400;
    return res.status(status).json({ success: false, message: err.message || "Failed to delete message" });
  }
}
