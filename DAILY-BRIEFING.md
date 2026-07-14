# Automating the daily cross-company briefing

Once your accounts are connected, this makes Claude write you a briefing every
weekday morning automatically.

**Important — it must run locally, not in the cloud.** The mail connector runs
on *this* machine (it reads your inboxes from here). A *cloud* scheduled task
runs on a different computer and can't see it, so it would come back empty.
The prompt below sets up a job on this Mac instead.

## Paste this into Claude Code

> Set up a local scheduled job on this Mac that writes me a cross-company
> briefing every weekday morning by reading across all my connected email
> accounts.
>
> Requirements:
> 1. Use the `mail` connector already configured here (it reads all my company
>    inboxes). The job MUST run locally on this machine so it can reach that
>    connector — do not create a cloud scheduled task, those can't see local
>    connectors.
> 2. Create a script that runs Claude headlessly (`claude -p`) with a briefing
>    prompt that:
>    - reads the last 24 hours of mail across ALL my accounts (account "all"),
>    - writes a "Cross-company morning briefing" grouped by company, covering
>      the most important items from each, anything that needs a reply from me,
>      and the top 3 things to act on first,
>    - saves it to `~/Briefings/YYYY-MM-DD.md` and shows a macOS notification
>      when it's ready.
> 3. Make sure the scheduled run can use the `mail` connector's read tools
>    without stopping for an interactive permission prompt (pre-approve them).
> 4. Schedule it for 7:00am on weekdays, in my local timezone. On a Mac, prefer
>    a launchd job (StartCalendarInterval) over cron, so it still runs if the
>    laptop was asleep at 7 and wakes up later.
> 5. Tell me plainly: the Mac has to be powered on and logged in for it to run;
>    how to change the time; and how to turn it off.
> 6. Run it once right now as a test and show me today's briefing so I know it
>    works.

## What to expect

- The briefing lands in a `Briefings` folder in your home directory, one file
  per day, and you get a notification when it's ready.
- It runs only when your Mac is on and logged in. If you're away, it simply
  runs the next morning you're back.
- It's read-only, like everything else here — it reads your mail to summarize
  it, and never sends, deletes, or changes anything.
- To change the time, turn it off, or have it also cover weekends, just ask
  Claude.
