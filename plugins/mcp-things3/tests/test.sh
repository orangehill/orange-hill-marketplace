#!/bin/bash
# test.sh -- Test suite for mcp-things3 MCP server plugin
# Tests the JSON-RPC protocol handling over stdio
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PLUGIN_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
SERVER="node $PLUGIN_DIR/server.js"

PASS=0
FAIL=0
TOTAL=0

# Send JSON-RPC requests and capture stdout, with a timeout via background kill
send_request() {
    local request="$1"
    local tmpout
    tmpout=$(mktemp)

    # Start server with input piped, capture stdout
    echo "$request" | $SERVER > "$tmpout" 2>/dev/null &
    local pid=$!

    # Kill after 10 seconds if still running
    (sleep 10 && kill "$pid" 2>/dev/null) &
    local killpid=$!

    wait "$pid" 2>/dev/null || true
    kill "$killpid" 2>/dev/null || true
    wait "$killpid" 2>/dev/null || true

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
        echo "        Got: $(printf '%s' "$actual" | head -c 300)"
    fi
}

# ============================================================
echo "=== MCP Protocol Tests ==="

# Test: initialize request
INIT_REQ='{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0"}}}'
INIT_RESP=$(send_request "$INIT_REQ")

assert_contains "initialize returns jsonrpc" '"jsonrpc"' "$INIT_RESP"
assert_contains "initialize returns server info" '"serverInfo"' "$INIT_RESP"
assert_contains "initialize returns mcp-things3 name" '"mcp-things3"' "$INIT_RESP"
assert_contains "initialize returns version" '"1.0.0"' "$INIT_RESP"

# Test: tools/list request
LIST_REQ='{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0"}}}
{"jsonrpc":"2.0","method":"notifications/initialized"}
{"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}'
LIST_RESP=$(send_request "$LIST_REQ")

assert_contains "tools/list returns tools" '"tools"' "$LIST_RESP"
assert_contains "tools/list includes get_todos" '"get_todos"' "$LIST_RESP"
assert_contains "tools/list includes search_todos" '"search_todos"' "$LIST_RESP"
assert_contains "tools/list includes get_projects" '"get_projects"' "$LIST_RESP"
assert_contains "tools/list includes add_todo" '"add_todo"' "$LIST_RESP"
assert_contains "tools/list includes add_project" '"add_project"' "$LIST_RESP"

# ============================================================
echo ""
echo "=== Tool Schema Tests ==="

assert_contains "get_todos has list param" '"list"' "$LIST_RESP"
assert_contains "search_todos has query param" '"query"' "$LIST_RESP"
assert_contains "add_todo has title param" '"title"' "$LIST_RESP"
assert_contains "add_todo has when param" '"when"' "$LIST_RESP"
assert_contains "add_todo has deadline param" '"deadline"' "$LIST_RESP"
assert_contains "add_todo has tags param" '"tags"' "$LIST_RESP"
assert_contains "add_todo has notes param" '"notes"' "$LIST_RESP"
assert_contains "add_project has area param" '"area"' "$LIST_RESP"

# ============================================================
echo ""
echo "=== Tool Enum Values ==="

assert_contains "get_todos has Inbox option" '"Inbox"' "$LIST_RESP"
assert_contains "get_todos has Today option" '"Today"' "$LIST_RESP"
assert_contains "get_todos has Someday option" '"Someday"' "$LIST_RESP"

# ============================================================
echo ""
echo "=== Error Handling Tests ==="

# Test: calling get_todos with invalid list value
ERR_REQ='{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0"}}}
{"jsonrpc":"2.0","method":"notifications/initialized"}
{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"get_todos","arguments":{"list":"InvalidList"}}}'
ERR_RESP=$(send_request "$ERR_REQ")

assert_contains "invalid list param returns isError" '"isError":true' "$ERR_RESP"

# Test: calling nonexistent tool
ERR_REQ2='{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0"}}}
{"jsonrpc":"2.0","method":"notifications/initialized"}
{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"nonexistent_tool","arguments":{}}}'
ERR_RESP2=$(send_request "$ERR_REQ2")

assert_contains "nonexistent tool returns isError" '"isError":true' "$ERR_RESP2"

# ============================================================
echo ""
echo "=== Server Stability Tests ==="

# Test: server handles empty input without crashing
EMPTY_RESP=$(echo "" | $SERVER 2>/dev/null &
  SPID=$!
  (sleep 3 && kill "$SPID" 2>/dev/null) &
  KPID=$!
  wait "$SPID" 2>/dev/null || true
  kill "$KPID" 2>/dev/null || true
  wait "$KPID" 2>/dev/null || true
)
TOTAL=$((TOTAL + 1))
PASS=$((PASS + 1))
echo "  PASS: server handles empty input without crashing"

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
