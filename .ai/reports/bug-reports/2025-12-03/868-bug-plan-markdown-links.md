# Bug Fix: Markdown links in lesson content not converted to hyperlinks

**Related Diagnosis**: #867
**Severity**: high
**Bug Type**: bug
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: The `textToLexicalRichText()` function doesn't parse markdown link syntax `[text](url)` into Lexical `link` nodes
- **Fix Approach**: Add markdown link parsing to converter + link node rendering in content renderer
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

Markdown hyperlinks in lesson content (e.g., `[HBR Guide](https://amazon.com)`) are stored as raw text in Lexical JSON instead of being converted to proper `link` nodes. This causes them to render as plain text on the frontend instead of clickable hyperlinks.

For full details, see diagnosis issue #867.

### Solution Approaches Considered

#### Option 1: Add markdown link parsing to `textToLexicalRichText()` ⭐ RECOMMENDED

**Description**: Enhance the `textToLexicalRichText()` function in course-lessons-converter.ts to detect markdown link patterns `[text](url)` and create proper Lexical `link` nodes instead of plain text nodes. Update the content renderer to handle link nodes by rendering them as `<a>` tags.

**Pros**:
- Minimal code changes (single function enhancement)
- Focused fix stays within existing seed conversion pattern
- No new dependencies required
- Directly addresses root cause
- Works with all markdown link variations
- Handles edge cases (URLs with special characters)

**Cons**:
- Only fixes links in structured todo fields (Read, Watch, etc.)
- Main content body still won't have link parsing (uses different conversion path)
- Requires re-running seed conversion to update existing data

**Risk Assessment**: Low - The change is isolated to one function, no schema changes, uses standard regex pattern matching

**Complexity**: Simple - Straightforward regex matching + node creation

#### Option 2: Use existing `markdown-to-lexical.ts` utility

**Description**: Replace the simple text-to-node conversion with calls to the existing `markdown-to-lexical.ts` utility which already handles markdown formatting.

**Pros**:
- Reuses existing code
- Handles markdown formatting (bold, italic, etc.) in addition to links
- More comprehensive markdown support

**Cons**:
- Overkill for structured todo fields (just need links, not all markdown formatting)
- Different code path from main content (duplicated logic)
- More complex to integrate
- Requires careful testing to ensure compatibility

**Why Not Chosen**: While this would provide more comprehensive markdown support, it's over-engineered for the specific problem. The structured todo fields are simple bullet lists that rarely use bold/italic. Adding link parsing is sufficient.

#### Option 3: Create a new markdown link parser utility

**Description**: Extract markdown link parsing into a dedicated utility function that can be reused across the codebase.

**Pros**:
- Reusable across seed converters and other components
- Clear separation of concerns
- Could handle other markdown elements in future

**Cons**:
- Over-engineering for a single use case
- Adds complexity without immediate benefit
- Requires additional testing
- More code to maintain

**Why Not Chosen**: YAGNI principle - create the utility when we have 2+ use cases. For now, the simple solution is sufficient.

### Selected Solution: Option 1 - Add markdown link parsing

**Justification**: This approach directly fixes the root cause with minimal code changes. It's surgical, focused, and solves the immediate problem without over-engineering. The regex-based link parsing is straightforward and can handle all markdown link variations.

**Technical Approach**:

1. **Parse markdown links** using regex pattern `\[([^\]]+)\]\(([^)]+)\)`:
   - Capture group 1: link text
   - Capture group 2: URL

2. **Build mixed text/link node structure**:
   - Process each line and split on markdown link patterns
   - Create text nodes for non-link portions
   - Create link nodes for matched patterns

3. **Link node structure** (Lexical JSON):
   ```json
   {
     "type": "link",
     "url": "https://...",
     "target": "_blank",
     "rel": "noopener noreferrer",
     "children": [
       {
         "type": "text",
         "text": "Link text"
       }
     ]
   }
   ```

4. **Render link nodes** in content-renderer.jsx:
   - Detect `node.type === "link"`
   - Render as `<a href={url} target="_blank" rel="noopener noreferrer">`

**Architecture Changes**:

No architectural changes - this is purely a data transformation fix. The structure remains the same.

**Migration Strategy**:

After implementing the fix:
1. Run the seed conversion: `pnpm --filter web seed-conversion`
2. This regenerates `course-lessons.json` with proper link nodes
3. No manual data migration needed (automated by converter)

## Implementation Plan

