import { Router } from "express";
import {
  getAlertsForScenario,
  listScenarios,
  getAlertsForCustomWeather,
} from "./testAlertController.js";

const router = Router();

router.get("/weather-alerts", listScenarios);
router.get("/weather-alerts/:scenario", getAlertsForScenario);
router.post("/weather-alerts", getAlertsForCustomWeather);

export default router;
