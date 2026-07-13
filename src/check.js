// Connection smoke test: logs into every configured account over IMAP and
// prints the All Mail message count. Run with `npm run check` after filling
// in .env — no MCP client needed.

import { ImapFlow } from "imapflow";
import { loadAccounts } from "./config.js";

const accounts = loadAccounts();
let failed = false;

for (const account of accounts) {
  const client = new ImapFlow({
    host: "imap.gmail.com",
    port: 993,
    secure: true,
    auth: { user: account.email, pass: account.password },
    logger: false,
  });
  try {
    await client.connect();
    const status = await client.status("[Gmail]/All Mail", { messages: true });
    console.log(`✅ ${account.id} (${account.email}) — ${status.messages} messages in All Mail`);
    await client.logout();
  } catch (err) {
    failed = true;
    console.error(`❌ ${account.id} (${account.email}) — ${err.message}`);
    if (/Invalid credentials|AUTHENTICATIONFAILED/i.test(String(err))) {
      console.error(
        "   → Check the app password (16 chars, spaces ok) and that 2-Step Verification is on for this account."
      );
    }
  }
}

process.exit(failed ? 1 : 0);
