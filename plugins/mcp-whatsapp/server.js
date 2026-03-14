#!/usr/bin/env node
/**
 * MCP Server: mcp-whatsapp
 * WhatsApp integration via Baileys (WhatsApp Web protocol).
 * Connects as your personal WhatsApp account — no business API needed.
 *
 * Run `node setup.js` first to pair via QR code.
 *
 * Uses stdio transport (JSON-RPC over stdin/stdout).
 * IMPORTANT: Never use console.log() -- it corrupts the JSON-RPC stream.
 * Use console.error() for debug logging.
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { existsSync, mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";
import makeWASocket, {
  useMultiFileAuthState,
  makeCacheableSignalKeyStore,
  DisconnectReason,
  fetchLatestBaileysVersion,
  getContentType,
  downloadMediaMessage,
  proto,
} from "@whiskeysockets/baileys";
import pino from "pino";
import { initDB, insertMessage, queryMessages, getMessageById, listChats, updateMediaPath } from "./db.js";

// Re-export initDB for search_messages direct query use
const getDB = initDB;

const server = new McpServer({
  name: "mcp-whatsapp",
  version: "2.0.0",
});

// --- Configuration ---
const AUTH_DIR = process.env.WHATSAPP_AUTH_DIR || join(homedir(), ".mcp-whatsapp", "auth");
const MEDIA_DIR = process.env.WHATSAPP_MEDIA_DIR || join(homedir(), ".mcp-whatsapp", "media");
const logger = pino({ level: "silent" });

// --- State ---
let sock = null;
let connectionState = "disconnected";
let db = null;

try {
  db = initDB();
} catch (err) {
  console.error("Warning: Could not initialize DB:", err.message);
}

/**
 * Extract message content from a Baileys message object.
 */
function extractMessageContent(msg) {
  if (!msg.message) return { type: "unknown", body: null };

  const contentType = getContentType(msg.message);
  const content = msg.message[contentType];

  switch (contentType) {
    case "conversation":
      return { type: "text", body: msg.message.conversation };
    case "extendedTextMessage":
      return { type: "text", body: content?.text || null };
    case "imageMessage":
      return { type: "image", body: content?.caption || null, media_id: msg.key.id, media_mime_type: content?.mimetype };
    case "videoMessage":
      return { type: "video", body: content?.caption || null, media_id: msg.key.id, media_mime_type: content?.mimetype };
    case "audioMessage":
      return { type: "audio", body: null, media_id: msg.key.id, media_mime_type: content?.mimetype };
    case "documentMessage":
      return { type: "document", body: content?.fileName || null, media_id: msg.key.id, media_mime_type: content?.mimetype };
    case "stickerMessage":
      return { type: "sticker", body: null, media_id: msg.key.id, media_mime_type: content?.mimetype };
    case "locationMessage":
      return {
        type: "location",
        body: JSON.stringify({
          latitude: content?.degreesLatitude,
          longitude: content?.degreesLongitude,
          name: content?.name,
          address: content?.address,
        }),
      };
    case "contactMessage":
      return { type: "contact", body: content?.displayName || null };
    case "reactionMessage":
      return { type: "reaction", body: content?.text || null };
    default:
      return { type: contentType || "unknown", body: null };
  }
}

/**
 * Store a Baileys message in the database.
 */
function storeMessage(msg) {
  if (!db || !msg.message) return;
  // Skip protocol messages (e.g., read receipts, status broadcasts to status@broadcast)
  if (msg.key.remoteJid === "status@broadcast") return;

  try {
    const extracted = extractMessageContent(msg);
    const quotedMsg = msg.message?.extendedTextMessage?.contextInfo?.stanzaId;

    insertMessage({
      id: msg.key.id,
      remote_jid: msg.key.remoteJid,
      from_me: !!msg.key.fromMe,
      message_type: extracted.type,
      body: extracted.body,
      media_id: extracted.media_id || null,
      media_mime_type: extracted.media_mime_type || null,
      caption: extracted.type !== "text" ? extracted.body : null,
      push_name: msg.pushName || null,
      quoted_id: quotedMsg || null,
      timestamp: msg.messageTimestamp
        ? (typeof msg.messageTimestamp === "number" ? msg.messageTimestamp : parseInt(msg.messageTimestamp))
        : Math.floor(Date.now() / 1000),
      raw_json: msg,
    });
  } catch (err) {
    // Ignore duplicate inserts
  }
}

/**
 * Connect to WhatsApp using saved auth state.
 */
