# Task #527: Audience Profiling Map Analysis

**Date:** 2026-02-18
**Task:** Review course Audience Profiling Map and identify fields for Audience Brief UI v1
**Scope:** Primary audience only (no secondary audience)

---

## Executive Summary

The course **Audience Profiling Map** defines three core sections for understanding who you're presenting to:

1. **Communication Profile** — Decision-making style, attention span, what they trust, career context
2. **Strategic Recommendations** — Lead with, frame as, avoid, include
3. **Presentation Format** — Structure, executive summary, data density, tone, frameworks, length

Comparing this against the **draft UI spec** (`audience-brief-ui-ux-editable-profile-page.md`) reveals:

**Key Finding:** The draft spec is **significantly expanded** beyond the course framework — it includes many fields not present in the original Audience Profiling Map, particularly in "Identity," "What They Already Know," "Slide Preferences," and "Key Facts" sections.

**Recommendation:** The draft spec should be **simplified and realigned** with the course framework for v1. Focus on the three core sections from the course map, with modest enhancements for practical implementation. Secondary audience support, sources/research tabs, and extended fields should be deferred to v1.5+.

---

## Research Sources

1. **Course Audience Profiling Map** — `wow1-audience-profiling.md` (Lines 38-56)
2. **Draft UI Spec** — `audience-brief-ui-ux-editable-profile-page.md` (Lines 30-91)
3. **Data Model** — `slideheroes-internal-tools/app/src/lib/mastra/schemas/audience.ts`
4. **Workflow UI Design** — `workflow-ui-design.md` (References Audience Profiling Map)

---

## Comparison: Course Map vs. Draft UI Spec

### 1. Communication Profile

| Course Field | Draft UI Equivalent | Status |
|-------------|---------------------|--------|
| Decision-making style | Decision Criteria → Top priorities | ✅ Mapped |
| Attention span | Slide Preferences → Preferred slide count range | ⚠️ Moved/Located differently |
| What they trust | Decision Criteria → Proof they need | ✅ Mapped |
| Career context | Identity → Role/Title, Seniority, Industry | ✅ Partially Mapped |

**Gaps Identified:**
- **Career context** in course map includes inferred patterns (e.g., "Ex-McKinsey → understands frameworks; ex-Treasury → wants financial rigor"). Draft spec doesn't capture this nuance — only collects raw fields.

---

### 2. Strategic Recommendations

| Course Field | Draft UI Equivalent | Status |
|-------------|---------------------|--------|
| Lead with | Goal & Stakes → Primary objective | ⚠️ Partial overlap |
| Frame as | Goal & Stakes → Stakes / consequences | ⚠️ Related but distinct |
| Avoid | Constraints → Must not include | ✅ Mapped |
| Include | Constraints → Must include | ✅ Mapped |

**Gaps Identified:**
- **"Lead with"** and **"Frame as"** from the course map are **strategic framing instructions**, not raw data. The draft spec's "Goal & Stakes" section captures *what* they care about but doesn't explicitly guide *how* to position the message.
- **"Time horizon"** in draft spec (e.g., "30/90/365 days") is **not present in course map** — may be unnecessary complexity for v1.

---

### 3. Presentation Format

| Course Field | Draft UI Equivalent | Status |
|-------------|---------------------|--------|
| Structure | Slide Preferences (no explicit field) | ❌ Missing |
| Executive summary | Slide Preferences (no explicit field) | ❌ Missing |
| Data density | Language & Tone → Density | ✅ Mapped |
| Tone | Language & Tone → Tone | ✅ Mapped |
| Frameworks they'll recognize | What They Already Know → What's familiar | ⚠️ Partial overlap |
| Length recommendation | Slide Preferences → Preferred slide count range | ✅ Mapped |

**Gaps Identified:**
- **"Structure"** and **"Executive summary"** from course map are **missing** from draft spec. These are high-leverage fields (e.g., "Pyramid principle, conclusion-first" — changes the entire deck).
- **"Frameworks they'll recognize"** is partially captured in "What's familiar" but not explicitly.

---

## Fields in Draft Spec NOT in Course Map

