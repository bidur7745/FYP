import { Server } from "socket.io";
import { ENV } from "../config/env.js";
import { verifyToken } from "../utils/authUtils.js";
import { getOrCreateDiscussionHub, listConversationsForUser, sendMessage, deleteMessage } from "../services/chatService.js";

let io = null;

export function getIO() {
  return io;
}

export function attachChatSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: ENV.FRONTEND_URL || "http://localhost:5173",
      credentials: true,
    },
    path: "/socket.io",
  });

  io.use(async (socket, next) => {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.replace("Bearer ", "") ||
      socket.handshake.query?.token;
    if (!token) {
      return next(new Error("Authentication required"));
    }
    const result = verifyToken(token);
    if (!result.valid) {
      return next(new Error("Invalid or expired token"));
    }
    socket.userId = result.decoded.id;
    socket.userRole = result.decoded.role;
    next();
  });

  io.on("connection", async (socket) => {
    const userId = socket.userId;
    const userRole = socket.userRole;
    const hub = await getOrCreateDiscussionHub();
    const conversations = await listConversationsForUser(userId, userRole);
    const roomIds = conversations.map((c) => String(c.id));
    roomIds.forEach((roomId) => socket.join(roomId));

    socket.on("chat:join", (conversationId) => {
      const id = String(conversationId);
      if (!socket.rooms.has(id)) socket.join(id);
    });

    socket.on("chat:send", async (payload, ack) => {
      try {
        const { conversationId, content, contentType, attachmentUrl, meta } = payload || {};
        if (!conversationId || content === undefined) {
          ack?.({ success: false, message: "conversationId and content required" });
          return;
        }
        const msg = await sendMessage(Number(conversationId), userId, {
          content: String(content),
          contentType: contentType || "text",
          attachmentUrl,
          meta,
        });
        io.to(String(conversationId)).emit("chat:message", msg);
        ack?.({ success: true, data: msg });
      } catch (err) {
        ack?.({ success: false, message: err.message });
      }
    });

    socket.on("chat:delete", async (payload, ack) => {
      try {
        const { conversationId, messageId } = payload || {};
        if (!conversationId || !messageId) {
          ack?.({ success: false, message: "conversationId and messageId required" });
          return;
        }
        const deleted = await deleteMessage(Number(conversationId), Number(messageId), userId, userRole);
        io.to(String(conversationId)).emit("chat:message_deleted", {
          conversationId: Number(conversationId),
          messageId: deleted.id,
        });
        ack?.({ success: true });
      } catch (err) {
        ack?.({ success: false, message: err.message });
      }
    });
  });

  return io;
}
