# Session: 2026-02-08 16:03:29 UTC

- **Session Key**: agent:main:discord:channel:1466532593754312899
- **Session ID**: 4ec99a41-9045-49fb-b66d-7237bff13365
- **Source**: discord

## Conversation Summary

assistant: Everything works cleanly. Let me also clean up the old downloads directory since it's empty:
assistant: Done. Here's what I fixed:

**New: `manifest.json` — single source of truth**
Every presentation has an `id`, `firm`, `title`, `url`, `status`, `r2_key`, and `evaluation` (when scored). Status flows: `new` → `uploaded` → `evaluated_kept`/`evaluated_deleted`. Scripts update it after every action.

**Updated scripts:**
- `download-and-upload-batch.py` — reads manifest, only processes `status=new`, updates to `uploaded` after each success
- `evaluate-presentations.py` — reads manifest, only processes `status=uploaded`, updates to `evaluated_kept`/`evaluated_deleted`
- **New:** `status.py` — shows pipeline status at a glance

**Fixed:**
- No more fuzzy filename matching — manifest ID is the key
- No more README lies — it now documents the process, not fake counts
- No more separate `evaluated.json` as source of truth (kept as legacy, but manifest is canonical)
- Scripts save after each action, so interrupted runs don't lose progress
- Nightly sessions can just run `status.py` to see where things stand

**Current state (real numbers):**
- 125 total in manifest
- 8 kept as best practice examples
- 30 evaluated and deleted
- 26 uploaded, waiting for evaluation
- 60 still new (not yet downloaded)

The process should now be self-explanatory for any future session. Want me to kick off an evaluation run on those 26 waiting presentations tonight?
assistant: NO_REPLY
user: [Discord Guild #general channel id:1466532593754312899 +50s 2026-02-08 16:02 UTC] slideheroes: can you make sure this manifest.json file is clearly a 'presentation-research-manifest'. perhaps change the file name, as 'manifest' is pretty broad
[message_id: 1470087430190403792]
assistant: All references updated. Also updating the description inside the file itself:
assistant: Done — renamed to `presentation-research-manifest.json` and updated all script references, README, and the file's internal description. ✅
