# Session: 2026-02-05 15:09:02 UTC

- **Session Key**: agent:main:discord:channel:1466532593754312899
- **Session ID**: 5ad517da-53da-4bd2-ab65-6f3758ced6dd
- **Source**: discord

## Conversation Summary

assistant: Found it! **Process 1 has 33,959 restarts** — it's constantly crashing and restarting. There are also **two processes** with the same name running.
assistant: **Root cause found!**

There are **two PM2 processes** with the same name (`internal-tools-dev`), fighting over:
1. The Next.js dev lock file
2. Port 3000

Process 1 keeps crashing (34K restarts!) because process 0 has the lock. When it briefly starts on port 3002, it breaks the webpack HMR connection, causing the browser to refresh.

Fixing now:
assistant: **Fixed!** ✅

**Problem:** There were **two PM2 processes** named `internal-tools-dev`:
- Process 0: Running fine for 21h, 0 restarts
- Process 1: **34,000 restarts** — constantly crashing because process 0 had the lock

Every time process 1 tried to start, it would briefly grab port 3002, break the webpack HMR connection, then crash. The browser would detect the broken HMR and do a full page refresh.

**Solution:** Deleted the duplicate process. Now there's only one, running stable.

The random page refreshes should stop now. Give it a try!
