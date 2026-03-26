import { db } from "../config/db.js";
import {
  userTable,
  userDetailsTable,
  conversationsTable,
  conversationParticipantsTable,
  chatMessagesTable,
} from "../schema/index.js";
import { eq, and, desc, asc, sql, or, inArray, isNull } from "drizzle-orm";

const DISCUSSION_HUB_SUBJECT = "KrishiMitra Global";
const KRISHIMITRA_GLOBAL = "krishimitra_global";

/** Map user role to role_snapshot (farmer -> user) */
function roleSnapshot(role) {
  if (role === "user") return "user";
  if (role === "expert") return "expert";
  if (role === "admin") return "admin";
  return "user";
}

/** Get or create the single Discussion Hub (krishimitra_global) conversation */
export async function getOrCreateDiscussionHub() {
  const [existing] = await db
    .select()
    .from(conversationsTable)
    .where(eq(conversationsTable.type, KRISHIMITRA_GLOBAL))
    .limit(1);
  if (existing) return existing;
  const [created] = await db
    .insert(conversationsTable)
    .values({
      type: KRISHIMITRA_GLOBAL,
      createdByUserId: null,
      subject: DISCUSSION_HUB_SUBJECT,
      isGroup: true,
      status: "open",
    })
    .returning();
  return created;
}

/** List conversations for the current user: participant list + Discussion Hub */
export async function listConversationsForUser(userId, userRole, filters = {}) {
  const hub = await getOrCreateDiscussionHub();
  const participantRows = await db
    .select({
      conversationId: conversationParticipantsTable.conversationId,
    })
    .from(conversationParticipantsTable)
    .where(
      and(
        eq(conversationParticipantsTable.userId, userId),
        eq(conversationParticipantsTable.hasLeft, false)
      )
    );
  const participantConvIds = participantRows.map((r) => r.conversationId);
  const allConvIds = [...new Set([hub.id, ...participantConvIds])];

  if (allConvIds.length === 0) {
    return [await conversationToSummary(hub, userId, userRole)];
  }

  const convs = await db
    .select()
    .from(conversationsTable)
    .where(inArray(conversationsTable.id, allConvIds))
    .orderBy(desc(conversationsTable.lastMessageAt));

  const typeFilter = filters.type;
  const statusFilter = filters.status;
  let result = await Promise.all(
    convs
      .filter((c) => (!typeFilter || c.type === typeFilter) && (!statusFilter || c.status === statusFilter))
      .map((c) => conversationToSummary(c, userId, userRole))
  );
  // Pin Discussion Hub at top
  result.sort((a, b) => {
    if (a.type === KRISHIMITRA_GLOBAL) return -1;
    if (b.type === KRISHIMITRA_GLOBAL) return 1;
    const aTime = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
    const bTime = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
    return bTime - aTime;
  });
  return result;
}

/** Build summary for one conversation (title, last message, unread count, etc.) */
async function conversationToSummary(conv, currentUserId, currentUserRole) {
  const canAccess =
    conv.type === KRISHIMITRA_GLOBAL ||
    (await isParticipant(conv.id, currentUserId));
  if (!canAccess) return null;

  let title = conv.subject || "Chat";
  let avatarUrl = conv.avatarUrl || null;
  if (conv.type === KRISHIMITRA_GLOBAL) {
    title = DISCUSSION_HUB_SUBJECT;
  } else if (!conv.isGroup && conv.type !== "disease_verification") {
    const other = await getOtherParticipants(conv.id, currentUserId);
    if (other.length === 1) {
      title = other[0].name;
      avatarUrl = other[0].profileImage || avatarUrl;
    } else if (other.length > 1) {
      title = other.map((p) => p.name).join(", ");
    }
  } else if (conv.type === "disease_verification" && conv.subject) {
    title = conv.subject;
  }

  const lastMessage = await getLastMessage(conv.id);
  const unreadCount = await getUnreadCount(conv.id, currentUserId);

  return {
    id: conv.id,
    type: conv.type,
    subject: conv.subject,
    isGroup: conv.isGroup,
    status: conv.status,
    priority: conv.priority,
    lastMessageAt: conv.lastMessageAt,
    title,
    avatarUrl,
    lastMessage: lastMessage
      ? {
          id: lastMessage.id,
          content: lastMessage.content,
          contentType: lastMessage.contentType,
          senderId: lastMessage.senderId,
          createdAt: lastMessage.createdAt,
        }
      : null,
    unreadCount,
  };
}

