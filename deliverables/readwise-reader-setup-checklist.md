# Readwise Reader — Configuration & Consolidation Checklist

## Goal
Consolidate inbound reading into **Readwise Reader** (RSS + newsletters + articles) so highlights + notes flow into the same capture/knowledge pipeline.

## Phase 1 — Import RSS from Feedly
**Option A (best): OPML export from Feedly → import to Readwise**
1. In Feedly: export subscriptions as **OPML**.
   - Feedly typically supports OPML export from the Organizer/Settings area.
2. In Readwise Reader:
   - Add content → **RSS** → Import **OPML**.
3. Verify:
   - Folder/collection structure imported as expected
   - A few feeds successfully fetch recent posts

**Option B: CSV list of feed URLs → bulk import**
If OPML export is annoying, gather feed URLs and import in batches.

## Phase 2 — Newsletters → Readwise
Pick one of these patterns:

1) **Unique Readwise email address**
- Readwise provides a “send-to” email address.
- Forward newsletters to that address.

2) **Gmail filter/forwarding** (recommended)
- Create a Gmail label: `Readwise/Newsletters`
- For each newsletter sender:
  - Filter: `from:(sender@domain.com)`
  - Actions: Apply label + Forward to Readwise address (or auto-forward if supported)
- Add a catch-all rule for known newsletter keywords if useful.

## Phase 3 — Other sources
- **Twitter/X threads**: use Reader’s web capture / “save to Reader” flow.
- **YouTube**: decide whether to read transcripts in Reader or keep in the #capture pipeline.
- **PDFs**: use Reader’s upload/import; verify highlight export to Readwise works.

## Phase 4 — Triage views (to avoid a giant unread list)
In Reader, create saved views (or use built-ins) for:
- **Daily skim** (short posts)
- **Deep reads** (longform)
- **To extract practices** (things likely to become best practices)

## Phase 5 — Integrate with our capture system
Recommendation:
- Reader is for *consumption + annotation*
- #capture / Mission Control is for *structured extraction* (Resource + 3–7 best practices)

Workflow:
1. Read in Reader → highlight
2. If it’s worth capturing: copy URL into #capture
3. Sophie extraction creates Resource + Practices, and links back to the original

## Open Questions (to decide quickly)
1. What’s the target “inbox zero” cadence? (daily skim vs weekly batch)
2. Do we want folders in Reader to mirror **Strategic Objectives**, or keep Reader topic-based and tag later in MC/Notion?

## Next Step
If you send me:
- the Feedly OPML (or a list of top feeds), and
- the list of newsletter senders you care about,
I can propose a clean Reader folder/view scheme and a Gmail filter plan.
