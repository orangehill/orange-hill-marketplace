# mcp-weather

A Claude Code MCP plugin for weather forecasts and geocoding, powered by the [Open-Meteo API](https://open-meteo.com/).

**No API key required.** Open-Meteo provides free weather data for non-commercial use.

## Setup

1. Install the plugin in Claude Code:
   ```bash
   claude plugin add /path/to/mcp-weather
   ```

2. Or add manually to your Claude Code MCP config:
   ```json
   {
     "mcpServers": {
       "weather": {
         "type": "stdio",
         "command": "node",
         "args": ["/path/to/mcp-weather/server.js"]
       }
     }
   }
   ```

3. Install dependencies (if not already installed):
   ```bash
   cd /path/to/mcp-weather && npm install
   ```

## Environment Variables

None required. Open-Meteo is free and does not require authentication.

## Tools

### `geocode`
Search for a location by name and get its coordinates.

**Parameters:**
- `name` (string, required) - City or location name (e.g. "London", "New York")
- `count` (number, optional) - Number of results (1-10, default 5)
- `language` (string, optional) - Result language (default "en")

**Example:** "Find the coordinates of Tokyo"

### `current_weather`
Get current weather conditions for a location.

**Parameters:**
- `latitude` (number, required) - Latitude
- `longitude` (number, required) - Longitude
- `temperature_unit` (string, optional) - "celsius" or "fahrenheit" (default "celsius")
- `wind_speed_unit` (string, optional) - "kmh", "ms", "mph", or "kn" (default "kmh")

**Returns:** Temperature, feels-like, humidity, wind speed/direction, precipitation, weather conditions.

### `daily_forecast`
Get a multi-day weather forecast.

**Parameters:**
- `latitude` (number, required) - Latitude
- `longitude` (number, required) - Longitude
- `forecast_days` (number, optional) - Days to forecast, 1-16 (default 7)
- `temperature_unit` (string, optional) - "celsius" or "fahrenheit"
- `wind_speed_unit` (string, optional) - "kmh", "ms", "mph", or "kn"

**Returns:** Daily high/low temperatures, precipitation sum and probability, max wind speed, sunrise/sunset.

### `hourly_forecast`
Get detailed hourly weather data.

**Parameters:**
- `latitude` (number, required) - Latitude
- `longitude` (number, required) - Longitude
- `forecast_days` (number, optional) - Days of hourly data, 1-16 (default 2)
- `temperature_unit` (string, optional) - "celsius" or "fahrenheit"
- `wind_speed_unit` (string, optional) - "kmh", "ms", "mph", or "kn"

**Returns:** Hourly temperature, humidity, wind, precipitation probability, and weather conditions.

## Usage Examples

Ask Claude:
- "What's the weather in Berlin right now?"
- "Give me a 5-day forecast for San Francisco"
- "What's the hourly weather for Tokyo tomorrow?"
- "Find the coordinates of Paris, then show me the current weather there in Fahrenheit"

## Testing

```bash
bash tests/test.sh
```

Runs 35 tests covering protocol handling and live API calls.

## API Reference

This plugin uses the [Open-Meteo API](https://open-meteo.com/en/docs):
- [Forecast API](https://open-meteo.com/en/docs) - Weather data
- [Geocoding API](https://open-meteo.com/en/docs/geocoding-api) - Location search

## License

MIT
