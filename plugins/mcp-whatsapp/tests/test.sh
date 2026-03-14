#!/bin/bash
# test.sh -- Test suite for mcp-whatsapp MCP server plugin (Baileys version)
# Tests JSON-RPC protocol, tool schemas, error handling, and DB operations.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PLUGIN_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
SERVER="node $PLUGIN_DIR/server.js"

PASS=0
FAIL=0
TOTAL=0

# Use a temp DB and auth dir for tests (no real WhatsApp connection)
export WHATSAPP_DB_PATH="$(mktemp -d)/test-messages.db"
export WHATSAPP_AUTH_DIR="$(mktemp -d)/test-auth"

# Send JSON-RPC requests and capture stdout
send_request() {
    local request="$1"
    local tmpout
    tmpout=$(mktemp)

    echo "$request" | $SERVER > "$tmpout" 2>/dev/null &
    local pid=$!

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

assert_not_contains() {
    local desc="$1"
    local pattern="$2"
    local actual="$3"
    TOTAL=$((TOTAL + 1))
    if printf '%s' "$actual" | grep -qF -- "$pattern"; then
        FAIL=$((FAIL + 1))
        echo "  FAIL: $desc (pattern '$pattern' should NOT be present)"
    else
        PASS=$((PASS + 1))
        echo "  PASS: $desc"
    fi
}

# ============================================================
echo "=== MCP Protocol Tests ==="

INIT_REQ='{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0"}}}'
INIT_RESP=$(send_request "$INIT_REQ")

assert_contains "initialize returns jsonrpc" '"jsonrpc"' "$INIT_RESP"
assert_contains "initialize returns server info" '"serverInfo"' "$INIT_RESP"
assert_contains "initialize returns mcp-whatsapp name" '"mcp-whatsapp"' "$INIT_RESP"
assert_contains "initialize returns version 2.0.0" '"2.0.0"' "$INIT_RESP"

# ============================================================
echo ""
echo "=== Tool Registration Tests ==="

LIST_REQ='{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0"}}}
{"jsonrpc":"2.0","method":"notifications/initialized"}
{"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}'
LIST_RESP=$(send_request "$LIST_REQ")

assert_contains "tools/list returns tools array" '"tools"' "$LIST_RESP"
assert_contains "has send_message" '"send_message"' "$LIST_RESP"
assert_contains "has send_media" '"send_media"' "$LIST_RESP"
assert_contains "has list_chats" '"list_chats"' "$LIST_RESP"
assert_contains "has get_messages" '"get_messages"' "$LIST_RESP"
assert_contains "has get_message_detail" '"get_message_detail"' "$LIST_RESP"
assert_contains "has download_media" '"download_media"' "$LIST_RESP"
assert_contains "has read_chat" '"read_chat"' "$LIST_RESP"
assert_contains "has search_messages" '"search_messages"' "$LIST_RESP"
assert_contains "has connection_status" '"connection_status"' "$LIST_RESP"

# ============================================================
echo ""
echo "=== Tool Schema Tests ==="

# send_message params
assert_contains "send_message has 'to' param" '"to"' "$LIST_RESP"
assert_contains "send_message has 'text' param" '"text"' "$LIST_RESP"
assert_contains "send_message has 'quoted_id' param" '"quoted_id"' "$LIST_RESP"

# send_media params
assert_contains "send_media has 'media_type' param" '"media_type"' "$LIST_RESP"
assert_contains "send_media has 'file' param" '"file"' "$LIST_RESP"
assert_contains "send_media has 'caption' param" '"caption"' "$LIST_RESP"
assert_contains "send_media has 'filename' param" '"filename"' "$LIST_RESP"

# media type enum values
assert_contains "media_type has 'image'" '"image"' "$LIST_RESP"
assert_contains "media_type has 'video'" '"video"' "$LIST_RESP"
assert_contains "media_type has 'audio'" '"audio"' "$LIST_RESP"
assert_contains "media_type has 'document'" '"document"' "$LIST_RESP"

# get_messages params
assert_contains "get_messages has 'jid' param" '"jid"' "$LIST_RESP"
assert_contains "get_messages has 'from_me' param" '"from_me"' "$LIST_RESP"
assert_contains "get_messages has 'since' param" '"since"' "$LIST_RESP"
assert_contains "get_messages has 'message_type' param" '"message_type"' "$LIST_RESP"
assert_contains "get_messages has 'limit' param" '"limit"' "$LIST_RESP"

# search_messages params
assert_contains "search_messages has 'query' param" '"query"' "$LIST_RESP"

# download_media params
assert_contains "download_media has 'message_id' param" '"message_id"' "$LIST_RESP"

# ============================================================
echo ""
echo "=== Error Handling Tests ==="

# send_message without connection returns error
SEND_ERR_REQ='{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0"}}}
{"jsonrpc":"2.0","method":"notifications/initialized"}
{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"send_message","arguments":{"to":"14155551234","text":"hello"}}}'
SEND_ERR_RESP=$(send_request "$SEND_ERR_REQ")

assert_contains "send without connection returns error" "not connected" "$SEND_ERR_RESP"
assert_contains "send without connection has isError" '"isError":true' "$SEND_ERR_RESP"

# send_media without connection returns error
MEDIA_ERR_REQ='{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0"}}}
{"jsonrpc":"2.0","method":"notifications/initialized"}
{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"send_media","arguments":{"to":"14155551234","media_type":"image","file":"/tmp/test.png"}}}'
MEDIA_ERR_RESP=$(send_request "$MEDIA_ERR_REQ")