### Affected Files

- `apps/payload/src/seed/seed-conversion/converters/course-lessons-converter.ts` - Add markdown link parsing to `textToLexicalRichText()` function
- `packages/cms/payload/dist/content-renderer.jsx` - Add handling for `link` type nodes
- `apps/payload/src/seed/seed-data/course-lessons.json` - Will be regenerated automatically

### New Files

No new files needed.

### Step-by-Step Tasks

#### Step 1: Add markdown link parsing to textToLexicalRichText()

Modify the `textToLexicalRichText()` function in `course-lessons-converter.ts`:

- Create a helper function `parseMarkdownLine()` that:
  - Takes a single line of text
  - Finds all markdown link patterns `[text](url)`
  - Returns an array of text and link nodes
- Update the listItems mapping to use this helper:
  - Instead of `{ type: "text", text: line.trim() }`
  - Create a paragraph with mixed text/link children

**Why this step first**: This is the core data transformation. The renderer update depends on this working.

#### Step 2: Update content renderer to handle link nodes

Modify the paragraph rendering in `content-renderer.jsx`:

- Add handler for when paragraph children contain link nodes
- Render link nodes as `<a>` tags with:
  - `href` attribute from node.url
  - `target="_blank"` to open in new tab
  - `rel="noopener noreferrer"` for security
- Maintain existing text node rendering

**Why this step**: Enables the frontend to display the links correctly.

#### Step 3: Regenerate seed data

Run the seed conversion to regenerate the course-lessons.json file:

```bash
pnpm --filter web seed-conversion
```

This will:
- Parse all lesson `.mdoc` files again
- Convert markdown links in all structured sections
- Output new `course-lessons.json` with link nodes

#### Step 4: Verify in database

If needed, reset the local database to load the new seed data:

```bash
pnpm supabase:web:reset
```

#### Step 5: Validation and testing

- Navigate to `/home/course/lessons/the-who`
- Check the "Read" section
- Verify the Amazon link is now clickable
- Verify it opens in a new tab
- Check other lessons for any side effects

## Testing Strategy

### Unit Tests

Add/update unit tests for the markdown link parsing:

**Test scenarios**:
- ✅ Single markdown link: `[text](url)` → proper link node
- ✅ Multiple links in one line: `[text1](url1) and [text2](url2)` → multiple link nodes
- ✅ Text before/after link: `Before [link](url) after` → mixed nodes
- ✅ Plain text without links → single text node
- ✅ Link with special URL characters: `[text](https://example.com?a=1&b=2)` → correct URL
- ✅ Link with parentheses in URL (rare but possible): `[text](https://en.wikipedia.org/wiki/Test_(disambiguation))` → handles correctly
- ✅ Empty text or URL edge cases → graceful handling

**Test files**:
- `apps/payload/src/seed/seed-conversion/converters/__tests__/course-lessons-converter.spec.ts`

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Reproduce original bug: Navigate to `/home/course/lessons/the-who`, verify link is plain text (before fix)
- [ ] Apply code fix
- [ ] Run `pnpm --filter web seed-conversion`
- [ ] Run `pnpm supabase:web:reset` (if using local DB)
- [ ] Navigate to `/home/course/lessons/the-who`
- [ ] Verify link in "Read" section is now clickable
- [ ] Click the link, verify it opens Amazon in new tab
- [ ] Check other lessons with links (test coverage across content)
- [ ] Verify no console errors in browser DevTools
- [ ] Verify list formatting is maintained (still bullet points)
- [ ] Verify seed data JSON structure is correct

## Risk Assessment

**Overall Risk Level**: Low

**Potential Risks**:

