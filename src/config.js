// Account list is driven entirely by env vars so adding a 4th/5th account
// never touches code:
//
//   GMAIL_ACCOUNTS=arcforma,formai,personal
//   GMAIL_ARCFORMA_EMAIL=oliver@arcforma.ai
//   GMAIL_ARCFORMA_APP_PASSWORD=xxxxxxxxxxxxxxxx
//   ...
//
// Each id in GMAIL_ACCOUNTS maps to GMAIL_<ID>_EMAIL / GMAIL_<ID>_APP_PASSWORD
// (id uppercased). App-password spaces are stripped, so pasting Google's
// "xxxx xxxx xxxx xxxx" format as-is works.

import dotenv from "dotenv";
import { fileURLToPath } from "node:url";
import path from "node:path";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
dotenv.config({ path: path.join(projectRoot, ".env"), quiet: true });

export function loadAccounts() {
  const ids = (process.env.GMAIL_ACCOUNTS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (ids.length === 0) {
    throw new Error(
      "No accounts configured. Set GMAIL_ACCOUNTS in .env (see .env.example)."
    );
  }

  const missing = [];
  const accounts = ids.map((id) => {
    const key = id.toUpperCase().replace(/[^A-Z0-9]/g, "_");
    const email = process.env[`GMAIL_${key}_EMAIL`];
    const password = (process.env[`GMAIL_${key}_APP_PASSWORD`] || "").replace(/\s+/g, "");
    if (!email) missing.push(`GMAIL_${key}_EMAIL`);
    if (!password) missing.push(`GMAIL_${key}_APP_PASSWORD`);
    return { id, email, password };
  });

  if (missing.length) {
    throw new Error(`Missing env vars for configured accounts: ${missing.join(", ")}`);
  }

  return accounts;
}

export function resolveAccounts(accounts, selector) {
  if (!selector || selector === "all") return accounts;
  const found = accounts.find(
    (a) => a.id === selector || a.email.toLowerCase() === selector.toLowerCase()
  );
  if (!found) {
    const known = accounts.map((a) => `${a.id} (${a.email})`).join(", ");
    throw new Error(`Unknown account "${selector}". Known accounts: ${known}, or "all".`);
  }
  return [found];
}
