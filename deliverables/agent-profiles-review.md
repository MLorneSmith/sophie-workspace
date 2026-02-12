# Agent Profiles Review

**Date:** 2026-02-10
**Reviewer:** Sophie (sub-agent)
**Scope:** All Sophie Loop agent profiles and related configuration

---

## Executive Summary

Found **8 active agent profiles** in `~/clawd/.ai/agents/`. Model references are largely consistent with `model-dispatch.json`, but there are documentation inconsistencies and several orphaned skills/tools referenced.

**Critical Issues:** 0
**High-Priority Issues:** 3
**Medium-Priority Issues:** 4
**Low-Priority Issues:** 2

---

## Profiles Reviewed

| Profile | Model Specified | Expected (model-dispatch.json) | Status |
|---------|------------------|-------------------------------|--------|
| coder.yaml | `openai-codex/gpt-5.2` | ✓ code role | **PASS** |
| devops.yaml | `openai-codex/gpt-5.2` | ✓ code role | **PASS** |
| researcher.yaml | `zai/glm-4.7` | ✓ research role | **PASS** |
| planner.yaml | `anthropic/claude-opus-4-6` | ✓ default role | **PASS** |
| reviewer.yaml | `anthropic/claude-opus-4-6` | ✓ default role | **PASS** |
| writer.yaml | `zai/glm-4.7` | ✓ bulk role | **PASS** |
| emailer.yaml | `zai/glm-4.7` | ✓ bulk role | **PASS** |
| designer.yaml | `zai/glm-4.7` | ✓ bulk role | **PASS** |

**All models are correctly assigned per `model-dispatch.json`.**

---

## Findings by Category

### 1. Documentation Inconsistencies (HIGH PRIORITY)

#### Issue: README.md Table Shows Wrong Models

The `README.md` file in `~/clawd/.ai/agents/` contains a table showing model assignments that **does not match** the actual profile YAML files:

| Agent | README Says | Profile Actually Says | Correct |
|-------|-------------|----------------------|---------|
| Writer | Opus 4.6 | GLM 4.7 | ✓ GLM 4.7 (bulk role) |
| Emailer | Opus 4.6 | GLM 4.7 | ✓ GLM 4.7 (bulk role) |
| Designer | Opus 4.6 | GLM 4.7 | ✓ GLM 4.7 (bulk role) |

**Impact:** Confusing for anyone reading the README to understand which models are actually used.

**Recommendation:** Update README.md table to match actual profile definitions.

---

#### Issue: SPAWN_RULES.md vs README.md Conflict

`SPAWN_RULES.md` correctly states:
> GLM (zai/glm-4.7): writer, emailer, researcher, designer

But `README.md` table incorrectly states:
> Writer: Opus 4.6
> Emailer: Opus 4.6
> Designer: Opus 4.6

**Impact:** Both files should be consistent. `SPAWN_RULES.md` is correct.

**Recommendation:** Sync README.md with SPAWN_RULES.md.

---

### 2. Orphaned/Unresolved Skills (MEDIUM PRIORITY)

The following skills are referenced in agent profiles but **do not exist** as skill directories in `~/clawd/skills/`:

| Profile | Skills Referenced | Status |
|---------|-------------------|--------|
| coder.yaml | `coding-agent`, `context7`, `github` | ❌ Not found |
| devops.yaml | `coding-agent`, `github` | ❌ Not found |
| designer.yaml | `frontend-design`, `tailwind-design-system` | ❌ Not found |
| researcher.yaml | `perplexity-research` | ❌ Not found |
| emailer.yaml | `email-marketing` | ❌ Not found |
| writer.yaml | `blog-writing`, `blog-post-optimizer` | ❌ Not found |

**Analysis:**
- These skills may be **conceptual names** that map to the context-mappings.yaml system rather than literal skill directories
- The Sophie Loop likely loads context from `~/clawd/.ai/contexts/skill-mappings.yaml` based on the `context_mapping` field in each profile
- If these were intended to be actual skills (with SKILL.md files), they are missing

