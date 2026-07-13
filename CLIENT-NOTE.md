# For Jonathan — unified mail briefing across your companies

## What this does

Claude's built-in email connection can only reach one account in one company
at a time. This is a small local tool that logs into each of your accounts
independently and gives Claude read-only access to all of them at once, so it
can produce a single daily briefing that reads across every company's mail —
full history, no forwarding, nothing leaving your machine.

## What I've already proven

I built and tested it end-to-end on three of my own accounts: three separate
logins, one connection, and Claude searching and reading across all three from
a single question. The design is account-agnostic, so your accounts are just
more entries in the config — the code doesn't change.

## What setup looks like for your four accounts

Everything runs on your machine. You'll type your own passwords and sign-ins;
I never see them, and nothing gets pasted into a chat. Per account it's one of:

- **Google account** — a two-minute self-serve step (turn on 2-Step
  Verification if it isn't already, generate a one-time "app password"). No IT
  involvement under normal settings.
- **Microsoft 365 account** — a normal sign-in screen where you approve
  **read-only** access to your own mailbox (your usual MFA applies). Two
  outcomes: it either works immediately, or your company shows a "needs admin
  approval" screen, which automatically files a request to your IT. For those,
  I'll hand you a ready-to-send note that tells IT exactly what they're
  approving: read-only access to one named mailbox, standard and revocable.

You don't need to be an admin of any company for this. The only thing IT can
be asked for is to approve a read-only, auditable, revocable permission for
your own mailbox — one of the easiest requests they field.

## The one piece I set up on my side

For the Microsoft accounts, there's a one-time registration I create so
Microsoft's sign-in will recognize the tool. It holds no passwords and is
reusable. We'll decide together whether that lives in my environment or gets
created inside one of your companies so your own IT owns it — a five-minute
call once I see how your four tenants are configured.

## What you get at the end

Ask Claude something like *"give me today's cross-company briefing"* and it
reads across all four inboxes and writes one summary. We can then set that to
run automatically each morning.