async function isParticipant(conversationId, userId) {
  if (!conversationId) return false;
  const [row] = await db
    .select()
    .from(conversationParticipantsTable)
    .where(
      and(
        eq(conversationParticipantsTable.conversationId, conversationId),
        eq(conversationParticipantsTable.userId, userId),
        eq(conversationParticipantsTable.hasLeft, false)
      )
    )
    .limit(1);
  return !!row;
}

/** For non-global convos, get participants that are not current user */
async function getOtherParticipants(conversationId, excludeUserId) {
  const rows = await db
    .select({
      id: userTable.id,
      name: userTable.name,
      role: userTable.role,
      profileImage: userDetailsTable.profileImage,
    })
    .from(conversationParticipantsTable)
    .innerJoin(userTable, eq(conversationParticipantsTable.userId, userTable.id))
    .leftJoin(userDetailsTable, eq(userDetailsTable.userId, userTable.id))
    .where(
      and(
        eq(conversationParticipantsTable.conversationId, conversationId),
        eq(conversationParticipantsTable.hasLeft, false)
      )
    );
  return rows.filter((r) => r.id !== excludeUserId);
}

async function getLastMessage(conversationId) {
  const [msg] = await db
    .select()
    .from(chatMessagesTable)
    .where(
      and(
        eq(chatMessagesTable.conversationId, conversationId),
        isNull(chatMessagesTable.deletedAt)
      )
    )
    .orderBy(desc(chatMessagesTable.createdAt))
    .limit(1);
  return msg || null;
}

async function getUnreadCount(conversationId, userId) {
  const [part] = await db
    .select({ lastReadMessageId: conversationParticipantsTable.lastReadMessageId })
    .from(conversationParticipantsTable)
    .where(
      and(
        eq(conversationParticipantsTable.conversationId, conversationId),
        eq(conversationParticipantsTable.userId, userId)
      )
    )
    .limit(1);
  if (!part || part.lastReadMessageId == null) {
    const [count] = await db
      .select({ count: sql`count(*)::int` })
      .from(chatMessagesTable)
      .where(
        and(
          eq(chatMessagesTable.conversationId, conversationId),
          isNull(chatMessagesTable.deletedAt)
        )
      );
    return count?.count ?? 0;
  }
  const [count] = await db
    .select({ count: sql`count(*)::int` })
    .from(chatMessagesTable)
    .where(
      and(
        eq(chatMessagesTable.conversationId, conversationId),
        isNull(chatMessagesTable.deletedAt),
        sql`${chatMessagesTable.id} > ${part.lastReadMessageId}`
      )
    );
  return count?.count ?? 0;
}

/** Total unread message count across all conversations for a user */
export async function getTotalUnreadCount(userId, userRole) {
  const hub = await getOrCreateDiscussionHub();
  const participantRows = await db
    .select({
      conversationId: conversationParticipantsTable.conversationId,
      lastReadMessageId: conversationParticipantsTable.lastReadMessageId,
    })
    .from(conversationParticipantsTable)
    .where(
      and(
        eq(conversationParticipantsTable.userId, userId),
        eq(conversationParticipantsTable.hasLeft, false)
      )
    );

  const convMap = new Map(participantRows.map((r) => [r.conversationId, r.lastReadMessageId]));
  if (!convMap.has(hub.id)) convMap.set(hub.id, null);

  let total = 0;
  for (const [convId, lastReadId] of convMap) {
    if (lastReadId == null) {
      const [c] = await db
        .select({ count: sql`count(*)::int` })
        .from(chatMessagesTable)
        .where(
          and(
            eq(chatMessagesTable.conversationId, convId),
            isNull(chatMessagesTable.deletedAt)
          )
        );
      total += c?.count ?? 0;
    } else {
      const [c] = await db
        .select({ count: sql`count(*)::int` })
        .from(chatMessagesTable)
        .where(
          and(
            eq(chatMessagesTable.conversationId, convId),
            isNull(chatMessagesTable.deletedAt),
            sql`${chatMessagesTable.id} > ${lastReadId}`
          )
        );
      total += c?.count ?? 0;
    }
  }
  return total;
}

