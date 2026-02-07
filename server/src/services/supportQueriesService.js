import { db } from "../config/db.js";
import { supportQueriesTable, notificationsTable } from "../schema/index.js";
import { eq, desc } from "drizzle-orm";

export const submitSupportQuery = async (payload) => {
  const { name, email, message, userId = null } = payload;
  if (!name || !email || !message) {
    throw new Error("Name, email, and message are required.");
  }
  const [row] = await db
    .insert(supportQueriesTable)
    .values({
      name: name.trim(),
      email: email.trim(),
      message: message.trim(),
      userId: userId || null,
      status: "open",
    })
    .returning();
  return row;
};

export const listSupportQueries = async (filters = {}) => {
  let query = db.select().from(supportQueriesTable).orderBy(desc(supportQueriesTable.createdAt));
  const rows = await query;
  if (filters.status) {
    return rows.filter((r) => r.status === filters.status);
  }
  return rows;
};

export const getSupportQueryById = async (id) => {
  const [row] = await db.select().from(supportQueriesTable).where(eq(supportQueriesTable.id, id)).limit(1);
  return row;
};

export const replySupportQuery = async (queryId, adminId, adminReply) => {
  const existing = await getSupportQueryById(queryId);
  if (!existing) throw new Error("Support query not found.");
  if (existing.status === "answered") throw new Error("This query has already been answered.");
  const [updated] = await db
    .update(supportQueriesTable)
    .set({
      status: "answered",
      adminReply: adminReply.trim(),
      answeredAt: new Date(),
      answeredBy: adminId,
    })
    .where(eq(supportQueriesTable.id, queryId))
    .returning();
  return updated;
};

export const getMySupportQueries = async (userId) => {
  const rows = await db
    .select()
    .from(supportQueriesTable)
    .where(eq(supportQueriesTable.userId, userId))
    .orderBy(desc(supportQueriesTable.createdAt));
  return rows;
};

export const createNotification = async (payload) => {
  const { userId, type, title, body, referenceId } = payload;
  const [row] = await db
    .insert(notificationsTable)
    .values({
      userId,
      type: type || "support_reply",
      title,
      body: body || null,
      referenceId: referenceId || null,
    })
    .returning();
  return row;
};
