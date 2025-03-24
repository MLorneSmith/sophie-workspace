# Tiptap Editor Implementation Revised Plan

## Background

We are currently experiencing issues with our Lexical rich text editor implementation in the Canvas document editor. The main problems include:

1. Bundling issues with Lexical in Next.js, causing errors like:

   ```
   Error: Unable to find an active editor state. State helpers or node methods can only be used synchronously during the callback of editor.update(), editor.read(), or editorState.read(). Detected on the page: 0 compatible editor(s) with version 0.24.0+dev.esm and incompatible editors with versions 0.24.0+dev.esm (separately built, likely a bundler configuration issue)
   ```

2. Formatting toolbar functionality failures
3. Issues with improvement suggestions not being properly inserted into the editor

After multiple attempts to resolve these issues, we've decided to migrate from Lexical to Tiptap, a more robust editor built on ProseMirror that has better compatibility with Next.js and React.

## Revised Approach

Since we're in initial development with only one record in Supabase, we'll take a more direct approach:

1. Modify the data creation process to store content in Tiptap format from the start
2. Create new Tiptap editor components that work directly with this format
3. Implement a simple one-time conversion for any existing data

This approach eliminates the need for complex bidirectional conversion between formats and provides a cleaner architecture going forward.

## Implementation Plan

### Phase 1: Project Setup & Dependencies (0.5 day)

#### 1.1 Install Core Packages

```bash
pnpm add @tiptap/react @tiptap/pm @tiptap/starter-kit
```

#### 1.2 Install Essential Extensions

```bash
pnpm add @tiptap/extension-placeholder @tiptap/extension-bold @tiptap/extension-italic @tiptap/extension-underline @tiptap/extension-heading @tiptap/extension-bullet-list @tiptap/extension-ordered-list @tiptap/extension-list-item
```

#### 1.3 Create File Structure

```
apps/web/app/home/(user)/ai/canvas/_components/editor/tiptap/
├── tiptap-editor.tsx        # Main editor component
├── toolbar.tsx              # Toolbar component
├── plugins/
│   ├── improvement-plugin.ts # For handling improvements
│   └── format-plugin.ts     # For format preservation
└── utils/
    ├── format-conversion.ts # One-time conversion utility
    └── editor-utils.ts      # Utility functions
```

### Phase 2: Update Data Creation & Storage Format (1 day)

#### 2.1 Modify `createInitialEditorState` in `submitBuildingBlocksAction.ts`

Update the function to create Tiptap JSON format instead of Lexical format:

```typescript
function createInitialEditorState(text: string) {
  // Split text into paragraphs and remove empty lines
  const paragraphs = text.split('\n').filter((line) => line.trim());

  // Convert each paragraph into a Tiptap node
  const content = paragraphs.map((paragraph) => {
    // Check if the line is a bullet point
    const trimmedParagraph = paragraph.trim();
    const isBulletPoint =
      trimmedParagraph.startsWith('-') || trimmedParagraph.startsWith('•');

    // Remove the bullet point character and trim whitespace
    const textContent = isBulletPoint
      ? trimmedParagraph.substring(1).trim()
      : trimmedParagraph;

    if (isBulletPoint) {
      // Create a bullet list item
      return {
        type: 'bulletList',
        content: [
          {
            type: 'listItem',
            content: [
              {
                type: 'paragraph',
                content: [
                  {
                    type: 'text',
                    text: textContent,
                  },
                ],
              },
            ],
          },
        ],
      };
    } else {
      // Create a regular paragraph
      return {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: textContent,
          },
        ],
      };
    }
  });

  // Return Tiptap document format
  return JSON.stringify({
    type: 'doc',
    content: content,
  });
}
```

#### 2.2 Create One-Time Conversion Utility

Create a utility to convert existing Lexical data to Tiptap format:

