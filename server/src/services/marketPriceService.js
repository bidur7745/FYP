import { db } from "../config/db.js";
import { marketPricesTable } from "../schema/index.js";
import { eq, and, gte, lte, desc, asc, ilike, sql } from "drizzle-orm";

/**
 * Get latest market prices with optional filters
 */
export async function getLatestPrices(filters = {}) {
  const {
    crop,
    market,
    limit = 100,
    sortBy = "priceDate",
    sortOrder = "desc",
  } = filters;
  const conditions = [];
  if (crop) {
    conditions.push(
      sql`(${marketPricesTable.cropNameEn} ILIKE ${"%" + crop + "%"} OR ${marketPricesTable.cropNameNe} ILIKE ${"%" + crop + "%"})`
    );
  }
  if (market) {
    conditions.push(
      ilike(marketPricesTable.marketNameEn, "%" + market + "%")
    );
  }
  const orderColumn =
    marketPricesTable[sortBy] || marketPricesTable.priceDate;
  let query = db
    .select()
    .from(marketPricesTable)
    .orderBy(
      sortOrder === "desc" ? desc(orderColumn) : asc(orderColumn)
    )
    .limit(Number(limit));
  if (conditions.length > 0) {
    query = query.where(and(...conditions));
  }
  return await query;
}

/**
 * Get prices for a specific crop over the last N days
 */
export async function getPricesByCrop(cropName, days = 30) {
  const start = new Date();
  start.setDate(start.getDate() - Number(days));
  const startStr = start.toISOString().slice(0, 10);
  return await db
    .select()
    .from(marketPricesTable)
    .where(
      and(
        sql`(${marketPricesTable.cropNameEn} ILIKE ${"%" + cropName + "%"} OR ${marketPricesTable.cropNameNe} ILIKE ${"%" + cropName + "%"})`,
        gte(marketPricesTable.priceDate, startStr)
      )
    )
    .orderBy(desc(marketPricesTable.priceDate));
}

/**
 * Get price trends for a crop (for charts)
 */
export async function getPriceTrends(cropName, days = 30) {
  const start = new Date();
  start.setDate(start.getDate() - Number(days));
  const startStr = start.toISOString().slice(0, 10);
  return await db
    .select({
      priceDate: marketPricesTable.priceDate,
      minPrice: marketPricesTable.minPrice,
      maxPrice: marketPricesTable.maxPrice,
      averagePrice: marketPricesTable.averagePrice,
    })
    .from(marketPricesTable)
    .where(
      and(
        sql`(${marketPricesTable.cropNameEn} ILIKE ${"%" + cropName + "%"} OR ${marketPricesTable.cropNameNe} ILIKE ${"%" + cropName + "%"})`,
        gte(marketPricesTable.priceDate, startStr)
      )
    )
    .orderBy(asc(marketPricesTable.priceDate));
}

/**
 * Get distinct crop names (for dropdowns)
 */
export async function getCropsList() {
  const rows = await db
    .selectDistinct({ cropNameEn: marketPricesTable.cropNameEn })
    .from(marketPricesTable)
    .orderBy(marketPricesTable.cropNameEn);
  return rows.map((r) => r.cropNameEn).filter(Boolean);
}

/**
 * Get prices within a date range
 */
export async function getPricesByDateRange(startDate, endDate) {
  const startStr = new Date(startDate).toISOString().slice(0, 10);
  const endStr = new Date(endDate).toISOString().slice(0, 10);
  return await db
    .select()
    .from(marketPricesTable)
    .where(
      and(
        gte(marketPricesTable.priceDate, startStr),
        lte(marketPricesTable.priceDate, endStr)
      )
    )
    .orderBy(desc(marketPricesTable.priceDate), marketPricesTable.cropNameEn);
}

/**
 * Get price statistics (min/max/avg over period)
 */
export async function getPriceStatistics(cropName, days = 30) {
  const start = new Date();
  start.setDate(start.getDate() - Number(days));
  const startStr = start.toISOString().slice(0, 10);
  const conditions = [gte(marketPricesTable.priceDate, startStr)];
  if (cropName) {
    conditions.push(
      sql`(${marketPricesTable.cropNameEn} ILIKE ${"%" + cropName + "%"} OR ${marketPricesTable.cropNameNe} ILIKE ${"%" + cropName + "%"})`
    );
  }
  const prices = await db
    .select()
    .from(marketPricesTable)
    .where(and(...conditions));
  if (prices.length === 0) {
    return null;
  }
  const avgPrices = prices.map((p) => Number(p.averagePrice));
  const minPrices = prices.map((p) => Number(p.minPrice));
  const maxPrices = prices.map((p) => Number(p.maxPrice));
  return {
    totalRecords: prices.length,
    averagePrice: {
      min: Math.min(...avgPrices),
      max: Math.max(...avgPrices),
      avg: avgPrices.reduce((a, b) => a + b, 0) / avgPrices.length,
    },
    minPrice: {
      min: Math.min(...minPrices),
      max: Math.max(...minPrices),
      avg: minPrices.reduce((a, b) => a + b, 0) / minPrices.length,
    },
    maxPrice: {
      min: Math.min(...maxPrices),
      max: Math.max(...maxPrices),
      avg: maxPrices.reduce((a, b) => a + b, 0) / maxPrices.length,
    },
  };
}

/**
 * Delete all market prices (admin)
 */
export async function deleteAllPrices() {
  const count = await db
    .select({ count: sql`count(*)` })
    .from(marketPricesTable);
  const total = Number(count[0]?.count ?? 0);
  await db.delete(marketPricesTable);
  return total;
}
