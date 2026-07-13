// Connection smoke test: verifies every configured account end-to-end
// (IMAP login, or OAuth token refresh + one API call) and prints a message
// count. Run with `npm run check` — no MCP client needed.

import { loadAccounts } from "./config.js";
import { providerFor } from "./provider.js";

const accounts = loadAccounts();
let failed = false;

for (const account of accounts) {
  try {
    const summary = await providerFor(account).checkAccount(account);
    console.log(`✅ ${account.id} [${account.provider}] — ${summary}`);
  } catch (err) {
    failed = true;
    console.error(`❌ ${account.id} [${account.provider}] (${account.email}) — ${err.message}`);
  }
}

process.exit(failed ? 1 : 0);