```typescript
// apps/web/app/home/(user)/ai/canvas/_components/editor/tiptap/utils/format-conversion.ts

export function lexicalToTiptap(lexicalContent: any): any {
  if (!lexicalContent) {
    return {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [],
        },
      ],
    };
  }

  // Parse if it's a string
  const parsed =
    typeof lexicalContent === 'string'
      ? JSON.parse(lexicalContent)
      : lexicalContent;

  // Basic conversion for existing data
  const tiptapDoc = { type: 'doc', content: [] };

  if (parsed?.root?.children) {
    tiptapDoc.content = parsed.root.children
      .map((node) => {
        // Map paragraph nodes
        if (node.type === 'paragraph') {
          return {
            type: 'paragraph',
            content: (node.children || []).map((textNode) => {
              const marks = [];

              // Handle text formatting
              if (textNode.format) {
                // Bold (format & 1)
                if (textNode.format & 1) marks.push({ type: 'bold' });
                // Italic (format & 2)
                if (textNode.format & 2) marks.push({ type: 'italic' });
                // Underline (format & 4)
                if (textNode.format & 4) marks.push({ type: 'underline' });
              }

              return {
                type: 'text',
                text: textNode.text || '',
                marks: marks.length > 0 ? marks : undefined,
              };
            }),
          };
        }

        // Map heading nodes
        if (node.type === 'heading') {
          return {
            type: 'heading',
            attrs: { level: node.tag === 'h1' ? 1 : node.tag === 'h2' ? 2 : 3 },
            content: (node.children || []).map((textNode) => ({
              type: 'text',
              text: textNode.text || '',
            })),
          };
        }

        // Default to paragraph if type is unknown
        return {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: node.textContent || '',
            },
          ],
        };
      })
      .filter((node) => node.content && node.content.length > 0);
  }

  // Ensure we have at least an empty paragraph
  if (tiptapDoc.content.length === 0) {
    tiptapDoc.content.push({
      type: 'paragraph',
      content: [],
    });
  }

  return tiptapDoc;
}
```

#### 2.3 Create Conversion Script

Create a script to convert existing records in the database:

```typescript
// apps/web/app/home/(user)/ai/canvas/_actions/convert-editor-data.ts

'use server';

import { getSupabaseServerClient } from '@kit/supabase/server-client';

import { Database } from '~/lib/database.types';

import { lexicalToTiptap } from '../_components/editor/tiptap/utils/format-conversion';

// apps/web/app/home/(user)/ai/canvas/_actions/convert-editor-data.ts

// apps/web/app/home/(user)/ai/canvas/_actions/convert-editor-data.ts

export async function convertExistingRecordsToTiptap() {
  const client = getSupabaseServerClient<Database>();

  // Fetch all records
  const { data: submissions, error } = await client
    .from('building_blocks_submissions')
    .select('*');

  if (error || !submissions) {
    console.error('Error fetching submissions:', error);
    return { success: false, error: error?.message };
  }

  const results = {
    total: submissions.length,
    converted: 0,
    failed: 0,
    errors: [] as string[],
  };

  // Convert and update each record
  for (const submission of submissions) {
    try {
      // Convert each field that contains editor content
      const convertedData = {
        situation: submission.situation
          ? JSON.stringify(lexicalToTiptap(submission.situation))
          : null,
        complication: submission.complication
          ? JSON.stringify(lexicalToTiptap(submission.complication))
          : null,
        answer: submission.answer
          ? JSON.stringify(lexicalToTiptap(submission.answer))
          : null,
        outline: submission.outline
          ? JSON.stringify(lexicalToTiptap(submission.outline))
          : null,
      };

      // Update the record
      const { error: updateError } = await client
        .from('building_blocks_submissions')
        .update(convertedData)
        .eq('id', submission.id);

      if (updateError) {
        console.error(
          `Error updating submission ${submission.id}:`,
          updateError,
        );
        results.failed++;
        results.errors.push(`ID ${submission.id}: ${updateError.message}`);
      } else {
        results.converted++;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`Error processing submission ${submission.id}:`, message);
      results.failed++;
      results.errors.push(`ID ${submission.id}: ${message}`);
    }
  }

  return { success: results.failed === 0, results };
}
```

