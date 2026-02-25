import axios from "axios";
import * as cheerio from "cheerio";
import { db } from "../config/db.js";
import { marketPricesTable } from "../schema/index.js";
import { eq, and } from "drizzle-orm";

const BASE_URL = "https://kalimatimarket.gov.np";
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36";
const MARKET_NAME_EN = "Kalimati Fruits and Vegetable Market";
const MARKET_NAME_NE = "कलिमाटी फलफूल तथा तरकारी बजार";
const SOURCE = "Kalimati FVM";

/**
 * Fetch HTML from Kalimati market website
 */
async function fetchPage() {
  const response = await axios.get(BASE_URL, {
    headers: {
      "User-Agent": USER_AGENT,
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9,ne;q=0.8",
    },
    timeout: 10000,
  });
  return response.data;
}

function getTodayDateStr() {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Extract numeric price from Nepali text (e.g. "रू ७०" -> 70)
 */
function extractPrice(priceText) {
  if (!priceText) return null;
  const cleaned = priceText
    .replace(/रू/g, "")
    .replace(/Rs\./gi, "")
    .replace(/Rs/gi, "")
    .replace(/,/g, "")
    .replace(/\s/g, "")
    .trim();
  const nepaliToArabic = {
    "०": "0", "१": "1", "२": "2", "३": "3", "४": "4",
    "५": "5", "६": "6", "७": "7", "८": "8", "९": "9",
  };
  let arabicNumber = "";
  for (const char of cleaned) {
    if (nepaliToArabic[char]) arabicNumber += nepaliToArabic[char];
    else if (/[0-9.]/.test(char)) arabicNumber += char;
  }
  const price = parseFloat(arabicNumber);
  if (price && price > 10000) return null;
  return Number.isNaN(price) ? null : price;
}

/**
 * Extract unit from commodity text (e.g. "गोलभेडा (के.जी.)" -> "kg")
 */
function extractUnit(commodityText) {
  const text = (commodityText || "").toLowerCase();
  if (text.includes("के.जी.") || text.includes("केजी") || text.includes("kg"))
    return "kg";
  if (text.includes("दर्जन") || text.includes("dozen")) return "dozen";
  if (text.includes("प्रति गोटा") || text.includes("piece")) return "piece";
  if (text.includes("बण्डल") || text.includes("bundle")) return "bundle";
  return "kg";
}

/**
 * Scrape market prices from Kalimati website; return array of rows matching schema
 */
export async function scrapeMarketPrices() {
  const html = await fetchPage();
  const $ = cheerio.load(html);
  const prices = [];
  const priceDateStr = getTodayDateStr();

  $("table tr, tbody tr, .table tr").each((index, element) => {
    const $row = $(element);
    const cells = $row.find("td, th");
    if (cells.length < 4) return;

    const commodityNameNepali = $(cells[0]).text().trim();
    const minPriceText = $(cells[1]).text().trim();
    const maxPriceText = $(cells[2]).text().trim();

    if (
      !commodityNameNepali ||
      commodityNameNepali.length < 2 ||
      commodityNameNepali === "कृषि उपज" ||
      commodityNameNepali === "Commodity" ||
      commodityNameNepali === "न्यूनतम" ||
      minPriceText === "न्यूनतम" ||
      minPriceText === "Minimum"
    )
      return;

    const minPrice = extractPrice(minPriceText);
    const maxPrice = extractPrice(maxPriceText);
    if (!minPrice || !maxPrice) return;

    const averagePrice =
      Math.round(((minPrice + maxPrice) / 2) * 100) / 100;
    const unit = extractUnit(commodityNameNepali);
    // Schema: cropNameEn, cropNameNe, marketNameEn, marketNameNe, price, minPrice, maxPrice, averagePrice, unit, priceDate, source
    prices.push({
      cropNameEn: commodityNameNepali,
      cropNameNe: commodityNameNepali,
      marketNameEn: MARKET_NAME_EN,
      marketNameNe: MARKET_NAME_NE,
      price: String(averagePrice),
      minPrice: String(minPrice),
      maxPrice: String(maxPrice),
      averagePrice: String(averagePrice),
      unit,
      priceDate: priceDateStr,
      source: SOURCE,
    });
  });

  if (prices.length === 0) {
    const pricePattern =
      /([^\|]+)\|रू\s*([०-९\d]+)\|रू\s*([०-९\d]+)\|रू\s*([०-९\d.]+)/g;
    const textContent = $.text();
    let match;
    while (
      (match = pricePattern.exec(textContent)) !== null &&
      prices.length < 200
    ) {
      const commodityNameNepali = match[1].trim();
      const minPrice = extractPrice(match[2]);
      const maxPrice = extractPrice(match[3]);
      if (
        minPrice &&
        maxPrice &&
        commodityNameNepali.length > 2
      ) {
        const averagePrice =
          Math.round(((minPrice + maxPrice) / 2) * 100) / 100;
        const unit = extractUnit(commodityNameNepali);
        prices.push({
          cropNameEn: commodityNameNepali,
          cropNameNe: commodityNameNepali,
          marketNameEn: MARKET_NAME_EN,
          marketNameNe: MARKET_NAME_NE,
          price: String(averagePrice),
          minPrice: String(minPrice),
          maxPrice: String(maxPrice),
          averagePrice: String(averagePrice),
          unit,
          priceDate: priceDateStr,
          source: SOURCE,
        });
      }
    }
  }

  return prices;
}

/**
 * Save scraped prices to DB (upsert by crop + market + date)
 */
export async function savePrices(prices) {
  const priceDateStr =
    prices.length > 0 ? prices[0].priceDate : getTodayDateStr();
  let saved = 0;
  const errors = [];

  for (const row of prices) {
    try {
      const existing = await db
        .select()
        .from(marketPricesTable)
        .where(
          and(
            eq(marketPricesTable.cropNameEn, row.cropNameEn),
            eq(marketPricesTable.marketNameEn, row.marketNameEn),
            eq(marketPricesTable.priceDate, priceDateStr)
          )
        )
        .limit(1);

      if (existing.length > 0) {
        await db
          .update(marketPricesTable)
          .set({
            minPrice: row.minPrice,
            maxPrice: row.maxPrice,
            averagePrice: row.averagePrice,
            price: row.price,
            unit: row.unit,
            updatedAt: new Date(),
          })
          .where(eq(marketPricesTable.id, existing[0].id));
      } else {
        await db.insert(marketPricesTable).values(row);
      }
      saved += 1;
    } catch (err) {
      errors.push({ commodity: row.cropNameEn, error: err.message });
    }
  }

  return { saved, errors };
}

/**
 * Check if we have any prices for today
 */
export async function hasTodayPrices() {
  const today = getTodayDateStr();
  const rows = await db
    .select({ id: marketPricesTable.id })
    .from(marketPricesTable)
    .where(eq(marketPricesTable.priceDate, today))
    .limit(1);
  return rows.length > 0;
}

/**
 * Scrape and save; returns { success, scraped, saved, errors, errorDetails }
 */
export async function scrapeAndSave() {
  try {
    const prices = await scrapeMarketPrices();
    if (prices.length === 0) {
      throw new Error("No prices found on the website");
    }
    const { saved, errors } = await savePrices(prices);
    return {
      success: true,
      scraped: prices.length,
      saved,
      skipped: 0,
      errors: errors.length,
      errorDetails: errors,
    };
  } catch (error) {
    console.error("Market scrape error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}
