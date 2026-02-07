import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { ENV } from "./env.js";
import * as schema from "../schema/index.js";

// Validate DATABASE_URL
if (!ENV.DATABASE_URL) {
  console.error("❌ DATABASE_URL is not set in environment variables!");
  throw new Error("DATABASE_URL is required");
}

// Create Neon connection with better error handling
let sql;
try {
  sql = neon(ENV.DATABASE_URL, {
    fetchConnectionCache: true,
  });
  console.log("✅ Database connection initialized");
} catch (error) {
  console.error("❌ Failed to initialize database connection:", error.message);
  throw error;
}

export const db = drizzle(sql, { schema });