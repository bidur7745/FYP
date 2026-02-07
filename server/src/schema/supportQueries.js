import { pgTable, serial, text, timestamp, integer } from "drizzle-orm/pg-core";
import { userTable } from "./user.js";

export const supportQueriesTable = pgTable("support_queries", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  message: text("message").notNull(),
  userId: integer("user_id").references(() => userTable.id, { onDelete: "set null" }),
  status: text("status").default("open").notNull(), // 'open' | 'answered'
  adminReply: text("admin_reply"),
  answeredAt: timestamp("answered_at"),
  answeredBy: integer("answered_by").references(() => userTable.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