/** Create a new conversation */
export async function createConversation(creatorId, creatorRole, payload) {
  const {
    type,
    participantUserIds = [],
    subject,
    diseasePredictionId,
    expertId,
  } = payload;

  if (type === "disease_verification") {
    if (!diseasePredictionId || !expertId)
      throw new Error("disease_verification requires diseasePredictionId and expertId");
    // Reuse existing conversation between this farmer and expert if present
    const existingRows = await db
      .select({
        id: conversationsTable.id,
        status: conversationsTable.status,
      })
      .from(conversationsTable)
      .innerJoin(
        conversationParticipantsTable,
        eq(conversationParticipantsTable.conversationId, conversationsTable.id)
      )
      .where(
        and(
          eq(conversationsTable.type, "disease_verification"),
          eq(conversationsTable.createdByUserId, creatorId),
          eq(conversationParticipantsTable.userId, expertId),
          eq(conversationParticipantsTable.hasLeft, false)
        )
      )
      .limit(1);

    if (existingRows.length > 0) {
      const existing = existingRows[0];
      // Optionally reopen closed thread
      if (existing.status !== "open") {
        await db
          .update(conversationsTable)
          .set({
            status: "open",
            updatedAt: new Date(),
          })
          .where(eq(conversationsTable.id, existing.id));
      }
      const [conv] = await db
        .select()
        .from(conversationsTable)
        .where(eq(conversationsTable.id, existing.id))
        .limit(1);
      return conv;
    }

    const [conv] = await db
      .insert(conversationsTable)
      .values({
        type: "disease_verification",
        createdByUserId: creatorId,
        subject: subject || "Disease verification",
        diseasePredictionId,
        isGroup: false,
        status: "open",
      })
      .returning();
    const snap = roleSnapshot(creatorRole);
    await db.insert(conversationParticipantsTable).values([
      { conversationId: conv.id, userId: creatorId, roleSnapshot: snap },
      { conversationId: conv.id, userId: expertId, roleSnapshot: "expert" },
    ]);
    await setLastVerificationExpert(creatorId, expertId);
    return conv;
  }

  if (type === "group_custom") {
    const memberIds = [...new Set([creatorId, ...participantUserIds])];
    const [conv] = await db
      .insert(conversationsTable)
      .values({
        type: "group_custom",
        createdByUserId: creatorId,
        subject: subject || "Group",
        isGroup: true,
        status: "open",
      })
      .returning();
    for (const uid of memberIds) {
      const roleSnap =
        uid === creatorId
          ? roleSnapshot(creatorRole)
          : roleSnapshot((await db.select({ role: userTable.role }).from(userTable).where(eq(userTable.id, uid)).limit(1))[0]?.role || "user");
      await db.insert(conversationParticipantsTable).values({
        conversationId: conv.id,
        userId: uid,
        roleSnapshot: roleSnap,
      });
    }
    return conv;
  }

  // DM: farmer_farmer, farmer_expert, farmer_admin
  const otherId = participantUserIds[0] || expertId;
  if (!otherId) throw new Error("DM requires one other participant");
  const [conv] = await db
    .insert(conversationsTable)
    .values({
      type,
      createdByUserId: creatorId,
      subject: subject || null,
      diseasePredictionId: diseasePredictionId || null,
      isGroup: false,
      status: "open",
    })
    .returning();
  const [other] = await db.select({ role: userTable.role }).from(userTable).where(eq(userTable.id, otherId)).limit(1);
  await db.insert(conversationParticipantsTable).values([
    { conversationId: conv.id, userId: creatorId, roleSnapshot: roleSnapshot(creatorRole) },
    { conversationId: conv.id, userId: otherId, roleSnapshot: other ? roleSnapshot(other.role) : "user" },
  ]);
  return conv;
}

