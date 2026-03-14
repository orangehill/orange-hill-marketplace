# mcp-whatsapp

MCP server plugin for WhatsApp via [Baileys](https://github.com/WhiskeySockets/Baileys). Send and receive messages as your own WhatsApp number — no business account, no Meta approval, no per-message fees.

## How It Works

Baileys connects to WhatsApp using the same protocol as WhatsApp Web (Linked Devices). You scan a QR code once with your phone, and the plugin can then send/receive messages as you.

- **server.js** — MCP server (stdio). 9 tools for sending, reading, searching messages. Spawned by Claude Code.
- **setup.js** — One-time QR code pairing script. Run manually before first use.

Messages received while the MCP server is running are stored in a local SQLite database for querying.

## Setup

### 1. Install

```bash
cd plugins/built/mcp-whatsapp
npm install
```

### 2. Pair Your WhatsApp

**Option A: QR code (scan with phone)**
```bash
node setup.js
```
A QR code appears in the terminal. Scan it with WhatsApp → Settings → Linked Devices → Link a Device.

**Option B: Pairing code (enter on phone)**
```bash
node setup.js --pairing-code 14155551234
```
A 6-digit code is shown. Enter it in WhatsApp → Linked Devices → Link a Device → Link with phone number.

Auth state is saved to `~/.mcp-whatsapp/auth/`. You won't need to re-pair unless you explicitly unlink the device.

### 3. Add to Claude Code

Add to your project's `.mcp.json`:

```json
{
  "mcpServers": {
    "whatsapp": {
      "type": "stdio",
      "command": "node",
      "args": ["/path/to/mcp-whatsapp/server.js"]
    }
  }
}
```

No environment variables needed — auth state is read from `~/.mcp-whatsapp/auth/` automatically.

## Tools

| Tool | Description |
|------|-------------|
| `send_message` | Send a text message (supports quoting/replying) |
| `send_media` | Send image, video, audio, or document (local file or URL) |
| `list_chats` | List conversations with latest message from each |
| `get_messages` | Get messages with filters (chat, direction, time, type) |
| `get_message_detail` | Full message details including raw WhatsApp data |
| `download_media` | Download media from a received message to local file |
| `read_chat` | Mark messages as read (blue checkmarks) |
| `search_messages` | Full-text search across stored messages |
| `connection_status` | Check connection state and account info |

## Environment Variables (all optional)

| Variable | Default | Description |
|----------|---------|-------------|
| `WHATSAPP_AUTH_DIR` | `~/.mcp-whatsapp/auth/` | Auth state directory |
| `WHATSAPP_DB_PATH` | `~/.mcp-whatsapp/messages.db` | SQLite database path |
| `WHATSAPP_MEDIA_DIR` | `~/.mcp-whatsapp/media/` | Downloaded media directory |

## Usage Examples

**Send a message:**
> "Send a WhatsApp message to +1-415-555-1234 saying 'Meeting at 3pm tomorrow'"

**Check recent messages:**
> "Show me my recent WhatsApp messages"

**Search messages:**
> "Search my WhatsApp for messages about 'dinner reservation'"

**Send a photo:**
> "Send this photo /tmp/screenshot.png to 14155551234 on WhatsApp with caption 'Check this out'"

**Read a chat:**
> "Mark my WhatsApp chat with 14155551234 as read"

## Testing

```bash
bash tests/test.sh
```

## Important Notes

- Messages are only stored while the MCP server is running. When Claude Code closes the plugin, the WhatsApp connection closes too.
- Phone numbers must include country code (e.g., `14155551234`). The `+` prefix is stripped automatically.
- Baileys is not an official WhatsApp product. Use responsibly — aggressive automation may result in your number being banned.
- Your WhatsApp account can have up to 4 linked devices. This plugin uses one slot.
- To unlink: WhatsApp → Settings → Linked Devices → tap the device → Log Out.
- To re-pair: `rm -rf ~/.mcp-whatsapp/auth/ && node setup.js`
