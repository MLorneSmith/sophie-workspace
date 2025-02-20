'use client';

import { useCallback, useEffect, useRef } from 'react';

import { ListItemNode, ListNode } from '@lexical/list';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import LexicalErrorBoundary from '@lexical/react/LexicalErrorBoundary';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { HeadingNode } from '@lexical/rich-text';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { EditorState, LexicalEditor as LexicalEditorType } from 'lexical';
import { UNDO_COMMAND } from 'lexical';
import debounce from 'lodash/debounce';

import { useSupabase } from '@kit/supabase/hooks/use-supabase';

import { useSaveContext } from '../../_lib/contexts/save-context';
import { EditorToolbar } from './editor-toolbar';
import './editor.css';

interface LexicalState {
  root: {
    children: unknown[];
    direction: string | null;
    format: string;
    indent: number;
    type: string;
    version: number;
  };
}

interface LexicalEditorProps {
  content: string;
  submissionId: string;
  sectionType: 'situation' | 'complication' | 'answer' | 'outline';
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
  previousContent: LexicalState | null;
}

function EditorRefPlugin({
  editorRef,
}: {
  editorRef: React.MutableRefObject<LexicalEditorType | null>;
}) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    editorRef.current = editor;
    return () => {
      editorRef.current = null;
    };
  }, [editor, editorRef]);

  return null;
}

const theme = {
  // Theme styling
  paragraph: 'mb-2',
  text: {
    bold: 'font-bold',
    italic: 'italic',
    underline: 'underline',
  },
  list: {
    ul: 'list-disc ml-4',
    ol: 'list-decimal ml-4',
    listitem: 'mb-1',
  },
  nestedList: {
    list: 'ml-4',
    listitem: 'list-circle',
  },
  heading: {
    h2: 'text-xl font-bold mb-2',
  },
};

