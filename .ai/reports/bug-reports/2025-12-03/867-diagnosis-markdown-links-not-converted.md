# Bug Diagnosis: Markdown links in lesson content not converted to hyperlinks

**ID**: ISSUE-867
**Created**: 2025-12-03T16:00:00Z
**Reporter**: user
**Severity**: high
**Status**: new
**Type**: bug

## Summary

Markdown hyperlinks in lesson content files (e.g., `[HBR Guide to Persuasive Presentations](https://www.amazon.com/...)`) are not being converted to clickable hyperlinks when rendered on the frontend. Instead, the raw markdown syntax is displayed as plain text. This affects the "Read" section content in lessons, specifically visible on `/home/course/lessons/the-who`.

## Environment

- **Application Version**: Current dev branch
- **Environment**: Development
- **Browser**: All browsers
- **Node Version**: 22.x
- **Database**: PostgreSQL (Supabase)
- **Last Working**: Never worked (always broken)

## Reproduction Steps

1. Navigate to `/home/course/lessons/the-who` in the web application
2. Look at the "Read" section in the lesson content
3. Observe that the link `[HBR Guide to Persuasive Presentations by Nancy Duarte](https://www.amazon.com/...)` is displayed as plain text instead of a clickable hyperlink

## Expected Behavior

Markdown links like `[Link Text](URL)` should be converted to proper Lexical `link` nodes and rendered as clickable `<a>` tags in the frontend.

## Actual Behavior

The markdown link syntax is stored as plain text in the Lexical JSON structure and rendered as literal text `[HBR Guide to Persuasive Presentations by Nancy Duarte](https://www.amazon.com/...)` on the page.

## Diagnostic Data

### Seed Data Analysis

The raw source file `apps/payload/src/seed/seed-data-raw/lessons/the-who.mdoc` contains:

```markdown
Read

  - [HBR Guide to Persuasive Presentations by Nancy Duarte](https://www.amazon.com/gp/product/1422187101/ref=as_li_qf_sp_asin_il_tl?ie=UTF8&camp=1789&creative=9325&creativeASIN=1422187101&linkCode=as2&tag=slideheroesco-20&linkId=SXHESAMTAMTOMBCT)
```

After conversion, in `apps/payload/src/seed/seed-data/course-lessons.json` (lines 477-513):

```json
"todo_read_content": {
  "root": {
    "type": "root",
    "children": [
      {
        "type": "list",
        "listType": "bullet",
        "children": [
          {
            "type": "listitem",
            "children": [
              {
                "type": "paragraph",
                "children": [
                  {
                    "type": "text",
                    "text": "[HBR Guide to Persuasive Presentations by Nancy Duarte](https://www.amazon.com/gp/product/1422187101/ref=as_li_qf_sp_asin_il_tl?ie=UTF8&camp=1789&creative=9325&creativeASIN=1422187101&linkCode=as2&tag=slideheroesco-20&linkId=SXHESAMTAMTOMBCT)"
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  }
}
```

The markdown link is stored as raw text in a `text` node instead of being parsed into a proper Lexical `link` node structure.

### Code Analysis

The problematic code is in `apps/payload/src/seed/seed-conversion/converters/course-lessons-converter.ts`:

**Function: `textToLexicalRichText` (lines 618-702)**

```typescript
function textToLexicalRichText(text: string): LexicalContent | null {
  // ...
  const lines = text.split("\n").filter((line) => line.trim());
  // ...
  // Create list items from the lines
  const listItems = lines.map((line) => ({
    type: "listitem",
    version: 1,
    value: 1,
    children: [
      {
        type: "paragraph",
        version: 1,
        children: [{ type: "text", text: line.trim() }],  // <-- BUG: No markdown parsing!
      },
    ],
  }));
  // ...
}
```

**Root Cause**: The `textToLexicalRichText` function creates plain text nodes directly from each line without parsing markdown link syntax. It simply wraps the raw text in a `{ type: "text", text: line.trim() }` structure.

### Expected Lexical Link Structure

A proper Lexical link node should look like:

```json
{
  "type": "link",
  "version": 1,
  "url": "https://www.amazon.com/...",
  "target": "_blank",
  "rel": "noopener noreferrer",
  "children": [
    {
      "type": "text",
      "text": "HBR Guide to Persuasive Presentations by Nancy Duarte"
    }
  ]
}
```

### Renderer Analysis

The content renderer at `packages/cms/payload/dist/content-renderer.jsx` does not have any handling for `link` type nodes, which would also need to be added:

- Line 262-268: Text nodes are rendered as plain `<span>` elements
- Line 287-296: List item text is extracted and joined without link processing
- No `node.type === "link"` handling exists in the renderer

## Error Stack Traces

No runtime errors - this is a data transformation bug.

## Related Code

