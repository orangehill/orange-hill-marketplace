#!/usr/bin/env node
/**
 * MCP Server: mcp-weather
 * Weather forecasts and geocoding via Open-Meteo API (free, no API key required)
 *
 * Uses stdio transport (JSON-RPC over stdin/stdout).
 * IMPORTANT: Never use console.log() -- it corrupts the JSON-RPC stream.
 * Use console.error() for debug logging.
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const server = new McpServer({
  name: "mcp-weather",
  version: "1.0.0",
});

// --- WMO Weather Code descriptions ---
const WMO_CODES = {
  0: "Clear sky",
  1: "Mainly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Foggy",
  48: "Depositing rime fog",
  51: "Light drizzle",
  53: "Moderate drizzle",
  55: "Dense drizzle",
  56: "Light freezing drizzle",
  57: "Dense freezing drizzle",
  61: "Slight rain",
  63: "Moderate rain",
  65: "Heavy rain",
  66: "Light freezing rain",
  67: "Heavy freezing rain",
  71: "Slight snowfall",
  73: "Moderate snowfall",
  75: "Heavy snowfall",
  77: "Snow grains",
  80: "Slight rain showers",
  81: "Moderate rain showers",
  82: "Violent rain showers",
  85: "Slight snow showers",
  86: "Heavy snow showers",
  95: "Thunderstorm",
  96: "Thunderstorm with slight hail",
  99: "Thunderstorm with heavy hail",
};

function describeWeatherCode(code) {
  return WMO_CODES[code] || `Unknown (code ${code})`;
}

// --- Helper functions ---

async function apiRequest(baseUrl, params = {}) {
  const url = new URL(baseUrl);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  }

  const response = await fetch(url.toString(), {
    headers: {
      Accept: "application/json",
      "User-Agent": "mcp-weather/1.0",
    },
  });

  const data = await response.json();

  if (!response.ok || data.error) {
    throw new Error(data.reason || `API error: ${response.status} ${response.statusText}`);
  }

  return data;
}

function formatCurrentWeather(data) {
  const c = data.current;
  const units = data.current_units;
  const lines = [
    `Weather at ${data.latitude}°N, ${data.longitude}°E (elevation: ${data.elevation}m)`,
    `Timezone: ${data.timezone}`,
    `Time: ${c.time}`,
    ``,
    `Conditions: ${describeWeatherCode(c.weather_code)}`,
    `Temperature: ${c.temperature_2m}${units.temperature_2m}`,
    `Feels like: ${c.apparent_temperature}${units.apparent_temperature}`,
    `Humidity: ${c.relative_humidity_2m}${units.relative_humidity_2m}`,
    `Wind: ${c.wind_speed_10m}${units.wind_speed_10m} from ${c.wind_direction_10m}°`,
    `Precipitation: ${c.precipitation}${units.precipitation}`,
  ];
  return lines.join("\n");
}

function formatDailyForecast(data) {
  const d = data.daily;
  const units = data.daily_units;
  const lines = [
    `${data.forecast_days || d.time.length}-day forecast for ${data.latitude}°N, ${data.longitude}°E`,
    `Timezone: ${data.timezone}`,
    ``,
  ];

  for (let i = 0; i < d.time.length; i++) {
    lines.push(`${d.time[i]}:`);
    lines.push(`  ${describeWeatherCode(d.weather_code[i])}`);
    lines.push(`  Temp: ${d.temperature_2m_min[i]}${units.temperature_2m_min} – ${d.temperature_2m_max[i]}${units.temperature_2m_max}`);
    lines.push(`  Precipitation: ${d.precipitation_sum[i]}${units.precipitation_sum} (${d.precipitation_probability_max[i]}% chance)`);
    lines.push(`  Wind: up to ${d.wind_speed_10m_max[i]}${units.wind_speed_10m_max}`);
    lines.push(`  Sunrise: ${d.sunrise[i]}  Sunset: ${d.sunset[i]}`);
    lines.push(``);
  }
  return lines.join("\n");
}

function formatHourlyForecast(data) {
  const h = data.hourly;
  const units = data.hourly_units;
  const lines = [
    `Hourly forecast for ${data.latitude}°N, ${data.longitude}°E`,
    `Timezone: ${data.timezone}`,
    ``,
  ];

  for (let i = 0; i < h.time.length; i++) {
    lines.push(
      `${h.time[i]}: ${describeWeatherCode(h.weather_code[i])}, ` +
      `${h.temperature_2m[i]}${units.temperature_2m}, ` +
      `humidity ${h.relative_humidity_2m[i]}${units.relative_humidity_2m}, ` +
      `wind ${h.wind_speed_10m[i]}${units.wind_speed_10m}, ` +
      `precip ${h.precipitation[i]}${units.precipitation} (${h.precipitation_probability[i]}%)`
    );
  }
  return lines.join("\n");
}

// --- Register tools ---

server.registerTool(
  "geocode",
  {
    description: "Search for a location by name and get its coordinates. Use this to find latitude/longitude before calling weather tools.",
    inputSchema: {
      name: z.string().describe("City or location name to search for (e.g. 'London', 'New York', 'Tokyo')"),
      count: z.number().optional().default(5).describe("Number of results to return (1-10, default 5)"),
      language: z.string().optional().default("en").describe("Language for results (e.g. 'en', 'de', 'fr')"),
    },
  },
  async ({ name, count, language }) => {
    try {
      const data = await apiRequest("https://geocoding-api.open-meteo.com/v1/search", {
        name,
        count: Math.min(count || 5, 10),
        language: language || "en",
        format: "json",
      });

      if (!data.results || data.results.length === 0) {
        return {
          content: [{ type: "text", text: `No locations found for "${name}".` }],
        };
      }

      const lines = [`Locations matching "${name}":\n`];
      for (const r of data.results) {
        const parts = [r.name];
        if (r.admin1) parts.push(r.admin1);
        if (r.country) parts.push(r.country);
        lines.push(`- ${parts.join(", ")}`);
        lines.push(`  Coordinates: ${r.latitude}, ${r.longitude}`);
        lines.push(`  Elevation: ${r.elevation}m | Timezone: ${r.timezone}`);
        if (r.population) lines.push(`  Population: ${r.population.toLocaleString()}`);
        lines.push(``);
      }

      return {
        content: [{ type: "text", text: lines.join("\n") }],
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: `Error: ${error.message}` }],
        isError: true,
      };
    }
  }
);

server.registerTool(
  "current_weather",
  {
    description: "Get current weather conditions for a location. Provides temperature, humidity, wind, precipitation, and weather description.",
    inputSchema: {
      latitude: z.number().describe("Latitude of the location (e.g. 52.52 for Berlin)"),
      longitude: z.number().describe("Longitude of the location (e.g. 13.41 for Berlin)"),
      temperature_unit: z.enum(["celsius", "fahrenheit"]).optional().default("celsius").describe("Temperature unit"),
      wind_speed_unit: z.enum(["kmh", "ms", "mph", "kn"]).optional().default("kmh").describe("Wind speed unit"),
    },
  },
  async ({ latitude, longitude, temperature_unit, wind_speed_unit }) => {
    try {
      const data = await apiRequest("https://api.open-meteo.com/v1/forecast", {
        latitude,
        longitude,
        current: "temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,wind_direction_10m",
        temperature_unit: temperature_unit || "celsius",
        wind_speed_unit: wind_speed_unit || "kmh",
        timezone: "auto",
      });

      return {
        content: [{ type: "text", text: formatCurrentWeather(data) }],
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: `Error: ${error.message}` }],
        isError: true,
      };
    }
  }
);

server.registerTool(
  "daily_forecast",
  {
    description: "Get a daily weather forecast for a location. Provides high/low temperatures, precipitation, wind, sunrise/sunset for each day.",
    inputSchema: {
      latitude: z.number().describe("Latitude of the location"),
      longitude: z.number().describe("Longitude of the location"),
      forecast_days: z.number().optional().default(7).describe("Number of forecast days (1-16, default 7)"),
      temperature_unit: z.enum(["celsius", "fahrenheit"]).optional().default("celsius").describe("Temperature unit"),
      wind_speed_unit: z.enum(["kmh", "ms", "mph", "kn"]).optional().default("kmh").describe("Wind speed unit"),
    },
  },
  async ({ latitude, longitude, forecast_days, temperature_unit, wind_speed_unit }) => {
    try {
      const days = Math.min(Math.max(forecast_days || 7, 1), 16);
      const data = await apiRequest("https://api.open-meteo.com/v1/forecast", {
        latitude,
        longitude,
        daily: "weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,wind_speed_10m_max,sunrise,sunset",
        temperature_unit: temperature_unit || "celsius",
        wind_speed_unit: wind_speed_unit || "kmh",
        timezone: "auto",
        forecast_days: days,
      });

      data.forecast_days = days;
      return {
        content: [{ type: "text", text: formatDailyForecast(data) }],
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: `Error: ${error.message}` }],
        isError: true,
      };
    }
  }
);

server.registerTool(
  "hourly_forecast",
  {
    description: "Get an hourly weather forecast for a location. Provides temperature, humidity, wind, precipitation, and weather conditions for each hour.",
    inputSchema: {
      latitude: z.number().describe("Latitude of the location"),
      longitude: z.number().describe("Longitude of the location"),
      forecast_days: z.number().optional().default(2).describe("Number of forecast days for hourly data (1-16, default 2)"),
      temperature_unit: z.enum(["celsius", "fahrenheit"]).optional().default("celsius").describe("Temperature unit"),
      wind_speed_unit: z.enum(["kmh", "ms", "mph", "kn"]).optional().default("kmh").describe("Wind speed unit"),
    },
  },
  async ({ latitude, longitude, forecast_days, temperature_unit, wind_speed_unit }) => {
    try {
      const days = Math.min(Math.max(forecast_days || 2, 1), 16);
      const data = await apiRequest("https://api.open-meteo.com/v1/forecast", {
        latitude,
        longitude,
        hourly: "temperature_2m,relative_humidity_2m,precipitation_probability,precipitation,weather_code,wind_speed_10m",
        temperature_unit: temperature_unit || "celsius",
        wind_speed_unit: wind_speed_unit || "kmh",
        timezone: "auto",
        forecast_days: days,
      });

      return {
        content: [{ type: "text", text: formatHourlyForecast(data) }],
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: `Error: ${error.message}` }],
        isError: true,
      };
    }
  }
);

// --- Start server ---
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("MCP server mcp-weather running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