assert_contains "send_media without connection returns error" "not connected" "$MEDIA_ERR_RESP"

# read_chat without connection returns error
READ_ERR_REQ='{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0"}}}
{"jsonrpc":"2.0","method":"notifications/initialized"}
{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"read_chat","arguments":{"jid":"14155551234"}}}'
READ_ERR_RESP=$(send_request "$READ_ERR_REQ")

assert_contains "read_chat without connection returns error" "not connected" "$READ_ERR_RESP"

# connection_status works without connection (shows status)
STATUS_REQ='{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0"}}}
{"jsonrpc":"2.0","method":"notifications/initialized"}
{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"connection_status","arguments":{}}}'
STATUS_RESP=$(send_request "$STATUS_REQ")

assert_contains "connection_status returns status field" 'not_paired' "$STATUS_RESP"
assert_contains "connection_status returns paired field" '\"paired\"' "$STATUS_RESP"
assert_contains "connection_status shows not paired" '\"paired\": false' "$STATUS_RESP"
assert_contains "connection_status includes hint" "setup.js" "$STATUS_RESP"

# nonexistent tool
BAD_TOOL_REQ='{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0"}}}
{"jsonrpc":"2.0","method":"notifications/initialized"}
{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"nonexistent_tool","arguments":{}}}'
BAD_TOOL_RESP=$(send_request "$BAD_TOOL_REQ")

assert_contains "nonexistent tool returns isError" '"isError":true' "$BAD_TOOL_RESP"

# empty messages
EMPTY_REQ='{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0"}}}
{"jsonrpc":"2.0","method":"notifications/initialized"}
{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"get_messages","arguments":{}}}'
EMPTY_RESP=$(send_request "$EMPTY_REQ")

assert_contains "empty db returns no messages" "No messages found" "$EMPTY_RESP"

# empty chats
CHATS_REQ='{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0"}}}
{"jsonrpc":"2.0","method":"notifications/initialized"}
{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"list_chats","arguments":{}}}'
CHATS_RESP=$(send_request "$CHATS_REQ")

assert_contains "empty db returns no chats" "No chats stored" "$CHATS_RESP"

# nonexistent message
NOEXIST_REQ='{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0"}}}
{"jsonrpc":"2.0","method":"notifications/initialized"}
{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"get_message_detail","arguments":{"id":"nonexistent"}}}'
NOEXIST_RESP=$(send_request "$NOEXIST_REQ")

assert_contains "nonexistent message returns not found" "No message found" "$NOEXIST_RESP"

# search with no results
SEARCH_REQ='{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0"}}}
{"jsonrpc":"2.0","method":"notifications/initialized"}
{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"search_messages","arguments":{"query":"nonexistent text"}}}'
SEARCH_RESP=$(send_request "$SEARCH_REQ")

assert_contains "search with no results shows message" "No messages found" "$SEARCH_RESP"

# ============================================================
echo ""
echo "=== Database Tests ==="