### Phase 3: Core Tiptap Editor Implementation (2 days)

#### 3.1 Create `tiptap-editor.tsx` Component

```typescript
// apps/web/app/home/(user)/ai/canvas/_components/editor/tiptap/tiptap-editor.tsx

'use client';

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
} from 'react';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Bold from '@tiptap/extension-bold';
import Italic from '@tiptap/extension-italic';
import Underline from '@tiptap/extension-underline';
import Heading from '@tiptap/extension-heading';
import BulletList from '@tiptap/extension-bullet-list';
import OrderedList from '@tiptap/extension-ordered-list';
import ListItem from '@tiptap/extension-list-item';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import debounce from 'lodash/debounce';

import { type BaseImprovement } from '@kit/ai-gateway/src/prompts/types/improvements';
import { useSupabase } from '@kit/supabase/hooks/use-supabase';

import { useSaveContext } from '../../_lib/contexts/save-context';
import { LoadingAnimation } from '../suggestions/loading-animation';
import './editor.css';
import { Toolbar } from './toolbar';

interface TiptapEditorProps {
  content: string;
  submissionId: string;
  sectionType: 'situation' | 'complication' | 'answer' | 'outline';
  onAcceptImprovement?: (improvement: BaseImprovement) => void;
  isLoading?: boolean;
}

export interface TiptapEditorRef {
  insertContent: (content: string) => void;
  update: (fn: () => void) => void;
}

interface SubmissionData {
  id: string;
  title: string;
  situation: string | null;
  complication: string | null;
  answer: string | null;
  outline: string | null;
  [key: string]: any;
}

interface MutationContext {
  previousContent: any | null;
}

export const TiptapEditor = forwardRef<TiptapEditorRef, TiptapEditorProps>(
  function TiptapEditor(props, ref) {
    const { content, submissionId, sectionType, onAcceptImprovement, isLoading } = props;
    const supabase = useSupabase();
    const queryClient = useQueryClient();
    const { setSaveStatus, registerSaveCallback } = useSaveContext();
    const editorRef = useRef(null);

    // Parse initial content
    const initialContent = useMemo(() => {
      try {
        return typeof content === 'string' ? JSON.parse(content) : content;
      } catch (e) {
        console.error('Failed to parse content:', e);
        return {
          type: 'doc',
          content: [{ type: 'paragraph', content: [] }]
        };
      }
    }, [content]);

    // Initialize Tiptap editor
    const editor = useEditor({
      extensions: [
        StarterKit,
        Placeholder.configure({ placeholder: 'Enter your content...' }),
        Bold,
        Italic,
        Underline,
        Heading.configure({ levels: [1, 2, 3] }),
        BulletList,
        OrderedList,
        ListItem,
      ],
      content: initialContent,
      editorProps: {
        attributes: {
          class: 'outline-none h-full',
        },
      },
      onBlur: ({ editor }) => {
        saveContent(editor.getJSON());
      },
    });

    // Expose methods via ref
    useImperativeHandle(ref, () => ({
      insertContent: (content: string) => {
        editor?.commands.insertContent(content);
      },
      update: (fn: () => void) => {
        if (editor) {
          // Execute function in Tiptap context
          editor.chain().focus().command(() => {
            fn();
            return true;
          }).run();
        }
      },
    }));

    // Mutation for saving content
    const { mutate: updateContent } = useMutation<
      SubmissionData,
      Error,
      any,
      MutationContext
    >({
      mutationFn: async (newContent: any) => {
        console.debug('Saving content:', { sectionType, newContent });
        const { data, error } = await supabase
          .from('building_blocks_submissions')
          .update({ [sectionType]: JSON.stringify(newContent) })
          .eq('id', submissionId)
          .select()
          .single();

        if (error) throw error;
        return data;
      },
      onMutate: async (newContent: any): Promise<MutationContext> => {
        // Cancel outgoing refetches
        await queryClient.cancelQueries({
          queryKey: ['submission', submissionId, sectionType],
          exact: true,
        });

        // Save previous value
        const previousContent =
          queryClient.getQueryData<any>([
            'submission',
            submissionId,
            sectionType,
          ]) ?? null;

        // Update cache optimistically
        queryClient.setQueryData(
          ['submission', submissionId, sectionType],
          newContent,
        );

        return { previousContent };
      },
      onError: (err, newContent, context: MutationContext | undefined) => {
        console.error('Error saving content:', err);
        setSaveStatus('error');
        // Rollback on error
        if (context?.previousContent) {
          queryClient.setQueryData(
            ['submission', submissionId, sectionType],
            context.previousContent,
          );
        }
      },
      onSuccess: (data) => {
        console.debug('Content saved successfully:', {
          sectionType,
          data: data?.[sectionType],
        });
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      },
      onSettled: () => {
        // Always refetch after error or success
        queryClient.invalidateQueries({
          queryKey: ['submission', submissionId, sectionType],
          exact: true,
        });
      },
    });

    // Save content function
    const saveContent = useCallback(
      async (editorContent: any) => {
        try {
          setSaveStatus('saving');
          await updateContent(editorContent);
        } catch (error) {
          console.error('Error saving content:', error);
          setSaveStatus('error');
          setTimeout(() => setSaveStatus('idle'), 3000);
        }
      },
      [updateContent, setSaveStatus],
    );

    // Debounced save handler
    const debouncedSave = useMemo(
      () => debounce(saveContent, 1000),
      [saveContent],
    );

    // Register save callback
    useEffect(() => {
      const callback = async () => {
        if (editor) {
          try {
            await saveContent(editor.getJSON());
          } catch (error) {
            console.error('Save callback failed:', error);
          }
        }
      };
      registerSaveCallback(callback);
    }, [registerSaveCallback, saveContent, editor]);

    // Update editor content when it changes
    useEffect(() => {
      if (editor && initialContent) {
        // Only update if content has changed to avoid loops
        const currentContent = editor.getJSON();
        if (JSON.stringify(currentContent) !== JSON.stringify(initialContent)) {
          editor.commands.setContent(initialContent);
        }
      }
    }, [editor, initialContent]);

    // Handle editor changes
    useEffect(() => {
      if (!editor) return;

      const handleUpdate = ({ editor }: { editor: any }) => {
        debouncedSave(editor.getJSON());
      };

      editor.on('update', handleUpdate);

      return () => {
        editor.off('update', handleUpdate);
      };
    }, [editor, debouncedSave]);

    // Cleanup debounced save on unmount
    useEffect(() => {
      return () => {
        debouncedSave.cancel();
      };
    }, [debouncedSave]);

    // Save before unload
    useEffect(() => {
      const handleBeforeUnload = () => {
        if (editor) {
          debouncedSave.cancel();
          saveContent(editor.getJSON());
        }
      };

      window.addEventListener('beforeunload', handleBeforeUnload);
      return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [editor, debouncedSave, saveContent]);

    return (
      <div className="editor-shell relative flex h-full flex-col rounded-lg border">
        {isLoading && (
          <div className="bg-background/80 absolute inset-0 z-50 backdrop-blur-sm">
            <LoadingAnimation messageIndex={0} />
          </div>
        )}
        <Toolbar editor={editor} />
        <div className="flex-1 p-4">
          <EditorContent editor={editor} className="h-full" />
        </div>
      </div>
    );
  },
);
```

