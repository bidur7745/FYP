import { pgTable, serial, text, timestamp, uniqueIndex, integer } from "drizzle-orm/pg-core";
import { cropsTable } from "./crops.js";

export const diseasesTable = pgTable(
  "diseases",
  {
    id: serial("id").primaryKey(),
    cropId: integer("crop_id").references(() => cropsTable.cropId, { onDelete: "cascade" }).notNull(),
    className: text("class_name").notNull(),
    generalNameEn: text("general_name_en"),
    generalNameNe: text("general_name_ne"),
    categoryEn: text("category_en"),
    categoryNe: text("category_ne"),
    scientificName: text("scientific_name"),
    symptomsEn: text("symptoms_en"),
    symptomsNe: text("symptoms_ne"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("diseases_crop_class_unique").on(table.cropId, table.className),
  ]
);
