# Payload CMS: SSR vs Collection-Level Editor Configuration

**Analysis Date:** November 19, 2025  
**Topic:** Why global editor configuration is required even when collection editors are correct

---

## The Critical Insight

You can have a **perfectly configured collection-level editor** with all the right blocks, but still get the "type block not found" error if the **global editor** lacks the BlocksFeature.

This is not intuitive, and it's the key to understanding why this bug existed.

---

## Two Separate Concerns

### 1. Server-Side Rendering (SSR) - The Issue

**What it is:**
- Payload admin panel renders using Next.js Server Components
- When building the form state, SSR components must parse rich text fields
- This parsing happens on the server, not in the browser

**Which editor config it uses:**
- **Global editor** from `payload.config.ts`
- NOT the collection-level editor
- This is because the form rendering is generic—it doesn't know which collection is being edited yet

**Why it broke:**
```typescript
// payload.config.ts - Global editor (WRONG)
editor: lexicalEditor({})  // No BlocksFeature!

// When SSR tries to parse content with blocks:
// 1. Calls parseEditorState() with rich text JSON
// 2. Encounters "type": "block" node
// 3. Looks for registered handler in editor config
// 4. Global editor has NO BlocksFeature
// 5. BlockNode type is not registered
// 6. ERROR: "type block not found"
```

### 2. Collection-Level Editor - Client-Side UI

**What it is:**
- The rich text editing interface in the browser
- Used when editing content in the admin panel (after SSR parsing succeeds)
- Provides block selection, editing UI, formatting tools

**Which editor config it uses:**
- **Collection-specific editor** (e.g., in Posts.ts)
- Overrides global config for that collection
- Can add additional features specific to that collection

**Why this alone wasn't enough:**
```typescript
// Posts.ts - Collection editor (CORRECT)
editor: lexicalEditor({
  features: ({ defaultFeatures }) => [
    ...defaultFeatures,
    BlocksFeature({
      blocks: [BunnyVideo, CallToAction, YouTubeVideo],
    }),
  ],
})

// This is great for the BROWSER ui, but...
// The SSR components on the SERVER still use the global editor!
```

---

## The Request/Response Lifecycle

### Step 1: User Navigates to Edit Post
```
Browser
  ↓ GET /admin/collections/posts/{id}
  ↓
Server (Next.js SSR)
```

### Step 2: Server Renders Form State
```
Server (Next.js SSR) starts rendering
  ↓
Calls buildFormState(postData)
  ↓
Encounters richText field with content
  ↓
Calls RscEntryLexicalField component
  ↓
RscEntryLexicalField.tsx:124 - parseEditorState()
  ↓
Uses GLOBAL editor config to parse JSON ← Uses payload.config.ts!
  ↓
Encounters "type": "block" node
  ↓
Looks for BlocksFeature in global config ← NOT THERE!
  ↓
ERROR: "parseEditorState: type block not found"
```

### Step 3: Error Propagates
```
Error thrown in RscEntryLexicalField
  ↓
Propagates to RenderServerComponent
  ↓
Propagates to buildFormState
  ↓
Admin page fails to render
  ↓
User sees error in browser
```

### If Global Config Were Correct

```
Server (Next.js SSR) starts rendering
  ↓
Calls buildFormState(postData)
  ↓
Encounters richText field with content
  ↓
Calls RscEntryLexicalField component
  ↓
RscEntryLexicalField.tsx:124 - parseEditorState()
  ↓
Uses GLOBAL editor config to parse JSON ← HAS BlocksFeature NOW!
  ↓
Encounters "type": "block" node
  ↓
BlocksFeature has registered BlockNode type ✅
  ↓
Parses successfully
  ↓
HTML sent to browser
  ↓
Browser renders form with collection-level editor UI
  ↓
User can edit content
```

---

## Configuration Locations & Their Purpose

### Global Editor (`apps/payload/src/payload.config.ts`)
```typescript
export default buildConfig({
  // ... other config
  
  // USED BY: Server-side rendering, form state building
  // SCOPE: Application-wide default editor
  // RESPONSIBLE FOR: Parsing all rich text content
  
  editor: lexicalEditor({
    features: ({ defaultFeatures }) => [
      ...defaultFeatures,
      BlocksFeature({
        blocks: allBlocks,  // ← MUST include all blocks used anywhere
      }),
    ],
  }),
});
```

**Key Point:** This is the baseline. Every collection inherits this unless overridden.

### Collection Editor (`apps/payload/src/collections/Posts.ts`)
```typescript
export const Posts = buildCollection({
  // ... other config
  
  // USED BY: Browser-side editing UI
  // SCOPE: Specific to Posts collection
  // RESPONSIBLE FOR: Providing editing interface
  
  fields: [
    {
      name: 'content',
      type: 'richText',
      editor: lexicalEditor({
        features: ({ defaultFeatures }) => [
          ...defaultFeatures,
          BlocksFeature({
            blocks: [BunnyVideo, CallToAction, YouTubeVideo],
          }),
        ],
      }),
    },
  ],
});
```

