## ✅ Implementation Complete

### Summary
- Modified `extractSection()` function to return "none" instead of null when content is "None"
- Updated `extractTodoSectionContent()` to preserve "none" values
- **Added paragraph rendering for "None" content** - Modified `textToLexicalRichText()` to detect "none" content and generate a paragraph structure with capitalized "None" text instead of a list structure

### Root Cause
1. The seed converter's `extractSection()` function was returning `null` when it detected "None" content, causing the lesson JSON to omit these fields entirely
2. Even after fixing that, the `PayloadContentRenderer` doesn't handle `list` type nodes, so the "none" content (as a list) rendered as empty

### Fix Applied
1. Changed `extractSection()` to return `"none"` string instead of `null`
2. Changed `textToLexicalRichText()` to convert "none" to a paragraph with "None" text (not a list), which the renderer handles correctly

### Files Changed
```
apps/payload/src/seed/seed-conversion/converters/course-lessons-converter.ts (+34 lines)
apps/payload/src/seed/seed-data/course-lessons.json (regenerated)
```

### Commits
```
0a5336ce8 fix(cms): preserve None values as richText in lesson converter
```

### Validation Results
✅ All validation commands passed successfully:
- `pnpm --filter payload seed:convert` - Regenerated JSON without errors
- `pnpm --filter payload seed:validate` - Seed data validation passed
- `pnpm typecheck` - Type checking passed
- `pnpm lint:fix && pnpm format:fix` - No lint/format issues

### Verification
- Lesson 10 now has all four `todo_*` fields with paragraph structure containing "None"
- Lesson 11 (with actual content) still displays correct content unchanged
- Lesson 20 also has all fields properly populated with "None"

---
*Implementation completed by Claude*
