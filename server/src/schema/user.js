import { pgEnum, pgTable, serial, text, boolean, timestamp } from "drizzle-orm/pg-core";

// ✅ Export enum separately so Drizzle CLI detects it
export const roleEnum = pgEnum("role", ["user", "admin", "expert"]);

export const userTable = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: roleEnum("role").default("user").notNull(),
  isVerified: boolean("isVerified").default(false).notNull(),
  verificationCode: text("verificationCode"), // 6-digit OTP code
  verificationExpires: timestamp("verificationExpires"), // OTP expiration time
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
  