#### 3.2 Create Toolbar Component

```typescript
// apps/web/app/home/(user)/ai/canvas/_components/editor/tiptap/toolbar.tsx

'use client';

import { type Editor } from '@tiptap/react';
import {
  Bold,
  Italic,
  Underline,
  Heading1,
  Heading2,
  List,
  ListOrdered,
  Undo
} from 'lucide-react';

import { cn } from '@kit/ui/utils';
import { Button } from '@kit/ui/button';
import { Separator } from '@kit/ui/separator';

interface ToolbarProps {
  editor: Editor | null;
}

export function Toolbar({ editor }: ToolbarProps) {
  if (!editor) {
    return null;
  }

  return (
    <div className="border-b p-1 flex items-center gap-1">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={cn(
          'h-8 w-8 p-0',
          editor.isActive('bold') && 'bg-accent text-accent-foreground'
        )}
        aria-label="Bold"
      >
        <Bold className="h-4 w-4" />
      </Button>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={cn(
          'h-8 w-8 p-0',
          editor.isActive('italic') && 'bg-accent text-accent-foreground'
        )}
        aria-label="Italic"
      >
        <Italic className="h-4 w-4" />
      </Button>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        className={cn(
          'h-8 w-8 p-0',
          editor.isActive('underline') && 'bg-accent text-accent-foreground'
        )}
        aria-label="Underline"
      >
        <Underline className="h-4 w-4" />
      </Button>

      <Separator orientation="vertical" className="mx-1 h-6" />

      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        className={cn(
          'h-8 w-8 p-0',
          editor.isActive('heading', { level: 1 }) && 'bg-accent text-accent-foreground'
        )}
        aria-label="Heading 1"
      >
        <Heading1 className="h-4 w-4" />
      </Button>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={cn(
          'h-8 w-8 p-0',
          editor.isActive('heading', { level: 2 }) && 'bg-accent text-accent-foreground'
        )}
        aria-label="Heading 2"
      >
        <Heading2 className="h-4 w-4" />
      </Button>

      <Separator orientation="vertical" className="mx-1 h-6" />

      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={cn(
          'h-8 w-8 p-0',
          editor.isActive('bulletList') && 'bg-accent text-accent-foreground'
        )}
        aria-label="Bullet List"
      >
        <List className="h-4 w-4" />
      </Button>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={cn(
          'h-8 w-8 p-0',
          editor.isActive('orderedList') && 'bg-accent text-accent-foreground'
        )}
        aria-label="Ordered List"
      >
        <ListOrdered className="h-4 w-4" />
      </Button>

      <Separator orientation="vertical" className="mx-1 h-6" />

      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        className="h-8 w-8 p-0"
        aria-label="Undo"
      >
        <Undo className="h-4 w-4" />
      </Button>
    </div>
  );
}
```

