# Client setup runbook — unified mail access for Claude

One local MCP server gives Claude read-only search across all of your email
accounts at once. Nothing is sent anywhere: the server runs on your machine,
credentials stay in a local file, and the code physically contains no
send/delete/modify operations.

## What gets installed

- Node.js (LTS) if not already present
- This folder (`gmail-mcp`), with your account credentials in a local `.env`
  file and OAuth tokens (if any) in `tokens/` — both excluded from version
  control

## Per-account setup — pick the lane per account

### Lane A — Gmail with an app password (fastest, ~5 min, no IT needed)

Works when your Google account allows app passwords (most do by default).

1. Signed in as the account, open <https://myaccount.google.com/apppasswords>
   - If it asks you to enable **2-Step Verification** first, do that
     (Security → 2-Step Verification), then come back.
   - If the page says app passwords aren't available for your account, your
     org has disabled them — use **Lane B** for this account.
2. App name: `claude-mail` → **Create** → copy the 16-character password.
3. Add the account to `.env` (spaces in the password are fine):
   ```
   MAIL_WORK_EMAIL=you@yourcompany.com
   MAIL_WORK_APP_PASSWORD=xxxx xxxx xxxx xxxx
   ```
   and append `work` to `MAIL_ACCOUNTS`.

### Lane B — Gmail via Google OAuth (when IT disabled IMAP/app passwords)

Uses the Gmail API with the **read-only** scope. One-time browser sign-in.

1. In `.env`: set `MAIL_<ID>_PROVIDER=gmail-api` and the account email
   (the `GOOGLE_OAUTH_CLIENT_ID/SECRET` app settings are already filled in
   by your consultant).
2. Run `npm run auth <id>` → a browser opens → sign in as that account →
   approve the read-only Gmail permission.
3. If Google blocks the sign-in with an admin-approval message, your org
   restricts third-party apps — send IT the **Google IT request** below and
   re-run after they approve.

### Lane C — Microsoft 365 / Outlook (via Microsoft Graph)

One-time device-code sign-in with the **Mail.Read** (read-only) permission.

1. In `.env`: set `MAIL_<ID>_PROVIDER=outlook` and the account email.
2. Run `npm run auth <id>` → it prints a URL + short code → open the URL,
   enter the code, sign in with the account. MFA works normally.
3. If you see "Need admin approval", your org requires admin consent — send
   IT the **Microsoft IT request** below and re-run after they approve.

## Verify + wire into Claude

```sh
npm run check          # one ✅ line per account with a message count
```

**Claude Desktop** — add to `claude_desktop_config.json`
(macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "mail": {
      "command": "node",
      "args": ["/ABSOLUTE/PATH/TO/gmail-mcp/src/server.js"]
    }
  }
}
```

then fully quit and reopen Claude Desktop.

**Claude Code:**

```sh
claude mcp add --scope user mail -- node /ABSOLUTE/PATH/TO/gmail-mcp/src/server.js
```

Smoke test in Claude: *"Search all my accounts for `<keyword>` and show which
account each result came from."*

## IT request templates

**Google IT request** (org restricts third-party app access):

> Subject: Allowlist a read-only Gmail OAuth app for <user@org.com>
>
> Please allow the OAuth app with client ID `<GOOGLE_OAUTH_CLIENT_ID>` to
> access Google data for <user@org.com>, scope
> `https://www.googleapis.com/auth/gmail.readonly` (read-only mail; no send,
> modify, or delete). Admin console → Security → API controls → App access
> control → Configure new app. This is a locally-run mail search tool; access
> is revocable anytime from the user's account permissions page.

**Microsoft IT request** (tenant requires admin consent):

> Subject: Approve a read-only mail app for <user@org.com>
>
> Please grant admin consent for the app registration `<MS_CLIENT_ID>`
> ("claude-mail") requesting only the delegated Microsoft Graph permission
> `Mail.Read` (read the signed-in user's own mailbox; no send or modify).
> The consent request should already be pending under Entra ID → Enterprise
> applications → Admin consent requests. Access is revocable anytime under
> the user's My Apps or by removing the enterprise application.

## Consultant prerequisites (one-time, before the engagement)

These create the shared OAuth "apps" that lanes B and C sign in through.
Lane A needs nothing.

**Google OAuth client (lane B)** — in <https://console.cloud.google.com>:

1. Create a project (e.g. `claude-mail`) → APIs & Services → **Enable the
   Gmail API**.
2. OAuth consent screen: External, app name `claude-mail`, add each lane-B
   user's email as a **test user**.
3. Credentials → Create credentials → OAuth client ID → **Desktop app** →
   copy client ID + secret into `.env`.
4. ⚠️ **Testing-mode gotcha:** while the consent screen is in "Testing"
   status, refresh tokens **expire after 7 days** (re-run `npm run auth`).
   Publishing to Production for the `gmail.readonly` restricted scope
   requires Google's app verification — heavy. For a long-term client
   deployment on a **Workspace** account, the clean fix is to create this
   OAuth client in a GCP project under the *client's own* Workspace org with
   consent screen type **Internal**: no verification, no 7-day expiry, and
   their IT gets full ownership. For personal `@gmail.com` accounts, prefer
   lane A (app passwords) — lane B there is demo-grade only.

**Entra ID app registration (lane C)** — in <https://entra.microsoft.com>
(any Microsoft work account can create a free tenant):

1. App registrations → New registration → name `claude-mail` → supported
   account types: **"Accounts in any organizational directory and personal
   Microsoft accounts"**.
2. Authentication → Advanced settings → **"Allow public client flows" = Yes**
   (required for the device-code sign-in — the flow fails without it).
3. API permissions → Add → Microsoft Graph → Delegated → **Mail.Read**.
4. Copy the Application (client) ID into `.env` as `MS_CLIENT_ID`.

No client secret is needed (public client), so the registration itself
contains nothing sensitive. One registration covers every Outlook account in
every engagement.

## Revoking access (any time, ~30 seconds)

- **Lane A:** delete the app password — myaccount.google.com → Security →
  2-Step Verification → App passwords.
- **Lane B:** remove the app — <https://myaccount.google.com/permissions>.
- **Lane C:** remove the app — <https://myapps.microsoft.com> → app → Remove
  (or your admin removes the enterprise app).
- Locally: delete `.env` and `tokens/` and the server can read nothing.
