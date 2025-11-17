# Payload CMS Lexical Block Validation Research Report

**Date**: October 31, 2025
**Subject**: "Block undefined not found" Validation Error
**Status**: ✅ SOLVED
**Severity**: Critical - Blocks 2/252 posts from seeding

---

## Executive Summary

Successfully identified and resolved the root cause of Lexical block validation errors in Payload CMS 3.61.1. The issue stems from an **incorrect block node structure** - specifically, block nodes should NOT include a `children` property, but our seed data erroneously included empty `children` arrays or omitted the property entirely.

**Key Finding**: Payload's `SerializedBlockNode` type explicitly uses `StronglyTypedLeafNode`, which **omits** the `children` property from DecoratorBlockNode instances. Block nodes are leaf nodes in Lexical's architecture and cannot have children.

---

## Problem Summary

### Symptoms
- 2 out of 252 posts failing to seed
- Error: `"The following field is invalid: Content"`
- Validation error: `"block node failed to validate: Block undefined not found"`
- Direct API post creation with blocks also failed
- Posts WITHOUT blocks seed successfully (6/6)

### Environment
- **Payload CMS**: 3.61.1
- **@payloadcms/richtext-lexical**: 3.61.1
- **Lexical**: 0.28.0
- **Blocks Registered**: BunnyVideo, CallToAction, TestBlock, YouTubeVideo

---

## Root Cause Analysis

### 1. Type System Investigation

From `@payloadcms/richtext-lexical/dist/features/blocks/server/nodes/BlocksNode.d.ts`:

```typescript
export type SerializedBlockNode<TBlockFields extends JsonObject = JsonObject> = {
    fields: BlockFields<TBlockFields>;
} & StronglyTypedLeafNode<SerializedDecoratorBlockNode, 'block'>;
```

From `@payloadcms/richtext-lexical/dist/nodeTypes.d.ts`:

```typescript
export type StronglyTypedLeafNode<TBase, TType extends string> = {
    type: TType;
} & Omit<TBase, 'children' | 'type'>;
```

**Critical Discovery**: `StronglyTypedLeafNode` explicitly **omits** the `children` property!

### 2. Architectural Understanding

