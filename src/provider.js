// Provider dispatch: every provider module exposes the same read-only
// surface (searchMail, listRecent, readMessage, checkAccount) over the same
// normalized result shape, so the MCP tools don't care what's behind an
// account.

import * as gmailImap from "./providers/gmail-imap.js";
import * as gmailApi from "./providers/gmail-api.js";
import * as outlookGraph from "./providers/outlook-graph.js";

const providers = {
  gmail: gmailImap,
  "gmail-api": gmailApi,
  outlook: outlookGraph,
};

export function providerFor(account) {
  const provider = providers[account.provider];
  if (!provider) throw new Error(`${account.id}: unknown provider "${account.provider}"`);
  return provider;
}