export function LexicalEditor({
  content,
  submissionId,
  sectionType,
}: LexicalEditorProps) {
  const supabase = useSupabase();
  const queryClient = useQueryClient();
  const { setSaveStatus, registerSaveCallback } = useSaveContext();
  const editorRef = useRef<LexicalEditorType | null>(null);

  // Mutation for saving content
  const { mutate: updateContent } = useMutation<
    SubmissionData,
    Error,
    LexicalState,
    MutationContext
  >({
    mutationFn: async (newContent: LexicalState) => {
      console.debug('Saving content:', { sectionType, newContent });
      const { data, error } = await supabase
        .from('building_blocks_submissions')
        .update({ [sectionType]: newContent })
        .eq('id', submissionId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onMutate: async (newContent: LexicalState): Promise<MutationContext> => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: ['submission', submissionId, sectionType],
        exact: true,
      });

      // Save previous value
      const previousContent =
        queryClient.getQueryData<LexicalState>([
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

  // Save handler
  const saveContent = useCallback(
    async (editorState: EditorState) => {
      return new Promise<void>((resolve, reject) => {
        try {
          const editorStateJSON = editorState.toJSON();
          console.debug('Serializing editor state:', {
            sectionType,
            state: editorStateJSON,
          });

          // Ensure we have a valid Lexical state object
          if (typeof editorStateJSON === 'object' && editorStateJSON.root) {
            // Call updateContent and wait for the mutation to complete
            updateContent(editorStateJSON, {
              onSuccess: () => resolve(),
              onError: (error) => {
                console.error('Failed to save content:', error);
                reject(error);
              },
            });
          } else {
            const error = new Error('Invalid editor state format');
            console.error('Invalid editor state:', editorStateJSON);
            reject(error);
          }
        } catch (error: unknown) {
          const err =
            error instanceof Error ? error : new Error('Unknown error');
          console.error('Error serializing editor state:', err);
          reject(err);
        }
      });
    },
    [sectionType, updateContent],
  );

  // Register save callback
  useEffect(() => {
    const callback = async () => {
      if (editorRef.current) {
        try {
          const editorState = editorRef.current.getEditorState();
          await saveContent(editorState);
        } catch (error) {
          console.error('Save callback failed:', error);
        }
      }
    };
    registerSaveCallback(callback);
  }, [registerSaveCallback, saveContent]);

  // Debounced save handler with status updates
  const debouncedSave = useCallback(
    debounce(async (editorState: EditorState) => {
      try {
        setSaveStatus('saving');
        await saveContent(editorState);
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      } catch (error) {
        setSaveStatus('error');
        setTimeout(() => setSaveStatus('idle'), 3000);
        console.error('Error saving content:', error);
      }
    }, 500),
    [saveContent, setSaveStatus],
  );

  // Editor change handler
  const onChange = useCallback(
    (editorState: EditorState) => {
      debouncedSave(editorState);
    },
    [debouncedSave],
  );

  // Save on blur
  const onBlur = useCallback(() => {
    if (editorRef.current) {
      debouncedSave(editorRef.current.getEditorState());
    }
  }, [debouncedSave]);

  // Save before unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (editorRef.current) {
        // Force immediate save without debounce
        saveContent(editorRef.current.getEditorState());
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [saveContent]);

  // Save on unmount
  useEffect(() => {
    return () => {
      if (editorRef.current) {
        const editorState = editorRef.current.getEditorState();
        saveContent(editorState).catch((error) => {
          console.error('Failed to save on unmount:', error);
        });
      }
    };
  }, [saveContent]);

  const EMPTY_EDITOR_STATE = JSON.stringify({
    root: {
      children: [
        {
          children: [],
          direction: null,
          format: '',
          indent: 0,
          type: 'paragraph',
          version: 1,
        },
      ],
      direction: null,
      format: '',
      indent: 0,
      type: 'root',
      version: 1,
    },
  });

  // Parse initial content if it's a string
  const initialContent = useCallback(() => {
    if (!content) {
      console.debug('No content provided, using empty state');
      return EMPTY_EDITOR_STATE;
    }

    try {
      // If content is already a string, validate it's a proper Lexical state
      if (typeof content === 'string') {
        const parsed = JSON.parse(content);
        if (parsed?.root) {
          return content; // Valid Lexical state JSON string
        }
      }

      // If content is an object, validate and stringify it
      if (
        typeof content === 'object' &&
        content !== null &&
        'root' in content
      ) {
        return JSON.stringify(content);
      }

      console.debug('Invalid content format, using empty state:', content);
      return EMPTY_EDITOR_STATE;
    } catch (e) {
      console.debug('Failed to parse content:', e);
      return EMPTY_EDITOR_STATE;
    }
  }, [content]);

  // Create a KeyboardEventHandler component to handle keyboard shortcuts
  function KeyboardEventHandler() {
    const [editor] = useLexicalComposerContext();

    useEffect(() => {
      const handleKeyDown = (event: KeyboardEvent) => {
        if ((event.ctrlKey || event.metaKey) && event.key === 'z') {
          editor.dispatchCommand(UNDO_COMMAND, undefined);
          event.preventDefault();
        }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => {
        window.removeEventListener('keydown', handleKeyDown);
      };
    }, [editor]);

    return null;
  }

  const initialConfig = {
    namespace: `slideheroes-${sectionType}`,
    theme,
    onError: (error: Error) => {
      console.error('Lexical Editor Error:', error);
    },
    editorState: initialContent(), // Pass JSON string directly
    nodes: [ListNode, ListItemNode, HeadingNode],
    onChange,
    editable: true,
    onBlur,
  };

  return (
    <LexicalComposer
      initialConfig={initialConfig}
      key={`${submissionId}-${sectionType}`}
    >
      <EditorRefPlugin editorRef={editorRef} />
      <OnChangePlugin onChange={onChange} />
      <KeyboardEventHandler />
      <div className="editor-shell relative flex h-full flex-col rounded-lg border">
        <EditorToolbar />
        <div className="flex-1 p-4">
          <RichTextPlugin
            contentEditable={
              <div className="h-full">
                <ContentEditable className="h-full outline-none" />
              </div>
            }
            placeholder={
              <div className="pointer-events-none absolute top-[1.125rem] text-gray-400 select-none">
                Enter your content...
              </div>
            }
            ErrorBoundary={LexicalErrorBoundary}
          />
        </div>
        <HistoryPlugin />
        <ListPlugin />
      </div>
    </LexicalComposer>
  );
}
