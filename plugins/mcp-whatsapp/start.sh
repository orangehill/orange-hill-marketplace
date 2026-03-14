#!/bin/bash
# Auto-install npm deps on first run, then start the MCP server.
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"
[ -d node_modules ] || npm install --silent >&2
exec node server.js
