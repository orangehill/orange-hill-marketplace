/**
 * db.js -- Shared SQLite database module for mcp-whatsapp (Baileys)
 *
 * Stores incoming/outgoing messages from the Baileys WhatsApp Web connection.
 * Uses WAL mode for safe concurrent read/write.
 *
 * IMPORTANT: Never use console.log() in modules imported by server.js
 * -- it corrupts the JSON-RPC stream. Use console.error() for debug logging.
 */
import Database from "better-sqlite3";
import { mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { homedir } from "node:os";

const DEFAULT_DB_PATH = join(homedir(), ".mcp-whatsapp", "messages.db");

let db = null;

/**
 * Initialize (or return existing) database connection.
 */
export function initDB(dbPath) {
  if (db) return db;

  const resolvedPath = dbPath || process.env.WHATSAPP_DB_PATH || DEFAULT_DB_PATH;
  const dir = dirname(resolvedPath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  db = new Database(resolvedPath);
  db.pragma("journal_mode = WAL");
  db.pragma("busy_timeout = 5000");

  db.exec(`
    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      remote_jid TEXT NOT NULL,
      from_me INTEGER NOT NULL DEFAULT 0,
      message_type TEXT NOT NULL DEFAULT 'text',
      body TEXT,
      media_id TEXT,
      media_mime_type TEXT,
      media_local_path TEXT,
      caption TEXT,
      contact_name TEXT,
      push_name TEXT,
      quoted_id TEXT,
      timestamp INTEGER NOT NULL,
      status TEXT DEFAULT 'sent',
      raw_json TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_messages_jid ON messages(remote_jid);
    CREATE INDEX IF NOT EXISTS idx_messages_from_me ON messages(from_me);
    CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp);
    CREATE INDEX IF NOT EXISTS idx_messages_type ON messages(message_type);
  `);

  return db;
}

/**
 * Insert a message.
 */
export function insertMessage({
  id,
  remote_jid,
  from_me = false,
  message_type = "text",
  body,
  media_id,
  media_mime_type,
  caption,
  contact_name,
  push_name,
  quoted_id,
  timestamp,
  status = "sent",
  raw_json,
}) {
  const d = initDB();
  const stmt = d.prepare(`
    INSERT OR IGNORE INTO messages
      (id, remote_jid, from_me, message_type, body, media_id, media_mime_type,
       caption, contact_name, push_name, quoted_id, timestamp, status, raw_json)
    VALUES
      (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  return stmt.run(
    id, remote_jid, from_me ? 1 : 0, message_type,
    body || null, media_id || null, media_mime_type || null,
    caption || null, contact_name || null, push_name || null,
    quoted_id || null, timestamp, status,
    raw_json ? JSON.stringify(raw_json) : null
  );
}

/**
 * Query messages with optional filters.
 */
export function queryMessages({ remote_jid, from_me, since, message_type, limit = 50 } = {}) {
  const d = initDB();
  const conditions = [];
  const params = [];

  if (remote_jid) {
    conditions.push("remote_jid = ?");
    params.push(remote_jid);
  }
  if (from_me !== undefined && from_me !== null) {
    conditions.push("from_me = ?");
    params.push(from_me ? 1 : 0);
  }
  if (since) {
    conditions.push("timestamp >= ?");
    params.push(since);
  }
  if (message_type) {
    conditions.push("message_type = ?");
    params.push(message_type);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const sql = `SELECT * FROM messages ${where} ORDER BY timestamp DESC LIMIT ?`;
  params.push(limit);

  return d.prepare(sql).all(...params);
}

/**
 * Get a single message by ID.
 */
export function getMessageById(id) {
  const d = initDB();
  return d.prepare("SELECT * FROM messages WHERE id = ?").get(id);
}

/**
 * List distinct chats with latest message info.
 */
export function listChats(limit = 50) {
  const d = initDB();
  return d.prepare(`
    SELECT
      m.remote_jid,
      m.contact_name,
      m.push_name,
      m.body as last_message,
      m.message_type as last_type,
      m.from_me as last_from_me,
      m.timestamp as last_timestamp,
      (SELECT COUNT(*) FROM messages WHERE remote_jid = m.remote_jid) as message_count
    FROM messages m
    INNER JOIN (
      SELECT remote_jid, MAX(timestamp) as max_ts
      FROM messages
      GROUP BY remote_jid
    ) latest ON m.remote_jid = latest.remote_jid AND m.timestamp = latest.max_ts
    ORDER BY m.timestamp DESC
    LIMIT ?
  `).all(limit);
}

/**
 * Update media local path after download.
 */
export function updateMediaPath(id, localPath) {
  const d = initDB();
  d.prepare("UPDATE messages SET media_local_path = ? WHERE id = ?").run(localPath, id);
}

/**
 * Close the database connection.
 */
export function closeDB() {
  if (db) {
    db.close();
    db = null;
  }
}
