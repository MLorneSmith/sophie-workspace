# Sophie Context Files Review

**Date:** 2026-02-10
**Scope:** All .md files in ~/clawd/ and ~/clawd/state/ that define Sophie's behavior, memory, and configuration
**Files Reviewed:**
- SOUL.md
- USER.md
- AGENTS.md
- IDENTITY.md
- TOOLS.md
- HEARTBEAT.md
- MEMORY.md
- state/current.md
- state/ROUTINES.md
- .ai/SPAWN_RULES.md
- .ai/README.md
- .ai/README-loop-runner.md
- .ai/README-orchestrator.md
- templates/morning-briefing.md

---

## Executive Summary

Overall, Sophie's context files are **well-maintained and coherent**. The core files (SOUL.md, USER.md, IDENTITY.md) are stable, and there are no critical contradictions. However, several **outdated path references** and **stale workflow descriptions** exist that should be cleaned up to prevent confusion.

**Priority Level:** Low-Medium
**Issues Found:** 8 (1 high, 4 medium, 3 low)

---

## Critical Issues

### 1. 🚨 Outdated Codex Workflow Documentation (MEMORY.md)

**Location:** MEMORY.md → "Coding Sub-Agent Strategy (Feb 8 2026)" section

**Problem:**
- Documents scripts in `.ai/bin/codex/implement`, `.ai/bin/codex/codecheck`, etc.
- These paths **do not exist** in the workspace
- The actual workflow uses Sophie Loop (loop-runner.py) to spawn sub-agents

**Current Docs Say:**
```bash
.ai/bin/codex/implement 123
```

**Actual Workflow (from .ai/README-loop-runner.md):**
```bash
python3 ~/.ai/loop-runner.py prepare --task-id 84 --agent coder --persona solo-consultant
# Main session spawns with the returned model/prompt
```

**Impact:** Medium - Could confuse sub-agent spawning if someone follows MEMORY.md documentation

**Recommendation:**
- Update MEMORY.md "Coding Sub-Agent Strategy" section to reflect current Sophie Loop workflow
- Remove references to `.ai/bin/codex/` scripts
- Update to use loop-runner.py workflow

---

## Medium Issues

### 2. ⚠️ Path Inconsistency: `.ai/` vs `~/clawd/.ai/`

**Locations:** MEMORY.md, AGENTS.md

**Problem:**
- Some files reference `.ai/` or `~/.ai/`
- Actual location is `~/clawd/.ai/`

**Examples:**
- MEMORY.md: `~/.ai/loop-runner.py` (actual: `~/clawd/.ai/loop-runner.py`)
- MEMORY.md: `~/.ai/agents/` (actual: `~/clawd/.ai/agents/`)

**Impact:** Low - Usually relative paths resolve correctly, but inconsistent

**Recommendation:**
- Standardize on full paths: `~/clawd/.ai/`
- Update MEMORY.md references to use full paths

---

### 3. ⚠️ AGENTS.md References Missing BOOTSTRAP.md

**Location:** AGENTS.md → "First Run" section

**Problem:**
- Says: "If `BOOTSTRAP.md` exists, that's your birth certificate. Follow it, figure out who you are, then delete it."
- No BOOTSTRAP.md file exists in workspace

**Impact:** Low - This is likely intentional (already deleted after setup), but the reference is confusing

