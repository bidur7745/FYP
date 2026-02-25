import { pgTable, serial, text, timestamp, integer, pgEnum } from "drizzle-orm/pg-core";
import { userTable } from "./user.js";

// Expert verification: pending (awaiting review), approved, rejected
export const expertVerificationStatusEnum = pgEnum("expert_verification_status", ["pending", "approved", "rejected"]);

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
  isVerifiedExpert: expertVerificationStatusEnum("isVerifiedExpert").default("pending").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
    