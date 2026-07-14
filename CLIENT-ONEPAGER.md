# Connect Claude to all your email — one setup, ~15 minutes

**What you'll get:** Claude able to search and read across *all* your work
inboxes at once (across every company), so it can write you a single daily
briefing. Read-only, your own mailboxes, your passwords never leave your
machine.

---

## Before you start (one-time)

You need two free things installed on your computer:

1. **Claude Code** — the tool that will do the setup for you.
   → https://claude.com/claude-code  (sign in with your Claude account)
2. **Node.js** (Claude Code uses it) — install the "LTS" version.
   → https://nodejs.org

That's it. You won't type any code — Claude Code does that part.

---

## Step 1 — Get the framework

Open **Claude Code** and paste the prompt in the box below. It will download
the tool, install it, and then walk you through connecting each account one at
a time.

> **Setup prompt — paste this into Claude Code:**
>
> Clone the repo at **https://github.com/oliverkoast/multi-email-mcp** into a folder
> in my home directory and run `npm install` in it. Then open
> `CLIENT-SETUP.md` and walk me through
> connecting my email accounts to it, ONE AT A TIME, telling me exactly what
> to click. My accounts are:
> - <email 1> (Microsoft 365)
> - <email 2> (Microsoft 365)
> - <email 3> (Microsoft 365)
> - <email 4> (Google Workspace)
>
> I'll type my own passwords and sign-ins — never ask me to paste a password
> into the chat. For each Microsoft account, open the browser sign-in and let
> me approve read-only access. For the Google account, use the app-password
> steps. When everything's connected, run `npm run check` to confirm, wire it
> into my Claude, and then prove it works by searching all my accounts for a
> keyword and showing the results labeled by account.

---

## Step 2 — Follow Claude's lead (the only hands-on part)

For each account, Claude will pause and tell you what to do:

- **Microsoft accounts:** a browser sign-in opens. Sign in with your work
  account (your normal login + phone approval), then click **Accept** on the
  "read-only mail" screen.
  - If you see **"Needs admin approval"** instead: Claude will hand you a short
    email — forward it to that company's IT so they can approve read-only
    access. Then move on; that account connects once they say yes.
- **Google account:** Claude walks you through creating a one-time
  "app password" (a two-minute click-through). Paste it where Claude tells you.

You are never asked to share a password in the chat, and every permission is
**read-only** — Claude can read your mail, never send, delete, or change it.

---

## Step 3 — You're done

When Claude shows a merged list of mail from all your accounts, it's working.
Try this:

> **Daily briefing prompt:**
>
> Read across all my connected email accounts and write me today's
> cross-company briefing: the most important items from each company, anything
> that needs a reply, and what I should act on first.

Later we can set that to run automatically every morning.

---

**Questions or something's blocked?** Send me the message Claude showed you and
I'll sort it out. You can disconnect any account at any time — just ask Claude
"how do I revoke access to <account>?"