**Recommendation:**
- Either: Remove the reference to BOOTSTRAP.md (it's no longer relevant for production sessions)
- Or: Keep a minimal BOOTSTRAP.md explaining that it's not needed for established systems

---

### 4. ⚠️ Duplication of Model Preferences

**Locations:** USER.md and MEMORY.md

**Problem:**
- USER.md contains model preferences:
  - "Default model (Sophie): Opus 4.6"
  - "Coding sub-agents: GPT-5.2 Codex"
- MEMORY.md also contains these preferences
- config/model-dispatch.json is the actual source of truth

**Impact:** Low - Currently consistent, but risks drift if one is updated but not others

**Recommendation:**
- Keep USER.md as the human-facing preference reference
- Make MEMORY.md reference config/model-dispatch.json as the source of truth
- Add a note: "For authoritative model selection, see config/model-dispatch.json"

---

### 5. ⚠️ HEARTBEAT.md "One-off Items" Placeholder

**Location:** HEARTBEAT.md → "One-off Items" section

**Problem:**
- Says: `(No active one-off items)`
- This needs manual updates when one-off items exist

**Impact:** Low - Documented convention, just needs maintenance

**Recommendation:**
- Keep as-is - this is intentional and the note makes it clear it's a placeholder

---

## Low Issues

### 6. ℹ️ IDENTITY.md Avatar Unset

**Location:** IDENTITY.md

**Problem:**
- `Avatar: *(unset)*` - never filled in

**Impact:** Cosmetic - doesn't affect functionality

**Recommendation:**
- Either set an avatar URL or remove the line if not needed

---

### 7. ℹ️ README.md Contains Only "Test"

**Location:** ~/clawd/README.md

**Problem:**
- Contains only the word "Test"
- Not useful for anyone exploring the workspace

**Impact:** Low - Not critical for operation

**Recommendation:**
- Either: Remove the file
- Or: Write a brief description of what ~/clawd/ contains

---

### 8. ℹ️ Partial Overlap Between HEARTBEAT.md and ROUTINES.md

**Locations:** HEARTBEAT.md and state/ROUTINES.md

**Problem:**
- Both files describe morning briefing procedures
- HEARTBEAT.md has detailed capture system instructions
- ROUTINES.md has pre-flight checklist and template reference

**Impact:** Low - They serve different purposes (periodic checks vs. daily routines), so overlap is expected

**Recommendation:**
- No change needed - the separation is intentional and clear

---

## Path Verification Summary

All critical path references were verified:

| Path Reference | File | Status |
|----------------|------|--------|
| `state/ROUTINES.md` | HEARTBEAT.md | ✅ Exists |
| `~/clawd/scripts/capture-log.sh` | HEARTBEAT.md | ✅ Exists |
| `~/clawd/scripts/generate-feedback-urls.sh` | HEARTBEAT.md | ✅ Exists |
| `~/clawd/scripts/morning-briefing-data.sh` | ROUTINES.md | ✅ Exists |
| `~/clawd/scripts/validate-briefing.sh` | templates/morning-briefing.md | ✅ Exists |
| `~/clawd/scripts/get-youtube-transcript.py` | HEARTBEAT.md | ✅ Exists |
| `~/clawd/data/quotes.json` | ROUTINES.md | ✅ Exists |
| `~/.clawdbot/.env` | HEARTBEAT.md | ✅ Exists |
| `~/2025slideheroes-sophie/AGENTS.md` | MEMORY.md | ✅ Exists |
| `~/.codex/config.toml` | MEMORY.md | ✅ Exists |
| `.ai/bin/codex/` | MEMORY.md | ❌ Does NOT exist (outdated docs) |
| `~/.ai/loop-runner.py` | MEMORY.md | ❌ Wrong path (should be ~/clawd/.ai/) |
| `~/.ai/agents/` | MEMORY.md | ❌ Wrong path (should be ~/clawd/.ai/) |

---

## Contradiction Check

### No Critical Contradictions Found

All files are internally consistent:
- Model preferences match across USER.md, MEMORY.md, and model-dispatch.json
- Code permissions (2025slideheroes fork workflow vs. slideheroes-internal-tools full access) are consistent
- Timezone references (EST) are consistent
- Channel IDs and references are consistent

---

## Duplicated Content Analysis

### Acceptable Duplications

1. **Morning briefing procedures** (ROUTINES.md + HEARTBEAT.md):
   - ROUTINES: Template-based workflow, pre-flight checklist
   - HEARTBEAT: Detailed capture monitoring, nighttime backlog work
   - Different purposes - acceptable

2. **Model preferences** (USER.md + MEMORY.md):
   - Slight duplication, but currently consistent
   - See recommendation #4 above

---

## Missing Information Check

### No Critical Gaps Found

All essential information is present:
- Sophie's identity and personality (SOUL.md, IDENTITY.md)
- User information and preferences (USER.md)
- Operational procedures (ROUTINES.md, HEARTBEAT.md)
- Long-term memory and strategic context (MEMORY.md)
- Current state tracking (state/current.md)
- Tool configuration (TOOLS.md, model-dispatch.json)

---

## Recommendations Summary

### Priority 1 (High) - Fix Soon

1. **Update MEMORY.md "Coding Sub-Agent Strategy" section** to reflect current Sophie Loop workflow (remove `.ai/bin/codex/` references)

### Priority 2 (Medium) - Fix When Convenient

2. **Standardize path references** to use full paths: `~/clawd/.ai/`
3. **Clarify or remove BOOTSTRAP.md reference** in AGENTS.md
4. **Clarify model preference source of truth** in MEMORY.md (reference model-dispatch.json)

### Priority 3 (Low) - Nice to Have

5. **Set or remove avatar** in IDENTITY.md
6. **Update or remove ~/clawd/README.md**

---

## Strengths

- **Excellent documentation practices** - Clear structure, good use of tags and categories
- **Active maintenance** - Files are regularly updated with timestamps
- **No critical contradictions** - All core information is consistent
- **Good separation of concerns** - SOUL, IDENTITY, USER, AGENTS, TOOLS each have clear purposes
- **Strong operational tracking** - state/current.md and memory/YYYY-MM-DD.md capture what's happening

---

## Conclusion

Sophie's context files are in **good shape**. The main issue is outdated documentation about the Codex coding workflow (MEMORY.md). Once that section is updated, all other issues are minor cosmetic or organizational improvements.

The system is **operationally sound** and all critical path references work correctly.