/** Update conversation metadata with permissions */
export async function updateConversationMetadata(conversationId, currentUserId, currentUserRole, { subject, avatarUrl, status }) {
  const [conv] = await db
    .select()
    .from(conversationsTable)
    .where(eq(conversationsTable.id, conversationId))
    .limit(1);

  if (!conv) {
    throw new Error("Conversation not found");
  }

  // Global Discussion Hub: only admins can modify
  if (conv.type === KRISHIMITRA_GLOBAL && currentUserRole !== "admin") {
    throw new Error("Only admins can update the global group");
  }

  // Custom groups: creator or admin can modify
  if (
    conv.type === "group_custom" &&
    currentUserRole !== "admin" &&
    conv.createdByUserId !== currentUserId
  ) {
    throw new Error("You do not have permission to update this group");
  }

  // Disease verification: any participant can modify
  if (conv.type === "disease_verification") {
    const participant = await isParticipant(conversationId, currentUserId);
    if (!participant && currentUserRole !== "admin") {
      throw new Error("You do not have permission to update this conversation");
    }
  }

  // DM types: any participant can update status
  const dmTypes = ["farmer_farmer", "farmer_expert", "farmer_admin"];
  if (dmTypes.includes(conv.type)) {
    const participant = await isParticipant(conversationId, currentUserId);
    if (!participant && currentUserRole !== "admin") {
      throw new Error("You do not have permission to update this conversation");
    }
  }

  const updateValues = {};
  if (typeof subject === "string" && subject.trim().length > 0) {
    updateValues.subject = subject.trim();
  }
  if (typeof avatarUrl === "string") {
    updateValues.avatarUrl = avatarUrl.trim() || null;
  }
  const validStatuses = ["open", "closed", "archived"];
  if (typeof status === "string" && validStatuses.includes(status)) {
    updateValues.status = status;
  }
  if (Object.keys(updateValues).length === 0) {
    return await getConversationById(conversationId, currentUserId);
  }

  updateValues.updatedAt = new Date();

  await db
    .update(conversationsTable)
    .set(updateValues)
    .where(eq(conversationsTable.id, conversationId));

  return await getConversationById(conversationId, currentUserId);
}

export async function setLastVerificationExpert(farmerUserId, expertId) {
  const [existing] = await db
    .select()
    .from(userDetailsTable)
    .where(eq(userDetailsTable.userId, farmerUserId))
    .limit(1);
  if (existing) {
    await db
      .update(userDetailsTable)
      .set({ lastVerificationExpertId: expertId, updatedAt: new Date() })
      .where(eq(userDetailsTable.userId, farmerUserId));
  } else {
    await db.insert(userDetailsTable).values({
      userId: farmerUserId,
      lastVerificationExpertId: expertId,
    });
  }
}

export async function getConversationById(conversationId, userId) {
  const [conv] = await db
    .select()
    .from(conversationsTable)
    .where(eq(conversationsTable.id, conversationId))
    .limit(1);
  if (!conv) return null;
  const canAccess =
    conv.type === KRISHIMITRA_GLOBAL || (await isParticipant(conversationId, userId));
  if (!canAccess) return null;
  const participants = await getParticipantsForConversation(conversationId);
  return {
    ...conv,
    participants,
  };
}

async function getParticipantsForConversation(conversationId) {
  const rows = await db
    .select({
      userId: conversationParticipantsTable.userId,
      roleSnapshot: conversationParticipantsTable.roleSnapshot,
      canWrite: conversationParticipantsTable.canWrite,
      hasLeft: conversationParticipantsTable.hasLeft,
      name: userTable.name,
      email: userTable.email,
      role: userTable.role,
    })
    .from(conversationParticipantsTable)
    .innerJoin(userTable, eq(conversationParticipantsTable.userId, userTable.id))
    .where(
      and(
        eq(conversationParticipantsTable.conversationId, conversationId),
        eq(conversationParticipantsTable.hasLeft, false)
      )
    );
  return rows;
}

