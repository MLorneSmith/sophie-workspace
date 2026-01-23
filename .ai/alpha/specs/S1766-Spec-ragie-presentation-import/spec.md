# Project Specification: Ragie Integration for Presentation Import

## Metadata
| Field | Value |
|-------|-------|
| **Spec ID** | S1766 |
| **GitHub Issue** | #1766 |
| **Document Owner** | Claude (Alpha Workflow) |
| **Created** | 2026-01-23 |
| **Status** | Draft |
| **Version** | 0.1 |

---

## 1. Executive Summary

### One-Line Description
Integrate Ragie RAG-as-a-Service to enable users to upload existing presentations and leverage that content to accelerate the Blocks stage of presentation creation.

### Press Release Headline
> "SlideHeroes announces Presentation Import feature enabling users to instantly transform their existing presentations into structured building blocks for faster content creation"

### Elevator Pitch (30 seconds)
SlideHeroes users often have existing presentations they want to repurpose. The Ragie Integration for Presentation Import allows users to upload their PPTX, PDF, or other presentation files to a personal library, then use AI to automatically extract and populate presentation fields in the Blocks form. This reduces the time to start a new presentation from scratch by auto-filling presentation type, title, and audience, while providing contextual AI suggestions for situation, complication, and answer fields based on the uploaded content.

---

## 2. Problem Statement

### Problem Description
Users come to SlideHeroes with existing presentations they want to repurpose, restructure, or enhance. Currently, they must manually re-enter all content from their existing presentations into the Blocks form, which is time-consuming and error-prone. There's no way to leverage the insights, structure, or content from presentations they've already created.

### Who Experiences This Problem?
- **Busy professionals** who have a library of existing presentations they want to refresh
- **Consultants** who repurpose similar presentations for different clients
- **Educators** who iterate on course materials each semester
- **Sales teams** who need to quickly adapt product decks for different audiences

### Current Alternatives
1. **Manual copy-paste**: Users open their existing presentation in another window and manually transfer content
2. **Start from scratch**: Users abandon existing content and begin fresh
3. **Use competitor tools**: Some tools offer import features but lack the structured SCqA framework

### Impact of Not Solving
- **Business impact**: Lower conversion from trial to paid as users abandon the workflow when they realize they need to re-enter content manually
- **User impact**: Frustration and wasted time; users may not adopt SlideHeroes for their main workflow
- **Competitive impact**: Competitors with import features have an advantage in user acquisition

---

## 3. Vision & Goals

### Product Vision
Users can instantly transform any existing presentation into a structured SlideHeroes project. The platform becomes the central hub for all presentation content, intelligently analyzing and organizing uploaded materials to accelerate creation of new, improved presentations.

### Primary Goals (SMART)

| Goal | Success Metric | Target | Measurement Method |
|------|---------------|--------|-------------------|
| G1: Reduce time-to-first-block | Time from starting Blocks form to completing first submission | -40% vs current baseline (est. 8 min → 5 min) | Analytics event timing |
| G2: Increase Blocks completion rate | % of users who start Blocks and complete it | +25% (from estimated 60% → 75%) | Funnel analytics |
| G3: Drive upload adoption | % of Blocks submissions that use imported content | 30% of submissions within 3 months | Feature flag tracking |

### Strategic Alignment
This feature supports SlideHeroes' mission to make professional presentations accessible by removing the barrier of starting from scratch. It also creates a content moat - users who upload their presentation library become more invested in the platform.

---

## 4. Target Users

### Primary Persona
**Name**: Repurposing Rachel
**Role**: Senior Marketing Manager
**Goals**: Quickly adapt existing presentations for new audiences without starting from scratch
**Pain Points**: Spends 2+ hours recreating presentations she's already made; loses good content because it's buried in old decks
**Quote**: "I have 50+ presentations in my Drive. I just want to pull the best parts and make something new without all the manual work."