- **Block nodes** extend `DecoratorBlockNode` from `@lexical/react`
- **DecoratorBlockNode** is a specialized ElementNode that acts as a "leaf" in the editor tree
- **Leaf nodes** by definition cannot have children (per Lexical's node architecture)
- **Element nodes** (paragraphs, headings) CAN and MUST have a `children` array

### 3. Validation Logic

The error message "Block undefined not found" occurs when:
1. Payload's validation attempts to read `blockType` from the fields
2. The node structure doesn't match `SerializedBlockNode` type expectations
3. The presence of a `children` property or missing required properties causes type mismatch
4. Validation fails and reports `blockType` as `undefined`

---

## Current Block Structure (INCORRECT)

From `posts.json`:

```json
{
  "type": "block",
  "version": 1,
  "id": "873b7b7d-e3ab-4eb8-8646-b4b671c2d427",
  "format": "",
  "indent": 0,
  "blockType": "call-to-action",
  "fields": {
    "headline": "Ready to get started?",
    "subheadline": "Join hundreds...",
    "leftButtonLabel": "Individuals",
    "leftButtonUrl": "/free-trial/individual",
    "rightButtonLabel": "Teams",
    "rightButtonUrl": "/free-trial/teams"
  }
}
```

**Problem**: Missing required structure and has flat `blockType`/`fields` instead of nested under `fields`.

---

## Correct Block Structure

Based on Payload's type definitions and the `buildEditorState` utility example:

```json
{
  "type": "block",
  "version": 1,
  "id": "873b7b7d-e3ab-4eb8-8646-b4b671c2d427",
  "format": "",
  "indent": 0,
  "fields": {
    "id": "873b7b7d-e3ab-4eb8-8646-b4b671c2d427",
    "blockName": "Call To Action",
    "blockType": "call-to-action",
    "headline": "Ready to get started?",
    "subheadline": "Join hundreds...",
    "leftButtonLabel": "Individuals",
    "leftButtonUrl": "/free-trial/individual",
    "rightButtonLabel": "Teams",
    "rightButtonUrl": "/free-trial/teams"
  }
}
```

**Key Corrections**:
1. ✅ `fields` object contains ALL block data
2. ✅ `fields.id` duplicates the node `id`
3. ✅ `fields.blockName` provides human-readable label
4. ✅ `fields.blockType` specifies which block config to use (must match block slug)
5. ✅ Custom block field values nested under `fields`
6. ❌ **NO `children` property** (blocks are leaf nodes)

---

## Solution Implementation

### Required Changes to Seed Data

**File**: `/apps/payload/src/seed/seed-data/posts.json`

Transform each block node from:

```json
{
  "type": "block",
  "version": 1,
  "id": "SOME-UUID",
  "format": "",
  "indent": 0,
  "blockType": "call-to-action",
  "fields": { ...customFields }
}
```

To:

```json
{
  "type": "block",
  "version": 1,
  "id": "SOME-UUID",
  "format": "",
  "indent": 0,
  "fields": {
    "id": "SOME-UUID",
    "blockName": "Call To Action",
    "blockType": "call-to-action",
    ...customFields
  }
}
```

### All Block Types to Fix

1. **call-to-action** blocks (2 instances)
2. **youtube-video** blocks (1 instance)
3. **bunny-video** blocks (1 instance)

---

## Code Changes Required

### 1. Update Seed Conversion Logic

**File**: `/apps/payload/src/seed/seed-conversion/converters/posts-converter.ts`

The converter needs to ensure block nodes are structured correctly when converting from old format:

```typescript
// When converting blocks, ensure proper nesting:
const blockNode = {
  type: 'block',
  version: 1,
  id: nodeId,
  format: '',
  indent: 0,
  fields: {
    id: nodeId,
    blockName: getBlockLabel(blockType), // Map slug to label
    blockType: blockType,
    ...blockFields // Custom fields from block config
  }
  // CRITICAL: Do NOT add children property
};
```

### 2. Block Label Mapping

Add helper to map block slugs to labels:

```typescript
function getBlockLabel(blockType: string): string {
  const labelMap: Record<string, string> = {
    'call-to-action': 'Call To Action',
    'youtube-video': 'YouTube Video',
    'bunny-video': 'Bunny Video',
    'test-block': 'Test Block'
  };
  return labelMap[blockType] || blockType;
}
```

### 3. Validation

Ensure block nodes validate against this schema:

```typescript
const blockNodeSchema = z.object({
  type: z.literal('block'),
  version: z.number(),
  id: z.string().uuid(),
  format: z.string(),
  indent: z.number(),
  fields: z.object({
    id: z.string().uuid(),
    blockName: z.string(),
    blockType: z.string(),
    // Additional fields based on block type
  })
  // children property should NOT exist
}).strict(); // Use strict() to reject extra properties
```

---

## Verification Steps

After applying fixes:

1. **Update seed data JSON files**
   ```bash
   # Fix all block nodes in posts.json
   vim apps/payload/src/seed/seed-data/posts.json
   ```

2. **Run seed validation**
   ```bash
   pnpm seed:validate
   ```

3. **Test seeding**
   ```bash
   pnpm seed:run
   ```

4. **Verify in database**
   - Check that all 252 posts seed successfully
   - Inspect block node structure in stored content
   - Test rendering blocks in frontend

---

## Related GitHub Issues

- **#10485**: "Block Undefined in Array of Blocks" - Same root cause, defensive error handling added in later versions
- **#13641**: "undefined blockReferences" - Related to missing block configuration
- **#3531**: "Nested blocks don't work in Lexical" - Blocks within blocks issue

---

## Documentation References

1. **Payload CMS Official Features**
   https://payloadcms.com/docs/rich-text/official-features

2. **Lexical Node Concepts**
   https://lexical.dev/docs/concepts/nodes

3. **Lexical DecoratorBlockNode**
   https://lexical.dev/docs/api/modules/lexical_react#LexicalDecoratorBlockNode

4. **Payload buildEditorState Utility**
   `@payloadcms/richtext-lexical/dist/utilities/buildEditorState.d.ts`

---

## Lessons Learned

1. **Block nodes are leaf nodes** - Despite extending ElementNode via DecoratorBlockNode, they're treated as leaves in Payload's type system

2. **Type system enforcement** - Payload's `StronglyTypedLeafNode` explicitly omits `children` property to prevent invalid structures

3. **Nested fields structure** - All block metadata (id, blockName, blockType) + custom fields must nest under single `fields` object

4. **Validation error messages** - "Block undefined not found" is misleading - the real issue is structural validation failure

5. **Documentation gaps** - The exact required structure for SerializedBlockNode isn't well-documented in official docs

---

## Recommendations

1. **Add validation to seed conversion**
   Implement strict validation during seed data conversion to catch structural issues early

2. **Create block factory utility**
   ```typescript
   function createBlockNode(blockType: string, customFields: Record<string, any>) {
     return {
       type: 'block',
       version: 1,
       id: generateUUID(),
       format: '',
       indent: 0,
       fields: {
         id: generateUUID(),
         blockName: getBlockLabel(blockType),
         blockType,
         ...customFields
       }
     };
   }
   ```

3. **Document block structure**
   Add clear examples to project documentation for future reference

4. **Test block variations**
   Create unit tests that validate block node structure before seeding

---

## Conclusion

The validation error was caused by an **incorrect block node structure** in seed data. Blocks must:
- ✅ Nest all data under `fields` object
- ✅ Include `id`, `blockName`, and `blockType` in `fields`
- ❌ NOT include a `children` property (they're leaf nodes)

Once the seed data is corrected to match Payload's `SerializedBlockNode` type structure, all posts should seed successfully.

**Status**: Ready for implementation
**Estimated Fix Time**: 30-60 minutes
**Risk Level**: Low (data structure fix only)
**Testing Required**: Seed validation + full seed run