export async function getMessages(conversationId, userId, { before, after, limit = 50 } = {}) {
  const hub = await getOrCreateDiscussionHub();
  const canAccess =
    hub.id === Number(conversationId) || (await isParticipant(conversationId, userId));
  if (!canAccess) return [];
  const baseConditions = and(
    eq(chatMessagesTable.conversationId, conversationId),
    isNull(chatMessagesTable.deletedAt)
  );
  let rows;
  if (before) {
    rows = await db
      .select({
        id: chatMessagesTable.id,
        conversationId: chatMessagesTable.conversationId,
        senderId: chatMessagesTable.senderId,
        content: chatMessagesTable.content,
        contentType: chatMessagesTable.contentType,
        attachmentUrl: chatMessagesTable.attachmentUrl,
        meta: chatMessagesTable.meta,
        createdAt: chatMessagesTable.createdAt,
        editedAt: chatMessagesTable.editedAt,
        senderName: userTable.name,
      })
      .from(chatMessagesTable)
      .leftJoin(userTable, eq(chatMessagesTable.senderId, userTable.id))
      .where(and(baseConditions, sql`${chatMessagesTable.id} < ${before}`))
      .orderBy(desc(chatMessagesTable.id))
      .limit(limit);
    rows = rows.reverse();
  } else {
    rows = await db
      .select({
        id: chatMessagesTable.id,
        conversationId: chatMessagesTable.conversationId,
        senderId: chatMessagesTable.senderId,
        content: chatMessagesTable.content,
        contentType: chatMessagesTable.contentType,
        attachmentUrl: chatMessagesTable.attachmentUrl,
        meta: chatMessagesTable.meta,
        createdAt: chatMessagesTable.createdAt,
        editedAt: chatMessagesTable.editedAt,
        senderName: userTable.name,
      })
      .from(chatMessagesTable)
      .leftJoin(userTable, eq(chatMessagesTable.senderId, userTable.id))
      .where(baseConditions)
      .orderBy(asc(chatMessagesTable.id))
      .limit(limit);
  }
  return rows;
}

export async function sendMessage(conversationId, userId, { content, contentType = "text", attachmentUrl, meta }) {
  const hasText = content && content.trim().length > 0;
  const hasAttachment = attachmentUrl && attachmentUrl.trim().length > 0;
  if (!hasText && !hasAttachment) {
    throw new Error("Your message is empty.");
  }

  const hub = await getOrCreateDiscussionHub();
  const canAccess =
    hub.id === Number(conversationId) || (await isParticipant(conversationId, userId));
  if (!canAccess) throw new Error("Not a participant");
  const [conv] = await db
    .select()
    .from(conversationsTable)
    .where(eq(conversationsTable.id, conversationId))
    .limit(1);
  if (!conv || conv.status !== "open") throw new Error("Conversation not open");
  const [msg] = await db
    .insert(chatMessagesTable)
    .values({
      conversationId,
      senderId: userId,
      content: content?.trim() || "",
      contentType,
      attachmentUrl: attachmentUrl || null,
      meta: meta || null,
    })
    .returning();
  await db
    .update(conversationsTable)
    .set({ lastMessageAt: new Date(), updatedAt: new Date() })
    .where(eq(conversationsTable.id, conversationId));
  const [withSender] = await db
    .select({
      id: chatMessagesTable.id,
      conversationId: chatMessagesTable.conversationId,
      senderId: chatMessagesTable.senderId,
      content: chatMessagesTable.content,
      contentType: chatMessagesTable.contentType,
      attachmentUrl: chatMessagesTable.attachmentUrl,
      meta: chatMessagesTable.meta,
      createdAt: chatMessagesTable.createdAt,
      senderName: userTable.name,
    })
    .from(chatMessagesTable)
    .leftJoin(userTable, eq(chatMessagesTable.senderId, userTable.id))
    .where(eq(chatMessagesTable.id, msg.id))
    .limit(1);
  return withSender || msg;
}

export async function markRead(conversationId, userId, messageId) {
  let [part] = await db
    .select()
    .from(conversationParticipantsTable)
    .where(
      and(
        eq(conversationParticipantsTable.conversationId, conversationId),
        eq(conversationParticipantsTable.userId, userId)
      )
    )
    .limit(1);

  if (!part) {
    const hub = await getOrCreateDiscussionHub();
    if (hub.id === Number(conversationId)) {
      const [userRow] = await db
        .select({ role: userTable.role })
        .from(userTable)
        .where(eq(userTable.id, userId))
        .limit(1);
      const [created] = await db
        .insert(conversationParticipantsTable)
        .values({
          conversationId: hub.id,
          userId,
          roleSnapshot: roleSnapshot(userRow?.role || "user"),
        })
        .returning();
      part = created;
    } else {
      return;
    }
  }

  if (messageId) {
    const [msg] = await db
      .select({ id: chatMessagesTable.id })
      .from(chatMessagesTable)
      .where(
        and(
          eq(chatMessagesTable.id, messageId),
          eq(chatMessagesTable.conversationId, conversationId)
        )
      )
      .limit(1);
    if (!msg) return;
  }

  await db
    .update(conversationParticipantsTable)
    .set({ lastReadMessageId: messageId, updatedAt: new Date() })
    .where(eq(conversationParticipantsTable.id, part.id));
}

