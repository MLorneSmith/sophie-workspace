# Agent Teams Evaluation: Alpha Orchestrator Refactor

**Date:** 2026-02-06  
**Author:** Sophie  
**Status:** Analysis Complete — Awaiting Decision

---

## Executive Summary

Anthropic's Agent Teams feature enables coordinating multiple Claude Code sessions with inter-agent communication and a shared task list. This document evaluates whether to refactor the Alpha Orchestrator to use Agent Teams.

**Recommendation: Not recommended at this time.**

The current E2B-based architecture is better suited for our use case. Agent Teams solves a different problem — collaborative exploration requiring discussion — while our orchestrator needs isolated, reproducible builds with strict dependency ordering.

---

## Current Alpha Orchestrator Architecture

### How It Works Today

```
┌─────────────────────────────────────────────────────────────────┐
│                    SPEC ORCHESTRATOR                            │
│  - Manages work queue (spec-manifest.json)                      │
│  - Tracks feature dependencies                                  │
│  - Monitors health/heartbeats                                   │
└───────────────┬─────────────┬─────────────┬────────────────────┘
                │             │             │
        ┌───────▼───┐   ┌─────▼─────┐   ┌───▼───────┐
        │ E2B SBX-A │   │ E2B SBX-B │   │ E2B SBX-C │
        │ (Claude)  │   │ (Claude)  │   │ (Claude)  │
        │           │   │           │   │           │
        │ - Git     │   │ - Git     │   │ - Git     │
        │ - Full OS │   │ - Full OS │   │ - Full OS │
        │ - DB seed │   │ - DB seed │   │ - DB seed │
        └───────────┘   └───────────┘   └───────────┘
              │               │               │
              └───────────────┼───────────────┘
                              │
                    ┌─────────▼─────────┐
                    │   Shared Branch   │
                    │   (Git pushes)    │
                    └───────────────────┘
```

### Key Characteristics

| Aspect | Current Implementation |
|--------|----------------------|
| **Runtime** | E2B cloud sandboxes (isolated VMs) |
| **Communication** | None between agents — independent |
| **Coordination** | Central manifest file (JSON) |
| **Dependencies** | Strict ordering, features blocked until deps complete |
| **Git** | Each sandbox commits; orchestrator manages merges |
| **Environment** | Full OS, seeded database, all tooling |
| **Failure handling** | Retry logic, health checks, phantom recovery |

---

## What Agent Teams Offers

### Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                         TEAM LEAD                                │
│  - Creates team, spawns teammates                                │
│  - Coordinates via shared task list                              │
│  - Synthesizes results                                           │
└──────────────┬──────────────┬──────────────┬────────────────────┘
               │              │              │
       ┌───────▼───┐   ┌──────▼──────┐   ┌───▼───────┐
       │ Teammate A │   │ Teammate B  │   │ Teammate C│
       │ (Claude)   │◄──┤ (Claude)    │──►│ (Claude)  │
       │            │   │             │   │           │
       └──────▲─────┘   └──────▲──────┘   └─────▲─────┘
              │                │                │
              └────────────────┼────────────────┘
                      Direct Messaging
