## ✅ Implementation Complete

### Summary
- Added `survey_id` field to "before-you-go" lesson (lesson 31) linking to "feedback" survey
- Added `survey_id` field to "before-we-begin" lesson (lesson 8) linking to "self-assessment" survey
- Both surveys will now display correctly on their respective lesson pages

### Files Changed
```
apps/payload/src/seed/seed-data/course-lessons.json | 2 insertions
```

### Commits
```
7cab3fee6 fix(course): add missing survey_id to lesson seed data
```

### Validation Results
✅ JSON syntax validated
✅ TypeScript type check passed
✅ Lint check passed
✅ Database migrations applied successfully

### Follow-up Items
- Manual testing recommended: Navigate to `/home/course/lessons/before-you-go` and `/home/course/lessons/before-we-begin` to verify surveys display correctly after running `pnpm supabase:web:reset` and seeding

---
*Implementation completed by Claude*