### Secondary Personas
1. **Iterating Ian** - Educator who updates course materials each semester, wants to import last year's slides as a starting point
2. **Scaling Sam** - Sales team lead who needs to help team members quickly adapt master decks for different prospects

### Anti-Personas (Who This Is NOT For)
- Users who only create brand-new presentations with no existing content
- Users looking for full presentation editing (this is import for Blocks only, not a slide editor)
- Teams needing shared upload libraries (v1 is user-scoped only)

---

## 5. Solution Overview

### Proposed Solution
A two-part system consisting of (1) a personal "My Uploads" library where users manage their uploaded presentation files, and (2) an "Import" feature in the Blocks form that leverages Ragie RAG to analyze uploads and populate/suggest field values.

### Key Capabilities

1. **My Uploads Library**: Personal library where users upload and manage presentations (PPTX, PPT, PDF, Keynote, Google Slides export). Files are stored in Ragie with user-scoped partitioning. Users can view, select, and delete uploads. Visual indicator shows usage (e.g., "7 of 10 uploads used").

2. **Import in Blocks**: "Import from existing presentation" button in the Blocks form. Users can upload a new file directly or select from their library. Validation enforces limits (≤50 slides, <10 uploads).

3. **Smart Field Mapping**: AI auto-populates `presentation_type`, `question_type`, `title`, and `audience` fields by analyzing uploaded content. Progressive loading UX shows spinner per field as AI analyzes.

4. **Enhanced AI Suggestions**: The existing AI suggestion system for `situation`, `complication`, and `answer` fields is enhanced to draw from the uploaded presentation content via Ragie retrieval, providing contextually relevant suggestions.

### Customer Journey

1. **Discover**: User sees "Import from existing presentation" button while in Blocks form
2. **Upload/Select**: User either uploads a new file or opens their library to select an existing upload
3. **Validate**: System validates slide count (≤50) and upload count (<10)
4. **Process**: Ragie processes document; user sees progress indicator
5. **Auto-fill**: AI analyzes content and progressively fills presentation_type, question_type, title, audience fields with loading spinners
6. **Enhance**: As user edits situation/complication/answer, suggestions are informed by uploaded content
7. **Complete**: User finishes Blocks form with significantly less manual input

### Hypothetical Customer Quote
> "I uploaded my quarterly review deck and it instantly knew it was a business presentation for executives. The suggestions for my complication section pulled directly from my original pain points slide. What used to take 20 minutes now takes 5."
> — Rachel, Senior Marketing Manager

### Responsive Behavior

| Breakpoint | Layout | Notes |
|------------|--------|-------|
| Mobile (<768px) | Single column, stacked library list | Upload button prominent, thumbnails smaller |
| Tablet (768-1024px) | 2-column grid for library | Side panel for file details |
| Desktop (>1024px) | 3-column grid with full metadata | Primary design target |

---

## 6. Scope Definition

### In Scope

- [x] My Uploads Library page with list view (filename, upload date, slide count, file type)
- [x] Delete functionality with confirmation dialog
- [x] Upload usage indicator ("7 of 10 uploads used")
- [x] File upload to Ragie with user_id as partition key
- [x] Support for PPTX, PPT, PDF file formats
- [x] Keynote/Google Slides support via PDF export workflow (documented)
- [x] Supabase metadata table (user_id, ragie_document_id, filename, slide_count, file_type, created_at)
- [x] Slide count validation (max 50 slides)
- [x] Upload count validation (max 10 per user)
- [x] "Import from existing presentation" button in Blocks form
- [x] AI auto-population of presentation_type, question_type, title, audience
- [x] Enhanced AI suggestions for situation, complication, answer using Ragie retrieval
- [x] Progressive loading UX with per-field spinners
- [x] Error messaging for validation failures and processing errors
- [x] Upgrade CTA when at upload limit

### Out of Scope

