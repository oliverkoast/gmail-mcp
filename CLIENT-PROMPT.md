# Handoff prompt for the client

The easiest delivery is: client installs Claude Code (or opens Claude
Desktop + Claude Code), then pastes the prompt below. Their Claude does the
cloning, installing, and hand-holding; CLIENT-SETUP.md carries the exact
per-account steps so the prompt stays short. The repo is public at
https://github.com/oliverkoast/multi-email-mcp — fill in the client's real account
emails below before sending. (CLIENT-ONEPAGER.md is the friendlier,
non-technical version of this.)

---

Set up unified mail access for Claude across my work email accounts.

1. Clone https://github.com/oliverkoast/multi-email-mcp into a folder in my home directory (or unzip the archive
   I was sent), run `npm install` inside it, and open CLIENT-SETUP.md.
2. I have these accounts — walk me through them ONE AT A TIME, telling me
   exactly what to click. Use "Lane A" from CLIENT-SETUP.md for any Google
   account (fall back to Lane B only if app passwords are blocked), and
   "Lane C" for any Microsoft 365 account:
   - <email 1> (Microsoft 365)
   - <email 2> (Microsoft 365)
   - <email 3> (Microsoft 365)
   - <email 4> (Google Workspace)
3. I will type all passwords and sign-ins myself — when a credential is
   needed, tell me where to put it and wait for me to say done. Never ask me
   to paste a password into the chat.
4. If an account is blocked by my company's IT, don't troubleshoot for more
   than a couple of minutes — send me the matching IT request email template
   from CLIENT-SETUP.md, fill in the placeholders, and move on to the next
   account.
5. When accounts are configured, run `npm run check` and show me the result,
   wire the server into my Claude app per the README, then prove it works:
   search all accounts for a keyword I give you and show the merged results
   labeled by account.

---

Notes for the consultant (Oliver):

- Fill in the real account emails + providers before sending.
- If any Google org is hardened (Lane B), do the GCP OAuth-client step from
  "Consultant prerequisites" first and commit the client ID into the prompt
  or .env.example you ship.
- The Entra app registration (Lane C) is yours, one-time, reusable across
  clients — its client ID is public by design and safe to ship in the repo's
  .env.example.
