import axios from "axios";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { ENV } from "../config/env.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const OPENWEATHER_API_KEY = ENV.OPENWEATHER_API_KEY;
const OPENWEATHER_BASE_URL = "https://api.openweathermap.org/data/2.5";

// Load alert definitions from JSON file
const alertsConfigPath = join(__dirname, "../config/alerts.json");
const alertsConfig = JSON.parse(readFileSync(alertsConfigPath, "utf8"));

/**
 * Weather Service
 * Handles all weather-related API calls and alert generation
 */
class WeatherService {
  ensureApiKeyConfigured() {
    if (!OPENWEATHER_API_KEY) {
      const err = new Error("Weather service is unavailable: OPENWEATHER_API_KEY is not configured.");
      err.statusCode = 503;
      throw err;
    }
  }

  /**
   * Get current weather by coordinates
   * @param {number} lat - Latitude
   * @param {number} lon - Longitude
   * @returns {Promise<Object>} Current weather data
   */
  async getCurrentWeatherByCoords(lat, lon) {
    try {
      this.ensureApiKeyConfigured();

      const response = await axios.get(`${OPENWEATHER_BASE_URL}/weather`, {
        params: {
          lat: lat,
          lon: lon,
          appid: OPENWEATHER_API_KEY,
          units: "metric", // Celsius
        },
      });

      return response.data;
    } catch (error) {
      if (error?.statusCode) throw error;
      throw new Error(
        `Failed to fetch current weather: ${error.response?.data?.message || error.message}`
      );
    }
  }

  /**
   * Get 5-day forecast by coordinates
   * @param {number} lat - Latitude
   * @param {number} lon - Longitude
   * @returns {Promise<Object>} Forecast data
   */
  async getForecastByCoords(lat, lon) {
    try {
      this.ensureApiKeyConfigured();

      const response = await axios.get(`${OPENWEATHER_BASE_URL}/forecast`, {
        params: {
          lat: lat,
          lon: lon,
          appid: OPENWEATHER_API_KEY,
          units: "metric",
        },
      });

      return response.data;
    } catch (error) {
      if (error?.statusCode) throw error;
      throw new Error(
        `Failed to fetch forecast: ${error.response?.data?.message || error.message}`
      );
    }
  }

  /**
   * Get One Call API data (forecast + hourly data for 48 hours)
   * @param {number} lat - Latitude
   * @param {number} lon - Longitude
   * @returns {Promise<Object>} Extended weather data
   */
  async getOneCallData(lat, lon) {
    try {
      this.ensureApiKeyConfigured();

      // Try One Call API 3.0 first (if available)
      try {
        const response = await axios.get(`https://api.openweathermap.org/data/3.0/onecall`, {
          params: {
            lat: lat,
            lon: lon,
            appid: OPENWEATHER_API_KEY,
            units: "metric",
            exclude: "minutely,alerts",
          },
        });

        return response.data;
      } catch (error) {
        // Fallback to One Call API 2.5 (legacy)
        try {
          const response = await axios.get(`https://api.openweathermap.org/data/2.5/onecall`, {
            params: {
              lat: lat,
              lon: lon,
              appid: OPENWEATHER_API_KEY,
              units: "metric",
              exclude: "minutely,alerts",
            },
          });

          return response.data;
        } catch (err2) {
          // If One Call API is not available, use forecast API and create hourly-like data
          const forecast = await this.getForecastByCoords(lat, lon);
          return this.transformForecastToHourly(forecast);
        }
      }
    } catch (error) {
      if (error?.statusCode) throw error;
      throw new Error(`Failed to fetch extended weather: ${error.message}`);
    }
  }

