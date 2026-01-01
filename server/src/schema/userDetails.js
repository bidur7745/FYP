import { pgTable, serial, text, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { userTable } from "./user.js";

export const userDetailsTable = pgTable("userDetails", {
  id: serial("id").primaryKey(),
  userId: integer("userId").references(() => userTable.id, { onDelete: "cascade" }).notNull(),
  address: text("address"),
  farmLocation: text("farmLocation"), // Specific location of the farm
  bio: text("bio"),
  profileImage: text("profileImage"), // URL or path to profile image
  phone: text("phone"),
  skills: text("skills"),
  yearsOfExperience: integer("yearsOfExperience"),
  education: text("education"),
  licenseImage: text("licenseImage"), // URL or path to license image (for experts)
  isVerifiedExpert: boolean("isVerifiedExpert").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
    