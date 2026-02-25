import * as marketPriceService from "../services/marketPriceService.js";
import * as marketScraperService from "../services/marketScraperService.js";

/**
 * GET /api/market-prices - Latest prices with optional filters
 */
export async function getLatestPrices(req, res) {
  try {
    const {
      crop,
      market,
      limit = 100,
      sortBy = "priceDate",
      sortOrder = "desc",
    } = req.query;
    const prices = await marketPriceService.getLatestPrices({
      crop,
      market,
      limit,
      sortBy,
      sortOrder,
    });
    res.json({
      success: true,
      count: prices.length,
      prices,
    });
  } catch (error) {
    console.error("Error fetching market prices:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch market prices",
    });
  }
}

/**
 * GET /api/market-prices/crops - List distinct crops
 */
export async function getCrops(req, res) {
  try {
    const commodities = await marketPriceService.getCropsList();
    res.json({
      success: true,
      count: commodities.length,
      commodities,
    });
  } catch (error) {
    console.error("Error fetching crops:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch crops",
    });
  }
}

/**
 * GET /api/market-prices/crops/:cropName - Prices for one crop
 */
export async function getPricesByCrop(req, res) {
  try {
    const { cropName } = req.params;
    const { days = 30 } = req.query;
    const prices = await marketPriceService.getPricesByCrop(
      decodeURIComponent(cropName),
      days
    );
    res.json({
      success: true,
      commodity: cropName,
      count: prices.length,
      prices,
    });
  } catch (error) {
    console.error("Error fetching crop prices:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch crop prices",
    });
  }
}

/**
 * GET /api/market-prices/crops/:cropName/trends - Price trends for charts
 */
export async function getPriceTrends(req, res) {
  try {
    const { cropName } = req.params;
    const { days = 30 } = req.query;
    const trends = await marketPriceService.getPriceTrends(
      decodeURIComponent(cropName),
      days
    );
    res.json({
      success: true,
      commodity: cropName,
      period: `${days} days`,
      trends,
    });
  } catch (error) {
    console.error("Error fetching price trends:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch price trends",
    });
  }
}

/**
 * GET /api/market-prices/date-range - Prices between start and end date
 */
export async function getPricesByDateRange(req, res) {
  try {
    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "Start date and end date are required",
      });
    }
    const prices = await marketPriceService.getPricesByDateRange(
      startDate,
      endDate
    );
    res.json({
      success: true,
      startDate,
      endDate,
      count: prices.length,
      prices,
    });
  } catch (error) {
    console.error("Error fetching prices by date range:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch prices",
    });
  }
}

/**
 * GET /api/market-prices/statistics - Aggregate stats
 */
export async function getPriceStatistics(req, res) {
  try {
    const { commodity, days = 30 } = req.query;
    const statistics = await marketPriceService.getPriceStatistics(
      commodity,
      days
    );
    res.json({
      success: true,
      period: `${days} days`,
      statistics,
    });
  } catch (error) {
    console.error("Error fetching price statistics:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch price statistics",
    });
  }
}

/**
 * POST /api/market-prices/scrape - Manually trigger scrape
 */
export async function scrapePrices(req, res) {
  try {
    const result = await marketScraperService.scrapeAndSave();
    if (result.success) {
      res.json({
        success: true,
        message: "Market prices scraped successfully",
        scraped: result.scraped,
        saved: result.saved,
        skipped: result.skipped || 0,
        errors: result.errors,
        errorDetails: result.errorDetails,
      });
    } else {
      res.status(500).json({
        success: false,
        message: "Failed to scrape market prices",
        error: result.error,
      });
    }
  } catch (error) {
    console.error("Error scraping prices:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to scrape market prices",
    });
  }
}

/**
 * DELETE /api/market-prices - Delete all prices (admin)
 */
export async function deleteAllPrices(req, res) {
  try {
    const deletedCount = await marketPriceService.deleteAllPrices();
    res.json({
      success: true,
      message: "All market prices deleted successfully",
      deletedCount,
    });
  } catch (error) {
    console.error("Error deleting market prices:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to delete market prices",
    });
  }
}