#### 3.3 Create Improvement Plugin

```typescript
// apps/web/app/home/(user)/ai/canvas/_components/editor/tiptap/plugins/improvement-plugin.ts
import { type Editor } from '@tiptap/react';

import { type BaseImprovement } from '@kit/ai-gateway/src/prompts/types/improvements';

export function insertImprovement(
  editor: Editor,
  improvement: BaseImprovement,
) {
  if (!editor) return;

  editor
    .chain()
    .focus()
    .command(({ tr, commands }) => {
      // Create a heading for the summary point
      tr.insert(
        tr.selection.head,
        editor.schema.nodes.heading.create(
          { level: 2 },
          editor.schema.text(improvement.implementedSummaryPoint),
        ),
      );

      // Add a new line
      tr.insert(tr.selection.head, editor.schema.nodes.paragraph.create());

      // Create a bullet list for supporting points
      const bulletList = editor.schema.nodes.bulletList.create();
      const listItems = improvement.implementedSupportingPoints.map((point) => {
        const paragraph = editor.schema.nodes.paragraph.create(
          {},
          editor.schema.text(point),
        );
        return editor.schema.nodes.listItem.create({}, paragraph);
      });

      // Insert the bullet list with all items
      tr.insert(tr.selection.head, bulletList.copy(listItems));

      return true;
    })
    .run();
}
```

### Phase 4: Integration with Existing Components (1 day)

#### 4.1 Create `tiptap-tab-content.tsx`

