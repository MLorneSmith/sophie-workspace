'use client';

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
} from 'react';

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
import { $createParagraphNode, $createTextNode, $getRoot } from 'lexical';
import type { EditorState, LexicalEditor as LexicalEditorType } from 'lexical';
import { UNDO_COMMAND } from 'lexical';
import debounce from 'lodash/debounce';

import { type BaseImprovement } from '@kit/ai-gateway/src/prompts/types/improvements';
import { useSupabase } from '@kit/supabase/hooks/use-supabase';

import { useSaveContext } from '../../_lib/contexts/save-context';
import './editor.css';
import { ToolbarPlugin } from './toolbar-plugin';

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
  onAcceptImprovement?: (improvement: BaseImprovement) => void;
}

export interface LexicalEditorRef {
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

export const LexicalEditor = forwardRef<LexicalEditorRef, LexicalEditorProps>(
  function LexicalEditor(props, ref) {
    const { content, submissionId, sectionType, onAcceptImprovement } = props;
    const supabase = useSupabase();
    const queryClient = useQueryClient();
    const { setSaveStatus, registerSaveCallback } = useSaveContext();
    const editorRef = useRef<LexicalEditorType | null>(null);

    useImperativeHandle(ref, () => ({
      insertContent: (content: string) => {
        if (editorRef.current) {
          editorRef.current.update(() => {
            const root = $getRoot();
            const paragraphNode = $createParagraphNode();
            const textNode = $createTextNode(content);
            paragraphNode.append(textNode);
            root.append(paragraphNode);
          });
        }
      },
      update: (fn: () => void) => {
        if (editorRef.current) {
          editorRef.current.update(fn);
        }
      },
    }));

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
      return () =>
        window.removeEventListener('beforeunload', handleBeforeUnload);
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

    const DEFAULT_EDITOR_STATE = {
      root: {
        children: [
          {
            children: [
              {
                detail: 0,
                format: 0,
                mode: 'normal',
                style: '',
                text: '',
                type: 'text',
                version: 1,
              },
            ],
            direction: 'ltr',
            format: '',
            indent: 0,
            type: 'paragraph',
            version: 1,
            textFormat: 0,
            textStyle: '',
          },
        ],
        direction: 'ltr',
        format: '',
        indent: 0,
        type: 'root',
        version: 1,
      },
    };

    // Parse initial content if it's a string
    const initialContent = useCallback(() => {
      if (!content) {
        console.debug('No content provided, using default state');
        return JSON.stringify(DEFAULT_EDITOR_STATE);
      }

      try {
        const parsed =
          typeof content === 'string' ? JSON.parse(content) : content;

        // Validate the parsed content has the required structure and at least one text node
        if (
          parsed?.root?.children?.[0]?.children?.[0]?.type === 'text' &&
          parsed.root.children[0].type === 'paragraph'
        ) {
          // Ensure direction is set to prevent empty root node error
          if (!parsed.root.direction) {
            parsed.root.direction = 'ltr';
          }
          if (!parsed.root.children[0].direction) {
            parsed.root.children[0].direction = 'ltr';
          }

          return JSON.stringify(parsed);
        }

        console.debug(
          'Invalid content structure, using default state:',
          content,
        );
        return JSON.stringify(DEFAULT_EDITOR_STATE);
      } catch (e) {
        console.debug('Failed to parse content:', e);
        return JSON.stringify(DEFAULT_EDITOR_STATE);
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

    const handleAcceptImprovement = useCallback(
      (improvement: BaseImprovement) => {
        if (editorRef.current) {
          editorRef.current.update(() => {
            const root = $getRoot();
            const paragraphNode = $createParagraphNode();

            // Add summary point
            const summaryNode = $createTextNode(
              improvement.implementedSummaryPoint,
            );
            paragraphNode.append(summaryNode);

            // Add supporting points
            improvement.implementedSupportingPoints.forEach((point: string) => {
              const pointNode = $createTextNode(`\n• ${point}`);
              paragraphNode.append(pointNode);
            });

            root.append(paragraphNode);
          });

          if (onAcceptImprovement) {
            onAcceptImprovement(improvement);
          }
        }
      },
      [onAcceptImprovement],
    );

    return (
      <LexicalComposer
        initialConfig={initialConfig}
        key={`${submissionId}-${sectionType}`}
      >
        <EditorRefPlugin editorRef={editorRef} />
        <OnChangePlugin onChange={onChange} />
        <KeyboardEventHandler />
        <div className="editor-shell relative flex h-full flex-col rounded-lg border">
          <ToolbarPlugin />
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
  },
);
