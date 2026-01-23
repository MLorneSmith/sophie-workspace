# Ragie Integration for Presentation Import - Spec Input

**Date:** 2026-01-23
**Status:** Ready for `/alpha:spec`

## Summary

Integrate Ragie RAG-as-a-Service to allow users to upload existing presentations and use that content to accelerate the presentation creation workflow in the Blocks stage.

## Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| File formats | All (PPTX, PPT, PDF, Keynote, Google Slides) | Maximum flexibility for users |
| Data scoping | User-scoped only | Simpler model, privacy-focused |
| Upload UX | Library + on-demand import | Supports both quick imports and power users |
| Field population | Hybrid (auto-fill structured, suggestions for narrative) | Balances automation with user control |

## Spec Input

Copy the text below and run: `/alpha:spec Ragie Integration for Presentation Import`

---

```
Ragie Integration for Presentation Import

Integrate Ragie RAG-as-a-Service to allow users to upload existing presentations
and use that content to accelerate the presentation creation workflow.

KEY CAPABILITIES:
1. My Uploads Library - Personal library where users upload/manage presentations
   (PPTX, PPT, PDF, Keynote, Google Slides). Stored in Ragie with user-scoped
   partitioning for data isolation. Users can view, select, and delete uploads.

2. Import in Blocks - "Import from existing presentation" button in Blocks form.
   User can upload new file or select from their library.

3. Smart Field Mapping - Auto-populate presentation_type, question_type, title,
   and audience by analyzing uploaded content with AI.

4. Enhanced Suggestions - For situation, complication, and answer fields, enhance
   the existing AI suggestion system to draw from the uploaded presentation content
   via Ragie retrieval.

UPLOAD LIMITS:
- Maximum 50 slides per document (reject uploads exceeding this)
- Maximum 10 uploads per user in their library
- Users must delete existing uploads to make room for new ones when at limit
- Clear error messaging when limits are reached

LIBRARY MANAGEMENT:
- List view showing: filename, upload date, slide count, file type
- Delete functionality with confirmation dialog
- Indicator showing usage (e.g., "7 of 10 uploads used")

INTEGRATION POINTS:
- Ragie SDK for document ingestion, indexing, and retrieval
- Supabase for upload metadata tracking (user_id, ragie_document_id, filename,
  slide_count, file_type, created_at)
- Existing AI suggestion actions enhanced with Ragie context
- Multi-tenant partitioning using Ragie's partition feature (partition = user_id)

USER FLOW:
1. User clicks "Import" in Blocks form
2. Uploads new file OR selects from library
3. System validates: slide count ≤50, user upload count <10 (or replacing)
4. Ragie processes document → returns extracted content
5. AI analyzes content → auto-fills presentation_type, question_type, title, audience
6. As user edits situation/complication/answer, suggestions are informed by uploaded content

OUT OF SCOPE:
- Team-scoped uploads (user-scoped only for v1)
- Real-time sync with Google Drive (manual upload only)
- Using uploads to inform Canvas/Storyboard stages (Blocks only for v1)
- Editing uploaded content within SlideHeroes
```

---

## Next Step

Run:
```bash
/alpha:spec Ragie Integration for Presentation Import
```

The spec command will interview you for remaining details (risks, personas, success metrics) and research Ragie's SDK and existing codebase patterns.