**Key Point:** This enhances the global config for browser editing, but doesn't replace it.

---

## Why the Original Bug Existed

### Timeline

1. **Someone set up global editor as placeholder**
   ```typescript
   editor: lexicalEditor({})  // Minimal default
   ```

2. **Later, someone added blocks support to Posts**
   ```typescript
   // In Posts.ts collection editor
   BlocksFeature({ blocks: [...] })
   ```

3. **Posts worked fine in browser**
   - Collection editor had BlocksFeature
   - User could edit posts with blocks
   - All seemed good

4. **But SSR didn't have BlocksFeature**
   - Global editor still empty
   - When admin page loaded, SSR tried to parse
   - Parsing failed, whole page failed

5. **The bug wasn't obvious because**
   - Collection editor worked fine
   - No obvious reason why SSR would fail
   - Error occurred in Lexical internals, not user code
   - Takes deep understanding of Payload architecture to spot

---

## The Two-Tier System Visually

```
┌─────────────────────────────────────────────────────────────┐
│                    BROWSER (Client-Side)                    │
│                                                              │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ Admin Panel - Post Edit Form                          │ │
│  │                                                        │ │
│  │  Uses Collection Editor Config (Posts.ts)             │ │
│  │  ✅ BlocksFeature with blocks present                 │ │
│  │  ✅ Beautiful editing UI works                        │ │
│  └───────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                          ↑↓
              Form state, interactions
                          ↑↓
┌─────────────────────────────────────────────────────────────┐
│                    SERVER (Node.js/SSR)                     │
│                                                              │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ RscEntryLexicalField (Server Component)               │ │
│  │                                                        │ │
│  │  Parses rich text field using Global Editor Config    │ │
│  │  (payload.config.ts)                                  │ │
│  │  ✅ FIXED: BlocksFeature with allBlocks present       │ │
│  │  ✅ parseEditorState() works                          │ │
│  │  ✅ Returns parsed form state to browser              │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ Database Query                                         │ │
│  │ Fetches: Rich text content with block nodes          │ │
│  │ Data: ✅ CORRECT - Valid blockType values            │ │
│  └───────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## Common Misconceptions

### "I fixed the block definitions, why doesn't it work?"
**Answer:** Block definitions are correct. The issue is not with the blocks themselves, but with the SSR component's ability to parse them. You need BlocksFeature in the global editor.

### "My collection editor has all the blocks. Why does SSR still fail?"
**Answer:** SSR doesn't use the collection editor. It uses the global editor. Collection editors only affect the browser-side UI after SSR succeeds.

### "The error says 'type block not found'. Isn't that about the blockType?"
**Answer:** No. The error is about Lexical's internal `BlockNode` type, not the `blockType` field. The error is raised when Lexical can't parse the `"type": "block"` node structure, which requires BlocksFeature to be registered.

### "Can I fix this in the collection editor?"
**Answer:** No. You must fix the global editor. Collection editors enhance but don't replace the global configuration for SSR operations.

---

## Payload CMS Architecture Insight

This two-tier system exists because:

1. **Generic Form Building**
   - Forms must be rendered generically across collections
   - SSR doesn't know collection-specific details yet
   - Must use global editor for safe parsing

2. **Collection Specialization**
   - Each collection can have unique editing experiences
   - Collection editors override global for specific needs
   - Allows customization without affecting parsing

3. **Server/Client Separation**
   - SSR happens on server (uses global config)
   - Interactivity happens in browser (uses collection config)
   - Both need proper BlocksFeature configuration

---

## Checklist for Similar Issues

If you encounter a similar SSR-related error:

- [ ] Check **global** editor config in `payload.config.ts`
- [ ] Check if required **BlocksFeature** is configured globally
- [ ] Verify all **blocks are exported** in the allBlocks array
- [ ] Don't assume collection-level config is sufficient
- [ ] Test SSR by loading admin panel for affected collection
- [ ] Check browser DevTools Network tab for SSR errors

---

## Best Practice

**Always configure the global editor for all features used anywhere in your application.**

```typescript
// payload.config.ts - CORRECT PATTERN
export default buildConfig({
  // ...
  
  // Include BlocksFeature globally
  editor: lexicalEditor({
    features: ({ defaultFeatures }) => [
      ...defaultFeatures,
      BlocksFeature({
        blocks: allBlocks,  // ALL blocks used anywhere
      }),
    ],
  }),
  
  // Collection editors can extend/customize
  // but rely on global for parsing
});
```

---

## Summary

| Aspect | Global Editor | Collection Editor |
|--------|---------------|-------------------|
| **Uses** | Server (SSR) | Browser (UI) |
| **Purpose** | Parse/serialize | Edit UI |
| **Scope** | Application-wide | Collection-specific |
| **BlocksFeature** | ✅ MUST have | ✅ Can have |
| **Data** | Parses all content | Edits one collection |
| **Error Location** | In RscEntryLexicalField | In browser console |

The global editor is the **foundation**. Collection editors are the **enhancement**.

---

**Document created:** November 19, 2025  
**Related issue:** Payload CMS #648  
**Project:** SlideHeroes
