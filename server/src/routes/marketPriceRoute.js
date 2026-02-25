import express from "express";
import {
  getLatestPrices,
  getCrops,
  getPricesByCrop,
  getPriceTrends,
  getPricesByDateRange,
  getPriceStatistics,
  scrapePrices,
  deleteAllPrices,
} from "../controllers/marketPriceController.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

// All read routes: protected (farmer/user)
router.get("/", authenticate, getLatestPrices);
router.get("/crops", authenticate, getCrops);
router.get("/crops/:cropName", authenticate, getPricesByCrop);
router.get("/crops/:cropName/trends", authenticate, getPriceTrends);
router.get("/date-range", authenticate, getPricesByDateRange);
router.get("/statistics", authenticate, getPriceStatistics);

// Scrape: protected (e.g. cron or admin only - same auth for now)
router.post("/scrape", authenticate, scrapePrices);

// Delete all: protected (intended for admin only - same auth for now)
router.delete("/", authenticate, deleteAllPrices);

export default router;
