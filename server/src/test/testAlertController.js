import weatherService from "../services/weatherService.js";
import { getMockWeatherForScenario, SCENARIOS } from "./mockWeather.js";

export async function getAlertsForScenario(req, res) {
  try {
    const scenario = req.params.scenario;
    const { current, forecast } = getMockWeatherForScenario(scenario);
    const alerts = weatherService.generateAlerts(current, forecast);
    res.json({
      scenario: scenario.toLowerCase(),
      currentWeather: current,
      alerts,
      availableScenarios: SCENARIOS,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to generate test alerts",
    });
  }
}

/**
 * GET /api/test/weather-alerts
 * Returns list of available scenarios and sample response for one scenario.
 */
export async function listScenarios(req, res) {
  try {
    res.json({
      availableScenarios: SCENARIOS,
      usage: "GET /api/test/weather-alerts/:scenario",
      example: "GET /api/test/weather-alerts/freeze",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to list scenarios",
    });
  }
}

export async function getAlertsForCustomWeather(req, res) {
  try {
    const { current, forecast } = req.body || {};
    if (!current || !current.main || !current.weather) {
      return res.status(400).json({
        success: false,
        message:
          "Body must include 'current' with OpenWeather shape (main, weather, wind?, rain?). Optional 'forecast' with list array.",
      });
    }
    const alerts = weatherService.generateAlerts(current, forecast || null);
    res.json({
      custom: true,
      currentWeather: current,
      alerts,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to generate alerts from custom weather",
    });
  }
}
