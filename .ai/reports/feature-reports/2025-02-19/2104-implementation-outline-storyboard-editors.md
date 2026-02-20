## Refactored: Outline Editor Rewrite

Based on feedback that the outline editor didn't match the old canvas outline's behavior, the outline implementation has been **completely rewritten** to use deterministic assembly instead of AI generation.

### Key Changes

**Outline Editor (rewritten):**
- **Deterministic assembly** from assemble_outputs (situation, complication, answer) — no AI call
- **Single TipTap editor** for the full outline document (was per-section editors)
- **"Reset Outline" button** to re-assemble from SCA data (matches old canvas behavior)
- Auto-save on blur + debounced 1s auto-save on update + beforeunload save
- Toolbar with Bold, Italic, Underline, H1, H2, Bullet List, Ordered List, Undo
- Auto-generates on first visit if no outline exists

**Storyboard generation (updated):**
- Extracts sections from TipTap document format (H2 headings as section boundaries)
- Still uses AI for slide generation from outline text

**Removed:**
- `section-editor.tsx` — no longer needed (single editor replaces per-section editors)
- Emptied unused service files

### Files Changed
```
 generate-outline.action.ts    | 459 ++++++++++++---------
 save-outline.action.ts        |  13 +-
 outline-editor.tsx            | 347 +++++++++++-----
 section-editor.tsx            | 250 -----------
 use-outline-contents.ts       |  55 ++-
 outline-contents.service.ts   | 105 +----
 generate-storyboard.action.ts |  85 +++-
 storyboard-contents.service.ts| 105 +----
 8 files changed, 698 insertions(+), 875 deletions(-)
```

### Validation Results
- typecheck: passed
- lint: passed (0 warnings)
- format: passed

---
*Refactored by Claude*