- [ ] Team-scoped uploads (user-scoped only for v1)
- [ ] Real-time sync with Google Drive or Dropbox (manual upload only)
- [ ] Using uploads to inform Canvas or Storyboard stages (Blocks only for v1)
- [ ] Editing uploaded content within SlideHeroes
- [ ] Direct Keynote file parsing (requires PDF export)
- [ ] Direct Google Slides import (requires PDF/PPTX export)
- [ ] Thumbnail/preview generation for uploaded files
- [ ] Batch upload of multiple files at once
- [ ] Search within uploads library
- [ ] Sorting/filtering in uploads library

### Future Considerations (v2+)

- Team-scoped upload libraries with permission controls
- Google Drive integration for direct import
- Canvas/Storyboard stage integration
- Thumbnail previews and slide-by-slide browsing
- Upload search and filtering
- Higher upload limits for paid tiers
- Analytics on which uploads are most reused

---

## 7. Technical Context

### System Integration Points

| System | Integration Type | Notes |
|--------|-----------------|-------|
| `building_blocks_submissions` table | DB (foreign key) | Stores `source_upload_id` reference to imported presentation |
| `ai-suggestions-action.ts` | Server Action | Enhanced to include Ragie retrieval context |
| `BlocksForm.tsx` | UI Component | Add import button and processing state |
| `BlocksFormContext.tsx` | State | Add import state management |
| Ragie SDK | External API | Document ingestion, retrieval, management |
| Supabase Storage | DB | Optional: Store original files as backup |

### Technical Constraints

- **Performance**: Document processing should complete within 30 seconds; UI should show progress
- **Security**: API key must be server-side only; RLS policies on metadata table
- **Compliance**: No PII extracted or stored beyond what user explicitly saves
- **Scalability**: Ragie partition per user handles isolation; rate limits per Ragie plan (Developer: 10-1000/min)

### Technology Preferences/Mandates

- **Ragie SDK**: `ragie` npm package with tree-shaking via `RagieCore` and standalone functions
- **Server Actions**: All Ragie API calls via `enhanceAction` wrapper
- **Zod Validation**: All upload metadata and form data validated
- **React Query**: For upload library data fetching and cache invalidation

### Dependencies

| Dependency | Owner | Risk Level | Notes |
|------------|-------|------------|-------|
| Ragie API availability | External (Ragie) | Medium | Include retry logic; graceful degradation |
| Ragie rate limits | External | Low | Developer tier: 10/min for summaries, 1000/min for docs |
| Ragie document processing time | External | Medium | Async with polling; show progress to user |
| Supabase RLS | Internal | Low | Standard pattern; user_id = auth.uid() |

---

## 8. Assumptions & Risks

### Key Assumptions

1. **Ragie processes PPTX/PDF reliably**: Assumption that Ragie can extract meaningful text content from presentation files — *Validation: Test with 10 sample presentations of varying complexity*

2. **50-slide limit is sufficient**: Most presentations users want to import are under 50 slides — *Validation: Survey users about typical presentation length; monitor validation rejection rate*

3. **10-upload limit is acceptable for v1**: Users won't need more than 10 uploads in their library — *Validation: Monitor upload deletion rate; gather feedback*

4. **AI can infer presentation_type/question_type**: Content analysis can reliably suggest structured field values — *Validation: A/B test auto-fill accuracy with user corrections*

### Risk Register

| ID | Risk | Probability | Impact | Mitigation | Owner |
|----|------|-------------|--------|------------|-------|
| R1 | Ragie processing takes too long (>30s) | Medium | Medium | Implement webhook notifications; show progress UI; allow user to continue without waiting | Engineering |
| R2 | AI field mapping accuracy is poor | Medium | High | Provide easy correction UX; track accuracy metrics; iterate on prompts | Engineering |
| R3 | Users hit upload limit and churn | Low | Medium | Upgrade CTA; clear deletion workflow; monitor limit-hit events | Product |
| R4 | Ragie costs exceed budget | Low | High | Monitor usage; set internal alerts; tiered limits by user plan | Engineering |

### Open Questions

