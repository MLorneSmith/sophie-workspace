'use client';

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
} from 'react';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import Bold from '@tiptap/extension-bold';
import BulletList from '@tiptap/extension-bullet-list';
import Heading from '@tiptap/extension-heading';
import Italic from '@tiptap/extension-italic';
import ListItem from '@tiptap/extension-list-item';
import OrderedList from '@tiptap/extension-ordered-list';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import debounce from 'lodash/debounce';

import { type BaseImprovement } from '@kit/ai-gateway/src/prompts/types/improvements';
import { useSupabase } from '@kit/supabase/hooks/use-supabase';

import { useSaveContext } from '../../../_lib/contexts/save-context';
import { normalizeEditorContent } from '../../../_lib/utils/normalize-editor-content';
import { type EditorContentTypes } from '../../../_types/editor-types';
import { LoadingAnimation } from '../../suggestions/loading-animation';
import './editor.css';
import { Toolbar } from './toolbar';

interface TiptapEditorProps {
  content: string;
  submissionId: string;
  sectionType: EditorContentTypes;
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
    const {
      content,
      submissionId,
      sectionType,
      onAcceptImprovement,
      isLoading,
    } = props;
    const supabase = useSupabase();
    const queryClient = useQueryClient();
    const { setSaveStatus, registerSaveCallback } = useSaveContext();
    const editorRef = useRef(null);

    // Parse and normalize initial content
    const initialContent = useMemo(() => {
      console.log('TiptapEditor parsing content:', {
        sectionType,
        contentType: typeof content,
        contentLength:
          typeof content === 'string' ? content.length : 'not a string',
      });

      try {
        if (typeof content !== 'string') {
          console.warn('TiptapEditor received non-string content:', content);
          // Create a default empty document and normalize it
          return normalizeEditorContent(
            {
              type: 'doc',
              content: [{ type: 'paragraph', content: [] }],
            },
            sectionType,
          );
        }

        // Parse the content string into an object
        const parsed = JSON.parse(content);
        console.log('Successfully parsed content:', {
          type: parsed?.type,
          contentLength: parsed?.content?.length,
          firstNodeType: parsed?.content?.[0]?.type,
        });

        // Normalize the content before passing it to the editor
        // This helps prevent ProseMirror model version conflicts
        return normalizeEditorContent(parsed, sectionType);
      } catch (e) {
        console.error('Failed to parse content:', e);
        // Return a normalized empty document as fallback
        return normalizeEditorContent(
          {
            type: 'doc',
            content: [
              { type: 'paragraph', content: [{ type: 'text', text: ' ' }] },
            ],
          },
          sectionType,
        );
      }
    }, [content, sectionType]);

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
        console.log('TiptapEditor insertContent called with:', content);
        if (editor) {
          // Make sure the editor is focused before inserting content
          editor.commands.focus();
          // Insert the content and return status
          const result = editor.commands.insertContent(content);
          console.log('Content insertion result:', result);
          return result;
        }
        return false;
      },
      update: (fn: () => void) => {
        if (editor) {
          // Execute function in Tiptap context
          console.log('TiptapEditor update called');
          editor
            .chain()
            .focus()
            .command(() => {
              fn();
              return true;
            })
            .run();
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

    // Save content function with normalization
    const saveContent = useCallback(
      async (editorContent: any) => {
        try {
          setSaveStatus('saving');
          // Normalize the content before saving to ensure it's valid
          const normalizedContent = normalizeEditorContent(
            editorContent,
            sectionType,
          );
          await updateContent(normalizedContent);
        } catch (error) {
          console.error('Error saving content:', error);
          setSaveStatus('error');
          setTimeout(() => setSaveStatus('idle'), 3000);
        }
      },
      [updateContent, setSaveStatus, sectionType],
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

    // Update editor content when it changes, with improved error handling
    useEffect(() => {
      if (!editor || !initialContent) return;

      try {
        // Log the content types for debugging
        console.log('Editor update effect with content:', {
          sectionType,
          initialContentType: typeof initialContent,
          editorExists: !!editor,
        });

        // Only update if content has changed to avoid loops
        const currentContent = editor.getJSON();
        const currentContentStr = JSON.stringify(currentContent);
        const initialContentStr = JSON.stringify(initialContent);

        // If content has changed, reset the editor completely to avoid ProseMirror model version conflicts
        if (currentContentStr !== initialContentStr) {
          console.log('Content changed, updating editor');

          // Use a try-catch to handle potential errors
          try {
            // Use a timeout to ensure clean DOM updates
            setTimeout(() => {
              if (editor) {
                try {
                  // First clear content then set new content
                  editor.commands.clearContent();
                  // Use the normalized content to prevent model conflicts
                  editor.commands.setContent(initialContent);
                } catch (innerError) {
                  console.error(
                    'Error while setting editor content:',
                    innerError,
                  );

                  // As a last resort, try recreating a minimal valid document
                  const safeContent = normalizeEditorContent(
                    {
                      type: 'doc',
                      content: [
                        {
                          type: 'paragraph',
                          content: [{ type: 'text', text: ' ' }],
                        },
                      ],
                    },
                    sectionType,
                  );

                  editor.commands.setContent(safeContent);
                }
              }
            }, 0);
          } catch (error) {
            console.error('Error updating editor content:', error);
          }
        }
      } catch (error) {
        console.error('Error in editor update effect:', error);
      }
    }, [editor, initialContent, sectionType]);

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
      return () =>
        window.removeEventListener('beforeunload', handleBeforeUnload);
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
