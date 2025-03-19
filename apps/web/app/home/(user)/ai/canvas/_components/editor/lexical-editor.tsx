'use client';

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
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
import { LoadingAnimation } from '../suggestions/loading-animation';
import './editor.css';
import { FormatPreservationPlugin } from './plugins/format-preservation.plugin';
import { FormattedElementNode } from './plugins/format/nodes/formatted-element.node';
import { ToolbarPlugin } from './toolbar-plugin';
import {
  enhanceEditorStateForSerialization,
  parseAndEnhanceContent,
} from './utils/format-serialization';

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
  isLoading?: boolean;
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
  // Add a ref to track component mount status
  const isMountedRef = useRef(true);

  useEffect(() => {
    // Set mounted flag to true when component mounts
    isMountedRef.current = true;

    // Store the editor reference
    editorRef.current = editor;

    // Create a local variable to avoid the cleanup closure issue
    const currentEditor = editor;

    return () => {
      // Set mounted flag to false on unmount
      isMountedRef.current = false;

      // Only clear if it's still the same editor instance and component is unmounting
      try {
        if (editorRef.current === currentEditor) {
          editorRef.current = null;
        }
      } catch (e) {
        console.warn('Error during editor reference cleanup:', e);
      }
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
          .update({ [sectionType]: JSON.stringify(newContent) })
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

    // Save handler with clone to prevent modification during serialization
    const saveContent = useCallback(
      async (editorState: EditorState) => {
        return new Promise<void>((resolve, reject) => {
          try {
            // Clone the state to prevent modification during serialization
            const editorStateClone = editorState.clone();
            const editorStateJSON = editorStateClone.toJSON();

            console.debug('Serializing editor state:', {
              sectionType,
              state: editorStateJSON,
            });

            // Ensure we have a valid Lexical state object
            if (typeof editorStateJSON === 'object' && editorStateJSON.root) {
              // Enhance the editor state JSON for serialization
              const enhancedStateJSON =
                enhanceEditorStateForSerialization(editorStateJSON);

              // Call updateContent with the enhanced state and wait for the mutation to complete
              updateContent(enhancedStateJSON, {
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

    // Save handler with validation and optimized state management
    const saveWithValidation = useCallback(
      async (editorState: EditorState) => {
        try {
          setSaveStatus('saving');

          // Validate editor state structure
          const stateJSON = editorState.toJSON();
          if (!stateJSON?.root?.children?.length) {
            throw new Error('Invalid editor state structure');
          }

          // Save content with discrete update for synchronous commit
          await saveContent(editorState);
          setSaveStatus('saved');
          setTimeout(() => setSaveStatus('idle'), 2000);
        } catch (error) {
          console.error('Error saving content:', error);
          setSaveStatus('error');
          setTimeout(() => setSaveStatus('idle'), 3000);

          // Only attempt recovery if the editor instance still exists
          if (editorRef.current) {
            try {
              // Get the last known good state
              const lastGoodState = queryClient.getQueryData([
                'submission',
                submissionId,
                sectionType,
              ]);

              if (lastGoodState) {
                // Parse and validate the last good state
                const parsedState = JSON.parse(JSON.stringify(lastGoodState));
                if (parsedState?.root?.children?.length) {
                  // Enhance the state JSON for serialization
                  const enhancedState =
                    enhanceEditorStateForSerialization(parsedState);

                  // Create a new editor state with format preservation
                  const stateJson = JSON.stringify(enhancedState);
                  const recoveredState =
                    editorRef.current.parseEditorState(stateJson);

                  // Apply the recovered state immediately
                  editorRef.current.setEditorState(recoveredState);
                }
              }
            } catch (recoveryError) {
              console.error('Failed to recover editor state:', recoveryError);
            }
          }
        }
      },
      [
        saveContent,
        setSaveStatus,
        editorRef,
        queryClient,
        submissionId,
        sectionType,
      ],
    );

    // Register save callback with validation
    useEffect(() => {
      const callback = async () => {
        if (editorRef.current) {
          try {
            const editorState = editorRef.current.getEditorState();
            await saveWithValidation(editorState);
          } catch (error) {
            console.error('Save callback failed:', error);
          }
        }
      };
      registerSaveCallback(callback);
    }, [registerSaveCallback, saveWithValidation]);

    // Debounced save handler
    const debouncedSave = useMemo(
      () =>
        debounce(async (editorState: EditorState) => {
          const stateToSave = editorState.clone();

          // Implement a basic retry mechanism with exponential backoff
          const attemptSave = async (retries = 3, delay = 1000) => {
            try {
              await saveWithValidation(stateToSave);
            } catch (error) {
              if (retries > 0) {
                console.log(`Retrying save... (${retries} attempts remaining)`);
                setTimeout(() => attemptSave(retries - 1, delay * 2), delay);
              }
            }
          };

          attemptSave();
        }, 1000),
      [saveWithValidation],
    );

    // Cleanup debounced save on unmount
    useEffect(() => {
      return () => {
        debouncedSave.cancel();
      };
    }, [debouncedSave]);

    // Editor change handler
    const onChange = useCallback(
      (editorState: EditorState) => {
        debouncedSave(editorState);
      },
      [debouncedSave],
    );

    // Save on blur with validation
    const onBlur = useCallback(() => {
      if (editorRef.current) {
        const currentState = editorRef.current.getEditorState();
        saveWithValidation(currentState);
      }
    }, [saveWithValidation]);

    // Save before unload with validation
    useEffect(() => {
      const handleBeforeUnload = () => {
        if (editorRef.current) {
          const currentState = editorRef.current.getEditorState();
          // Force immediate save with validation
          saveWithValidation(currentState);
        }
      };

      window.addEventListener('beforeunload', handleBeforeUnload);
      return () =>
        window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [saveWithValidation]);

    // Save on unmount with validation
    useEffect(() => {
      return () => {
        if (editorRef.current) {
          const editorState = editorRef.current.getEditorState();
          saveWithValidation(editorState).catch((error) => {
            console.error('Failed to save on unmount:', error);
          });
        }
      };
    }, [saveWithValidation]);

    const _DEFAULT_EDITOR_STATE = {
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

    // Parse initial content using the format serialization utility
    const initialContent = useCallback(() => {
      return parseAndEnhanceContent(content);
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
      onError: (_error: Error) => {
        console.error('Lexical Editor Error:', _error);
      },
      editorState: initialContent(), // Pass JSON string directly
      nodes: [ListNode, ListItemNode, HeadingNode, FormattedElementNode],
      onChange,
      editable: true,
      onBlur,
    };

    const _handleAcceptImprovement = useCallback(
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
        {props.isLoading && (
          <div className="bg-background/80 absolute inset-0 z-50 backdrop-blur-sm">
            <LoadingAnimation messageIndex={0} />
          </div>
        )}
        <EditorRefPlugin editorRef={editorRef} />
        <OnChangePlugin onChange={onChange} />
        <KeyboardEventHandler />

        {/* Single focused format preservation plugin */}
        <FormatPreservationPlugin />
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