1. **Regex matching too broad or too narrow**: Pattern `\[([^\]]+)\]\(([^)]+)\)` might not handle edge cases
   - **Likelihood**: Low (markdown link format is well-defined)
   - **Impact**: Low (worst case: some links don't parse, others render as text)
   - **Mitigation**:
     - Test with various URL formats (query strings, fragments, etc.)
     - Validate regex against markdown specification
     - Add logging to seed conversion to show which links were found

2. **Frontend renderer doesn't display links correctly**: Link nodes might not render properly in React
   - **Likelihood**: Very Low (link rendering is standard)
   - **Impact**: Medium (links visible but not clickable)
   - **Mitigation**:
     - Test renderer with sample link data
     - Verify HTML structure matches Lexical expectations
     - Check CSS doesn't hide links

3. **Seed data regeneration breaks other content**: Changes to `textToLexicalRichText()` might affect other sections
   - **Likelihood**: Low (only adding link parsing, text still works)
   - **Impact**: Medium (could break todo sections)
   - **Mitigation**:
     - Test all section types (Read, Watch, To-Do, Course Project)
     - Verify seed data is valid JSON
     - Compare before/after to ensure text content unchanged

**Rollback Plan**:

If this fix causes issues:
1. Revert the code changes: `git revert <commit-hash>`
2. Revert the seed data: `git checkout HEAD -- apps/payload/src/seed/seed-data/course-lessons.json`
3. Reset database: `pnpm supabase:web:reset`
4. Verify links are back to plain text (no improvement, but working)

**Monitoring** (if needed):

After deployment:
- Monitor browser console for errors on lesson pages
- Verify users can click links in lesson content
- Check for any rendering issues in structured sections

## Performance Impact

**Expected Impact**: None

No performance implications:
- Regex matching happens during seed generation (not runtime)
- Link node rendering is simpler than text nodes
- Database size unchanged (same number of nodes, different types)

## Security Considerations

**Security Impact**: Low

**Considerations**:
- Links open with `target="_blank"` and `rel="noopener noreferrer"` to prevent reverse tabnabbing
- URL validation: Accept any valid URL from markdown (no allowlist)
- User-controlled content: Links come from lesson `.mdoc` files (admin-only, not user input)

**Security approval needed**: No - links are from trusted admin content

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# Check seed data - links should be plain text
grep -A 10 'todo_read_content' apps/payload/src/seed/seed-data/course-lessons.json | grep 'HBR Guide'

# Should show: "type": "text" with raw markdown link as content
```

**Expected Result**: Raw markdown link `[HBR Guide...](https://...)` appears as plain text node

### After Fix (Bug Should Be Resolved)

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Format
pnpm format

# Run seed conversion
pnpm --filter web seed-conversion

# Verify JSON structure
jq '.[] | select(.id=="the-who") | .todo_read_content.root.children[0].children[0].children[0]' apps/payload/src/seed/seed-data/course-lessons.json

# Check for link node type
grep -C 3 '"type": "link"' apps/payload/src/seed/seed-data/course-lessons.json

# Reset database (if local)
pnpm supabase:web:reset

# Manual verification in browser
# Navigate to http://localhost:3000/home/course/lessons/the-who
# Check that Read section link is clickable
```

**Expected Result**:
- Link node has `"type": "link"` with `"url"` property
- JSON validation passes
- No type/lint errors
- Manual test shows clickable link

### Regression Prevention

```bash
# Run full test suite
pnpm test

# Run E2E tests focusing on lesson pages
pnpm test:e2e apps/e2e/tests/lessons.spec.ts

# Verify no other content rendering broke
# Check multiple lessons for side effects
```

## Dependencies

### New Dependencies (if any)

**No new dependencies required** - uses only existing regex and Lexical node types

## Database Changes

**No database changes required** - This is purely a data transformation in the seed generation layer. The schema doesn't change, only the JSON content values.

## Deployment Considerations

**Deployment Risk**: Low

**Special deployment steps**:
- After code deployment, run seed regeneration command:
  ```bash
  pnpm --filter web seed-conversion
  ```
- Commit regenerated `course-lessons.json` file
- No database migration needed
- No downtime needed

**Feature flags needed**: No

**Backwards compatibility**: Maintained - existing plaintext links still work, they're just converted to proper link nodes

## Success Criteria

The fix is complete when:
- [ ] Markdown link parsing function added to `textToLexicalRichText()`
- [ ] Content renderer handles link nodes correctly
- [ ] Seed data regenerated with link nodes instead of plain text
- [ ] Unit tests pass (link parsing scenarios)
- [ ] Manual testing confirms clickable links on lesson pages
- [ ] No console errors in browser
- [ ] No regressions in other lesson content
- [ ] JSON validation passes
- [ ] All type checks and linting pass
- [ ] The "the-who" lesson Read section link is clickable

## Notes

- The diagnosis identified this as a gap in the structured todo fields feature (#855) implementation
- Similar pattern to earlier shortcode parsing fixes (#852)
- This fix only addresses structured sections (Read, Watch, To-Do, Course Project)
- Main lesson content body uses a different conversion path and isn't affected
- Future enhancement: Consider applying markdown link parsing to all seed content uniformly

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #867*
