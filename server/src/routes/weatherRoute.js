import express from "express";
import { authenticate } from "../middleware/auth.js";
import {
  getCurrentWeatherController,
  getForecastController,
  getExtendedWeatherController,
} from "../controllers/weatherController.js";

const router = express.Router();

/**
 * POST /api/weather/current
 * Get current weather and alerts by coordinates
 * Body: { latitude, longitude }
 * Protected route - requires authentication
 */
router.post("/current", authenticate, getCurrentWeatherController);

/**
 * GET /api/weather/forecast
 * Get 5-day forecast by coordinates
 * Query params: lat, lon
 * Protected route - requires authentication
 */
router.get("/forecast", authenticate, getForecastController);

/**
 * GET /api/weather/extended
 * Get extended weather data (hourly + daily forecast)
 * Query params: lat, lon
 * Protected route - requires authentication
 */
router.get("/extended", authenticate, getExtendedWeatherController);

export default router;

