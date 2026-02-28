import { pgTable, serial, integer, text, timestamp, numeric } from "drizzle-orm/pg-core";
import { userTable } from "./user.js";

export const diseasePredictionsTable = pgTable("disease_predictions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => userTable.id, { onDelete: "cascade" })
    .notNull(),
  crop: text("crop").notNull(),
  predictedDisease: text("predicted_disease").notNull(),
  generalName: text("general_name"),
  imageUrl: text("image_url"),
  diseaseConfidence: numeric("disease_confidence", { precision: 5, scale: 4 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

