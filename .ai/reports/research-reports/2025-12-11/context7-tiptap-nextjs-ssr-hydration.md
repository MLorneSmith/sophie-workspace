# Context7 Research: Tiptap Next.js SSR and Hydration

**Date**: 2025-12-11
**Agent**: context7-expert
**Libraries Researched**: Tiptap (@ueberdosis/tiptap-docs)

## Query Summary

Retrieved Tiptap documentation focused on Next.js integration, SSR configuration, hydration mismatch prevention, and the `immediatelyRender` option in the `useEditor` hook.

## Findings

### The `immediatelyRender` Option

**Purpose**: Controls whether the Tiptap editor renders immediately during initialization or defers rendering until the client-side hydration completes.

**For Next.js App Router (Recommended)**:
```jsx
'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'

const Tiptap = () => {
  const editor = useEditor({
    extensions: [StarterKit],
    content: '<p>Hello World! 🌎️</p>',
    // Prevent server-side rendering issues in Next.js
    immediatelyRender: false,
  })

  return <EditorContent editor={editor} />
}

export default Tiptap
```

**Key Points**:
- **`immediatelyRender: false`** - Prevents SSR hydration mismatches (recommended for Next.js)
- **`immediatelyRender: true`** - Renders immediately but may cause hydration errors
- Default behavior without this option can cause hydration issues in Next.js App Router

### SSR Configuration Patterns

#### Pattern 1: Defer Rendering with Null Check (Recommended)

```jsx
'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'

export function MyEditor() {
  const editor = useEditor({
    extensions: [StarterKit],
    content: '<p>Hello World!</p>',
    // Disable immediate rendering to prevent SSR issues
    immediatelyRender: false,
  })

  if (!editor) {
    return null // Prevent rendering until the editor is initialized
  }

  return <EditorContent editor={editor} />
}
```

**Benefits**:
- Prevents hydration mismatches
- Ensures editor is fully initialized before rendering
- Client-side only rendering

#### Pattern 2: Advanced Rendering Control

```tsx
import { useEditor } from '@tiptap/react'

function Component() {
  const editor = useEditor({
    extensions,
    content,
    /**
     * Enable the default behavior of rendering immediately
     */
    immediatelyRender: true,
    /**
     * Disable re-rendering on every transaction (performance optimization)
     */
    shouldRerenderOnTransaction: false,
  })

  return <EditorContent editor={editor} />
}
```

**Use Cases**:
- Performance optimization when you control rendering manually
- When using custom state management for editor updates

#### Pattern 3: Opt-in SSR with Element Option

```ts
const editor = new Editor({
  element: null, // opt-in to SSR
  content: {
    type: 'doc',
    content: [
      /* ... */
    ],
  },
  extensions: [
    /* ... */
  ],
})
```

**Use Cases**:
- Server-side editor initialization without DOM
- Headless editor usage
- Advanced SSR scenarios

### Hydration Mismatch Prevention

**Problem**: Tiptap's default behavior renders on both server and client, causing React hydration errors.

**Solution**: Use `immediatelyRender: false` to ensure client-only rendering.

**Example Error Without Fix**:
```
Warning: Expected server HTML to contain a matching <div> in <div>.
```

**Fixed Version**:
```jsx
'use client'

const editor = useEditor({
  extensions: [StarterKit],
  content: '<p>Hello World!</p>',
  immediatelyRender: false, // ✅ Prevents hydration mismatch
})

if (!editor) return null // ✅ Wait for client initialization
```

### Best Practices for Next.js App Router

1. **Always use `'use client'` directive** - Tiptap requires client-side interactivity
2. **Set `immediatelyRender: false`** - Prevents SSR hydration issues
3. **Check editor initialization** - Return `null` until editor is ready
4. **Avoid server components** - Tiptap is inherently client-side

### Integration with Next.js Pages

```jsx
// app/page.js or pages/index.js
import Tiptap from '../components/Tiptap'

export default function Home() {
  return <Tiptap />
}
```

### Advanced Configuration

#### With AI Toolkit and Chat:
```tsx
'use client'

import { useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { AiToolkit } from '@tiptap-pro/ai-toolkit'

export default function Page() {
  const editor = useEditor({
    immediatelyRender: false, // ✅ Critical for Next.js
    extensions: [StarterKit, AiToolkit],
    content: `<h1>AI agent demo</h1><p>Ask the AI to improve this.</p>`,
  })

  if (!editor) return null

  return <EditorContent editor={editor} />
}
```

#### With Multiple Extensions:
```ts
import { useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import { Color } from '@tiptap/extension-color'
import TextStyle from '@tiptap/extension-text-style'
import Highlight from '@tiptap/extension-highlight'

const editor = useEditor({
  immediatelyRender: false, // ✅ Essential for SSR
  extensions: [
    StarterKit,
    Image.configure({
      inline: true,
      allowBase64: true,
    }),
    TextStyle,
    Color.configure({
      types: [TextStyle.name],
    }),
    Highlight.configure({
      multicolor: true,
    }),
  ],
})
```

## Key Takeaways

1. **`immediatelyRender: false` is mandatory for Next.js App Router** to prevent hydration mismatches
2. **Always check if editor is initialized** with `if (!editor) return null` pattern
3. **Use `'use client'` directive** - Tiptap requires client-side rendering
4. **Performance optimization**: Combine with `shouldRerenderOnTransaction: false` for manual rendering control
5. **SSR opt-in**: Use `element: null` for headless/server-side editor initialization without DOM

## Code Examples

### Minimal Next.js Setup

```jsx
'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'

export default function TiptapEditor() {
  const editor = useEditor({
    extensions: [StarterKit],
    content: '<p>Hello World! 🌎️</p>',
    immediatelyRender: false,
  })

  if (!editor) return null

  return <EditorContent editor={editor} />
}
```

### Performance-Optimized Setup

```tsx
'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'

export default function OptimizedEditor() {
  const editor = useEditor({
    extensions: [StarterKit],
    content: '<p>Content here</p>',
    immediatelyRender: false,          // Prevent SSR issues
    shouldRerenderOnTransaction: false, // Optimize re-renders
  })

  if (!editor) return null

  return <EditorContent editor={editor} />
}
```

## Sources

- Tiptap Docs via Context7 (ueberdosis/tiptap-docs)
- Topics: Next.js SSR, hydration, immediatelyRender, useEditor hook
- Token usage: 2,315 tokens
