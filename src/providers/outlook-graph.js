// Microsoft 365 / Outlook provider via Microsoft Graph (delegated Mail.Read).
// Auth is a one-time device-code sign-in (`npm run auth <id>`); MSAL's token
// cache is persisted to tokens/<id>.json and refreshed silently from then on.
// Search uses KQL (`from:`, `subject:`, `hasAttachments:true`, ...).

import { PublicClientApplication } from "@azure/msal-node";
import fs from "node:fs";
import { msOAuthConfig } from "../config.js";

const GRAPH = "https://graph.microsoft.com/v1.0";
export const MS_SCOPES = ["Mail.Read"];

export function cachePlugin(file) {
  return {
    beforeCacheAccess: async (ctx) => {
      if (fs.existsSync(file)) ctx.tokenCache.deserialize(fs.readFileSync(file, "utf8"));
    },
    afterCacheAccess: async (ctx) => {
      if (ctx.cacheHasChanged) fs.writeFileSync(file, ctx.tokenCache.serialize(), { mode: 0o600 });
    },
  };
}

export function makePca(account) {
  const { clientId, tenant } = msOAuthConfig();
  return new PublicClientApplication({
    auth: { clientId, authority: `https://login.microsoftonline.com/${tenant}` },
    cache: { cachePlugin: cachePlugin(account.tokenFile) },
  });
}

async function getToken(account) {
  if (!fs.existsSync(account.tokenFile)) {
    throw new Error(
      `${account.id} (${account.email}) is not authenticated yet — run: npm run auth ${account.id}`
    );
  }
  const pca = makePca(account);
  const cached = await pca.getTokenCache().getAllAccounts();
  if (!cached.length) {
    throw new Error(`${account.id}: token cache is empty — run: npm run auth ${account.id}`);
  }
  try {
    const result = await pca.acquireTokenSilent({ account: cached[0], scopes: MS_SCOPES });
    return result.accessToken;
  } catch {
    throw new Error(
      `${account.id}: token refresh failed (expired or revoked) — run: npm run auth ${account.id}`
    );
  }
}

async function graph(token, path, { preferText = false } = {}) {
  const headers = { Authorization: `Bearer ${token}` };
  if (preferText) headers.Prefer = 'outlook.body-content-type="text"';
  const res = await fetch(`${GRAPH}${path}`, { headers });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Graph ${res.status}: ${body.slice(0, 300)}`);
  }
  return res.json();
}

function addr(recipient) {
  const e = recipient?.emailAddress;
  if (!e) return "";
  return e.name && e.name !== e.address ? `${e.name} <${e.address}>` : e.address || "";
}

function toSummary(account, msg) {
  return {
    account: account.id,
    account_email: account.email,
    id: msg.id,
    subject: msg.subject || "(no subject)",
    from: addr(msg.from),
    to: (msg.toRecipients || []).map(addr).join(", "),
    date: msg.receivedDateTime || null,
    snippet: (msg.bodyPreview || "").replace(/\s+/g, " ").trim().slice(0, 300),
  };
}

const SELECT = "id,subject,from,toRecipients,receivedDateTime,bodyPreview";

export async function searchMail(account, query, limit) {
  const token = await getToken(account);
  // $search takes a quoted KQL string and doesn't combine with $orderby.
  const search = encodeURIComponent(`"${query.replace(/"/g, '\\"')}"`);
  const data = await graph(token, `/me/messages?$search=${search}&$top=${limit}&$select=${SELECT}`);
  const results = (data.value || []).map((m) => toSummary(account, m));
  results.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  return results;
}

export async function listRecent(account, limit) {
  const token = await getToken(account);
  const data = await graph(
    token,
    `/me/messages?$top=${limit}&$orderby=receivedDateTime desc&$select=${SELECT}`
  );
  return (data.value || []).map((m) => toSummary(account, m));
}

export async function readMessage(account, id) {
  const token = await getToken(account);
  const msg = await graph(
    token,
    `/me/messages/${encodeURIComponent(id)}?$select=subject,from,toRecipients,ccRecipients,receivedDateTime,body,hasAttachments`,
    { preferText: true }
  );
  let attachments = [];
  if (msg.hasAttachments) {
    const att = await graph(
      token,
      `/me/messages/${encodeURIComponent(id)}/attachments?$select=name,contentType,size`
    );
    attachments = (att.value || []).map((a) => ({
      filename: a.name,
      contentType: a.contentType,
      size: a.size,
    }));
  }
  return {
    account: account.id,
    account_email: account.email,
    id,
    subject: msg.subject || "(no subject)",
    from: addr(msg.from),
    to: (msg.toRecipients || []).map(addr).join(", "),
    cc: (msg.ccRecipients || []).map(addr).join(", "),
    date: msg.receivedDateTime || null,
    body: msg.body?.content || "",
    attachments,
  };
}

export async function checkAccount(account) {
  const token = await getToken(account);
  const inbox = await graph(token, "/me/mailFolders/inbox?$select=totalItemCount");
  return `${account.email} — ${inbox.totalItemCount} messages in Inbox (Microsoft Graph)`;
}
