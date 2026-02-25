/**
 * Import JSON data from Neon export into respective tables.
 * Run from server directory: node src/scripts/import-neon-data.js [dataDir]
 * Default dataDir: ./data (place JSON files there) or set env DATA_DIR.
 */

import "dotenv/config";
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { db } from "../config/db.js";
import {
  cropsTable,
  userTable,
  plantationGuidesTable,
  plantingCalendarTable,
  governmentSchemesTable,
  schemeDetailsTable,
  marketPricesTable,
} from "../schema/index.js";

const dataDir =
  process.env.DATA_DIR ||
  process.argv[2] ||
  join(process.cwd(), "data");

function loadJson(filename) {
  const path = join(dataDir, filename);
  if (!existsSync(path)) {
    throw new Error(`File not found: ${path}`);
  }
  const raw = readFileSync(path, "utf8");
  return JSON.parse(raw);
}

async function importTable(name, fn) {
  try {
    await fn();
    console.log(`✅ ${name}: Success`);
    return { table: name, success: true };
  } catch (err) {
    console.log(`❌ ${name}: Failed - ${err.message}`);
    return { table: name, success: false, error: err.message };
  }
}

async function run() {
  console.log("Data directory:", dataDir);
  console.log("---");

  const results = [];

  // 1. Crops
  results.push(
    await importTable("crops", async () => {
      const rows = loadJson("crops.json");
      if (rows.length === 0) return;
      const mapped = rows.map((r) => ({
        cropId: r.crop_id,
        cropName: r.crop_name,
        cropCategory: r.crop_category,
        regions: r.regions,
        season: r.season,
        soilType: r.soil_type,
        waterRequirement: r.water_requirement,
        climate: r.climate,
        notes: r.notes,
        imageUrl: r.image_url,
      }));
      await db.insert(cropsTable).values(mapped).onConflictDoNothing({ target: cropsTable.cropId });
    })
  );

  // 2. Users
  results.push(
    await importTable("users", async () => {
      const rows = loadJson("users.json");
      if (rows.length === 0) return;
      const mapped = rows.map((r) => ({
        id: r.id,
        name: r.name,
        email: r.email,
        password: r.password,
        role: r.role,
        isVerified: r.isVerified,
        verificationCode: r.verificationCode,
        verificationExpires: r.verificationExpires ? new Date(r.verificationExpires) : null,
        createdAt: r.created_at ? new Date(r.created_at) : new Date(),
      }));
      await db.insert(userTable).values(mapped).onConflictDoNothing({ target: userTable.id });
    })
  );

  // 3. Plantation guides
  results.push(
    await importTable("plantation_guides", async () => {
      const rows = loadJson("plantation_guides.json");
      if (rows.length === 0) return;
      const mapped = rows.map((r) => ({
        guideId: r.guide_id,
        cropId: r.crop_id,
        seedPreparation: r.seed_preparation,
        plantingMethod: r.planting_method,
        irrigationSchedule: r.irrigation_schedule,
        harvestingTips: r.harvesting_tips,
        averageYield: r.average_yield,
        videoUrl: r.video_url,
        spacing: r.spacing,
        maturityPeriod: r.maturity_period,
        plantationProcess: r.plantation_process,
      }));
      await db.insert(plantationGuidesTable).values(mapped).onConflictDoNothing({ target: plantationGuidesTable.guideId });
    })
  );

  // 4. Planting calendar
  results.push(
    await importTable("planting_calendar", async () => {
      const rows = loadJson("planting_calendar.json");
      if (rows.length === 0) return;
      const mapped = rows.map((r) => ({
        calendarId: r.calendar_id,
        cropId: r.crop_id,
        region: r.region,
        season: r.season,
        sowingPeriod: r.sowing_period,
        transplantingPeriod: r.transplanting_period,
        harvestingPeriod: r.harvesting_period,
        notes: r.notes,
      }));
      await db.insert(plantingCalendarTable).values(mapped).onConflictDoNothing({ target: plantingCalendarTable.calendarId });
    })
  );

  // 5. Government schemes
  results.push(
    await importTable("government_schemes", async () => {
      const rows = loadJson("government_schemes.json");
      if (rows.length === 0) return;
      const mapped = rows.map((r) => ({
        id: r.id,
        title: r.title,
        description: r.description,
        schemeType: r.scheme_type,
        sector: r.sector,
        level: r.level,
        provinceName: r.province_name,
        districtName: r.district_name,
        localBodyType: r.local_body_type,
        localBodyName: r.local_body_name,
        regionScope: r.region_scope,
        sourceUrl: r.source_url,
        documentUrl: r.document_url,
        status: r.status,
        publishedDate: r.published_date || null,
        expiryDate: r.expiry_date || null,
        createdAt: r.created_at ? new Date(r.created_at) : new Date(),
        updatedAt: r.updated_at ? new Date(r.updated_at) : new Date(),
      }));
      await db.insert(governmentSchemesTable).values(mapped).onConflictDoNothing({ target: governmentSchemesTable.id });
    })
  );

  // 6. Scheme details
  results.push(
    await importTable("scheme_details", async () => {
      const rows = loadJson("scheme_details.json");
      if (rows.length === 0) return;
      const mapped = rows.map((r) => ({
        id: r.id,
        schemeId: r.scheme_id,
        eligibility: r.eligibility,
        benefits: r.benefits,
        applicationProcess: r.application_process,
        requiredDocuments: r.required_documents,
        usageConditions: r.usage_conditions,
      }));
      await db.insert(schemeDetailsTable).values(mapped).onConflictDoNothing({ target: schemeDetailsTable.id });
    })
  );

  // 7. Market prices
  results.push(
    await importTable("market_prices", async () => {
      const rows = loadJson("market_prices.json");
      if (rows.length === 0) return;
      const mapped = rows.map((r) => ({
        id: r.id,
        cropNameEn: r.crop_name_en,
        cropNameNe: r.crop_name_ne,
        marketNameEn: r.market_name_en,
        marketNameNe: r.market_name_ne,
        price: String(r.price),
        minPrice: String(r.min_price),
        maxPrice: String(r.max_price),
        averagePrice: String(r.average_price),
        unit: r.unit,
        priceDate: r.price_date,
        source: r.source,
        createdAt: r.created_at ? new Date(r.created_at) : new Date(),
        updatedAt: r.updated_at ? new Date(r.updated_at) : new Date(),
      }));
      await db.insert(marketPricesTable).values(mapped).onConflictDoNothing({ target: marketPricesTable.id });
    })
  );

  console.log("---");
  const passed = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;
  console.log(`Done: ${passed} table(s) succeeded, ${failed} table(s) failed.`);
  process.exit(failed > 0 ? 1 : 0);
}

run().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