| Section | Field | Assessment |
|---------|-------|------------|
| **Identity** | Geography | ❌ Not in course map — low priority for v1 |
| **Identity** | Audience name / Segment label | ✅ Practical — needed for profile naming/reuse |
| **Goal & Stakes** | Time horizon | ❌ Not in course map — complexity for limited value |
| **What They Already Know** | Domain knowledge level | ❌ Not in course map — can be inferred |
| **What They Already Know** | Terms to avoid / define | ⚠️ Partial overlap with course "what they trust" |
| **Language & Tone** | Reading level (general/business/technical) | ❌ Not in course map — overlaps with tone/density |
| **Language & Tone** | Do / Don't list | ❌ Not in course map — redundant with Constraints |
| **Slide Preferences** | Chart vs text bias | ❌ Not in course map — v1.5+ feature |
| **Slide Preferences** | Visual style (modern/classic/minimal/data-heavy) | ❌ Not in course map — v1.5+ feature |
| **Key Facts** | Structured fact list (numbers, competitors, definitions) | ⚠️ Useful but not in course map — defer to v1.5 |

---

## Data Model Alignment Issues

The `AudienceBriefSchema` in `audience.ts` has misalignments with both the course map and the draft UI spec:

| Schema Field | Course Map | Draft UI Spec | Issue |
|-------------|------------|---------------|-------|
| `person.name` | ❌ Not specified | ✅ Audience name | ✅ Practical |
| `person.title` | ✅ Career context | ✅ Role/Title | ✅ Aligned |
| `person.linkedinUrl` | ❌ Not specified | ❌ Not in spec | ❌ Research input, not UI field |
| `person.summary` | ❌ Not specified | ❌ Not in spec | ❌ Research output, not UI field |
| `company.name` | ❌ Not specified | ❌ Not in spec | ❌ Research input, not UI field |
| `company.summary` | ❌ Not specified | ❌ Not in spec | ❌ Research output, not UI field |
| `goals` | ⚠️ Partial (Lead with/Frame as) | ⚠️ Primary objective, Stakes | ⚠️ Misaligned |
| `constraints` | ✅ Must/Must not | ✅ Must/Must not | ✅ Aligned |
| `likelyObjections` | ⚠️ Implicit (Avoid/What they trust) | ✅ Objections/concerns | ✅ Aligned |
| `recommendedMessaging.positioning` | ⚠️ Lead with/Frame as | ❌ Not explicitly captured | ❌ Missing |
| `recommendedMessaging.tone` | ✅ Tone | ✅ Tone | ✅ Aligned |

**Key Issue:** The schema mixes **research inputs** (linkedinUrl, website), **research outputs** (summary), and **user-editable fields**. The UI spec should focus on **user-editable structured fields** — research enriches but doesn't replace them.

---

## Key Findings

### 1. Draft Spec is Over-Specified for v1
- The draft spec includes **8 sections** and **30+ fields**, significantly beyond the 3 core sections of the course map.
- Many fields (Geography, Time horizon, Reading level, Do/Don't list, Chart vs text bias, Visual style) are **not in the course framework** and add complexity without clear value for v1.

### 2. Strategic Framing is Under-Specified
- The course map's **"Lead with"** and **"Frame as"** are missing from the draft spec. These are high-leverage — they tell the user *how* to position their message, not just *who* the audience is.
- The "Goal & Stakes" section captures *what* matters but not *how* to frame it.

### 3. Presentation Format Gaps
- **"Structure"** and **"Executive summary"** are completely missing from the draft spec. These are critical — they determine the deck's architecture (e.g., "Pyramid principle, conclusion-first" vs. "Chronological").
- "Frameworks they'll recognize" is implicit in "What's familiar" but should be explicit for consulting audiences.

### 4. Career Context Nuance is Lost
- The course map includes **inferred career context** (e.g., "Ex-McKinsey → understands frameworks"). The draft spec collects raw fields (Role, Seniority, Industry) but doesn't capture the **implications** of those fields.

### 5. Data Model Confusion
- The current schema mixes **research inputs**, **research outputs**, and **user edits**. This will cause implementation friction.
- The schema doesn't align with the course map's three-section structure.

---

## Recommended Actions

### 1. Simplify Draft UI Spec for v1 (High Priority)

**Align with course framework — 3 core sections:**

| Section | Fields (v1) |
|---------|-------------|
| **A) Identity** | Audience name, Role/Title, Industry/Function, Seniority |
| **B) Strategic Profile** | Decision-making style, Attention span, What they trust, Career context (inferred), Lead with, Frame as, Avoid, Include |
| **C) Presentation Format** | Structure, Executive summary, Data density, Tone, Frameworks they'll recognize, Length recommendation |

**Defer to v1.5+:**
- Geography
- Time horizon
- Domain knowledge level
- Reading level
- Do/Don't list (redundant with Constraints)
- Chart vs text bias
- Visual style
- Key Facts section
- History tab
- Sources tab

---

### 2. Add Missing Strategic Fields (High Priority)