```typescript
// apps/web/app/home/(user)/ai/canvas/_components/editor/tiptap/tiptap-tab-content.tsx

'use client';

import { forwardRef, useEffect, useRef } from 'react';

import { useSearchParams } from 'next/navigation';

import { useQuery } from '@tanstack/react-query';

import { useSupabase } from '@kit/supabase/hooks/use-supabase';
import { Spinner } from '@kit/ui/spinner';

import { Database } from '~/lib/database.types';

import {
  TiptapEditor as TiptapEditorComponent,
  type TiptapEditorRef,
} from './tiptap-editor';

interface TabContentProps {
  sectionType: 'situation' | 'complication' | 'answer' | 'outline';
}

const EMPTY_EDITOR_STATE = {
  type: 'doc',
  content: [
    {
      type: 'paragraph',
      content: []
    }
  ]
};

export const TiptapTabContent = forwardRef<TiptapEditorRef, TabContentProps>(
  function TiptapTabContent({ sectionType }, ref) {
    const searchParams = useSearchParams();
    const id = searchParams.get('id');
    const supabase = useSupabase<Database>();
    // Add a ref to track component mount status
    const isMountedRef = useRef(true);

    useEffect(() => {
      // Set mounted flag to true when component mounts
      isMountedRef.current = true;

      return () => {
        // Set mounted flag to false on unmount
        isMountedRef.current = false;
      };
    }, []);

    const { data: content, isLoading } = useQuery({
      queryKey: ['submission', id, sectionType],
      queryFn: async () => {
        if (!id) return EMPTY_EDITOR_STATE;

        const { data, error } = await supabase
          .from('building_blocks_submissions')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;
        if (!data) return EMPTY_EDITOR_STATE;

        const rawContent = (data as Record<string, any>)[sectionType];
        console.debug('Loading content:', { sectionType, rawContent });

        if (!rawContent) return EMPTY_EDITOR_STATE;

        // If content is already stored as JSON object, validate and return it
        if (
          typeof rawContent === 'object' &&
          rawContent !== null &&
          'type' in rawContent &&
          rawContent.type === 'doc'
        ) {
          return rawContent;
        }

        // Try to parse string content as JSON
        try {
          const parsed = JSON.parse(rawContent);
          if (
            typeof parsed === 'object' &&
            parsed !== null &&
            'type' in parsed &&
            parsed.type === 'doc'
          ) {
            return parsed;
          }

          // If it's Lexical format, convert it
          if (
            typeof parsed === 'object' &&
            parsed !== null &&
            'root' in parsed
          ) {
            // Import the conversion utility dynamically to avoid circular dependencies
            const { lexicalToTiptap } = await import('./utils/format-conversion');
            return lexicalToTiptap(parsed);
          }

          console.debug('Invalid Tiptap state format:', parsed);
          return EMPTY_EDITOR_STATE;
        } catch (e) {
          console.debug('Failed to parse content as JSON:', e);
          return EMPTY_EDITOR_STATE;
        }
      },
      enabled: !!id,
    });

    if (!id) {
      return <div>No submission ID provided</div>;
    }

    if (isLoading) {
      return (
        <div className="flex h-[200px] items-center justify-center">
          <Spinner className="h-6 w-6" />
        </div>
      );
    }

    return (
      <div className="h-full">
        <TiptapEditorComponent
          ref={ref}
          content={JSON.stringify(content ?? EMPTY_EDITOR_STATE)}
          submissionId={id}
          sectionType={sectionType}
        />
      </div>
    );
  },
);
```

#### 4.2 Update `editor-panel.tsx` to Use Tiptap

Modify the imports and component references in `editor-panel.tsx` to use the new Tiptap components:

```typescript
// Import the new Tiptap components
import { type TiptapEditorRef } from './editor/tiptap/tiptap-editor';
import { TiptapTabContent } from './editor/tiptap/tiptap-tab-content';

// Replace references to LexicalEditorRef with TiptapEditorRef
// Replace TabContent with TiptapTabContent
```

