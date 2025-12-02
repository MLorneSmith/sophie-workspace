## ✅ Implementation Complete

### Summary
- Fixed regex pattern in `convertToSimpleLexical()` to skip bunny video shortcodes
- Changed approach: instead of parsing the shortcode, we now skip any paragraph containing `{% bunny` entirely
- Added `.filter()` to remove null entries from the children array
- Regenerated `course-lessons.json` seed data - now 0 shortcodes in content (was 19)
- All 19 `bunny_video_id` fields preserved correctly

### Files Changed
```
apps/payload/src/seed/seed-conversion/converters/course-lessons-converter.ts
apps/payload/src/seed/seed-data/course-lessons.json
```

### Commits
```
110322c60 fix(cms): remove bunny video shortcodes from lesson content
```

### Validation Results
✅ All validation commands passed:
- `pnpm typecheck` - passed
- `pnpm lint` - passed (warnings only)
- `pnpm format` - passed after auto-fix
- Seed data verified: 0 shortcodes, 19 video IDs

### Technical Details
The fix skips bunny shortcode paragraphs entirely rather than trying to parse them, since the video ID is already extracted to the `bunny_video_id` field by `extractBunnyVideoId()`.

---
*Implementation completed by Claude*