async function connectWhatsApp() {
  if (!existsSync(AUTH_DIR) || !existsSync(join(AUTH_DIR, "creds.json"))) {
    connectionState = "not_paired";
    console.error("WhatsApp not paired. Run: node setup.js");
    return;
  }

  try {
    const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
    const { version } = await fetchLatestBaileysVersion();

    sock = makeWASocket({
      version,
      auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, logger),
      },
      logger,
      markOnlineOnConnect: false,
    });

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("connection.update", (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (connection === "open") {
        connectionState = "connected";
        console.error("WhatsApp connected");
      } else if (connection === "close") {
        const statusCode = lastDisconnect?.error?.output?.statusCode;
        if (statusCode === DisconnectReason.loggedOut) {
          connectionState = "logged_out";
          console.error("WhatsApp logged out. Re-run setup.js.");
          sock = null;
        } else {
          // All other disconnects: let Baileys handle reconnection internally.
          // Creating a new socket causes cascading reconnect loops.
          connectionState = "reconnecting";
        }
      } else if (connection === "connecting") {
        connectionState = "connecting";
      }

      if (qr) {
        // QR received means auth is invalid
        connectionState = "needs_repairing";
        console.error("Auth expired. Re-run: node setup.js");
        sock?.end(undefined);
        sock = null;
      }
    });

    // Store incoming messages
    sock.ev.on("messages.upsert", ({ type, messages }) => {
      for (const msg of messages) {
        storeMessage(msg);
      }
    });
  } catch (err) {
    connectionState = "error";
    console.error("WhatsApp connection error:", err.message);
  }
}

/**
 * Normalize a phone number to JID format.
 */
function toJid(input) {
  if (input.includes("@")) return input;
  const clean = input.replace(/[\s+\-()]/g, "");
  return `${clean}@s.whatsapp.net`;
}

/**
 * Require an active connection for tools that need it.
 */
function requireConnection() {
  if (!sock || connectionState !== "connected") {
    const hint = connectionState === "not_paired" || connectionState === "needs_repairing"
      ? " Run: node setup.js (in the plugin directory)"
      : ` Current state: ${connectionState}`;
    throw new Error(`WhatsApp not connected.${hint}`);
  }
}

// --- Register tools ---

// 1. send_message
server.registerTool(
  "send_message",
  {
    description:
      "Send a text message via WhatsApp. You can reply to a specific message by providing quoted_id.",
    inputSchema: {
      to: z.string().describe("Phone number with country code (e.g., '14155551234') or JID"),
      text: z.string().describe("Message text to send"),
      quoted_id: z.string().optional().describe("Message ID to reply/quote"),
    },
  },
  async ({ to, text, quoted_id }) => {
    try {
      requireConnection();
      const jid = toJid(to);
      const opts = {};

      if (quoted_id && db) {
        const quotedMsg = getMessageById(quoted_id);
        if (quotedMsg?.raw_json) {
          try {
            opts.quoted = JSON.parse(quotedMsg.raw_json);
          } catch {}
        }
      }

      const result = await sock.sendMessage(jid, { text }, opts);

      if (result) storeMessage({ ...result, key: { ...result.key, fromMe: true }, pushName: "Me" });

      return {
        content: [{
          type: "text",
          text: `Message sent to ${jid}. ID: ${result?.key?.id || "unknown"}`,
        }],
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: `Error: ${error.message}` }],
        isError: true,
      };
    }
  }
);

// 2. send_media
server.registerTool(
  "send_media",
  {
    description:
      "Send a media file (image, video, audio, document) via WhatsApp. Provide a local file path or URL.",
    inputSchema: {
      to: z.string().describe("Phone number with country code or JID"),
      media_type: z.enum(["image", "video", "audio", "document"]).describe("Type of media"),
      file: z.string().describe("Local file path or HTTP(S) URL"),
      caption: z.string().optional().describe("Caption for image/video/document"),
      filename: z.string().optional().describe("Filename for document type"),
    },
  },
  async ({ to, media_type, file, caption, filename }) => {
    try {
      requireConnection();
      const jid = toJid(to);

      const mediaSource = file.startsWith("http") ? { url: file } : readFileSync(file);
      const msg = { [media_type]: mediaSource };

      if (caption) msg.caption = caption;
      if (filename && media_type === "document") msg.fileName = filename;
      if (media_type === "document" && !msg.mimetype) {
        // Try to infer mimetype from extension
        const ext = file.split(".").pop()?.toLowerCase();
        const mimeMap = { pdf: "application/pdf", doc: "application/msword", docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", csv: "text/csv", txt: "text/plain", zip: "application/zip" };
        if (ext && mimeMap[ext]) msg.mimetype = mimeMap[ext];
      }

      const result = await sock.sendMessage(jid, msg);
      if (result) storeMessage({ ...result, key: { ...result.key, fromMe: true }, pushName: "Me" });

      return {
        content: [{
          type: "text",
          text: `${media_type} sent to ${jid}. ID: ${result?.key?.id || "unknown"}`,
        }],
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: `Error: ${error.message}` }],
        isError: true,
      };
    }
  }
);

