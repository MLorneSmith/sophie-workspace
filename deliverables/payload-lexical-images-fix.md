# Fix: Payload CMS Lexical Editor Images

**Task:** [W1] Blog Fix - CMS Images - Fix Payload CMS Lexical editor images
**Status:** Analysis complete, fix identified

---

## Problem

Blog posts from Payload CMS don't display inline images because:

1. **Backend (Payload):** The `UploadFeature` is not enabled in the Lexical editor configuration
2. **Frontend (Content Renderer):** No handler exists for `upload` node types

---

## Solution

### Part 1: Enable UploadFeature in Payload (Backend)

**File:** `apps/payload/src/collections/Posts.ts`

**Current code:**
```typescript
editor: lexicalEditor({
  features: ({ defaultFeatures }) => [
    ...defaultFeatures,
    BlocksFeature({
      blocks: [BunnyVideo, CallToAction, TestBlock, YouTubeVideo],
    }),
  ],
}),
```

**Updated code:**
```typescript
import { 
  BlocksFeature, 
  UploadFeature,  // ADD THIS IMPORT
  lexicalEditor 
} from "@payloadcms/richtext-lexical";

// ... in the content field:

editor: lexicalEditor({
  features: ({ defaultFeatures }) => [
    ...defaultFeatures,
    UploadFeature({
      collections: {
        media: {
          fields: [
            {
              name: 'caption',
              type: 'text',
              label: 'Caption',
            },
            {
              name: 'altText', 
              type: 'text',
              label: 'Alt Text',
              required: true,
            },
          ],
        },
      },
    }),
    BlocksFeature({
      blocks: [BunnyVideo, CallToAction, TestBlock, YouTubeVideo],
    }),
  ],
}),
```

This enables the image upload button in the Lexical toolbar and stores images with optional caption and required alt text.

---

### Part 2: Add Upload Node Handler (Frontend)

**File:** `packages/cms/payload/src/content-renderer.tsx`

Add this handler in the `lexicalContent.root.children.map()` block, before the "unhandled node types" fallback:

```typescript
// Handle upload (image) nodes
if (node.type === 'upload') {
  // Extract image data from the node
  // Payload stores upload data in node.value (the media document)
  const uploadData = node.value || node.fields || node;
  
  // Get the image URL - check various possible locations
  const imageUrl = 
    uploadData.url ||
    uploadData.fields?.url ||
    (uploadData.filename && `/api/media/file/${uploadData.filename}`) ||
    null;
  
  const altText = 
    uploadData.altText || 
    uploadData.fields?.altText || 
    uploadData.alt ||
    uploadData.filename ||
    'Blog image';
  
  const caption = 
    uploadData.caption || 
    uploadData.fields?.caption ||
    null;

  if (!imageUrl) {
    // Debug: log the node structure if URL not found
    console.warn('Upload node missing URL:', node);
    return null;
  }

  return (
    <figure key={`upload-${i}-${uploadData.id || 'img'}`} className="my-6">
      <img
        src={imageUrl}
        alt={altText}
        className="w-full rounded-lg"
        loading="lazy"
      />
      {caption && (
        <figcaption className="mt-2 text-center text-sm text-gray-600">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
```

---

### Part 3: Type Definition (Optional but Recommended)

Add to the `LexicalNode` type definition:

```typescript
type LexicalNode = {
  type: string;
  tag?: string;
  text?: string;
  url?: string;
  children?: LexicalNode[];
  fields?: Record<string, unknown>;
  value?: {  // For upload nodes
    id?: string;
    url?: string;
    filename?: string;
    altText?: string;
    caption?: string;
    width?: number;
    height?: number;
  };
  // ... existing fields
};
```

---

## Testing Steps

1. **After backend change:**
   - Rebuild Payload: `pnpm build` in `apps/payload`
   - Open Payload admin → Posts → Edit a post
   - In the content editor, you should now see an "Upload" button in the toolbar
   - Click it and upload/select an image from Media collection
   - Save the post

2. **After frontend change:**
   - Rebuild web app: `pnpm build` in `apps/web`
   - View the blog post on the frontend
   - Image should render with optional caption

---

## Notes

- **Image Storage:** Images are stored in the `media` collection (already exists)
- **Image URLs:** Payload serves images from `/api/media/file/[filename]` by default, or from S3/R2 if configured
- **Responsive Images:** Consider adding `srcset` for responsive image loading in a future iteration
- **Image Optimization:** Next.js `<Image>` component could be used instead of `<img>` for automatic optimization

---

## References

- [Payload Rich Text Docs](https://payloadcms.com/docs/rich-text/overview)
- [Payload UploadFeature](https://payloadcms.com/docs/rich-text/official-features) - see Upload section
- Current Posts collection: `apps/payload/src/collections/Posts.ts`
- Content renderer: `packages/cms/payload/src/content-renderer.tsx`
