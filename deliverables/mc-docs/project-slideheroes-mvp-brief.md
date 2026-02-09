# SlideHeroes MVP Brief

**Tags:** `project`, `slideheroes`, `brief`
**Created:** 2026-02-02
**Status:** Active

---

## Overview

**Goal:** Beta-ready MVP for testing AI-assisted presentation workflow by end of February 2026.

**Target Users:** Beta testers (new users) testing presentation tools. Courses hidden via feature flag.

---

## Core Workflow

```
Assemble → Outline → Storyboard → Generate → Export
```

- **Assemble:** Import existing content (Ragie RAG)
- **Outline:** Structure the presentation
- **Storyboard:** Visual drag-drop slide arrangement
- **Generate:** AI content generation per slide
- **Export:** PPTX and PDF output

---

## 4-Week Timeline

### Week 1 (Feb 3-9): Foundation
- Course feature flag (hide courses)
- Dashboard completion (S1890)
- Blog fixes (CMS images + public rendering)

### Week 2 (Feb 10-16): Presentation Workflow
- Outline UI polish
- Storyboard build (drag-drop)
- Generate rebuild (AI content)
- Export (PPTX/PDF)

### Week 3 (Feb 17-23): RAG + Design
- Ragie integration (S1766)
- Workflow bug fixes
- Homepage design exploration
- Business decisions (pricing)

### Week 4 (Feb 24-28): Launch Prep
- Homepage implementation
- Pricing page UI
- Stripe products config
- Beta testing & polish

---

## Product Model

### Tiers
| Tier | Access |
|------|--------|
| DDM | Course + Assessment only |
| Pro | Full app (course + tools) |
| Pro + Coaching | Pro + Cal.com coaching |

### Pricing Plans
- Pro Monthly (public)
- Pro Annual (public)
- Pro Trial - 1 week (public)
- Seneca/Student (hidden)
- DDM upgrade to Pro (hidden)

---

## Success Criteria

- [ ] Beta users can sign up and access Pro features
- [ ] Courses hidden from beta testers
- [ ] Dashboard loads correctly
- [ ] Complete workflow works end-to-end
- [ ] Users can upload via Ragie
- [ ] Users can export to PPTX and PDF
- [ ] Blog posts appear with images
- [ ] Homepage reflects new design
- [ ] Pricing page shows correct products

---

## Out of Scope (Post-MVP)

- E2E encryption
- Legacy customer migration
- Time-based tier downgrades
- Real-time collaboration
- Presentation versioning
- Advanced analytics
- Mobile app

---

## Links

- **Todoist:** 16 tasks created (Feb 3-28)
- **Specs:** `.ai/alpha/specs/` (S1890, S1766)
- **Full Roadmap:** Shared via Discord 2026-02-02
