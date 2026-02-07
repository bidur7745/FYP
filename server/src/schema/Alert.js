import { pgTable, serial, text, timestamp, jsonb, real, integer, pgEnum } from "drizzle-orm/pg-core";
import { userTable } from "./user.js";

// Enum for alert type
export const alertTypeEnum = pgEnum("alert_type", [
  'freeze',
  'cold',
  'heat',
  'warm',
  'rain',
  'heavy-rain',
  'drought',
  'wind',
  'wind-moderate',
  'snow',
  'freeze-forecast',
  'heavy-rain-forecast'
]);

// Enum for severity
export const severityEnum = pgEnum("severity", ['low', 'medium', 'high']);

export const alertsTable = pgTable("alerts", {
  alertId: serial("alert_id").primaryKey(),
  // User reference 
  userId: integer("user_id").references(() => userTable.id, { onDelete: "cascade" }).notNull(),
  // Location information
  location: text("location").notNull(), 
  latitude: real("latitude"),
  longitude: real("longitude"), 
  // Alert details
  type: alertTypeEnum("type").notNull(),
  severity: severityEnum("severity").notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  icon: text("icon"), 
  // Recommended actions as array of strings
  recommendedActions: text("recommended_actions").array().default([]),
  // Weather data as array of JSON objects
  weatherData: jsonb("weather_data").array().default([]),
  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at").notNull(),
});