Add to Strategic Profile section:
- **Lead with** (strategic framing: "Start with cost of inaction — she's been vocal about digital transformation")
- **Frame as** (positioning: "Acceleration, not disruption")
- **Career context** (inferred implications: "Ex-McKinsey → understands frameworks; ex-Treasury → wants financial rigor")

These are the highest-leverage fields from the course map — they directly affect how the story is structured.

---

### 3. Add Presentation Format Fields (High Priority)

Add to Presentation Format section:
- **Structure** (deck architecture: "Pyramid principle, conclusion-first" or "Chronological" or "Problem-Solution")
- **Executive summary** (slide placement: "Slide 2" or "First slide after title" or "Appendix only")
- **Frameworks they'll recognize** (specific frameworks: "NPV, risk matrices" or "MECE, 2x2 matrices" or "None — avoid jargon")

These are explicitly in the course map and missing from the draft spec.

---

### 4. Update Data Model (Medium Priority)

Separate concerns in `audience.ts`:

```typescript
// User-editable profile (what goes in the UI)
export const AudienceProfileSchema = z.object({
  identity: z.object({
    name: z.string().optional(),
    role: z.string().min(1),
    industry: z.string().optional(),
    seniority: z.enum(["IC", "Manager", "Director", "VP", "CxO"]),
  }),
  strategic: z.object({
    decisionMakingStyle: z.string(),
    attentionSpan: z.string(),
    whatTheyTrust: z.string(),
    careerContext: z.string(),
    leadWith: z.string(),
    frameAs: z.string(),
    avoid: z.array(z.string()),
    include: z.array(z.string()),
  }),
  presentation: z.object({
    structure: z.string(),
    executiveSummary: z.string(),
    dataDensity: z.enum(["low", "medium", "high"]),
    tone: z.enum(["formal", "consulting", "friendly", "inspirational"]),
    frameworks: z.string(),
    lengthRecommendation: z.string(),
  }),
})

// Research enrichment (separate from user edits)
export const AudienceResearchSchema = z.object({
  person: z.object({
    name: z.string(),
    title: z.string(),
    linkedinUrl: z.string().optional(),
    summary: z.string(), // Research output
  }),
  company: z.object({
    name: z.string(),
    website: z.string(),
    summary: z.string(), // Research output
  }),
})
```

---

### 5. Implement Inference for Career Context (Medium Priority)

The course map shows **career context as inferred insights**, not raw fields. For v1:

- Collect: Role/Title, Seniority, Industry (raw fields)
- Infer: Career context narrative (e.g., "Ex-McKinsey Director in Tech → expects framework-driven analysis, comfortable with data density")

This aligns with the course's approach: **structured inputs → enriched outputs**.

---

### 6. Document the v1 vs. v1.5+ Boundary (Low Priority)

Update `audience-brief-ui-ux-editable-profile-page.md` with:
- Explicit v1 field list (aligned with course map)
- v1.5+ roadmap (secondary audience, history, key facts, advanced slide preferences)
- Rationale for why each field is in v1 or deferred

This provides clarity for implementation and prevents scope creep.

---

## Uncertainties & Questions

1. **"Lead with" and "Frame as" generation:** Should these be AI-suggested (based on research) or fully user-written? The course examples suggest they're **strategic recommendations** — likely AI-suggested with user editing.

2. **Career context format:** Should this be a free-text field or structured tags? The course examples suggest free-text narratives (e.g., "Ex-McKinsey → understands frameworks; ex-Treasury → wants financial rigor").

3. **Frameworks enumeration:** Should "Frameworks they'll recognize" be a free-text field or a multi-select from a known set? The course examples suggest free-text (e.g., "NPV, risk matrices, etc.").

4. **Research-to-UI mapping:** How do research outputs (person.summary, company.summary) map to UI fields? They should enrich but not replace user edits — this needs clear UX design.

---

## Summary Recommendation

**For v1:**
1. Simplify to **3 sections** aligned with course Audience Profiling Map
2. Add missing high-leverage fields: **Lead with**, **Frame as**, **Structure**, **Executive summary**
3. Remove low-value fields: Geography, Time horizon, Reading level, Do/Don't list, Chart vs text bias, Visual style, Key Facts
4. Update data model to separate research inputs, research outputs, and user edits
5. Implement career context as **inferred narrative**, not raw data collection

**Success criteria:** The v1 Audience Brief UI should feel like a **direct translation** of the course framework into an editable interface — no more, no less. Additional features can be added in v1.5+ after validating the core value proposition.

---

*Task #527 Complete*