  /**
   * Transform forecast data to hourly format when One Call API is not available
   * @param {Object} forecastData - Forecast API response
   * @returns {Object} Transformed data with hourly and daily forecasts
   */
  transformForecastToHourly(forecastData) {
    const hourly = [];

    if (forecastData && forecastData.list) {
      forecastData.list.forEach((item) => {
        hourly.push({
          dt: item.dt,
          temp: item.main.temp,
          feels_like: item.main.feels_like,
          pressure: item.main.pressure,
          humidity: item.main.humidity,
          dew_point: item.main.temp - (100 - item.main.humidity) / 5, // Estimated dew point
          uvi: 0, // Not available in forecast API
          clouds: item.clouds.all,
          visibility: item.visibility || 10000,
          wind_speed: item.wind?.speed || 0,
          wind_deg: item.wind?.deg || 0,
          weather: item.weather,
          pop: item.pop || 0, // Probability of precipitation
          rain: item.rain || {},
          snow: item.snow || {},
        });
      });
    }

    // Generate daily forecast from hourly data
    const daily = [];
    const hourlyByDay = {};

    hourly.forEach((h) => {
      const date = new Date(h.dt * 1000);
      const dayKey = date.toDateString();

      if (!hourlyByDay[dayKey]) {
        hourlyByDay[dayKey] = [];
      }

      hourlyByDay[dayKey].push(h);
    });

    Object.keys(hourlyByDay).forEach((dayKey) => {
      const dayHours = hourlyByDay[dayKey];
      const temps = dayHours.map((h) => h.temp);

      daily.push({
        dt: dayHours[0].dt,
        temp: {
          day: dayHours[Math.floor(dayHours.length / 2)]?.temp || temps[0],
          min: Math.min(...temps),
          max: Math.max(...temps),
        },
        feels_like: {
          day: dayHours[Math.floor(dayHours.length / 2)]?.feels_like || dayHours[0].feels_like,
        },
        pressure: dayHours[0].pressure,
        humidity: dayHours[0].humidity,
        dew_point: dayHours[0].dew_point,
        wind_speed: dayHours[0].wind_speed,
        wind_deg: dayHours[0].wind_deg,
        weather: dayHours[Math.floor(dayHours.length / 2)]?.weather || dayHours[0].weather,
        clouds: dayHours[0].clouds,
        pop: Math.max(...dayHours.map((h) => h.pop)),
        rain: dayHours.find((h) => h.rain && Object.keys(h.rain).length > 0)?.rain || {},
        snow: dayHours.find((h) => h.snow && Object.keys(h.snow).length > 0)?.snow || {},
        uvi: 0,
      });
    });

    return {
      current: hourly[0] || {},
      hourly: hourly.slice(0, 48), // Next 48 hours
      daily: daily.slice(0, 8), // Next 8 days
    };
  }

