import { pgTable, serial, text, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { userTable } from "./user.js";

export const notificationsTable = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => userTable.id, { onDelete: "cascade" }).notNull(),
  type: text("type").notNull(), // e.g. 'support_reply'
  title: text("title").notNull(),
  body: text("body"),
  read: boolean("read").default(false).notNull(),
  referenceId: integer("reference_id"), // e.g. support_query id for support_reply
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
