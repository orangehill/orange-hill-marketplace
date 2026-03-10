#!/bin/bash
# test.sh -- Test suite for mcp-weather MCP server plugin
# Tests JSON-RPC protocol handling and live API calls (Open-Meteo, no key required)
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PLUGIN_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

PASS=0
FAIL=0
TOTAL=0

# Send JSON-RPC requests to the server and capture stdout
# Uses a background process + sleep to handle the server not exiting on EOF
send_request() {
    local request="$1"
    local tmpout
    tmpout=$(mktemp)

    # Start server in background, feed it the request
    printf '%s\n' "$request" | node "$PLUGIN_DIR/server.js" > "$tmpout" 2>/dev/null &
    local pid=$!

    # Wait up to 15 seconds for the process to finish
    local waited=0
    while kill -0 "$pid" 2>/dev/null && [ "$waited" -lt 15 ]; do
        sleep 1
        waited=$((waited + 1))
    done

    # Kill if still running
    kill "$pid" 2>/dev/null || true
    wait "$pid" 2>/dev/null || true

    cat "$tmpout"
    rm -f "$tmpout"
}

assert_contains() {
    local desc="$1"
    local pattern="$2"
    local actual="$3"
    TOTAL=$((TOTAL + 1))
    if printf '%s' "$actual" | grep -qF -- "$pattern"; then
        PASS=$((PASS + 1))
        echo "  PASS: $desc"
    else
        FAIL=$((FAIL + 1))
        echo "  FAIL: $desc (pattern '$pattern' not found)"
        echo "  --- actual output (first 500 chars) ---"
        printf '%s' "$actual" | head -c 500
        echo ""
        echo "  ---"
    fi
}

assert_not_contains() {
    local desc="$1"
    local pattern="$2"
    local actual="$3"
    TOTAL=$((TOTAL + 1))
    if printf '%s' "$actual" | grep -qF -- "$pattern"; then
        FAIL=$((FAIL + 1))
        echo "  FAIL: $desc (pattern '$pattern' WAS found but should not be)"
    else
        PASS=$((PASS + 1))
        echo "  PASS: $desc"
    fi
}

# Common protocol preamble
INIT_MSG='{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0"}}}'
NOTIF_MSG='{"jsonrpc":"2.0","method":"notifications/initialized"}'

# ============================================================
echo "=== MCP Protocol Tests ==="
echo ""

# Test: initialize request
echo "--- Initialize ---"
INIT_RESP=$(send_request "$INIT_MSG")

assert_contains "initialize returns jsonrpc" '"jsonrpc"' "$INIT_RESP"
assert_contains "initialize returns server info" '"serverInfo"' "$INIT_RESP"
assert_contains "initialize returns server name" '"mcp-weather"' "$INIT_RESP"

# Test: tools/list request
echo ""
echo "--- Tools List ---"
LIST_REQ="${INIT_MSG}
${NOTIF_MSG}
"'{"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}'
LIST_RESP=$(send_request "$LIST_REQ")

assert_contains "tools/list returns tools array" '"tools"' "$LIST_RESP"
assert_contains "tools/list includes geocode" '"geocode"' "$LIST_RESP"
assert_contains "tools/list includes current_weather" '"current_weather"' "$LIST_RESP"
assert_contains "tools/list includes daily_forecast" '"daily_forecast"' "$LIST_RESP"
assert_contains "tools/list includes hourly_forecast" '"hourly_forecast"' "$LIST_RESP"

# ============================================================
echo ""
echo "=== Live API Tests (Open-Meteo -- no API key needed) ==="
echo ""

# Test: geocode tool (search for Berlin)
echo "--- Geocode ---"
GEOCODE_REQ="${INIT_MSG}
${NOTIF_MSG}
"'{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"geocode","arguments":{"name":"Berlin","count":3}}}'
GEOCODE_RESP=$(send_request "$GEOCODE_REQ")

assert_contains "geocode returns result" '"result"' "$GEOCODE_RESP"
assert_contains "geocode finds Berlin" 'Berlin' "$GEOCODE_RESP"
assert_contains "geocode has coordinates" 'Coordinates' "$GEOCODE_RESP"
assert_contains "geocode shows Germany" 'Germany' "$GEOCODE_RESP"
assert_not_contains "geocode has no error" '"isError":true' "$GEOCODE_RESP"

# Test: geocode with no results
echo ""
echo "--- Geocode (no results) ---"
GEOCODE_EMPTY_REQ="${INIT_MSG}
${NOTIF_MSG}
"'{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"geocode","arguments":{"name":"xyznonexistentplace123"}}}'
GEOCODE_EMPTY_RESP=$(send_request "$GEOCODE_EMPTY_REQ")

