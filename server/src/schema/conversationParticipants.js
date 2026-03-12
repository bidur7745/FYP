import { pgTable, serial, integer, timestamp, boolean, text } from "drizzle-orm/pg-core";
import { userTable } from "./user.js";
import { conversationsTable } from "./conversations.js";
import { chatMessagesTable } from "./chatMessages.js";

export const conversationParticipantsTable = pgTable("conversation_participants", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id")
    .references(() => conversationsTable.id, { onDelete: "cascade" })
    .notNull(),
  userId: integer("user_id")
    .references(() => userTable.id, { onDelete: "cascade" })
    .notNull(),
  roleSnapshot: text("role_snapshot").notNull(), // 'user' | 'expert' | 'admin'
  canWrite: boolean("can_write").default(true).notNull(),
  hasLeft: boolean("has_left").default(false).notNull(),
  lastReadMessageId: integer("last_read_message_id").references(
    () => chatMessagesTable.id,
    { onDelete: "set null" }
  ),
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