**Recommendation:**
1. Clarify whether these are intended as literal skills or context mappings
2. If literal: create the missing skill directories with SKILL.md files
3. If context mappings: rename `skills:` field to `context_mapping:` or add a comment clarifying this

---

### 3. Orphaned/Unresolved Tools (LOW PRIORITY)

The following tools are referenced in profiles but may not exist as standard tools:

| Profile | Tools Referenced | Status |
|---------|------------------|--------|
| designer.yaml | `browser`, `canvas` | ⚠️ May not exist |

**Analysis:**
- `browser`: Not in the standard tool list. May refer to browser automation (Puppeteer/Playwright) which is not currently configured.
- `canvas`: Refers to UI design tooling. The `~/clawd/canvas/` directory exists but is a Clawdbot Canvas test page, not a design tool.

**Impact:** If designer.yaml attempts to use these tools, they will fail.

**Recommendation:**
1. Verify if browser automation is available via openclaw.json (shows `browser` enabled with Chrome path)
2. Remove `canvas` tool reference or implement actual canvas design capabilities
3. Consider adding `playwright` skill if browser automation is needed

---

### 4. Orphaned Context Mappings (LOW PRIORITY)

The `skill-mappings.yaml` file contains context mappings for skills that **no agent uses**:

| Mapping | Referenced By | Status |
|---------|---------------|--------|
| `social-media` | ❌ No agent | Orphaned |
| `outbound` | ❌ No agent | Orphaned |

**Impact:** These mappings are maintained but unused. May indicate planned but not-yet-created agents.

**Recommendation:**
- Create agents for social media and outbound outreach, OR
- Remove unused mappings to reduce maintenance burden

---

### 5. Missing Profiles (MEDIUM PRIORITY)

The following agent profiles **should exist** based on the Sophie Loop architecture but are missing:

| Missing Profile | Expected Role | Suggested Model |
|-----------------|---------------|-----------------|
| **social-media** | LinkedIn, Twitter posts | GLM 4.7 (bulk) |
| **outbound** | Sales outreach sequences | GLM 4.7 (bulk) |
| **analyst** | Data analysis, metrics | GLM 4.7 (bulk/research) |

**Impact:**
- Social media and outbound work cannot be automated via Sophie Loop
- Manual work required for these channels

**Recommendation:**
1. Create `social-media.yaml` using the `social-media` context mapping from skill-mappings.yaml
2. Create `outbound.yaml` using the `outbound` context mapping
3. Consider whether `analyst` is needed (may be covered by researcher)

---

### 6. Context Files Validation (PASS)

All context files referenced in `skill-mappings.yaml` exist and are valid:

```
~/clawd/.ai/contexts/
├── company/        # about.md, products.md, differentiators.md, roadmap.md ✓
├── personas/       # solo-consultant.md, boutique-consultancy.md, etc. ✓
├── voice/          # brand-voice.md, mike-style.md, vocabulary.md ✓
├── messaging/      # positioning.md, pain-points.md, value-props.md ✓
├── guidelines/     # blog-guidelines.md, email-guidelines.md, etc. ✓
└── anti-persona-filter  # anti-personas.md ✓
```

**Status:** All context paths resolve correctly.

---

### 7. Potential Orphaned Projects (INFORMATIONAL)

Found a project that may be related to agent orchestration:

| Path | Status | Notes |
|------|--------|-------|
| `~/clawd/projects/council-v2/` | ⚠️ Unknown | Contains `agent-teams-evaluation.md` - may be related to multi-agent coordination |

**Recommendation:**
- Review `council-v2` project to determine if it's still active or can be archived
- The `agent-teams-evaluation.md` document recommends AGAINST using Anthropic's Agent Teams for the Alpha Orchestrator

---

## Model Dispatch Configuration

The `~/clawd/config/model-dispatch.json` is correctly structured:

