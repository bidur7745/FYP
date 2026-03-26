import weatherService from "../services/weatherService.js";
import { createAlert } from "../services/alertService.js";

/**
 * Get current weather and alerts by coordinates
 * POST /api/weather/current
 * Body: { latitude, longitude }
 */
export const getCurrentWeatherController = async (req, res) => {
  try {
    const userId = req.user.id; // From authentication middleware
    const { latitude, longitude } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: "Latitude and longitude are required",
      });
    }

    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);

    // Validate coordinates
    if (isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      return res.status(400).json({
        success: false,
        message: "Invalid coordinates",
      });
    }

    // Get current weather
    const currentWeather = await weatherService.getCurrentWeatherByCoords(lat, lon);

    // Get forecast for alert generation
    let forecastData = null;
    try {
      forecastData = await weatherService.getForecastByCoords(lat, lon);
    } catch (err) {
      console.log("Forecast fetch failed, continuing without it:", err.message);
    }

    // Reverse geocode to get location name
    const locationName = await weatherService.reverseGeocode(lat, lon);

    // Generate alerts
    const alerts = weatherService.generateAlerts(currentWeather, forecastData);

    // Save alerts to database
    if (alerts.length > 0) {
      try {
        const alertPromises = alerts.map((alert) =>
          createAlert({
            userId,
            location: locationName,
            latitude: lat,
            longitude: lon,
            type: alert.type,
            severity: alert.severity,
            title: alert.title,
            message: alert.message,
            icon: alert.icon,
            recommendedActions: alert.recommendedActions || [],
            weatherData: [currentWeather], // Store as array
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
          })
        );

        await Promise.all(alertPromises);
      } catch (alertError) {
        console.error("Error saving alerts to database:", alertError);
        // Continue even if alert saving fails
      }
    }

    return res.status(200).json({
      success: true,
      weather: currentWeather,
      alerts: alerts,
      location: {
        name: locationName,
        city: currentWeather.name,
        country: currentWeather.sys?.country,
        coordinates: {
          latitude: lat,
          longitude: lon,
        },
      },
    });
  } catch (error) {
    if (error?.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }
    console.error("Error fetching weather:", error.message || error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch weather data",
    });
  }
};

/**
 * Get forecast by coordinates
 * GET /api/weather/forecast?lat=...&lon=...
 */
export const getForecastController = async (req, res) => {
  try {
    const { lat, lon } = req.query;

    if (!lat || !lon) {
      return res.status(400).json({
        success: false,
        message: "Latitude and longitude are required",
      });
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lon);

    // Validate coordinates
    if (isNaN(latitude) || isNaN(longitude) || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return res.status(400).json({
        success: false,
        message: "Invalid coordinates",
      });
    }

    const forecastData = await weatherService.getForecastByCoords(latitude, longitude);

    return res.status(200).json({
      success: true,
      forecast: forecastData,
    });
  } catch (error) {
    if (error?.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }
    console.error("Error fetching forecast:", error.message || error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch forecast data",
    });
  }
};

/**
 * Get extended weather data (historical + forecast + hourly)
 * GET /api/weather/extended?lat=...&lon=...
 */
export const getExtendedWeatherController = async (req, res) => {
  try {
    const { lat, lon } = req.query;

    if (!lat || !lon) {
      return res.status(400).json({
        success: false,
        message: "Latitude and longitude are required",
      });
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lon);

    // Validate coordinates
    if (isNaN(latitude) || isNaN(longitude) || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return res.status(400).json({
        success: false,
        message: "Invalid coordinates",
      });
    }

    // Get One Call API data (hourly + daily forecast)
    const oneCallData = await weatherService.getOneCallData(latitude, longitude);

    return res.status(200).json({
      success: true,
      hourly: oneCallData.hourly || [],
      daily: oneCallData.daily || [],
      current: oneCallData.current || {},
    });
  } catch (error) {
    if (error?.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }
    console.error("Error fetching extended weather:", error.message || error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch extended weather data",
    });
  }
};

