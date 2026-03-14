# Reorganize Notion Second Brain by Strategic Objectives (Proposal)

## Goal
Make Notion’s structure mirror the **7 SlideHeroes strategic objectives** (same mental model as Mission Control + Todoist), so anything we capture or create can be found via:
- **Objective → Initiative → Artifact** (resource, best practice, spec, decision, deliverable)
- Cross-cutting views like “this week’s work”, “things awaiting Mike”, etc.

This doc focuses on **information architecture + migration steps** (not an opinionated content rewrite).

## Non-goals
- Rewriting old notes/content for style.
- Replacing Mission Control (MC) with Notion.
- Implementing the full change automatically (Notion API automation can be a follow-up).

---

## Proposed Top-Level Notion Navigation
Create (or standardize) a left-nav with these top-level pages:

1. **🏠 Home (Dashboard)**
   - Quick links: Mission Control, Todoist, SOPs, Product docs
   - “Recently updated” rollup
   - “Inbox (to triage)” view

2. **🎯 Strategy (Objectives & Initiatives)**
   - One page per objective (Obj 1–7)
   - Each objective page lists its initiatives and “active projects”

3. **🧠 Knowledge (Resources & Best Practices)**
   - Resources database (articles, videos, threads)
   - Best Practices database (actionable practices linked to resources)
   - Both tagged by objective/initiative where applicable

4. **📚 Docs (Shared)**
   - Specs, decision logs, research summaries, working agreements
   - SOPs get a dedicated filtered view (or a top-level “SOPs” shortcut)

5. **📥 Inbox (Unprocessed)**
   - Default landing for anything captured that isn’t classified yet

6. **🗂 Archive**
   - Old structures preserved temporarily during migration

---

## Core Taxonomy (Minimal Fields)
To keep things consistent across databases, use a shared taxonomy:

### Required tags (where relevant)
- **Strategic Objective** (select):
  - Obj 1 — Product Customers Love
  - Obj 2 — Audience
  - Obj 3 — Convert Existing
  - Obj 4 — Acquire New
  - Obj 5 — Delight & Retain
  - Obj 6 — AI Systems
  - Obj 7 — Business OS

- **Initiative** (select or relation): name of initiative under the objective

### Optional but useful
- **Status** (select): Inbox / Active / Waiting / Done / Archived
- **Owner** (person/select): Mike / Sophie / Both
- **Type** (select): Research / Spec / Decision / Deliverable / SOP / Reference
- **Source Link** (url): for resources and externally-referenced docs

---

## Database-by-Database Changes

### 1) Resources (already exists)
**Keep the database**, add properties:
- Strategic Objective (select)
- Initiative (select)
- Processing Status (select): Inbox / Extracted / No Action / Archived

Add standard views:
- **Inbox** (Processing Status = Inbox)
- **By Objective** (group by Strategic Objective)
- **Last 30 days** (Date Consumed within 30d)

### 2) Best Practices (already exists)
Add/standardize properties:
- Strategic Objective (select)
- Initiative (select)
- Applied? (checkbox) — already present

Views:
- **By Objective** (group)
- **Unapplied High-Value** (if you later add Rating)
- **Recently Added**

### 3) Docs (create if not clean today)
If you already have many pages floating around, convert to a **Docs database** with:
- Title
- Type (Spec/Decision/Deliverable/SOP/Reference)
- Strategic Objective
- Initiative
- Owner
- Status

Views:
- **SOPs** (Type = SOP)
- **Waiting on Mike** (Status = Waiting, Owner includes Mike)
- **By Objective** (group)

---

## Mapping Rules (How to Classify Things)
Use these simple heuristics:
1. **If it helps us collaborate (Mike↔Sophie) and will be referenced again → Docs database.**
2. **If it’s external input (article/video/thread) → Resources database.**
3. **If it’s an actionable takeaway → Best Practices database (linked to a Resource).**
4. **If it’s operational state / running log → keep in Sophie workspace (not Notion).**

---

## Migration Plan (Low Risk)

### Phase 0 — Create the scaffolding (30–60 min)
- Create the top-level pages listed above.
- Add the new properties to Resources / Best Practices.
- Create Docs database (or confirm an existing one and align fields).

### Phase 1 — “Now forward” rule (immediate)
- New items must be tagged with Objective (and Initiative if clear).
- Anything unclear goes to **Inbox** with Objective = (blank) and Status = Inbox.

### Phase 2 — Backfill the last 30–90 days (1–2 sessions)
- Batch triage recent Resources and Best Practices:
  - Add Objective + Initiative
  - Mark Processing Status

### Phase 3 — Archive the old structure (one session)
- Move legacy top-level pages into Archive.
- Leave redirects/links on Home for any still-used legacy pages.

---

## Nice-to-Haves (Optional Follow-ups)
- **Notion templates** for:
  - Research note
  - Spec
  - Decision log
  - SOP
- **Automation** (future): if an item is created via capture system, pre-fill Objective guesses (via LLM) and set Status=Inbox.

---

## Suggested Next Step
If you want, I can:
1) Translate this into a checklist you can execute quickly inside Notion, or
2) Do a “migration sprint plan” (what to tag first, which views to create), or
3) Implement Notion changes via API (requires agreeing on exact database IDs + safe scope).
