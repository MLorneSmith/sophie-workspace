# Mission Control Docs Strategy: Recommendation

*Prepared by Sophie | February 2026*

---

## Executive Summary

Mission Control Docs should focus exclusively on **collaboration artifacts** — documents that help Mike and Sophie work together effectively. Personal knowledge lives in Notion. Sophie's operational memory lives in her workspace. MC Docs is the **shared interface** between the two.

---

## 1. Philosophy: "The Collaboration Layer"

### What Mission Control Is For
Mission Control exists to **optimize collaboration** between you and me. Therefore, MC Docs should contain:
- Documents we both need to reference
- Outputs I produce for your review
- Context that helps me work on your projects
- Templates for recurring collaboration patterns

### What Mission Control Is NOT For
- Your personal knowledge (→ Notion)
- My operational state (→ Sophie workspace: `memory/`, `state/`)
- Task management (→ MC Kanban + Todoist)
- General reference material (→ Notion Resources)

### The Test
Before adding a doc to MC, ask: **"Does Sophie need this to collaborate with Mike?"**
- Yes → MC Docs
- No, it's Mike's knowledge → Notion
- No, it's Sophie's operational data → Sophie workspace

---

## 2. Recommended Document Categories

### Category 1: Project Contexts
**Purpose:** Give Sophie the context needed to work on projects

| Document Type | Example | Update Frequency |
|---------------|---------|------------------|
| Project Brief | "SlideHeroes AI MVP - Brief" | At project start, major pivots |
| Technical Specs | "AI Generation API Design" | As architecture evolves |
| Decision Log | "Why we chose X over Y" | After key decisions |

**Tags:** `project`, `[project-name]`

### Category 2: Sophie Deliverables
**Purpose:** Outputs Sophie produces for Mike's review

| Document Type | Example | Update Frequency |
|---------------|---------|------------------|
| Recommendations | "Notion Structure Recommendation" | On completion |
| Research Reports | "Competitor Analysis Q1 2026" | Periodic |
| Design Proposals | "Feed Monitor v2 Architecture" | Before implementation |

**Tags:** `deliverable`, `[topic]`

### Category 3: Working Agreements
**Purpose:** How we collaborate (stable, rarely changes)

| Document Type | Example | Update Frequency |
|---------------|---------|------------------|
| Collaboration Guide | "How Sophie Works on Code" | When process changes |
| Communication Prefs | "When to Notify Mike" | As needed |
| Quality Standards | "PR Review Checklist" | When standards evolve |

**Tags:** `agreement`, `process`

### Category 4: Reference (Shared)
**Purpose:** Information we both need quick access to

| Document Type | Example | Update Frequency |
|---------------|---------|------------------|
| API Keys/Endpoints | "SlideHeroes API Reference" | When APIs change |
| Account Info | "Service Accounts List" | When accounts added |
| Environment Setup | "Dev Environment Guide" | When setup changes |

**Tags:** `reference`, `[system-name]`

---

## 3. Integration with Sophie's Memory

### Current Sophie Memory Structure
```
~/clawd/
├── MEMORY.md          # Long-term curated memories
├── memory/            # Daily notes, session logs
│   ├── 2026-02-02.md
│   └── ...
├── state/             # Live operational state
│   ├── current.md     # What's happening now
│   └── ROUTINES.md    # Recurring procedures
└── deliverables/      # ← NEW: Outputs for MC Docs
```

### How They Connect

| Sophie's Memory | Purpose | Syncs to MC Docs? |
|-----------------|---------|-------------------|
| `MEMORY.md` | Personal context about Mike | ❌ No (private) |
| `memory/*.md` | Session logs | ❌ No (operational) |
| `state/current.md` | Live work state | ❌ No (ephemeral) |
| `deliverables/*.md` | Outputs for Mike | ✅ Yes |

### Proposed Workflow

1. **Sophie creates deliverable** → writes to `~/clawd/deliverables/`
2. **Sophie registers with MC** → POST to `/api/docs` with content + tags
3. **Mike reviews in MC Docs** → sees rendered document with metadata
4. **If approved** → Mike can move to Notion (for long-term reference)
5. **If feedback** → Sophie revises, updates MC doc

This keeps:
- Sophie's working files in her workspace (git-backed)
- Polished outputs visible in MC Docs UI
- Clear handoff point for collaboration

---

## 4. Document Lifecycle

