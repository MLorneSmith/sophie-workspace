## ✅ Implementation Complete

### Summary
- Replaced nested `<button>` wrapper with `<label>` element in ScaleQuestion component
- Fixed HTML validation error where RadioGroupItem (renders as button) was wrapped in outer button
- Applied existing pattern from plan-picker.tsx with visual feedback for selected state
- Removed unused `Label` import, added `cn` utility for conditional styling

### Files Changed
```
apps/web/app/home/(user)/assessment/survey/_components/scale-question.tsx | 33 +++++++++-------------
1 file changed, 14 insertions(+), 19 deletions(-)
```

### Commits
```
4126c5acf fix(ui): replace nested buttons with label in ScaleQuestion component
```

### Validation Results
✅ All validation commands passed successfully:
- `pnpm typecheck` - passed (37 tasks successful)
- `pnpm lint:fix` - passed (no errors)

### Technical Details
The fix replaces:
```tsx
<button onClick={...} onKeyDown={...}>
  <RadioGroupItem />  // Also renders as button!
  <Label>...</Label>
</button>
```

With:
```tsx
<label htmlFor={optionId} className={cn(...)}>
  <RadioGroupItem />  // Keyboard/click handling built-in via label
  <span>...</span>
</label>
```

This approach:
1. Eliminates nested buttons (invalid HTML)
2. Preserves keyboard accessibility (label click triggers RadioGroupItem)
3. Adds visual feedback for selected state via `bg-muted` class
4. Follows established project pattern from plan-picker.tsx

### Follow-up Items
- None required

---
*Implementation completed by Claude*
