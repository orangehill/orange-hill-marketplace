#!/usr/bin/env node
/**
 * setup.js -- WhatsApp QR code pairing script.
 *
 * Run this once to link your WhatsApp account:
 *   node setup.js
 *
 * Or use pairing code (no QR scanning needed):
 *   node setup.js --pairing-code 14155551234
 *
 * Auth state is saved to ~/.mcp-whatsapp/auth/ and reused by server.js.
 */
import makeWASocket, {
  useMultiFileAuthState,
  makeCacheableSignalKeyStore,
  DisconnectReason,
  fetchLatestBaileysVersion,
} from "@whiskeysockets/baileys";
import pino from "pino";
import { mkdirSync, existsSync, rmSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";

/**
 * Render a QR code string in the terminal.
 */
async function printQR(qrText) {
  try {
    const QRCode = await import("qrcode");
    const str = await QRCode.toString(qrText, { type: "terminal", small: true });
    console.log("\n" + str);
  } catch {
    console.log("\nQR data (install 'qrcode' for visual display):");
    console.log(qrText);
  }
}

const AUTH_DIR = process.env.WHATSAPP_AUTH_DIR || join(homedir(), ".mcp-whatsapp", "auth");
// Silent logger — suppress all Baileys internal logging
const logger = pino({ level: "silent" });

// Parse args
const args = process.argv.slice(2);
const pairingCodeIdx = args.indexOf("--pairing-code");
const pairingPhone = pairingCodeIdx >= 0 ? args[pairingCodeIdx + 1] : null;

async function startSocket() {
  if (!existsSync(AUTH_DIR)) {
    mkdirSync(AUTH_DIR, { recursive: true });
  }

  const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
  const { version } = await fetchLatestBaileysVersion();

  console.log(`Baileys version: ${version.join(".")}`);
  console.log(`Auth directory: ${AUTH_DIR}`);

  if (state.creds.registered) {
    console.log("\nAlready paired! Your WhatsApp session is active.");
    console.log("To re-pair, delete the auth directory and run setup again:");
    console.log(`  rm -rf "${AUTH_DIR}" && node setup.js`);
    process.exit(0);
  }

  const sock = makeWASocket({
    version,
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, logger),
    },
    logger,
  });

  // If using pairing code, request it after socket is ready
  if (pairingPhone) {
    await new Promise((r) => setTimeout(r, 3000));
    const phone = pairingPhone.replace(/[\s+\-()]/g, "");
    console.log(`\nRequesting pairing code for ${phone}...`);
    const code = await sock.requestPairingCode(phone);
    console.log(`\nPairing code: ${code}`);
    console.log("Enter this code in WhatsApp → Linked Devices → Link a Device → Link with phone number");
  }

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect, qr } = update;

    // Render QR code when received (only in QR mode, not pairing code)
    if (qr && !pairingPhone) {
      await printQR(qr);
      console.log("Scan the QR code with WhatsApp:");
      console.log("  Settings → Linked Devices → Link a Device\n");
    }

    if (connection === "open") {
      console.log("\nConnected successfully!");
      console.log("Your WhatsApp is now linked. You can close this script.");
      console.log("\nThe MCP server will use saved credentials automatically.");
      // Wait for final creds save, then exit
      setTimeout(() => process.exit(0), 3000);
    }

    if (connection === "close") {
      const statusCode = lastDisconnect?.error?.output?.statusCode;

      if (statusCode === DisconnectReason.loggedOut || statusCode === 401) {
        // Auth is invalid — wipe and restart fresh
        console.log("\nSession invalidated. Clearing auth and restarting...");
        rmSync(AUTH_DIR, { recursive: true, force: true });
        setTimeout(() => startSocket(), 1000);
        return;
      }

      // Stream error 515 or other transient errors — reconnect
      // This commonly happens right after QR scan (WhatsApp resets the connection)
      console.log("Reconnecting...");
      setTimeout(() => startSocket(), 2000);
    }
  });
}

startSocket().catch((err) => {
  console.error("Setup failed:", err.message);
  process.exit(1);
});