#### 4.3 Implement Improvement Handling

Update the `handleAcceptImprovement` function in `editor-panel.tsx` to use the Tiptap improvement plugin:

```typescript
import { insertImprovement } from './editor/tiptap/plugins/improvement-plugin';

const handleAcceptImprovement = useCallback(
  (improvement: BaseImprovement) => {
    if (!editorRef.current) return;

    try {
      // Use the Tiptap improvement plugin
      editorRef.current.update(() => {
        if (editor) {
          insertImprovement(editor, improvement);
        }
      });
    } catch (error) {
      console.warn('Error accepting improvement:', error);
    }
  },
  [editorRef],
);
```

### Phase 5: Testing (1.5 days)

#### 5.1 Unit Testing

Create tests for:

- Format conversion utility
- Editor initialization
- Content saving and loading
- Toolbar functionality

#### 5.2 Integration Testing

Test:

- Tab switching with content preservation
- AI improvement insertion
- Error handling and recovery
- Performance with large documents

### Phase 6: Rollout (1 day)

#### 6.1 Feature Flag Implementation

Create a feature flag to toggle between Lexical and Tiptap editors:

```typescript
// apps/web/app/home/(user)/ai/canvas/_lib/config.ts

export const FEATURES = {
  useTiptapEditor: true, // Set to false to use Lexical editor
};
```

Update the editor-panel.tsx to use the feature flag:

```typescript
import { FEATURES } from '../_lib/config';

// In the component
{FEATURES.useTiptapEditor ? (
  <TiptapTabContent ref={editorRef} sectionType={sectionType} />
) : (
  <TabContent ref={editorRef} sectionType={sectionType} />
)}
```

#### 6.2 Data Migration

Run the conversion script to migrate existing data:

```typescript
// In a server action or admin page
import { convertExistingRecordsToTiptap } from '../_actions/convert-editor-data';

// Call the function to convert all records
const result = await convertExistingRecordsToTiptap();
console.log('Migration result:', result);
```

#### 6.3 Monitoring

Add logging to track any issues with the new editor:

```typescript
// Add logging in key areas like content loading and saving
console.debug('Editor state:', editor.getJSON());
```

### Phase 7: Cleanup (0.5 day)

#### 7.1 Remove Legacy Code

Once the Tiptap implementation is stable:

1. Remove Lexical dependencies from package.json
2. Remove Lexical components and utilities
3. Remove the feature flag and always use Tiptap

#### 7.2 Documentation

Update documentation to reflect the new editor implementation:

1. Add comments to key components
2. Document the Tiptap format structure
3. Document how to extend the editor with new features

## Timeline Summary

| Phase | Description          | Duration     |
| ----- | -------------------- | ------------ |
| 1     | Setup & Dependencies | 0.5 day      |
| 2     | Update Data Format   | 1 day        |
| 3     | Core Implementation  | 2 days       |
| 4     | Integration          | 1 day        |
| 5     | Testing              | 1.5 days     |
| 6     | Rollout              | 1 day        |
| 7     | Cleanup              | 0.5 day      |
|       | **Total**            | **6.5 days** |

## Success Criteria

The implementation will be considered successful when:

1. The editor loads and functions correctly in all browsers
2. Content is properly saved and loaded in Tiptap format
3. AI suggestions can be inserted without errors
4. Format is preserved when switching tabs
5. No console errors related to the editor
6. Performance is equal to or better than the Lexical implementation

## Conclusion

This revised implementation plan takes advantage of our early development stage to make a clean transition to Tiptap. By modifying the data creation process to use Tiptap format from the start, we eliminate the need for complex bidirectional conversion and create a more maintainable solution going forward.

The plan addresses all the issues we've encountered with Lexical while providing a clear path to implementation with minimal disruption. The modular approach allows for incremental development and testing, reducing risk and ensuring a smooth transition.