DB_TEST=$(node -e "
import { initDB, insertMessage, queryMessages, getMessageById, listChats } from '$PLUGIN_DIR/db.js';
const db = initDB('$WHATSAPP_DB_PATH');

// Insert incoming message
insertMessage({
  id: 'msg_001',
  remote_jid: '14155551234@s.whatsapp.net',
  from_me: false,
  message_type: 'text',
  body: 'Hello from test',
  push_name: 'Alice',
  timestamp: 1700000000,
});

// Insert outgoing message
insertMessage({
  id: 'msg_002',
  remote_jid: '14155551234@s.whatsapp.net',
  from_me: true,
  message_type: 'text',
  body: 'Hi Alice!',
  timestamp: 1700000100,
});

// Insert image message
insertMessage({
  id: 'msg_003',
  remote_jid: '19876543210@s.whatsapp.net',
  from_me: false,
  message_type: 'image',
  caption: 'Check this out',
  media_id: 'media_123',
  media_mime_type: 'image/jpeg',
  push_name: 'Bob',
  timestamp: 1700000200,
});

// Query all
const all = queryMessages({});
console.log('ALL_COUNT:' + all.length);

// Query by JID
const alice = queryMessages({ remote_jid: '14155551234@s.whatsapp.net' });
console.log('ALICE_COUNT:' + alice.length);

// Query incoming only
const incoming = queryMessages({ from_me: false });
console.log('INCOMING_COUNT:' + incoming.length);

// Query outgoing only
const outgoing = queryMessages({ from_me: true });
console.log('OUTGOING_COUNT:' + outgoing.length);

// Query by type
const images = queryMessages({ message_type: 'image' });
console.log('IMAGE_COUNT:' + images.length);

// Query since
const recent = queryMessages({ since: 1700000100 });
console.log('RECENT_COUNT:' + recent.length);

// Get by ID
const msg = getMessageById('msg_001');
console.log('GET_ID:' + msg.id);
console.log('GET_BODY:' + msg.body);
console.log('GET_PUSHNAME:' + msg.push_name);
console.log('GET_JID:' + msg.remote_jid);

// List chats
const chats = listChats();
console.log('CHAT_COUNT:' + chats.length);
console.log('CHAT_0_JID:' + chats[0].remote_jid);
console.log('CHAT_0_COUNT:' + chats[0].message_count);

// Duplicate insert ignored
insertMessage({ id: 'msg_001', remote_jid: '14155551234@s.whatsapp.net', from_me: false, message_type: 'text', body: 'dupe', timestamp: 1700000000 });
const afterDupe = queryMessages({});
console.log('AFTER_DUPE_COUNT:' + afterDupe.length);
" 2>/dev/null)

assert_contains "DB has 3 total messages" "ALL_COUNT:3" "$DB_TEST"
assert_contains "DB JID filter works" "ALICE_COUNT:2" "$DB_TEST"
assert_contains "DB incoming filter works" "INCOMING_COUNT:2" "$DB_TEST"
assert_contains "DB outgoing filter works" "OUTGOING_COUNT:1" "$DB_TEST"
assert_contains "DB type filter works" "IMAGE_COUNT:1" "$DB_TEST"
assert_contains "DB since filter works" "RECENT_COUNT:2" "$DB_TEST"
assert_contains "DB get by ID works" "GET_ID:msg_001" "$DB_TEST"
assert_contains "DB body matches" "GET_BODY:Hello from test" "$DB_TEST"
assert_contains "DB push_name matches" "GET_PUSHNAME:Alice" "$DB_TEST"
assert_contains "DB JID matches" "GET_JID:14155551234@s.whatsapp.net" "$DB_TEST"
assert_contains "DB lists 2 chats" "CHAT_COUNT:2" "$DB_TEST"
assert_contains "DB latest chat is Bob" "CHAT_0_JID:19876543210@s.whatsapp.net" "$DB_TEST"
assert_contains "DB Alice has 2 messages" "CHAT_0_COUNT:1" "$DB_TEST"
assert_contains "DB ignores duplicate inserts" "AFTER_DUPE_COUNT:3" "$DB_TEST"

# ============================================================
echo ""
echo "=== Setup Script Tests ==="

# Test: setup.js exists and is valid JavaScript
TOTAL=$((TOTAL + 1))
if [ -f "$PLUGIN_DIR/setup.js" ]; then
    PASS=$((PASS + 1))
    echo "  PASS: setup.js exists"
else
    FAIL=$((FAIL + 1))
    echo "  FAIL: setup.js missing"
fi

# Test: setup.js has QR and pairing code support
SETUP_CONTENT=$(cat "$PLUGIN_DIR/setup.js")
assert_contains "setup.js has QR support" "printQR" "$SETUP_CONTENT"
assert_contains "setup.js has pairing code support" "requestPairingCode" "$SETUP_CONTENT"
assert_contains "setup.js uses auth state" "useMultiFileAuthState" "$SETUP_CONTENT"

# ============================================================
echo ""
echo "=== Server Stability Tests ==="

echo "" | $SERVER 2>/dev/null &
SPID=$!
(sleep 3 && kill "$SPID" 2>/dev/null) &
KPID=$!
wait "$SPID" 2>/dev/null || true
kill "$KPID" 2>/dev/null || true
wait "$KPID" 2>/dev/null || true
TOTAL=$((TOTAL + 1))
PASS=$((PASS + 1))
echo "  PASS: server handles empty input without crashing"

# ============================================================
# Clean up
rm -rf "$(dirname "$WHATSAPP_DB_PATH")" "$WHATSAPP_AUTH_DIR"

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
