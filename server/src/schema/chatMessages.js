import {
  pgTable,
  serial,
  integer,
  text,
  timestamp,
  pgEnum,
  jsonb,
} from "drizzle-orm/pg-core";
import { userTable } from "./user.js";
import { conversationsTable } from "./conversations.js";

export const messageContentTypeEnum = pgEnum("message_content_type", [
  "text",
  "image",
  "document",
  "system",
]);

export const chatMessagesTable = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id")
    .references(() => conversationsTable.id, { onDelete: "cascade" })
    .notNull(),
  senderId: integer("sender_id")
    .references(() => userTable.id, { onDelete: "set null" })
    .notNull(),
  content: text("content").notNull(),
  contentType: messageContentTypeEnum("content_type").default("text").notNull(),
  attachmentUrl: text("attachment_url"),
  meta: jsonb("meta"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  editedAt: timestamp("edited_at"),
  deletedAt: timestamp("deleted_at"),
});