- **Affected Files**:
  - `apps/payload/src/seed/seed-conversion/converters/course-lessons-converter.ts` (primary - converter)
  - `packages/cms/payload/dist/content-renderer.jsx` (secondary - renderer)
  - `apps/payload/src/seed/seed-data/course-lessons.json` (output data)

- **Recent Changes**: git commits affecting these files include recent fixes for bunny shortcodes and lesson field labels

- **Suspected Functions**:
  - `textToLexicalRichText()` in course-lessons-converter.ts (lines 618-702)
  - `extractSection()` in course-lessons-converter.ts (lines 532-567)

## Related Issues & Context

### Similar Symptoms
- #852 (CLOSED): "Bug Fix: Bunny Video Shortcode Appearing in Lesson Content" - Similar issue where shortcodes weren't being properly parsed
- #850 (CLOSED): "Bug Diagnosis: Bunny Video Shortcode Appearing in Lesson Content" - Related seed conversion issue

### Same Component
- #864 (CLOSED): "Bug Fix: Lesson field labels display inconsistently" - Recent changes to lesson converter
- #855 (CLOSED): "Feature: Structured Todo Fields for Lesson Content" - Added the `textToLexicalRichText` function
- #506 (CLOSED): "Course Lessons Converter: Missing Field Mappings" - Previous converter issues

### Historical Context
This appears to be a gap in the original implementation of the structured todo fields feature (#855). The `textToLexicalRichText` function was designed to handle plain text bullet points but did not account for markdown link syntax in the content.

## Root Cause Analysis

### Identified Root Cause

**Summary**: The `textToLexicalRichText` function in course-lessons-converter.ts creates plain text nodes without parsing markdown link syntax `[text](url)` into proper Lexical `link` nodes.

**Detailed Explanation**:
When lesson content is converted from raw `.mdoc` files to Lexical JSON format, the `textToLexicalRichText` function is called to transform the "Read", "Watch", "To-Do", and "Course Project" sections. This function:

1. Splits the input text by newlines
2. Creates a list structure with list items
3. Wraps each line's text in a simple `{ type: "text", text: line.trim() }` object

The function does NOT parse markdown syntax, so markdown links like `[Link Text](URL)` are stored verbatim as plain text instead of being converted to Lexical `link` nodes.

**Supporting Evidence**:
- Line 503 in course-lessons.json shows the raw markdown: `"text": "[HBR Guide to Persuasive Presentations by Nancy Duarte](https://www.amazon.com/...)"`
- Lines 669-676 in course-lessons-converter.ts show text nodes are created without any markdown parsing: `children: [{ type: "text", text: line.trim() }]`

### How This Causes the Observed Behavior

1. Raw lesson file `the-who.mdoc` contains markdown link: `- [HBR Guide...](https://...)`
2. `extractReadSection()` extracts bullet points from the "Read" section
3. `textToLexicalRichText()` is called with the extracted text
4. Function creates a text node with the raw markdown string as-is
5. Seed data JSON stores the raw markdown syntax in a plain text node
6. Content renderer displays the text node as literal text
7. User sees `[HBR Guide...](https://...)` instead of a clickable link

### Confidence Level

**Confidence**: High

**Reasoning**:
1. The code path is clear and traceable
2. The seed data output confirms the issue (raw markdown stored as text)
3. The function implementation explicitly shows no markdown parsing
4. This matches the pattern of similar issues (#852, #850) where content wasn't properly transformed

## Fix Approach (High-Level)

Two changes are needed:

1. **Update `textToLexicalRichText()` in course-lessons-converter.ts**: Add markdown link parsing to detect `[text](url)` patterns and create proper Lexical `link` nodes:
   ```typescript
   // Parse markdown links: [text](url)
   const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
   // Create link nodes for matches, text nodes for non-matches
   ```

2. **Update content-renderer.jsx**: Add handling for `link` type nodes to render them as `<a>` elements:
   ```tsx
   if (node.type === "link") {
     return <a href={node.url} target="_blank" rel="noopener noreferrer">{/* children */}</a>;
   }
   ```

After fixing, re-run the seed conversion to regenerate course-lessons.json with proper link nodes.

## Diagnosis Determination

The root cause has been definitively identified: the `textToLexicalRichText` function in course-lessons-converter.ts (lines 618-702) does not parse markdown link syntax when creating Lexical content. This is a gap in the original implementation rather than a regression.

The fix requires:
1. Adding markdown link parsing to the converter function
2. Adding link node rendering to the content renderer
3. Regenerating seed data

## Additional Context

- This bug affects any lesson with external links in the Read, Watch, To-Do, or Course Project sections
- The "the-who" lesson is the most visible example because it has an Amazon affiliate link in the Read section
- The `markdown-to-lexical.ts` utility file exists but is not used by the course-lessons-converter for structured fields

---
*Generated by Claude Debug Assistant*
*Tools Used: Read, Grep, Glob, Bash (git, gh)*
