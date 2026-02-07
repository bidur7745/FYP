import { db } from "../config/db.js";
import { notificationsTable } from "../schema/index.js";
import { eq, desc, and, sql } from "drizzle-orm";

export const getNotifications = async (userId, options = {}) => {
  const limit = options.limit ?? 50;
  const rows = await db
    .select()
    .from(notificationsTable)
    .where(eq(notificationsTable.userId, userId))
    .orderBy(desc(notificationsTable.createdAt))
    .limit(limit);
  return rows;
};

export const getUnreadNotificationCount = async (userId) => {
  const [row] = await db
    .select({ count: sql`count(*)::int` })
    .from(notificationsTable)
    .where(and(eq(notificationsTable.userId, userId), eq(notificationsTable.read, false)));
  return row?.count ?? 0;
};

export const markNotificationAsRead = async (userId, notificationId) => {
  const [updated] = await db
    .update(notificationsTable)
    .set({ read: true })
    .where(
      and(
        eq(notificationsTable.id, notificationId),
        eq(notificationsTable.userId, userId)
      )
    )
    .returning();
  return updated;
};

export const markAllNotificationsAsRead = async (userId) => {
  await db
    .update(notificationsTable)
    .set({ read: true })
    .where(eq(notificationsTable.userId, userId));
  return true;
};