### Creation
```
Sophie produces work
    ↓
Writes to ~/clawd/deliverables/[name].md
    ↓
Registers with MC Docs API (tags, metadata)
    ↓
Appears in MC Docs UI for Mike
```

### Review & Iteration
```
Mike reviews in MC Docs
    ↓
Provides feedback (Discord/MC comments)
    ↓
Sophie revises in deliverables/
    ↓
Updates MC Doc via API
    ↓
Repeat until approved
```

### Archive/Graduation
```
Document complete/approved
    ↓
Option A: Stays in MC Docs (ongoing reference)
Option B: Mike copies to Notion (personal knowledge)
Option C: Archive in MC (still searchable)
```

---

## 5. Tag Taxonomy

Consistent tags make docs findable:

### Primary Category Tags
- `project` — Project-specific context
- `deliverable` — Sophie outputs for review
- `agreement` — Working agreements/processes
- `reference` — Shared quick-reference info

### Secondary Tags
- `[project-name]` — e.g., `slideheroes`, `newsletter`, `feed-monitor`
- `[topic]` — e.g., `architecture`, `strategy`, `research`
- `draft` — Work in progress
- `approved` — Reviewed and accepted
- `archived` — No longer active but kept for reference

### Example Tag Combinations
- Notion recommendation: `deliverable`, `research`, `approved`
- SlideHeroes MVP brief: `project`, `slideheroes`, `brief`
- PR review checklist: `agreement`, `process`, `code`

---

## 6. What NOT to Store in MC Docs

| Don't Store | Why | Where Instead |
|-------------|-----|---------------|
| Meeting notes (personal) | Mike's knowledge | Notion |
| Research articles | General reference | Notion Resources |
| Daily journals | Mike's reflection | Notion |
| Sophie conversation logs | Operational | `memory/*.md` |
| Config/secrets | Security | Encrypted/env vars |
| Large binary files | Performance | External storage |

---

## 7. Implementation Recommendations

### Technical (Optional Enhancements)
1. **Auto-sync from deliverables/** — Script to register new files with MC Docs API
2. **Version tracking** — Show edit history in MC Docs UI
3. **Comments** — Allow Mike to leave feedback on docs
4. **Notion export** — One-click copy to Notion

### Process
1. **Create `~/clawd/deliverables/` folder** — Done ✓
2. **Sophie writes deliverables there** — Starting now
3. **Weekly cleanup** — Archive completed deliverables
4. **Quarterly review** — Audit tags, remove stale docs

---

## 8. Relationship to Other Systems

```
┌─────────────────────────────────────────────────────────────┐
│                     MIKE'S ECOSYSTEM                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐   │
│  │   NOTION    │     │   MISSION   │     │   TODOIST   │   │
│  │  (Second    │◄───►│   CONTROL   │◄───►│  (Task      │   │
│  │   Brain)    │     │  (Collab)   │     │  Execution) │   │
│  └─────────────┘     └──────┬──────┘     └─────────────┘   │
│        │                    │                    │          │
│        │              ┌─────┴─────┐              │          │
│        │              │  MC DOCS  │              │          │
│        │              │ (Shared   │              │          │
│        │              │  Artifacts)│              │          │
│        │              └─────┬─────┘              │          │
│        │                    │                    │          │
│        │                    ▼                    │          │
│        │         ┌─────────────────┐            │          │
│        │         │     SOPHIE      │            │          │
│        └────────►│   (AI Agent)    │◄───────────┘          │
│                  │                 │                        │
│                  │  ┌───────────┐  │                        │
│                  │  │ memory/   │  │                        │
│                  │  │ state/    │  │                        │
│                  │  │ MEMORY.md │  │                        │
│                  │  └───────────┘  │                        │
│                  └─────────────────┘                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Flow:**
- Mike's knowledge → Notion
- Mike-Sophie shared work → MC Docs
- Sophie's operations → Sophie workspace
- Task execution → Todoist (Mike) + MC Kanban (Sophie)

---

## Summary

MC Docs = **The handoff zone**

| Belongs in MC Docs | Doesn't Belong |
|-------------------|----------------|
| Sophie's deliverables | Mike's personal notes |
| Project contexts for Sophie | General reference material |
| Working agreements | Sophie's operational memory |
| Shared reference | Tasks (use Kanban) |

Keep it focused. If it's not about collaboration, it goes elsewhere.

---

*This recommendation builds on the Notion Second Brain structure (Task #15). Next: Best Practices Extraction System (Task #14) will define how extracted insights flow into both Notion and MC Docs.*
