// Mock OpenWeather-shaped data for alert tests

const baseCurrent = {
  name: "Test Location",
  sys: { country: "NP" },
  main: {
    temp: 20,
    feels_like: 19,
    humidity: 60,
    pressure: 1013,
  },
  wind: { speed: 3 },
  weather: [{ main: "Clear", description: "clear sky", id: 800 }],
  clouds: { all: 0 },
  rain: {},
};

const baseForecast = {
  list: [
    { main: { temp_min: 18, temp_max: 22 }, weather: [{ main: "Clear" }], rain: {} },
    { main: { temp_min: 17, temp_max: 21 }, weather: [{ main: "Clouds" }], rain: {} },
    { main: { temp_min: 19, temp_max: 23 }, weather: [{ main: "Clear" }], rain: {} },
    { main: { temp_min: 18, temp_max: 24 }, weather: [{ main: "Clear" }], rain: {} },
    { main: { temp_min: 20, temp_max: 25 }, weather: [{ main: "Clear" }], rain: {} },
    { main: { temp_min: 19, temp_max: 23 }, weather: [{ main: "Clear" }], rain: {} },
    { main: { temp_min: 18, temp_max: 22 }, weather: [{ main: "Clear" }], rain: {} },
    { main: { temp_min: 17, temp_max: 21 }, weather: [{ main: "Clear" }], rain: {} },
  ],
};

export function getMockWeatherForScenario(scenario) {
  const s = (scenario || "").toLowerCase().trim();

  switch (s) {
    case "freeze": {
      const current = JSON.parse(JSON.stringify(baseCurrent));
      current.main.temp = 3;
      current.main.feels_like = 0;
      current.weather[0] = { main: "Cold", description: "freezing" };
      return { current, forecast: null };
    }

    case "cold": {
      const current = JSON.parse(JSON.stringify(baseCurrent));
      current.main.temp = 8;
      current.main.feels_like = 6;
      current.weather[0] = { main: "Clouds", description: "cold" };
      return { current, forecast: null };
    }

    case "heat": {
      const current = JSON.parse(JSON.stringify(baseCurrent));
      current.main.temp = 38;
      current.main.feels_like = 40;
      current.weather[0] = { main: "Clear", description: "extreme heat" };
      return { current, forecast: null };
    }

    case "warm": {
      const current = JSON.parse(JSON.stringify(baseCurrent));
      current.main.temp = 32;
      current.main.feels_like = 33;
      current.weather[0] = { main: "Clear", description: "hot" };
      return { current, forecast: null };
    }

    case "rain": {
      const current = JSON.parse(JSON.stringify(baseCurrent));
      current.weather[0] = { main: "Rain", description: "light rain" };
      current.rain = { "1h": 2, "3h": 5 };
      return { current, forecast: null };
    }

    case "heavy-rain": {
      const current = JSON.parse(JSON.stringify(baseCurrent));
      current.weather[0] = { main: "Rain", description: "heavy rain" };
      current.rain = { "1h": 15, "3h": 25 };
      return { current, forecast: null };
    }

    case "drought": {
      const current = JSON.parse(JSON.stringify(baseCurrent));
      current.main.temp = 28;
      current.main.humidity = 25;
      current.weather[0] = { main: "Clear", description: "dry" };
      return { current, forecast: null };
    }

    case "wind": {
      const current = JSON.parse(JSON.stringify(baseCurrent));
      current.wind.speed = 18;
      return { current, forecast: null };
    }

    case "wind-moderate": {
      const current = JSON.parse(JSON.stringify(baseCurrent));
      current.wind.speed = 12; // m/s
      return { current, forecast: null };
    }

    case "snow": {
      const current = JSON.parse(JSON.stringify(baseCurrent));
      current.weather[0] = { main: "Snow", description: "snow" };
      current.main.temp = 0;
      return { current, forecast: null };
    }

    case "freeze-forecast": {
      const current = JSON.parse(JSON.stringify(baseCurrent));
      current.main.temp = 8;
      const forecast = JSON.parse(JSON.stringify(baseForecast));
      forecast.list.forEach((item) => {
        item.main.temp_min = 2;
        item.main.temp_max = 6;
      });
      return { current, forecast };
    }

    case "heavy-rain-forecast": {
      const current = JSON.parse(JSON.stringify(baseCurrent));
      const forecast = JSON.parse(JSON.stringify(baseForecast));
      forecast.list[2].weather[0].main = "Rain";
      forecast.list[2].rain = { "3h": 15 };
      return { current, forecast };
    }

    case "all": {
      // Combine multiple conditions to trigger many alerts (may not all fire due to mutually exclusive logic)
      const current = JSON.parse(JSON.stringify(baseCurrent));
      current.main.temp = 4;
      current.main.humidity = 95;
      current.wind.speed = 16;
      current.weather[0] = { main: "Rain", description: "heavy rain" };
      current.rain = { "1h": 12, "3h": 20 };
      const forecast = JSON.parse(JSON.stringify(baseForecast));
      forecast.list[0].main.temp_min = 2;
      forecast.list[1].weather[0].main = "Rain";
      forecast.list[1].rain = { "3h": 12 };
      return { current, forecast };
    }

    default:
      return { current: JSON.parse(JSON.stringify(baseCurrent)), forecast: null };
  }
}

export const SCENARIOS = [
  "freeze",
  "cold",
  "heat",
  "warm",
  "rain",
  "heavy-rain",
  "drought",
  "wind",
  "wind-moderate",
  "snow",
  "freeze-forecast",
  "heavy-rain-forecast",
  "all",
];