1. [ ] What is the Ragie pricing model and expected cost per user per month?
2. [ ] Should we implement webhook notifications from Ragie or rely on polling?
3. [ ] What analytics events should we track for measuring success?
4. [ ] Should there be an explicit "Re-analyze" button if AI suggestions seem off?

---

## 9. Success Criteria

### Definition of Done (Project Level)

- [ ] Users can upload presentation files (PPTX, PPT, PDF) to their personal library
- [ ] Users can view, select, and delete uploads from their library
- [ ] Users can import from library or upload new file in Blocks form
- [ ] AI auto-populates presentation_type, question_type, title, audience from imported content
- [ ] AI suggestions for situation/complication/answer are enhanced with Ragie context
- [ ] Upload limits (50 slides, 10 files) are enforced with clear error messages
- [ ] Upgrade CTA appears when user is at upload limit
- [ ] All server actions use enhanceAction with proper validation
- [ ] RLS policies protect user data
- [ ] E2E tests cover happy path and error scenarios

### Launch Criteria

- [ ] 100 internal test uploads processed without errors
- [ ] AI field mapping accuracy >80% (user doesn't need to change suggested value)
- [ ] Document processing p95 <30 seconds
- [ ] No security vulnerabilities in penetration testing
- [ ] Documentation complete for support team

### Post-Launch Validation

| Metric | Baseline | Target | Timeframe |
|--------|----------|--------|-----------|
| Blocks completion rate | 60% (estimated) | 75% | 4 weeks |
| Time to first block submission | 8 min (estimated) | 5 min | 4 weeks |
| Import feature adoption | 0% | 30% of submissions | 12 weeks |
| User-reported satisfaction (NPS) | Current baseline | +10 points | 12 weeks |

---

## 10. Decomposition Hints

### Standard Initiative Categories to Consider

1. **Foundation/Layout** (P0) - Database schema, Ragie SDK setup, environment configuration
2. **Data Layer** (P0/P1) - Server actions for upload/delete/list, metadata management
3. **Core Components** - My Uploads Library page, Import modal in Blocks
4. **Integrations** (P1) - Ragie document processing, AI field mapping, enhanced suggestions
5. **Polish & Edge Cases** (P2) - Error states, loading states, upgrade CTA, accessibility

### Candidate Initiatives

1. **I1: Foundation & Data Layer**: Database migration for uploads metadata, Ragie SDK integration, basic server actions for CRUD operations, environment variable setup

2. **I2: My Uploads Library**: Library page UI, list/grid view, upload functionality, delete with confirmation, usage indicator, RLS policies

3. **I3: Import in Blocks Integration**: Import button in Blocks form, file selection modal, upload-on-demand flow, processing state UI

4. **I4: AI Field Mapping**: Integration with AI suggestion system, Ragie retrieval for context, auto-population of structured fields, enhanced suggestions for narrative fields

5. **I5: Limits & Monetization**: Slide count validation, upload count validation, error messaging, upgrade CTA integration

### Suggested Priority Order

| Priority | Initiative | Rationale |
|----------|------------|-----------|
| P0 | I1: Foundation & Data Layer | Must have database and SDK before anything else |
| P0 | I2: My Uploads Library | Core feature that enables all other capabilities |
| P1 | I3: Import in Blocks Integration | Primary user value - connecting uploads to workflow |
| P1 | I4: AI Field Mapping | Key differentiator - the "magic" of the feature |
| P2 | I5: Limits & Monetization | Important but can be added after core flow works |

### Complexity Indicators

| Area | Complexity | Rationale (based on codebase findings) |
|------|------------|----------------------------------------|
| Database schema | Low | Standard pattern; existing `building_blocks_submissions` as reference |
| Ragie SDK integration | Medium | External API; need error handling and retry logic |
| My Uploads Library UI | Low | Existing patterns in codebase (DataTable, Dialog, Dropzone) |
| AI field mapping | High | New capability; requires prompt engineering and accuracy tuning |
| Enhanced suggestions | Medium | Extending existing `ai-suggestions-action.ts` with additional context |
| Blocks form integration | Medium | Must integrate cleanly with existing multi-step form state |

---

## 11. Appendices

### A. Glossary

| Term | Definition |
|------|------------|
| **Ragie** | RAG-as-a-Service platform for document ingestion and retrieval |
| **Partition** | Ragie concept for data isolation; using user_id as partition key |
| **Blocks** | SlideHeroes form for structured presentation input (SCqA framework) |
| **SCqA** | Situation-Complication-Question-Answer framework for presentations |
| **RAG** | Retrieval-Augmented Generation - using retrieved documents to enhance AI responses |

### B. Codebase Exploration Results (REQUIRED)

| Component/Pattern Found | File Path | Reusable? | Notes |
|------------------------|-----------|-----------|-------|
| BlocksForm multi-step form | `apps/web/app/home/(user)/ai/blocks/_components/BlocksForm.tsx` | Yes | Add import state to form context |
| BlocksFormContext | `apps/web/app/home/(user)/ai/blocks/_components/BlocksFormContext.tsx` | Yes | Extend with import source tracking |
| AI suggestions action | `apps/web/app/home/(user)/ai/blocks/_actions/ai-suggestions-action.ts` | Yes | Add Ragie context to suggestions |
| Submit building blocks schema | `apps/web/app/home/(user)/ai/blocks/_lib/schemas/submit-building-blocks.schema.ts` | Pattern | Reference for upload schema |
| FileUploader component | `packages/ui/src/makerkit/file-uploader.tsx` | Yes | Use for upload UI |
| Dropzone component | `packages/ui/src/makerkit/dropzone.tsx` | Yes | Drag-and-drop support |
| useSupabaseUpload hook | `packages/ui/src/hooks/use-supabase-upload.tsx` | Pattern | Reference for upload patterns |
| DataTable component | `packages/ui/src/makerkit/data-table.tsx` | Yes | Library list view |
| AlertDialog | `packages/ui/src/shadcn/alert-dialog.tsx` | Yes | Delete confirmation |
| Dialog | `packages/ui/src/shadcn/dialog.tsx` | Yes | Import modal |
| Storage bucket pattern | `apps/web/supabase/migrations/20250407140654_create_certificates_bucket.sql` | Pattern | Reference for RLS on storage |

**Tables/Schemas Identified:**

| Table Name | Location | Purpose |
|------------|----------|---------|
| `building_blocks_submissions` | `apps/web/supabase/migrations/20250211000000_web_create_building_blocks_submissions.sql` | Reference for user-scoped data pattern |
| `accounts_memberships` | `apps/web/supabase/schemas/05-memberships.sql` | User-account relationship pattern |
| `storage.objects` | `apps/web/supabase/schemas/16-storage.sql` | Storage RLS pattern |

### C. Research Integration (REQUIRED)

| Research File | Key Findings | Spec Section(s) Affected |
|--------------|--------------|-------------------------|
| `ragie-sdk-docs.md` | 1. Use `RagieCore` with standalone functions for tree-shaking. 2. Partition feature perfect for user isolation. 3. Status progression: uploading→partitioning→processing→indexed→ready. 4. `maxChunksPerDocument` for diverse retrieval. 5. Developer tier: 10/min for summaries. | Section 7 (Technical Context), Section 5 (Solution Overview) |
| `presentation-import-patterns.md` | 1. Industry standard: 50-300 MB file size, 50-500 slide limits. 2. Target 95%+ field-level accuracy for AI mapping. 3. Slide-level chunking recommended for RAG. 4. Progressive disclosure for quota warnings. 5. Keynote requires conversion to PPTX/PDF. | Section 6 (Scope), Section 3 (Goals), Section 5 (UX) |

### D. External References

- [Ragie TypeScript SDK Documentation](https://docs.ragie.ai/)
- [Ragie GitHub Repository](https://github.com/ragieai/ragie-typescript)
- [python-pptx for reference on presentation structure](https://python-pptx.readthedocs.io/)

### E. Visual Assets

**ASCII Layout Mockup - My Uploads Library:**

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  SlideHeroes                                    [User Menu ▼]                │
├──────────────────────────────────────────────────────────────────────────────┤
│  ← Back to Dashboard                                                         │
│                                                                              │
│  My Uploads                                              [+ Upload New]      │
│  ─────────────────────────────────────────────────────────────────────────   │
│  7 of 10 uploads used  ████████████░░░░  [Upgrade for more]                 │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │ Filename                  │ Type  │ Slides │ Uploaded    │ Actions     │ │
│  ├────────────────────────────────────────────────────────────────────────┤ │
│  │ Q4 Sales Review.pptx      │ PPTX  │ 24     │ Jan 20, 2026│ [🗑 Delete] │ │
│  │ Product Launch Deck.pdf   │ PDF   │ 18     │ Jan 18, 2026│ [🗑 Delete] │ │
│  │ Team Offsite Agenda.pptx  │ PPTX  │ 12     │ Jan 15, 2026│ [🗑 Delete] │ │
│  │ Marketing Strategy.pptx   │ PPTX  │ 45     │ Jan 10, 2026│ [🗑 Delete] │ │
│  │ Annual Report 2025.pdf    │ PDF   │ 32     │ Jan 05, 2026│ [🗑 Delete] │ │
│  │ Client Proposal.pptx      │ PPTX  │ 8      │ Dec 28, 2025│ [🗑 Delete] │ │
│  │ Training Materials.pdf    │ PDF   │ 50     │ Dec 20, 2025│ [🗑 Delete] │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  Supported formats: PPTX, PPT, PDF (max 50 slides per file)                 │
└──────────────────────────────────────────────────────────────────────────────┘
```

**ASCII Layout Mockup - Import in Blocks Form:**

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  Blocks Form - Step 1: Presentation Type                                     │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │  📁 Import from existing presentation                                   ││
│  │  ─────────────────────────────────────────────────────────────────────  ││
│  │  Speed up your workflow by importing from a presentation you've         ││
│  │  already created.                                                       ││
│  │                                                                         ││
│  │  [Select from Library]    or    [Upload New File]                       ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
│  ── OR start fresh ──────────────────────────────────────────────────────── │
│                                                                              │
│  What type of presentation is this?                                          │
│                                                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   Business  │  │  Technical  │  │  Academic   │  │   Sales     │         │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘         │
│                                                                              │
│                                                    [Continue →]              │
└──────────────────────────────────────────────────────────────────────────────┘
```

**ASCII Layout Mockup - AI Processing State:**

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  Blocks Form - Importing from "Q4 Sales Review.pptx"                         │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Analyzing your presentation...                                              │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │  Presentation Type    ✓ Business                                        ││
│  │  Question Type        ✓ Informative                                     ││
│  │  Title                ⟳ Analyzing...                                    ││
│  │  Audience             ○ Waiting...                                      ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
│  You can edit any field after analysis completes.                           │
│                                                                              │
│  [Cancel Import]                                                             │
└──────────────────────────────────────────────────────────────────────────────┘
```

### F. Decision Log

| Date | Decision | Rationale | Decided By |
|------|----------|-----------|------------|
| 2026-01-23 | User-scoped uploads only (no team sharing) | Simpler v1; privacy-focused; avoid permission complexity | Product |
| 2026-01-23 | System-level Ragie API key | Better UX; controlled costs; no user configuration needed | User Interview |
| 2026-01-23 | Progressive field loading UX | Fields on different screens; matches existing form flow | User Interview |
| 2026-01-23 | Soft limit with upgrade CTA | Supports monetization path; better than hard wall | User Interview |
| 2026-01-23 | Max 50 slides per document | Balance between utility and processing time/cost | Research |
| 2026-01-23 | Max 10 uploads per user | Reasonable for v1; upgrade path available | Product |
| 2026-01-23 | PDF/PPTX/PPT support; Keynote via export | Direct parsing covers majority; Keynote has no JS library | Research |
