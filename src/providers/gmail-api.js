// Gmail REST API provider (OAuth, gmail.readonly scope) — the fallback for
// Google orgs where IT has disabled IMAP or app passwords. Same tool surface
// and result shape as the IMAP provider; `q` is native Gmail search syntax.
//
// Auth: one-time interactive `npm run auth <id>` stores a refresh token in
// tokens/<id>.json. This module never starts an interactive flow (the MCP
// server runs headless under Claude Desktop / Claude Code).

import { OAuth2Client } from "google-auth-library";
import fs from "node:fs";
import { googleOAuthConfig } from "../config.js";

const API = "https://gmail.googleapis.com/gmail/v1/users/me";
export const GMAIL_SCOPE = "https://www.googleapis.com/auth/gmail.readonly";

function getClient(account) {
  const { clientId, clientSecret } = googleOAuthConfig();
  if (!fs.existsSync(account.tokenFile)) {
    throw new Error(
      `${account.id} (${account.email}) is not authenticated yet — run: npm run auth ${account.id}`
    );
  }
  const { refresh_token } = JSON.parse(fs.readFileSync(account.tokenFile, "utf8"));
  const client = new OAuth2Client(clientId, clientSecret);
  client.setCredentials({ refresh_token });
  return client;
}

async function api(client, path) {
  const res = await client.request({ url: `${API}${path}` });
  return res.data;
}

function header(message, name) {
  const h = (message.payload?.headers || []).find(
    (x) => x.name.toLowerCase() === name.toLowerCase()
  );
  return h?.value || "";
}

function toSummary(account, message) {
  return {
    account: account.id,
    account_email: account.email,
    id: message.id,
    subject: header(message, "Subject") || "(no subject)",
    from: header(message, "From"),
    to: header(message, "To"),
    date: message.internalDate ? new Date(Number(message.internalDate)).toISOString() : null,
    snippet: message.snippet || "",
  };
}

async function summarizeIds(client, account, ids) {
  const results = [];
  for (const id of ids) {
    const msg = await api(
      client,
      `/messages/${id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=To`
    );
    results.push(toSummary(account, msg));
  }
  results.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  return results;
}

export async function searchMail(account, query, limit) {
  const client = getClient(account);
  const list = await api(client, `/messages?q=${encodeURIComponent(query)}&maxResults=${limit}`);
  return summarizeIds(client, account, (list.messages || []).map((m) => m.id));
}

export async function listRecent(account, limit) {
  const client = getClient(account);
  const list = await api(client, `/messages?maxResults=${limit}`);
  return summarizeIds(client, account, (list.messages || []).map((m) => m.id));
}

function decodeBody(data) {
  return Buffer.from(data.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8");
}

function findBody(payload, mime) {
  if (!payload) return null;
  if (payload.mimeType === mime && payload.body?.data) return decodeBody(payload.body.data);
  for (const part of payload.parts || []) {
    const hit = findBody(part, mime);
    if (hit) return hit;
  }
  return null;
}

function listAttachments(payload, out = []) {
  if (payload?.filename && payload.body?.attachmentId) {
    out.push({
      filename: payload.filename,
      contentType: payload.mimeType,
      size: payload.body.size,
    });
  }
  for (const part of payload?.parts || []) listAttachments(part, out);
  return out;
}

export async function readMessage(account, id) {
  const client = getClient(account);
  const msg = await api(client, `/messages/${encodeURIComponent(id)}?format=full`);
  return {
    account: account.id,
    account_email: account.email,
    id: msg.id,
    subject: header(msg, "Subject") || "(no subject)",
    from: header(msg, "From"),
    to: header(msg, "To"),
    cc: header(msg, "Cc"),
    date: msg.internalDate ? new Date(Number(msg.internalDate)).toISOString() : null,
    body: findBody(msg.payload, "text/plain") || findBody(msg.payload, "text/html") || msg.snippet || "",
    attachments: listAttachments(msg.payload),
  };
}

// Used by check.js — cheap authenticated call proving the token works.
export async function checkAccount(account) {
  const client = getClient(account);
  const profile = await api(client, "/profile");
  return `${profile.emailAddress} — ${profile.messagesTotal} messages (Gmail API)`;
}