```

### Key Features

| Feature | Description |
|---------|-------------|
| **Inter-agent messaging** | Teammates can message each other directly |
| **Shared task list** | Automatic task claiming with dependency support |
| **Self-coordination** | Teammates claim work autonomously |
| **Plan approval mode** | Lead can require plan review before implementation |
| **Delegate mode** | Restrict lead to coordination-only (no coding) |
| **Display modes** | In-process or split panes (tmux/iTerm2) |

### Best Use Cases (per Anthropic)

- ✅ Research and review (multiple perspectives)
- ✅ Debugging with competing hypotheses
- ✅ New modules where teammates own separate files
- ❌ Sequential tasks with many dependencies
- ❌ Same-file edits
- ❌ Work requiring strict ordering

---

## Comparison Matrix

| Dimension | Alpha Orchestrator (E2B) | Agent Teams |
|-----------|-------------------------|-------------|
| **Isolation** | ★★★★★ Full VM per agent | ★★☆☆☆ Shared filesystem |
| **Reproducibility** | ★★★★★ Seeded DB, clean env | ★★☆☆☆ Depends on local state |
| **Scalability** | ★★★★☆ 3+ parallel sandboxes | ★★★☆☆ Token-heavy at scale |
| **Collaboration** | ★☆☆☆☆ None by design | ★★★★★ Native messaging |
| **Setup complexity** | ★★★☆☆ E2B API, env vars | ★★★★☆ Simple CLI flag |
| **Cost model** | E2B compute + API tokens | API tokens only (but more) |
| **Git workflow** | ★★★★★ Each sandbox commits | ★★☆☆☆ Shared workspace conflicts |
| **Dependency handling** | ★★★★★ Manifest-based, strict | ★★★☆☆ Task list, auto-unblock |
| **Error recovery** | ★★★★☆ Heartbeats, phantom recovery | ★★☆☆☆ Manual intervention |
| **Local vs Cloud** | Cloud (E2B) | Local (Claude Code sessions) |

---

## Why Agent Teams Is NOT a Good Fit

### 1. We Need Isolation, Not Collaboration

**Our problem:** Implement features in parallel, each in a clean environment, with reproducible builds.

**Agent Teams solves:** Enable discussion and collaboration between agents exploring a problem.

The Alpha Orchestrator deliberately keeps agents isolated. When Agent A implements a feature, Agent B shouldn't even see those changes until they're committed. This prevents:
- Merge conflicts during implementation
- Half-complete code polluting other agents' context
- Race conditions on shared state

Agent Teams *encourages* sharing, which is counterproductive for our use case.

### 2. E2B Provides Reproducibility

Each E2B sandbox:
- Starts from a clean VM image
- Gets a freshly seeded database
- Has all dependencies installed
- Can be killed and recreated on failure

Agent Teams runs in the user's local environment. There's no isolation between teammates — they share the filesystem. This means:
- One teammate's broken build affects others
- Database state is shared and can be corrupted
- No "clean room" for each feature

### 3. Our Dependency Model Is Stricter

The Alpha Orchestrator has explicit dependency tracking:
```json
{
  "id": "F-1363-1",
  "dependencies": ["F-1362-3", "F-1362-4"],
  "status": "pending"
}
```

Features don't start until all dependencies are `completed`. This is enforced by the orchestrator, not left to agent judgment.

Agent Teams has task dependencies, but they're softer:
> "Tasks can also depend on other tasks: a pending task with unresolved dependencies cannot be claimed until those dependencies are completed."

The difference is *who decides* completion. In Agent Teams, the teammate marks their own task complete. In Alpha, the orchestrator validates the feature works (tests pass, no lint errors) before marking complete.

### 4. Git Workflow Complexity

Our current flow:
1. Each sandbox works on its own branch
2. Sandbox commits and pushes when feature is done
3. Orchestrator orchestrates merge order
4. Review sandbox aggregates all changes

Agent Teams with multiple teammates editing the same repo would create constant merge conflicts. The docs explicitly warn:
> "Avoid file conflicts: Two teammates editing the same file leads to overwrites."

Our features often touch shared files (types, routes, configs). The E2B approach sidesteps this by having each sandbox work in isolation.

### 5. Token Cost Is Already High

Agent Teams documentation warns:
> "Agent teams use significantly more tokens than a single session. Each teammate has its own context window."

We already use significant tokens with E2B sandboxes. Adding inter-agent messaging on top would increase costs without clear benefit.

---

## Where Agent Teams COULD Help

### Potential Use Cases in SlideHeroes

1. **Code Review Phase**: After implementation, spawn 3 teammates to review from security, performance, and test coverage perspectives. They could debate issues before the PR.

2. **Architecture Design**: Before implementation, use an agent team to explore different approaches to a feature, with teammates advocating for different solutions.

3. **Bug Investigation**: When a bug is hard to reproduce, spawn teammates with competing hypotheses about the root cause.

### Hybrid Approach (Future Consideration)

```
┌─────────────────────────────────────────────────────────────┐
│                    SPEC ORCHESTRATOR                         │
│  (unchanged — manages E2B sandboxes for implementation)      │
└──────────────────────────────┬──────────────────────────────┘
                               │
                    ┌──────────▼──────────┐
                    │   Completion Phase   │
                    └──────────┬──────────┘
                               │
          ┌────────────────────▼────────────────────┐
          │            AGENT TEAM (NEW)             │
          │  - Review implementation                │
          │  - Debate architectural decisions       │
          │  - Surface edge cases                   │
          └─────────────────────────────────────────┘
```

---

## What Would Be Required for a Full Refactor

If we decided to refactor anyway, here's what it would entail:

### Must Change

| Component | Current | New |
|-----------|---------|-----|
| Runtime | E2B SDK | Claude Code CLI with `--teammate-mode` |
| Work distribution | `work-queue.ts` | Agent Teams task list |
| Progress tracking | `spec-manifest.json` | `~/.claude/tasks/{team-name}/` |
| Health monitoring | `heartbeat-monitor.ts` | Agent Teams idle notifications |
| Sandbox creation | `sandbox.ts` | Spawn teammates via lead prompt |
| Inter-sandbox comms | None | Native teammate messaging |

### Estimated Effort

| Task | Effort | Risk |
|------|--------|------|
| Rewrite orchestrator core | 2-3 weeks | High |
| New git workflow for shared workspace | 1-2 weeks | High |
| Database isolation strategy | 1 week | Medium |
| Testing & validation | 1-2 weeks | Medium |
| Documentation | 3-5 days | Low |

**Total: 5-8 weeks of development**

### Risks

1. **Loss of isolation** — Features could interfere with each other
2. **Git conflicts** — Shared workspace means merge conflicts during implementation
3. **Reproducibility** — Local environment variations affect results
4. **Rollback complexity** — If Agent Teams has issues, we've lost our working system
5. **Experimental feature** — Agent Teams is marked experimental with known limitations

---

## Recommendation

### Do Not Refactor the Alpha Orchestrator to Use Agent Teams

**Rationale:**
1. Agent Teams solves a different problem (collaboration) than our problem (parallel isolated execution)
2. E2B's isolation is a feature, not a limitation
3. Our dependency model requires strict external validation
4. Git workflow would become significantly more complex
5. High effort (5-8 weeks) with unclear benefit

### Instead, Consider:

1. **Keep current architecture** for feature implementation
2. **Evaluate Agent Teams for the review/QA phase** where debate is valuable
3. **Monitor Agent Teams maturity** — when it's no longer experimental, reassess
4. **Consider subagents** (which we already have via Clawdbot) for focused subtasks within the orchestrator

---

## Decision Points for Mike

1. **Confirm recommendation** — Do you agree Agent Teams isn't right for the core orchestrator?

2. **Review phase interest** — Should we prototype Agent Teams for the completion/review phase?

3. **Timeline for reassessment** — When should we revisit this decision? (e.g., Q3 2026 when Agent Teams is stable)

---

## References

- [Agent Teams Documentation](https://code.claude.com/docs/en/agent-teams)
- [Alpha Orchestrator Source](~/2025slideheroes-sophie/.ai/alpha/scripts/)
- [E2B Documentation](https://e2b.dev/docs)