assert_contains "geocode empty returns no locations" 'No locations found' "$GEOCODE_EMPTY_RESP"

# Test: current_weather tool (Berlin coordinates)
echo ""
echo "--- Current Weather ---"
CURRENT_REQ="${INIT_MSG}
${NOTIF_MSG}
"'{"jsonrpc":"2.0","id":4,"method":"tools/call","params":{"name":"current_weather","arguments":{"latitude":52.52,"longitude":13.41}}}'
CURRENT_RESP=$(send_request "$CURRENT_REQ")

assert_contains "current_weather returns result" '"result"' "$CURRENT_RESP"
assert_contains "current_weather has temperature" 'Temperature' "$CURRENT_RESP"
assert_contains "current_weather has humidity" 'Humidity' "$CURRENT_RESP"
assert_contains "current_weather has wind" 'Wind' "$CURRENT_RESP"
assert_contains "current_weather has conditions" 'Conditions' "$CURRENT_RESP"
assert_not_contains "current_weather has no error" '"isError":true' "$CURRENT_RESP"

# Test: current_weather with fahrenheit
echo ""
echo "--- Current Weather (Fahrenheit) ---"
CURRENT_F_REQ="${INIT_MSG}
${NOTIF_MSG}
"'{"jsonrpc":"2.0","id":5,"method":"tools/call","params":{"name":"current_weather","arguments":{"latitude":40.71,"longitude":-74.01,"temperature_unit":"fahrenheit"}}}'
CURRENT_F_RESP=$(send_request "$CURRENT_F_REQ")

assert_contains "fahrenheit returns result" '"result"' "$CURRENT_F_RESP"
assert_contains "fahrenheit shows °F" '°F' "$CURRENT_F_RESP"
assert_not_contains "fahrenheit has no error" '"isError":true' "$CURRENT_F_RESP"

# Test: daily_forecast tool
echo ""
echo "--- Daily Forecast ---"
DAILY_REQ="${INIT_MSG}
${NOTIF_MSG}
"'{"jsonrpc":"2.0","id":6,"method":"tools/call","params":{"name":"daily_forecast","arguments":{"latitude":52.52,"longitude":13.41,"forecast_days":3}}}'
DAILY_RESP=$(send_request "$DAILY_REQ")

assert_contains "daily_forecast returns result" '"result"' "$DAILY_RESP"
assert_contains "daily_forecast has forecast header" '3-day forecast' "$DAILY_RESP"
assert_contains "daily_forecast has temp range" 'Temp' "$DAILY_RESP"
assert_contains "daily_forecast has precipitation" 'Precipitation' "$DAILY_RESP"
assert_contains "daily_forecast has sunrise" 'Sunrise' "$DAILY_RESP"
assert_not_contains "daily_forecast has no error" '"isError":true' "$DAILY_RESP"

# Test: hourly_forecast tool
echo ""
echo "--- Hourly Forecast ---"
HOURLY_REQ="${INIT_MSG}
${NOTIF_MSG}
"'{"jsonrpc":"2.0","id":7,"method":"tools/call","params":{"name":"hourly_forecast","arguments":{"latitude":52.52,"longitude":13.41,"forecast_days":1}}}'
HOURLY_RESP=$(send_request "$HOURLY_REQ")

assert_contains "hourly_forecast returns result" '"result"' "$HOURLY_RESP"
assert_contains "hourly_forecast has header" 'Hourly forecast' "$HOURLY_RESP"
assert_contains "hourly_forecast has humidity data" 'humidity' "$HOURLY_RESP"
assert_contains "hourly_forecast has wind data" 'wind' "$HOURLY_RESP"
assert_not_contains "hourly_forecast has no error" '"isError":true' "$HOURLY_RESP"

# Test: invalid coordinates
echo ""
echo "--- Error Handling ---"
ERR_REQ="${INIT_MSG}
${NOTIF_MSG}
"'{"jsonrpc":"2.0","id":8,"method":"tools/call","params":{"name":"current_weather","arguments":{"latitude":999,"longitude":999}}}'
ERR_RESP=$(send_request "$ERR_REQ")

assert_contains "invalid coords returns error" '"isError"' "$ERR_RESP"

# ============================================================
echo ""
echo "==================================="
echo "Results: $PASS passed, $FAIL failed, $TOTAL total"

if [ "$FAIL" -gt 0 ]; then
    echo "SOME TESTS FAILED"
    exit 1
else
    echo "ALL TESTS PASSED"
    exit 0
fi
