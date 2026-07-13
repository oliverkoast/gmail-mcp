// IMAP access layer. One short-lived connection per tool call (simple and
// stateless — fine for interactive use; pool connections if this ever needs
// to serve high volume).
//
// All reads go through "[Gmail]/All Mail" so message UIDs are stable across
// tools regardless of label/folder, and search covers archived mail too.

import { ImapFlow } from "imapflow";
import { simpleParser } from "mailparser";

const ALL_MAIL = "[Gmail]/All Mail";
const SNIPPET_BYTES = 4096;

async function withMailbox(account, fn) {
  const client = new ImapFlow({
    host: "imap.gmail.com",
    port: 993,
    secure: true,
    auth: { user: account.email, pass: account.password },
    logger: false,
  });
  try {
    await client.connect();
  } catch (err) {
    // imapflow's generic "Command failed" hides the server response
    const detail = err.responseText || err.message;
    const hint = err.authenticationFailed
      ? " (check the app password and that 2-Step Verification is enabled)"
      : "";
    throw new Error(`${account.email}: ${detail}${hint}`);
  }
  try {
    const lock = await client.getMailboxLock(ALL_MAIL, { readOnly: true });
    try {
      return await fn(client);
    } finally {
      lock.release();
    }
  } finally {
    await client.logout().catch(() => {});
  }
}

function addressToString(addr) {
  if (!addr || !addr.length) return "";
  return addr
    .map((a) => (a.name ? `${a.name} <${a.address}>` : a.address || ""))
    .join(", ");
}

function findTextPart(node, prefix = "") {
  if (!node) return null;
  if (node.type === "text/plain") return node.part || "1";
  if (node.childNodes) {
    for (const child of node.childNodes) {
      const hit = findTextPart(child, prefix);
      if (hit) return hit;
    }
  }
  return null;
}

async function fetchSnippet(client, uid, bodyStructure) {
  try {
    const part = findTextPart(bodyStructure);
    if (!part) return "";
    const { content } = await client.download(uid, part, {
      uid: true,
      maxBytes: SNIPPET_BYTES,
    });
    const chunks = [];
    for await (const chunk of content) chunks.push(chunk);
    return Buffer.concat(chunks)
      .toString("utf8")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 300);
  } catch {
    return ""; // a snippet is nice-to-have; never fail the listing over it
  }
}

function toSummary(account, msg) {
  return {
    account: account.id,
    account_email: account.email,
    id: String(msg.uid),
    subject: msg.envelope?.subject || "(no subject)",
    from: addressToString(msg.envelope?.from),
    to: addressToString(msg.envelope?.to),
    date: (msg.internalDate || msg.envelope?.date)?.toISOString?.() || null,
  };
}

async function summarizeUids(client, account, uids, { withSnippets = true } = {}) {
  if (!uids.length) return [];
  const messages = [];
  for await (const msg of client.fetch(
    uids,
    { uid: true, envelope: true, internalDate: true, bodyStructure: true },
    { uid: true }
  )) {
    messages.push(msg);
  }
  const results = [];
  for (const msg of messages) {
    const summary = toSummary(account, msg);
    if (withSnippets) {
      summary.snippet = await fetchSnippet(client, msg.uid, msg.bodyStructure);
    }
    results.push(summary);
  }
  results.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  return results;
}

// Gmail search syntax (from:, subject:, has:attachment, newer_than:7d, ...)
// via the X-GM-RAW IMAP extension. Plain words behave like the Gmail search box.
export async function searchMail(account, query, limit) {
  return withMailbox(account, async (client) => {
    const uids = await client.search({ gmraw: query }, { uid: true });
    if (!uids || !uids.length) return [];
    const newest = uids.sort((a, b) => b - a).slice(0, limit);
    return summarizeUids(client, account, newest);
  });
}

export async function listRecent(account, limit) {
  return withMailbox(account, async (client) => {
    const total = client.mailbox.exists;
    if (!total) return [];
    // Last N by sequence number, then map to UIDs via fetch.
    const from = Math.max(1, total - limit + 1);
    const uids = [];
    for await (const msg of client.fetch(`${from}:${total}`, { uid: true })) {
      uids.push(msg.uid);
    }
    return summarizeUids(client, account, uids);
  });
}

export async function readMessage(account, uid) {
  return withMailbox(account, async (client) => {
    const { content } = await client.download(String(uid), undefined, { uid: true });
    if (!content) throw new Error(`Message ${uid} not found in ${account.id}`);
    const parsed = await simpleParser(content);
    return {
      account: account.id,
      account_email: account.email,
      id: String(uid),
      subject: parsed.subject || "(no subject)",
      from: parsed.from?.text || "",
      to: parsed.to?.text || "",
      cc: parsed.cc?.text || "",
      date: parsed.date?.toISOString() || null,
      body: parsed.text || parsed.html || "",
      attachments: (parsed.attachments || []).map((a) => ({
        filename: a.filename,
        contentType: a.contentType,
        size: a.size,
      })),
    };
  });
}

export async function checkAccount(account) {
  const client = new ImapFlow({
    host: "imap.gmail.com",
    port: 993,
    secure: true,
    auth: { user: account.email, pass: account.password },
    logger: false,
  });
  try {
    await client.connect();
  } catch (err) {
    const detail = err.responseText || err.message;
    const hint = err.authenticationFailed
      ? " (check the app password and that 2-Step Verification is enabled)"
      : "";
    throw new Error(`${detail}${hint}`);
  }
  try {
    const status = await client.status(ALL_MAIL, { messages: true });
    return `${account.email} — ${status.messages} messages in All Mail (IMAP)`;
  } finally {
    await client.logout().catch(() => {});
  }
}
