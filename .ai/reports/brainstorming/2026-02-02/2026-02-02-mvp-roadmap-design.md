# SlideHeroes MVP Roadmap

**Created:** 2026-02-02
**Target:** End of February 2026 (4 weeks)
**Goal:** Beta-ready MVP for testing AI-assisted presentation workflow

---

## Executive Summary

This plan outlines the path to MVP for SlideHeroes, focusing on the core AI-assisted presentation workflow. Beta testers (new users) will test the presentation tools while courses remain hidden via feature flag.

**In Scope:**
- Presentation workflow: Assemble → Outline → Storyboard → Generate → Export
- Ragie RAG integration for importing existing presentations
- Dashboard completion
- Blog/CMS fixes
- Homepage redesign
- Products/pricing configuration

**Out of Scope (Post-MVP):**
- E2E encryption
- Legacy customer migration
- Time-based tier downgrades
- Real-time collaboration
- Presentation versioning/history

---

## Current State Assessment

| Area | Status | Notes |
|------|--------|-------|
| Infrastructure | ✅ Complete | Auth, RLS, deployment pipelines |
| Billing/Stripe | ✅ Complete | Integration works, needs product config |
| Dashboard | 🟡 67% | S1890 in progress, 7 tasks remaining |
| Blog/CMS | 🔴 Broken | Images not working, posts not rendering |
| Presentation Workflow | 🟡 50% | Canvas/Blocks exist, Storyboard/Generate/Export missing |
| RAG/Ragie | 🔴 0% | Spec exists (S1766), not started |
| Course | ✅ 80% | Built, needs feature flag to hide |

---

## Product Model (For Reference)

### Tiers
| Tier | Access |
|------|--------|
| DDM | Course + Assessment only |
| Pro | Full app (course + presentation tools) |
| Pro + Coaching | Pro + coaching add-on (Cal.com) |

### Pricing Plans (Public)
- Pro Monthly
- Pro Annual
- Pro Trial (1 week)

### Hidden Plans
- Seneca / Student
- DDM upgrade to Pro

### Beta Testers
- New users with Pro-level access
- Testing presentation workflow only
- Courses hidden via feature flag

---

## Week 1: Foundation (Feb 3-9)

**Goal:** Get the app beta-ready for testers to land and navigate.

### Tasks

#### 1.1 Course Feature Flag
- **Effort:** Small (1-2 hours)
- **Description:** Implement feature flag to hide all course-related UI and navigation
- **Acceptance Criteria:**
  - Course links hidden from navigation
  - /course routes return 404 or redirect
  - Assessment page hidden
  - Feature flag configurable in config/feature-flags.config.ts

#### 1.2 Dashboard Completion (S1890)
- **Effort:** Medium (1-2 days)
- **Description:** Complete remaining dashboard tasks from S1890 spec
- **Remaining Work:**
  - Quick actions panel (3 tasks remaining)
  - Presentation outline table
  - Loading skeletons
  - Error boundaries
- **Spec:** `.ai/alpha/specs/S1890-Spec-user-dashboard/`

#### 1.3 Blog Fix - CMS Images
- **Effort:** Medium (1 day)
- **Description:** Fix image handling in Payload CMS Lexical editor for long-form posts
- **Acceptance Criteria:**
  - Images can be uploaded within blog posts
  - Images persist and display correctly in CMS editor
  - Images have proper alt text support

#### 1.4 Blog Fix - Public Rendering
- **Effort:** Medium (1 day)
- **Description:** Fix blog posts not appearing on public website
- **Acceptance Criteria:**
  - Blog listing page shows all published posts
  - Individual blog post pages render correctly
  - Images display properly on public site
  - Proper SEO metadata

---

## Week 2: Presentation Workflow (Feb 10-16)

**Goal:** Build the complete presentation workflow end-to-end.

### Workflow Steps
```
Assemble (exists) → Outline (polish) → Storyboard (build) → Generate (rebuild) → Export
```

### Tasks

#### 2.1 Outline UI Polish
- **Effort:** Medium (1-2 days)
- **Description:** Refine existing canvas module UX for the Outline step
- **Acceptance Criteria:**
  - Clear visual hierarchy for presentation structure
  - Intuitive section/slide organization
  - AI suggestions integration working
  - Smooth transition to Storyboard step

#### 2.2 Storyboard Build
- **Effort:** Large (2-3 days)
- **Description:** Build the Storyboard step with full drag-drop functionality
- **Acceptance Criteria:**
  - Visual grid/canvas showing all slides
  - Full drag-drop reordering
  - Slide thumbnails/previews
  - Add/remove/duplicate slides
  - Transition to Generate step

#### 2.3 Generate Rebuild
- **Effort:** Large (2-3 days)
- **Description:** Rebuild AI content generation from storyboard
- **Acceptance Criteria:**
  - AI generates content for each slide based on outline/storyboard
  - User can review and edit generated content
  - Regenerate individual slides
  - Progress indication during generation
  - Cost tracking (existing Portkey integration)

#### 2.4 Presentation Export
- **Effort:** Large (2 days)
- **Description:** Implement PPTX and PDF export
- **Formats:** Both PPTX and PDF required
- **Acceptance Criteria:**
  - Export to PPTX with proper formatting
  - Export to PDF with proper formatting
  - Download triggered from UI
  - Export includes all slides, images, text
  - Reasonable file sizes

**Technical Decisions:**
- Export library: TBD (pptxgenjs, officegen, or API service)
- AI model for generation: Portkey gateway (existing)

---

