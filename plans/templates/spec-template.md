# Spec: [Project Name]

> **Status:** Draft | Approved | In Progress | Complete
> **Created:** YYYY-MM-DD
> **Spec Issue:** #[number]
> **Estimated Total:** [X] days across [N] features

---

## 1. Problem Statement

[What specific pain or gap exists? Who experiences it? What do they do today without this? Be concrete — quantify if possible.]

---

## 2. User Story

**As a** [persona],
**I want** [specific action or capability],
**So that** [measurable outcome or benefit].

---

## 3. User Experience

_Walk through what the user sees and does, step by step. This is the most important section — it tells CodeRabbit and the coding agent what to build._

1. User navigates to / opens / clicks...
2. System displays...
3. User enters / selects / drags...
4. System responds with...
5. User confirms / saves / exports...
6. System shows success / redirects to...

_For complex flows, describe the happy path first, then edge cases._

**Edge Cases:**
- If [condition], then [behavior]
- If [error state], then [how system handles it]

---

## 4. Acceptance Criteria

_Specific, testable conditions. When ALL are met, the spec is complete._

**Must Have:**
- [ ] [Testable criterion 1]
- [ ] [Testable criterion 2]
- [ ] [Testable criterion 3]

**Nice to Have:**
- [ ] [Optional criterion 1]
- [ ] [Optional criterion 2]

---

## 5. Scope

**In Scope:**
- [What's included]
- [What's included]

**Out of Scope:**
- [What's explicitly excluded] — _reason or "deferred to v2"_
- [What's explicitly excluded]

---

## 6. Visual Mockup

_For UI features: ASCII layout, wireframe description, or reference to an existing page. Skip for backend-only work._

```
┌──────────────────────────────────────────┐
│ [Page/Component Name]                     │
├──────────────────────────────────────────┤
│                                           │
│  [Describe layout and key elements]       │
│                                           │
└──────────────────────────────────────────┘
```

_Or describe in words: "Similar to the existing [page], but with [changes]."_

---

## 7. Feature Breakdown

_Each feature is a 3-10 day vertical slice that delivers testable value. Order by priority (1 = build first)._

| # | Feature Name | Priority | Est. Days | Dependencies | Description |
|---|-------------|----------|-----------|--------------|-------------|
| F1 | [Name] | 1 | [3-10] | None | [One-line description] |
| F2 | [Name] | 2 | [3-10] | F1 | [One-line description] |
| F3 | [Name] | 3 | [3-10] | F1 | [One-line description] |
| F4 | [Name] | 4 | [3-10] | F2, F3 | [One-line description] |

**Dependency Notes:**
- [Any important sequencing context]

**Parallel Opportunities:**
- [Which features can run simultaneously after their deps are met]

---

## 8. Risks & Open Questions

**Risks:**
| Risk | Impact | Mitigation |
|------|--------|------------|
| [Risk 1] | [High/Med/Low] | [How to handle] |
| [Risk 2] | [High/Med/Low] | [How to handle] |

**Open Questions:**
- [ ] [Question that needs answering before or during implementation]
- [ ] [Question]

---

## 9. Success Metrics

_How do we know this worked? Optional but valuable for larger specs._

- [Metric 1: e.g., "Users complete [action] in under 30 seconds"]
- [Metric 2: e.g., "Error rate below 1%"]

---

_Spec created via Rabbit Plan process. See SOP: `~/clawd/docs/sops/rabbit-plan.md`_
