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
import { LoadingAnimation } from '../../suggestions/loading-animation';
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

    // Parse initial content
    const initialContent = useMemo(() => {
      try {
        return typeof content === 'string' ? JSON.parse(content) : content;
      } catch (e) {
        console.error('Failed to parse content:', e);
        return {
          type: 'doc',
          content: [{ type: 'paragraph', content: [] }],
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