// 3. list_chats
server.registerTool(
  "list_chats",
  {
    description:
      "List WhatsApp conversations with the latest message from each. Shows chats stored since the MCP server started receiving messages.",
    inputSchema: {
      limit: z.number().optional().describe("Max chats to return (default: 30)"),
    },
  },
  async ({ limit }) => {
    try {
      if (!db) throw new Error("Database not available");

      const chats = listChats(limit || 30);
      if (chats.length === 0) {
        return { content: [{ type: "text", text: "No chats stored yet. Messages are recorded while the MCP server is running." }] };
      }

      const summary = chats.map((c) => ({
        jid: c.remote_jid,
        name: c.contact_name || c.push_name || c.remote_jid.split("@")[0],
        last_message: c.last_message,
        last_type: c.last_type,
        from_me: !!c.last_from_me,
        time: new Date(c.last_timestamp * 1000).toISOString(),
        message_count: c.message_count,
      }));

      return { content: [{ type: "text", text: JSON.stringify(summary, null, 2) }] };
    } catch (error) {
      return { content: [{ type: "text", text: `Error: ${error.message}` }], isError: true };
    }
  }
);

// 4. get_messages
server.registerTool(
  "get_messages",
  {
    description:
      "Get messages from a specific chat or all chats. Filters by JID, direction, time, and type.",
    inputSchema: {
      jid: z.string().optional().describe("Chat JID or phone number to filter by"),
      from_me: z.boolean().optional().describe("Filter: true=sent, false=received"),
      since: z.number().optional().describe("Only messages after this Unix timestamp"),
      message_type: z.string().optional().describe("Filter by type: text, image, video, audio, document"),
      limit: z.number().optional().describe("Max messages (default: 50)"),
    },
  },
  async ({ jid, from_me, since, message_type, limit }) => {
    try {
      if (!db) throw new Error("Database not available");

      const messages = queryMessages({
        remote_jid: jid ? toJid(jid) : undefined,
        from_me,
        since,
        message_type,
        limit: limit || 50,
      });

      if (messages.length === 0) {
        return { content: [{ type: "text", text: "No messages found matching filters." }] };
      }

      const summary = messages.map((m) => ({
        id: m.id,
        jid: m.remote_jid,
        from_me: !!m.from_me,
        type: m.message_type,
        body: m.body,
        caption: m.caption,
        name: m.push_name || m.contact_name,
        time: new Date(m.timestamp * 1000).toISOString(),
      }));

      return { content: [{ type: "text", text: JSON.stringify(summary, null, 2) }] };
    } catch (error) {
      return { content: [{ type: "text", text: `Error: ${error.message}` }], isError: true };
    }
  }
);

// 5. get_message_detail
server.registerTool(
  "get_message_detail",
  {
    description: "Get full details of a specific message by its ID, including raw WhatsApp data.",
    inputSchema: {
      id: z.string().describe("Message ID"),
    },
  },
  async ({ id }) => {
    try {
      if (!db) throw new Error("Database not available");
      const msg = getMessageById(id);
      if (!msg) return { content: [{ type: "text", text: `No message found with ID: ${id}` }] };

      if (msg.raw_json) {
        try { msg.raw_json = JSON.parse(msg.raw_json); } catch {}
      }

      return { content: [{ type: "text", text: JSON.stringify(msg, null, 2) }] };
    } catch (error) {
      return { content: [{ type: "text", text: `Error: ${error.message}` }], isError: true };
    }
  }
);

