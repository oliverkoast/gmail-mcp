#!/usr/bin/env node
// MCP server (stdio) exposing unified read-only Gmail access across every
// account listed in .env. Tools take an `account` param: an account id,
// an email address, or "all" to fan out and merge.

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { loadAccounts, resolveAccounts } from "./config.js";
import { providerFor } from "./provider.js";

const accounts = loadAccounts();
const accountIds = accounts.map((a) => a.id);

const server = new McpServer({ name: "gmail-multi", version: "0.1.0" });

function json(data) {
  return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
}

// Fan a read out across the selected accounts; one account failing (bad
// password, IMAP disabled) reports as an error entry instead of sinking
// the whole call.
async function fanOut(selector, fn) {
  const targets = resolveAccounts(accounts, selector);
  const settled = await Promise.allSettled(targets.map((a) => fn(a)));
  const results = [];
  const errors = [];
  settled.forEach((res, i) => {
    if (res.status === "fulfilled") results.push(...res.value);
    else errors.push({ account: targets[i].id, error: String(res.reason?.message || res.reason) });
  });
  results.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  return { results, ...(errors.length ? { errors } : {}) };
}

const accountParam = z
  .string()
  .default("all")
  .describe(`Which account to query: one of ${accountIds.join(", ")}, an email address, or "all" (default) to query every account and merge.`);

server.registerTool(
  "search_mail",
  {
    title: "Search mail",
    description:
      "Search mail across accounts. Gmail accounts use full Gmail search syntax (`from:stripe.com newer_than:7d`, `subject:invoice has:attachment`); Outlook accounts use KQL (`from:`, `subject:`, `hasAttachments:true`); plain keywords work everywhere. Returns subject, sender, date, and a snippet per match, labeled by account.",
    inputSchema: {
      query: z.string().describe("Search query (Gmail search-box syntax; KQL for Outlook accounts; plain keywords work on both)"),
      account: accountParam,
      limit: z.number().int().min(1).max(50).default(10).describe("Max results per account"),
    },
  },
  async ({ query, account, limit }) => json(await fanOut(account, (a) => providerFor(a).searchMail(a, query, limit)))
);

server.registerTool(
  "read_message",
  {
    title: "Read message",
    description:
      "Read the full body of one message by the `id` returned from search_mail/list_recent. `account` must be the specific account the id came from (ids are per-account).",
    inputSchema: {
      id: z.string().describe("Message id from search_mail or list_recent"),
      account: z.string().describe(`The account the id belongs to: one of ${accountIds.join(", ")}, or an email address`),
    },
  },
  async ({ id, account }) => {
    if (account === "all") throw new Error("read_message needs a specific account (ids are per-account).");
    const [target] = resolveAccounts(accounts, account);
    return json(await providerFor(target).readMessage(target, id));
  }
);

server.registerTool(
  "list_recent",
  {
    title: "List recent mail",
    description: "List the most recent messages, newest first, labeled by account.",
    inputSchema: {
      account: accountParam,
      limit: z.number().int().min(1).max(50).default(10).describe("Max results per account"),
    },
  },
  async ({ account, limit }) => json(await fanOut(account, (a) => providerFor(a).listRecent(a, limit)))
);

server.registerTool(
  "list_accounts",
  {
    title: "List configured accounts",
    description: "List the configured mail accounts (id, email, provider) this server can read.",
    inputSchema: {},
  },
  async () => json(accounts.map(({ id, email, provider }) => ({ id, email, provider })))
);

// Exit when the MCP client disconnects — lingering IMAP sockets would
// otherwise keep the process alive after stdin closes.
process.stdin.on("end", () => process.exit(0));
process.stdin.on("close", () => process.exit(0));

const transport = new StdioServerTransport();
await server.connect(transport);
console.error(`gmail-multi MCP server ready — accounts: ${accountIds.join(", ")}`);
