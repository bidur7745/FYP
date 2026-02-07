import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";
import { governmentSchemesTable } from "./governmentSchemes.js";

export const schemeDetailsTable = pgTable("scheme_details", {
  id: uuid("id").primaryKey().defaultRandom(),
  schemeId: uuid("scheme_id")
    .references(() => governmentSchemesTable.id, { onDelete: "cascade" })
    .notNull()
    .unique(),
  eligibility: text("eligibility"),
  benefits: text("benefits"), 
  applicationProcess: text("application_process").array(), // Step-by-step application process (Array of Text)
  requiredDocuments: text("required_documents").array(), // List of documents required (Array of Text)
  usageConditions: text("usage_conditions"), // Special conditions 
});
