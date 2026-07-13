# gmail-mcp — multi-account Gmail MCP server

A small local MCP server (stdio) that gives Claude unified **read-only** access
to any number of Gmail accounts at once. Each account authenticates
independently over IMAP with a Google **app password**; one MCP connection
searches and reads across all of them.

## Why IMAP + app passwords (vs. Gmail API OAuth)

For accounts you control, app passwords are the lowest-friction path: no Google
Cloud project, no OAuth consent screen, no token storage/refresh — each account
needs only 2-Step Verification plus one generated password. Gmail's IMAP server
supports the `X-GM-RAW` extension, so full Gmail search syntax works
(`from:`, `has:attachment`, `newer_than:7d`, ...). The tradeoffs: an app
password is a full-access mailbox credential (not scoped to read-only), and a
Workspace admin can disable IMAP or app passwords org-wide. For a client
deployment across orgs you don't admin, plan to swap the auth layer for Gmail
API OAuth (`gmail.readonly` scope); the config and tool surface here wouldn't
change.

## Tools

| Tool | Params | Returns |
|---|---|---|
| `search_mail` | `query`, `account` (id / email / `"all"`), `limit` | subject, sender, date, snippet per match, labeled by account |
| `read_message` | `id`, `account` (specific — ids are per-account) | full parsed body + headers + attachment list |
| `list_recent` | `account`, `limit` | newest messages first |
| `list_accounts` | — | configured account ids + emails |

`account: "all"` fans out to every account in parallel and merges results
newest-first; a failing account comes back as an `errors` entry instead of
failing the call.

## Setup

1. `npm install`
2. `cp .env.example .env`
3. For **each** account: enable 2-Step Verification, then create an app
   password at <https://myaccount.google.com/apppasswords> and paste it into
   `.env` (spaces are fine).
4. `npm run check` — logs into every account and prints its All Mail count.

### Adding an account

Append an id to `GMAIL_ACCOUNTS` and add `GMAIL_<ID>_EMAIL` +
`GMAIL_<ID>_APP_PASSWORD` to `.env`. No code changes.

## Wiring into Claude Code

```sh
claude mcp add --scope user gmail -- node /path/to/gmail-mcp/src/server.js
```

Credentials are read from this project's own `.env` (path-resolved, so the
server works regardless of the working directory it's launched from).

## Security notes

- `.env` is git-ignored; nothing secret is ever committed.
- The server is read-only by construction: mailboxes are opened with a
  read-only lock and no send/modify commands exist in the code.
- Revoke access anytime by deleting the app password in the Google account
  (Security → 2-Step Verification → App passwords).
