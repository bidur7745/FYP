import {
  pgTable,
  serial,
  integer,
  text,
  timestamp,
  boolean,
  smallint,
  pgEnum,
} from "drizzle-orm/pg-core";
import { userTable } from "./user.js";
import { diseasePredictionsTable } from "./diseasePredictions.js";

export const conversationTypeEnum = pgEnum("conversation_type", [
  "krishimitra_global",
  "group_custom",
  "farmer_farmer",
  "farmer_expert",
  "farmer_admin",
  "disease_verification",
]);

export const conversationStatusEnum = pgEnum("conversation_status", [
  "open",
  "closed",
  "archived",
]);

export const conversationsTable = pgTable("conversations", {
  id: serial("id").primaryKey(),
  type: conversationTypeEnum("type").notNull(),
  createdByUserId: integer("created_by_user_id").references(() => userTable.id, {
    onDelete: "set null",
  }),
  subject: text("subject"),
  avatarUrl: text("avatar_url"),
  diseasePredictionId: integer("disease_prediction_id").references(
    () => diseasePredictionsTable.id,
    { onDelete: "set null" }
  ),
  priority: smallint("priority").default(0).notNull(),
  status: conversationStatusEnum("status").default("open").notNull(),
  isGroup: boolean("is_group").default(false).notNull(),
  lastMessageAt: timestamp("last_message_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