## Week 3: RAG + Design (Feb 17-23)

**Goal:** Add RAG integration and prepare homepage redesign.

### Tasks

#### 3.1 Ragie Integration
- **Effort:** Large (3-4 days)
- **Description:** Implement upload → extract → populate workflow
- **Spec:** S1766-Spec-ragie-presentation-import
- **Acceptance Criteria:**
  - File upload UI (PPT, PPTX, PDF supported)
  - Google Slides link import (if feasible)
  - Ragie SDK integration for content extraction
  - Extracted content maps to Blocks/Assemble step
  - Progress/status feedback during processing
  - Error handling for unsupported formats

#### 3.2 Workflow Bug Fixes
- **Effort:** Buffer (1-2 days)
- **Description:** Address issues discovered during Week 2 implementation
- **Scope:** Bug fixes, edge cases, UX polish

#### 3.3 Homepage Design Exploration
- **Effort:** Medium (2 days)
- **Description:** AI-generated design options for homepage redesign
- **Deliverables:**
  - 2-3 layout concepts with wireframes
  - Hero section variations
  - Section organization options
  - Visual direction recommendations
- **Output:** Selected design for Week 4 implementation

#### 3.4 Business Decisions (Non-Engineering)
- **Owner:** You (business decisions)
- **Decisions Needed:**
  - Final pricing for Pro Monthly / Pro Annual
  - Trial length confirmation
  - Feature gates per tier
  - Create Stripe products/prices

---

## Week 4: Launch Prep (Feb 24-28)

**Goal:** Public-facing readiness and final polish.

### Tasks

#### 4.1 Homepage Implementation
- **Effort:** Large (2-3 days)
- **Description:** Implement selected homepage design
- **Acceptance Criteria:**
  - New layout implemented
  - New hero section
  - Updated sections and content
  - Responsive design
  - Performance optimized

#### 4.2 Pricing Page UI
- **Effort:** Medium (1 day)
- **Description:** Update pricing page to align with new homepage design
- **Acceptance Criteria:**
  - Visual consistency with new homepage
  - Displays configured Stripe products
  - Clear tier comparison
  - CTA buttons working

#### 4.3 Stripe Products Configuration
- **Effort:** Small (2-4 hours)
- **Description:** Configure actual products and prices in Stripe
- **Scope:**
  - Pro Monthly product/price
  - Pro Annual product/price
  - Pro Trial configuration
  - Hidden prices (Seneca, DDM upgrade)

#### 4.4 Beta Testing & Polish
- **Effort:** Medium (1-2 days)
- **Description:** End-to-end testing and bug fixes
- **Scope:**
  - Complete workflow testing
  - Onboarding flow review
  - Error handling verification
  - Performance testing
  - Bug fixes

---

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Week 2 scope too heavy | High | Medium | Buffer in Week 3; simplify if needed |
| Ragie integration complexity | Medium | Medium | S1766 spec exists; start early if possible |
| Homepage design iterations | Medium | Low | Timebox to 2-3 days max |
| Export library issues | Medium | High | Evaluate libraries early; have backup plan |
| Stripe config delays | Low | Low | Business decisions needed by Week 3 |

---

## Success Criteria

MVP is ready for beta when:

- [ ] Beta users can sign up and access Pro features
- [ ] Courses are hidden from beta testers
- [ ] Dashboard loads and displays correctly
- [ ] Complete workflow: Assemble → Outline → Storyboard → Generate → Export
- [ ] Users can upload existing presentations via Ragie
- [ ] Users can export to PPTX and PDF
- [ ] Blog posts appear on public website with images
- [ ] Homepage reflects new design
- [ ] Pricing page shows correct products

---

## Out of Scope (Post-MVP Backlog)

1. **E2E Encryption** - Client-side encryption for zero-knowledge marketing
2. **Legacy Customer Migration** - DDM, 495 DDM, Seneca customer handling
3. **Time-Based Downgrades** - Seneca Pro → DDM after 3 months
4. **Real-Time Collaboration** - Multiple users editing simultaneously
5. **Presentation Versioning** - History and rollback
6. **Advanced Analytics** - Usage dashboards, insights
7. **Mobile App** - Native mobile experience

---

## Alpha Workflow Execution

This plan will be executed using the Alpha workflow:

1. **Week 1:**
   - S1890 (Dashboard) - Resume existing spec
   - New spec for Blog/CMS fixes
   - New spec for Course feature flag

2. **Week 2:**
   - New spec for Presentation Workflow (Outline, Storyboard, Generate, Export)
   - Decompose into initiatives per step

3. **Week 3:**
   - S1766 (Ragie) - Execute existing spec
   - Homepage design exploration (brainstorming session)

4. **Week 4:**
   - New spec for Homepage implementation
   - Pricing page updates
   - Beta testing (manual + automated)

---

## Appendix: Product Configuration Reference

### Products
1. DDM (course only)
2. Pro (DDM + Tools)
3. Coaching Session (add-on)
4. DDM upgrade to Pro

### Customer Types
1. Legacy DDM Customers → DDM access
2. Legacy 495 DDM Customers → Pro year 1, DDM after
3. Legacy Seneca Customers → DDM access
4. New Pro → Pro access
5. New Seneca → Pro 3 months, DDM after

### User Types
1. Free Trial User → Pro for 1 week
2. Evaluation Copy User → Pro for 1 month

### Pricing Plans
- Pro Monthly (public)
- Pro Annual (public)
- Pro Trial (public)
- Seneca / Student (hidden)
- DDM upgrade to Pro (hidden)