/** Available people for group/DM: all users except self, with optional search */
export async function getAvailablePeople(currentUserId, search = "", roleFilter) {
  const conditions = [sql`${userTable.id} != ${currentUserId}`];
  if (search && search.trim()) {
    const pattern = "%" + search.trim() + "%";
    conditions.push(
      or(
        sql`${userTable.name} ilike ${pattern}`,
        sql`${userTable.email} ilike ${pattern}`
      )
    );
  }
  if (roleFilter) {
    conditions.push(eq(userTable.role, roleFilter));
  }
  const rows = await db
    .select({
      id: userTable.id,
      name: userTable.name,
      email: userTable.email,
      role: userTable.role,
    })
    .from(userTable)
    .where(and(...conditions))
    .limit(100);
  return rows;
}

/** Remove a member from a group conversation (soft leave) */
export async function removeConversationMember(conversationId, targetUserId, actingUserId, actingRole) {
  const [conv] = await db
    .select()
    .from(conversationsTable)
    .where(eq(conversationsTable.id, conversationId))
    .limit(1);

  if (!conv) throw new Error("Conversation not found");
  if (!conv.isGroup) throw new Error("Only group conversations can be modified");

  // Never remove admin members
  const [targetUser] = await db
    .select({ role: userTable.role })
    .from(userTable)
    .where(eq(userTable.id, targetUserId))
    .limit(1);
  if (targetUser?.role === "admin") {
    throw new Error("Admin members cannot be removed from the group");
  }

  // Global Discussion Hub: only admins can remove
  if (conv.type === KRISHIMITRA_GLOBAL && actingRole !== "admin") {
    throw new Error("Only admins can modify the global group");
  }

  // Custom groups: creator or admin can remove
  if (
    conv.type === "group_custom" &&
    actingRole !== "admin" &&
    conv.createdByUserId !== actingUserId
  ) {
    throw new Error("You do not have permission to modify this group");
  }

  await db
    .update(conversationParticipantsTable)
    .set({
      hasLeft: true,
      canWrite: false,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(conversationParticipantsTable.conversationId, conversationId),
        eq(conversationParticipantsTable.userId, targetUserId)
      )
    );

  return await getConversationById(conversationId, actingUserId);
}

/** Verify with expert context: previousExpert + availableExperts (verified only) */
export async function getVerifyWithExpertContext(farmerUserId) {
  const [details] = await db
    .select({ lastVerificationExpertId: userDetailsTable.lastVerificationExpertId })
    .from(userDetailsTable)
    .where(eq(userDetailsTable.userId, farmerUserId))
    .limit(1);
  let previousExpert = null;
  if (details?.lastVerificationExpertId) {
    const [u] = await db
      .select({ id: userTable.id, name: userTable.name })
      .from(userTable)
      .where(eq(userTable.id, details.lastVerificationExpertId))
      .limit(1);
    if (u) previousExpert = { id: u.id, name: u.name };
  }
  const experts = await db
    .select({
      id: userTable.id,
      name: userTable.name,
      email: userTable.email,
    })
    .from(userTable)
    .where(eq(userTable.role, "expert"))
    .limit(50);
  return {
    previousExpert,
    availableExperts: experts,
  };
}

export async function deleteMessage(conversationId, messageId, userId, userRole) {
  const [msg] = await db
    .select()
    .from(chatMessagesTable)
    .where(
      and(
        eq(chatMessagesTable.id, messageId),
        eq(chatMessagesTable.conversationId, conversationId),
        isNull(chatMessagesTable.deletedAt)
      )
    )
    .limit(1);

  if (!msg) throw new Error("Message not found");

  const isOwner = Number(msg.senderId) === Number(userId);
  const isAdmin = userRole === "admin";
  if (!isOwner && !isAdmin) throw new Error("You can only delete your own messages");

  const [deleted] = await db
    .update(chatMessagesTable)
    .set({ deletedAt: new Date() })
    .where(eq(chatMessagesTable.id, messageId))
    .returning();

  return deleted;
}