  /**
   * Reverse geocode coordinates to get city/location name
   * @param {number} lat - Latitude
   * @param {number} lon - Longitude
   * @returns {Promise<string>} City/location name
   */
  async reverseGeocode(lat, lon) {
    try {
      const response = await axios.get(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&addressdetails=1`,
        {
          headers: {
            "User-Agent": "KrishiMitra/1.0", // Required by Nominatim
            "Accept-Language": "en,np", // Prefer English, fallback to Nepali
          },
        }
      );

      if (!response.data || !response.data.address) {
        return `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
      }

      const address = response.data.address;

      // Extract city name from address components
      const cityName =
        address.city || // Major city
        address.town || // Town
        address.village || // Village
        address.municipality || // Municipality
        address.county || // County
        address.state_district || // State district
        `${lat.toFixed(4)}, ${lon.toFixed(4)}`; // Fallback to coordinates

      return cityName;
    } catch (error) {
      console.error("Reverse geocoding error:", error);
      // Return formatted coordinates as fallback
      return `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
    }
  }

  /**
   * Analyze weather and generate farmer alerts
   * @param {Object} weatherData - Current weather data from OpenWeather API
   * @param {Object} forecastData - Forecast data (optional)
   * @returns {Array} Array of alert objects
   */
  generateAlerts(weatherData, forecastData = null) {
    const alerts = [];
    const current = weatherData;

    const temp = current.main.temp;
    const feelsLike = current.main.feels_like;
    const humidity = current.main.humidity;
    const windSpeed = current.wind?.speed || 0;
    const weatherMain = current.weather[0].main;
    const weatherDesc = current.weather[0].description.toLowerCase();

    // Temperature alerts
    if (temp < 5) {
      const alertConfig = alertsConfig.freeze;
      alerts.push({
        type: "freeze",
        ...alertConfig,
        recommendedActions: alertConfig.recommendedActions || [],
      });
    } else if (temp < 10) {
      const alertConfig = alertsConfig.cold;
      alerts.push({
        type: "cold",
        ...alertConfig,
        recommendedActions: alertConfig.recommendedActions || [],
      });
    }

    if (temp > 35) {
      const alertConfig = alertsConfig.heat;
      alerts.push({
        type: "heat",
        ...alertConfig,
        recommendedActions: alertConfig.recommendedActions || [],
      });
    } else if (temp > 30) {
      const alertConfig = alertsConfig.warm;
      alerts.push({
        type: "warm",
        ...alertConfig,
        recommendedActions: alertConfig.recommendedActions || [],
      });
    }

    // Rain alerts
    if (weatherMain === "Rain" || weatherDesc.includes("rain")) {
      const rainVolume = current.rain?.["1h"] || current.rain?.["3h"] || 0;

      if (rainVolume > 10) {
        const alertConfig = alertsConfig["heavy-rain"];
        alerts.push({
          type: "heavy-rain",
          ...alertConfig,
          recommendedActions: alertConfig.recommendedActions || [],
        });
      } else {
        const alertConfig = alertsConfig.rain;
        alerts.push({
          type: "rain",
          ...alertConfig,
          recommendedActions: alertConfig.recommendedActions || [],
        });
      }
    }

    // Drought risk (low humidity + high temp)
    if (humidity < 30 && temp > 25) {
      const alertConfig = alertsConfig.drought;
      alerts.push({
        type: "drought",
        ...alertConfig,
        recommendedActions: alertConfig.recommendedActions || [],
      });
    }

    // Wind alerts
    if (windSpeed > 15) {
      const alertConfig = alertsConfig.wind;
      alerts.push({
        type: "wind",
        ...alertConfig,
        recommendedActions: alertConfig.recommendedActions || [],
      });
    } else if (windSpeed > 10) {
      const alertConfig = alertsConfig["wind-moderate"];
      alerts.push({
        type: "wind-moderate",
        ...alertConfig,
        recommendedActions: alertConfig.recommendedActions || [],
      });
    }

    // Snow alert
    if (weatherMain === "Snow") {
      const alertConfig = alertsConfig.snow;
      alerts.push({
        type: "snow",
        ...alertConfig,
        recommendedActions: alertConfig.recommendedActions || [],
      });
    }

    // Forecast-based alerts
    if (forecastData && forecastData.list) {
      // Check for upcoming freezing temperatures
      const upcomingTemps = forecastData.list.slice(0, 8).map((item) => item.main.temp_min);
      const minUpcomingTemp = Math.min(...upcomingTemps);

      if (minUpcomingTemp < 5 && temp >= 5) {
        const alertConfig = alertsConfig["freeze-forecast"];
        alerts.push({
          type: "freeze-forecast",
          ...alertConfig,
          recommendedActions: alertConfig.recommendedActions || [],
        });
      }

      // Check for upcoming heavy rain
      const upcomingRain = forecastData.list.slice(0, 8).some(
        (item) => item.weather[0].main === "Rain" && (item.rain?.["3h"] || 0) > 10
      );

      if (upcomingRain) {
        const alertConfig = alertsConfig["heavy-rain-forecast"];
        alerts.push({
          type: "heavy-rain-forecast",
          ...alertConfig,
          recommendedActions: alertConfig.recommendedActions || [],
        });
      }
    }

    return alerts;
  }
}

export default new WeatherService();