// 6. download_media
server.registerTool(
  "download_media",
  {
    description: "Download media (image/video/audio/document) from a received message to a local file.",
    inputSchema: {
      message_id: z.string().describe("ID of the message containing media"),
      filename: z.string().optional().describe("Custom filename (default: auto-generated)"),
    },
  },
  async ({ message_id, filename }) => {
    try {
      requireConnection();
      if (!db) throw new Error("Database not available");

      const dbMsg = getMessageById(message_id);
      if (!dbMsg) throw new Error(`Message not found: ${message_id}`);
      if (!dbMsg.raw_json) throw new Error("No raw message data stored for this message");

      let rawMsg;
      try { rawMsg = JSON.parse(dbMsg.raw_json); } catch { throw new Error("Could not parse stored message"); }

      const buffer = await downloadMediaMessage(rawMsg, "buffer", {}, {
        logger,
        reuploadRequest: sock.updateMediaMessage,
      });

      if (!existsSync(MEDIA_DIR)) mkdirSync(MEDIA_DIR, { recursive: true });

      const ext = (dbMsg.media_mime_type || "application/octet-stream").split("/")[1]?.split(";")[0] || "bin";
      const saveName = filename || `${message_id.replace(/[^a-zA-Z0-9]/g, "_")}.${ext}`;
      const savePath = join(MEDIA_DIR, saveName);

      writeFileSync(savePath, buffer);
      updateMediaPath(message_id, savePath);

      return {
        content: [{
          type: "text",
          text: `Media downloaded: ${savePath}\nType: ${dbMsg.media_mime_type || "unknown"}\nSize: ${buffer.length} bytes`,
        }],
      };
    } catch (error) {
      return { content: [{ type: "text", text: `Error: ${error.message}` }], isError: true };
    }
  }
);

// 7. read_chat
server.registerTool(
  "read_chat",
  {
    description: "Mark all messages in a chat as read (sends read receipts / blue checkmarks).",
    inputSchema: {
      jid: z.string().describe("Phone number or JID of the chat to mark as read"),
    },
  },
  async ({ jid: input }) => {
    try {
      requireConnection();
      const jid = toJid(input);

      // Get unread messages from this chat
      const messages = queryMessages({ remote_jid: jid, from_me: false, limit: 100 });
      if (messages.length === 0) {
        return { content: [{ type: "text", text: "No messages to mark as read." }] };
      }

      const keys = messages.map((m) => ({
        remoteJid: m.remote_jid,
        id: m.id,
        fromMe: false,
      }));

      await sock.readMessages(keys);

      return {
        content: [{ type: "text", text: `Marked ${keys.length} messages as read in ${jid}` }],
      };
    } catch (error) {
      return { content: [{ type: "text", text: `Error: ${error.message}` }], isError: true };
    }
  }
);

// 8. search_messages
server.registerTool(
  "search_messages",
  {
    description: "Search stored messages by text content.",
    inputSchema: {
      query: z.string().describe("Text to search for in message bodies"),
      jid: z.string().optional().describe("Limit search to a specific chat"),
      limit: z.number().optional().describe("Max results (default: 20)"),
    },
  },
  async ({ query, jid, limit }) => {
    try {
      if (!db) throw new Error("Database not available");
      const d = getDB();

      const conditions = ["body LIKE ?"];
      const params = [`%${query}%`];

      if (jid) {
        conditions.push("remote_jid = ?");
        params.push(toJid(jid));
      }

      params.push(limit || 20);

      const results = d.prepare(
        `SELECT id, remote_jid, from_me, message_type, body, push_name, timestamp
         FROM messages WHERE ${conditions.join(" AND ")}
         ORDER BY timestamp DESC LIMIT ?`
      ).all(...params);

      if (results.length === 0) {
        return { content: [{ type: "text", text: `No messages found matching "${query}"` }] };
      }

      const summary = results.map((m) => ({
        id: m.id,
        jid: m.remote_jid,
        from_me: !!m.from_me,
        body: m.body,
        name: m.push_name,
        time: new Date(m.timestamp * 1000).toISOString(),
      }));

      return { content: [{ type: "text", text: JSON.stringify(summary, null, 2) }] };
    } catch (error) {
      return { content: [{ type: "text", text: `Error: ${error.message}` }], isError: true };
    }
  }
);

// 9. connection_status
server.registerTool(
  "connection_status",
  {
    description: "Check the WhatsApp connection status and account info.",
    inputSchema: {},
  },
  async () => {
    try {
      const info = {
        status: connectionState,
        paired: existsSync(join(AUTH_DIR, "creds.json")),
        auth_dir: AUTH_DIR,
        db_path: process.env.WHATSAPP_DB_PATH || join(homedir(), ".mcp-whatsapp", "messages.db"),
      };

      if (sock?.user) {
        info.account = {
          id: sock.user.id,
          name: sock.user.name,
        };
      }

      if (connectionState !== "connected") {
        info.hint = connectionState === "not_paired" || connectionState === "needs_repairing"
          ? "Run: node setup.js (in the mcp-whatsapp plugin directory)"
          : "The server will reconnect automatically.";
      }

      return { content: [{ type: "text", text: JSON.stringify(info, null, 2) }] };
    } catch (error) {
      return { content: [{ type: "text", text: `Error: ${error.message}` }], isError: true };
    }
  }
);

// --- Start server ---
async function main() {
  // Connect to WhatsApp in background (don't block MCP startup)
  connectWhatsApp();

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("MCP server mcp-whatsapp running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