```json
{
  "code": "openai-codex/gpt-5.2",      // Used by: coder, devops ✓
  "research": "zai/glm-4.7",            // Used by: researcher ✓
  "bulk": "zai/glm-4.7",                // Used by: writer, emailer, designer ✓
  "default": "anthropic/claude-opus-4-6" // Used by: planner, reviewer ✓
}
```

All profiles align with this configuration. **No changes needed.**

---

## Tool References Validation

Standard tools referenced in profiles (all available):
- `exec` ✓
- `read` ✓
- `write` ✓
- `edit` ✓
- `web_search` ✓
- `web_fetch` ✓

Non-standard tools requiring verification:
- `browser` - Configured in openclaw.json (Chrome path: `/usr/bin/google-chrome-stable`, headless: true)
- `canvas` - ⚠️ Not a standard tool; current implementation is a test page

---

## Recommendations Summary

### Priority 1 (Fix Immediately)

1. **Update README.md table** to reflect actual model assignments (writer, emailer, designer use GLM 4.7, not Opus 4.6)
2. **Sync README.md with SPAWN_RULES.md** to ensure consistency

### Priority 2 (Fix Soon)

3. **Clarify skill references** - Determine if `skills:` fields in profiles are literal skills or context mappings
4. **Create missing agent profiles:**
   - `social-media.yaml` (for LinkedIn, Twitter)
   - `outbound.yaml` (for sales sequences)

### Priority 3 (Consider for Future)

5. **Remove orphaned context mappings** (social-media, outbound) OR create agents to use them
6. **Verify browser tool availability** - Test if designer.yaml can actually use browser automation
7. **Remove or clarify `canvas` tool reference** - Implement actual canvas tooling or remove from profile

---

## Verification Checklist

- [x] All 8 agent profiles reviewed
- [x] Model references validated against model-dispatch.json
- [x] Skills cross-checked against ~/clawd/skills/ directory
- [x] Tools verified against openclaw.json configuration
- [x] Context files validated (all exist)
- [x] Documentation consistency checked (README, SPAWN_RULES)
- [x] Orphaned/unused mappings identified
- [x] Missing profiles identified

---

## Appendix: Complete Profile Details

### coder.yaml
- **Model:** openai-codex/gpt-5.2 ✓
- **Context Mapping:** coding
- **Skills:** coding-agent, context7, github (⚠️ Not found)
- **Tools:** exec, read, write, edit, web_search, web_fetch ✓

### designer.yaml
- **Model:** zai/glm-4.7 ✓
- **Context Mapping:** design
- **Skills:** frontend-design, tailwind-design-system (⚠️ Not found)
- **Tools:** read, write, edit, web_search, web_fetch, browser (⚠️), canvas (⚠️)

### devops.yaml
- **Model:** openai-codex/gpt-5.2 ✓
- **Context Mapping:** devops
- **Skills:** coding-agent, github (⚠️ Not found)
- **Tools:** exec, read, write, edit, web_search ✓

### emailer.yaml
- **Model:** zai/glm-4.7 ✓
- **Context Mapping:** email-marketing
- **Skills:** email-marketing (⚠️ Not found)
- **Tools:** web_search, web_fetch, read, write ✓

### planner.yaml
- **Model:** anthropic/claude-opus-4-6 ✓
- **Context Mapping:** planning
- **Skills:** None
- **Tools:** web_search, web_fetch, read, write ✓

### researcher.yaml
- **Model:** zai/glm-4.7 ✓
- **Context Mapping:** research
- **Skills:** perplexity-research (⚠️ Not found)
- **Tools:** web_search, web_fetch, read, write ✓

### reviewer.yaml
- **Model:** anthropic/claude-opus-4-6 ✓
- **Context Mapping:** review (dynamic)
- **Skills:** None (evaluator only)
- **Tools:** read, web_fetch ✓

### writer.yaml
- **Model:** zai/glm-4.7 ✓
- **Context Mapping:** blog-writing
- **Skills:** blog-writing, blog-post-optimizer (⚠️ Not found)
- **Tools:** web_search, web_fetch, read, write ✓

---

**End of Report**
