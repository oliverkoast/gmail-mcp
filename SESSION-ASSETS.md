# Session Assets — copy each block in order

Each block below has a copy button (top right of the block). Copy the next one
when Oliver says so, paste into Claude, press Enter.

## Step 1 — Update and check

```text
Go to my multi-email-mcp folder, run git pull, then npm install. Then make sure my .env has the line MS_TENANT=organizations (add it if missing). Then run npm run check and show me the results per account. Don't fix anything yet, just report.
```

## Step 2 — Fix the jonsieff sign-in

```text
Delete the cached token for the jonsieff account (in the tokens/ folder) and re-run the auth for it. Open the browser sign-in and wait for me to complete it.
```

When Microsoft asks which account type: choose WORK OR SCHOOL.

## Step 3 — Verify jonsieff

```text
Search the jonsieff account for "Arcforma" and show the results with dates and senders.
```

## Step 4 — Add Conan Capital

```text
Add a new account to the .env: id "conancap", provider "outlook", email js@conancap.com. Then run the auth for it and open the browser sign-in for me. When it's done, search that account for a recent email and show me the result.
```

## Step 5 — Add Polymateria

```text
Add the Polymateria account to the .env if it isn't there: id "polymateria", provider "outlook", email js@polymateria.com. Run the auth and open the sign-in for me. When it's done, search that account for "board" and show the results.
```

## Step 6 — Wire it in everywhere

```text
Register this mail server for the Claude CLI as well, using: claude mcp add --scope user mail -- node (full path to multi-email-mcp)/src/server.js — work out the full path yourself. Then run claude mcp list and confirm the mail server shows as connected.
```

## Step 7 — The cross-company test

```text
Using the mail connector with account "all", pull the last 3 days of mail across ALL my accounts and give me a cross-company summary, labeled by which account each item came from. Tell me explicitly which accounts you pulled from.
```

## Step 8 — Paste into Cowork Settings → personal preferences

```text
Who I Am: Jonathan Sieff. Founder and board member across four companies: Polymateria, Conan Capital, AdvoTech, and Texas Venture Partners. Based in London, I work at board level rather than day-to-day operations, so my focus is strategy, brand, performance, and preparing for board meetings across all four businesses at once.

How to handle my email: when I ask about my email, briefings, or anything across my companies, always use the multi-email mail connector tools (search_mail / list_recent with account "all"), they cover ALL my accounts. The built-in Microsoft connector only sees Polymateria; never rely on it alone. Tell me which accounts you pulled from.
```

## Step 9 — Save my about-me file

```text
Save the following as ~/Documents/Claude/about-me.md, then confirm it saved:

# ABOUT ME: Jonathan Sieff

*Last updated: July 2026*

## Who I am

I'm a founder and board member based in London. I sit on the boards of four companies: Polymateria, Conan Capital, AdvoTech, and Texas Venture Partners. My background is in building and running consumer-facing businesses across retail, manufacturing, and distribution, with a particular focus on brands and intellectual property.

My role today is less about day-to-day operations and more about strategy, brand, and long-term direction across the companies I'm involved with. Outside of business, I stay active with a number of foundations and charities.

## My work

I work at board level across four companies, so my week is spread across different businesses rather than a single desk. Much of it is understanding how each one is performing, preparing for board meetings, and working closely with the founders and management teams who run things day to day.

The materials I lean on most are board packs, management accounts, financial models, and the correspondence that flows in from each company. Because I move between companies constantly, keeping a clear and current view across all of them matters more to me than anything else, and pulling that picture together quickly is where I most want help. When preparing for a board meeting, I want the recent updates, the open items, and the strategic questions worth asking, drawn from my email and shared files with sources I can check.

## Background

Before my current work, I founded Fashion Lab, a manufacturing group that was later acquired by a global sourcing and logistics company. Over more than twenty years I've worked on multiple branding and distribution businesses, which is where my focus on multi-consumer brands and intellectual property took shape.

I'm a founder and board member of Polymateria, a London company developing technology that helps conventional plastics biodegrade. Alongside my business work, I stay involved with several foundations and charities.
```

## Step 10 — The daily morning brief (after Step 7 works)

```text
Set up a local scheduled job on this Mac that writes me a cross-company briefing every weekday morning at 7:00am. It MUST run locally (not as a cloud task) so it can reach the mail connector. Create a script that runs Claude headlessly with a prompt that reads the last 24 hours across ALL my accounts using the mail connector's own tools by name (list_recent / search_mail with account "all", never the built-in connectors), writes a briefing grouped by company covering key items, anything needing my reply, and the top 3 actions, saves it to ~/Briefings/YYYY-MM-DD.md, and shows a notification. Pre-approve the mail connector's read tools so the scheduled run never stalls on permissions. Use launchd, not cron, so it runs after wake. Run it once now as a test and show me today's briefing.
```
