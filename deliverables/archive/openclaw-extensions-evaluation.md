# OpenClaw Extension Evaluation

**Date:** 2026-02-05  
**Task:** #31 - Evaluate OpenClaw extension repositories  
**Evaluator:** Sophie

---

## 1. Clawdstrike

**Repository:** https://github.com/backbay-labs/clawdstrike  
**Publisher:** Backbay Labs  
**Stars:** 50 | **Forks:** 2 | **Open Issues:** 1  
**Created:** 2026-01-31 | **Last Updated:** 2026-02-05  
**License:** MIT

### What It Does

Clawdstrike is a runtime security enforcement framework for AI agents. It provides:

- **Guards** — Block sensitive paths, control network egress, detect secrets, validate patches, restrict tools, catch jailbreaks
- **Signed Receipts** — Ed25519-signed attestations proving what was decided, under which policy
- **Multi-language** — Rust core with TypeScript, Python, and WebAssembly bindings
- **Multi-framework** — OpenClaw, Vercel AI, LangChain, Claude Code integrations

Key features:
- 7 built-in guards (path, egress, secrets, patches, tools, prompt injection, jailbreak)
- 4-layer jailbreak detection (heuristic + statistical + ML + optional LLM-as-judge)
- Output sanitization (redact secrets, PII from LLM output)
- Prompt watermarking for attribution
- Fail-closed design (invalid policies reject at load time)
- <0.05ms overhead per tool call

### Evaluation

| Criteria | Score | Notes |
|----------|-------|-------|
| **Usefulness** | ⭐⭐⭐⭐⭐ | Addresses real security concerns for agent systems |
| **Value-add** | ⭐⭐⭐⭐ | We don't have runtime security enforcement today |
| **Trust** | ⭐⭐⭐⭐ | Rust core, well-documented, professional presentation |
| **Maintenance** | ⭐⭐⭐⭐ | Active (updated today), but still alpha |
| **Integration** | ⭐⭐⭐ | Has OpenClaw plugin, but requires setup |
| **Dependencies** | ⭐⭐⭐⭐ | Rust + language bindings, reasonable |

### Recommendation: **WATCH** (adopt later when stable)

**Why watch, not adopt now:**
- Explicitly marked as "Alpha software — APIs may change"
- We're focused on building core functionality right now
- Security enforcement is valuable but not blocking

**When to adopt:**
- When we have agents with elevated permissions (filesystem writes, network access)
- When handling sensitive data that shouldn't leak
- When Clawdstrike reaches beta/stable

**Value proposition:**
- Prevent Sophie from accidentally exposing secrets
- Audit trail of tool executions
- Policy-based guardrails we can tune

---

## 2. OpenClaw Tool Call Viewer

**Repository:** https://github.com/VACInc/openclaw-tool-call-viewer  
**Publisher:** VACInc  
**Stars:** 11 | **Forks:** 0 | **Open Issues:** 0  
**Created:** 2026-02-04 | **Last Updated:** 2026-02-05  
**License:** MIT

### What It Does

A lightweight web UI for browsing OpenClaw session tool call history. Features:

- Dynamic parsing of JSONL session files
- Filter by: tool type, model, session, date range, text search
- Sort by column headers
- Auto-refresh (polls every 10 seconds)
- Export filtered results as JSON
- Zero dependencies (just Node.js)
- LAN accessible

### Evaluation

| Criteria | Score | Notes |
|----------|-------|-------|
| **Usefulness** | ⭐⭐⭐⭐ | Visual tool call history is helpful for debugging |
| **Value-add** | ⭐⭐⭐ | We already have Mission Control Activity Log |
| **Trust** | ⭐⭐⭐ | Simple codebase, zero deps (can audit easily) |
| **Maintenance** | ⭐⭐ | Very new (created 2 days ago), unknown track record |
| **Integration** | ⭐⭐⭐⭐⭐ | Zero-dependency, just run with Node |
| **Dependencies** | ⭐⭐⭐⭐⭐ | None! Just Node.js |

### Recommendation: **SKIP** (duplicates existing capability)

**Why skip:**
- We already have Mission Control Activity Log for tracking Sophie's work
- Our Activity Log is integrated with our task system
- This would be a separate, disconnected view

**When it might be useful:**
- Debugging OpenClaw session issues
- If Mission Control Activity Log doesn't capture tool-level detail
- Temporary diagnostic during development

**Alternative:** If we need tool-call-level visibility, we could add that detail to Mission Control rather than running a separate viewer.

---

## Summary

| Repository | Recommendation | Priority |
|------------|----------------|----------|
| **Clawdstrike** | WATCH | Add to "revisit when stable" list |
| **Tool Call Viewer** | SKIP | Duplicates Mission Control functionality |

### Action Items

1. ✅ Document evaluation (this file)
2. [ ] Add Clawdstrike to "tools to revisit" watchlist when it hits beta
3. [ ] Consider adding tool-call detail to Mission Control Activity if needed

---

*Evaluation complete. Task #31 done.*
