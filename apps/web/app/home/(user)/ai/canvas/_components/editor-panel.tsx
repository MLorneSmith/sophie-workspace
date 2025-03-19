'use client';

import { Suspense, useCallback, useRef, useState } from 'react';

import { useSearchParams } from 'next/navigation';

import { $createHeadingNode } from '@lexical/rich-text';
import { $createParagraphNode, $createTextNode, $getRoot } from 'lexical';

import { type BaseImprovement } from '@kit/ai-gateway/src/prompts/types/improvements';
import { useSupabase } from '@kit/supabase/hooks/use-supabase';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@kit/ui/resizable';
import { Spinner } from '@kit/ui/spinner';

import { Database } from '~/lib/database.types';

import { generateIdeasAction } from '../_actions/generate-ideas';
import { useOutlineContent } from '../_lib/hooks/use-outline-content';
import { ActionToolbar } from './action-toolbar';
import { type LexicalEditorRef } from './editor/lexical-editor';
import { OutlineTabContent } from './editor/outline-tab-content';
import { TabContent } from './editor/tab-content';
import { LoadingAnimation } from './suggestions/loading-animation';
import { LOADING_MESSAGES } from './suggestions/loading-messages';
import { SuggestionsPane } from './suggestions/suggestions-pane';

interface EditorPanelProps {
  sectionType: 'situation' | 'complication' | 'answer' | 'outline';
}

function LoadingFallback() {
  return (
    <div className="flex h-[200px] items-center justify-center">
      <Spinner className="h-6 w-6" />
    </div>
  );
}

function _ErrorBoundary({ error }: { error: Error }) {
  return (
    <div className="flex h-[200px] items-center justify-center text-red-500">
      <p>Error loading editor: {error.message}</p>
    </div>
  );
}

export function EditorPanel({ sectionType }: EditorPanelProps) {
  const searchParams = useSearchParams();
  const submissionId = searchParams.get('id') ?? '';
  const _supabase = useSupabase<Database>();
  const { data: content = '', regenerateOutline } =
    useOutlineContent(submissionId);
  const contentString =
    typeof content === 'string' ? content : JSON.stringify(content);

  const editorRef = useRef<LexicalEditorRef>(null);
  const [suggestions, setSuggestions] = useState<BaseImprovement[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [messageIndex, setMessageIndex] = useState(0);
  const [isRegeneratingOutline, setIsRegeneratingOutline] = useState(false);

  const handleAcceptImprovement = useCallback(
    (improvement: BaseImprovement) => {
      if (!editorRef.current) return;

      try {
        editorRef.current.update(() => {
          try {
            const root = $getRoot();

            // Create heading for summary point
            const headingNode = $createHeadingNode('h2');
            const summaryTextNode = $createTextNode(
              improvement.implementedSummaryPoint,
            );
            headingNode.append(summaryTextNode);
            root.append(headingNode);

            // Create paragraph for supporting points
            const paragraphNode = $createParagraphNode();
            improvement.implementedSupportingPoints.forEach((point) => {
              const pointNode = $createTextNode(`• ${point}\n`);
              paragraphNode.append(pointNode);
            });
            root.append(paragraphNode);
          } catch (error) {
            console.warn(
              'Error in editor update for accepting improvement:',
              error,
            );
          }
        });
      } catch (error) {
        console.warn('Error accepting improvement:', error);
      }
    },
    [editorRef],
  );

  const handleImproveStructure = useCallback(async () => {
    if (!editorRef.current || !submissionId) return;

    try {
      // TODO: Implement improve structure functionality
      console.log('Improve structure clicked');

      // When implemented, this would use the same safety pattern as handleGenerateIdeas
      // to safely get content from the editor
    } catch (error) {
      console.warn('Error improving structure:', error);
    }
  }, [editorRef, submissionId]);

  const handleGenerateIdeas = useCallback(async () => {
    if (!editorRef.current || !submissionId) return;

    // Increment message index before starting loading
    setMessageIndex((current) => (current + 1) % LOADING_MESSAGES.length);
    setIsGenerating(true);

    // Get content safely with try/catch
    let content = '';
    try {
      // Create a promise to get the content safely
      const getContentPromise = new Promise<string>((resolve) => {
        if (!editorRef.current) {
          resolve('');
          return;
        }

        try {
          editorRef.current.update(() => {
            try {
              const root = $getRoot();
              content = root.getTextContent();
              resolve(content);
            } catch (error) {
              console.warn('Error getting root text content:', error);
              resolve('');
            }
          });
        } catch (error) {
          console.warn('Error updating editor:', error);
          resolve('');
        }
      });

      // Wait for content with a timeout
      content = await Promise.race([
        getContentPromise,
        new Promise<string>((resolve) => setTimeout(() => resolve(''), 1000)),
      ]);

      // Ensure content is not empty for the API call
      const contentToSend =
        content.trim() || 'Please suggest some initial ideas.';

      const result = await generateIdeasAction({
        content: contentToSend,
        submissionId,
        type: sectionType,
      });

      if (result.success && result.data?.improvements) {
        setSuggestions(result.data.improvements);
      }
    } catch (error) {
      console.error('Failed to generate ideas:', error);
      // Could add toast notification here if needed
    } finally {
      setIsGenerating(false);
    }
  }, [editorRef, submissionId, sectionType]);

  return (
    <div className="flex h-[calc(100vh-180px)] flex-col">
      <ResizablePanelGroup direction="horizontal" className="mt-4 flex-1 gap-4">
        <ResizablePanel defaultSize={66}>
          <div className="flex h-full flex-col">
            <div className="flex-1 overflow-auto">
              <Suspense fallback={<LoadingFallback />}>
                {sectionType === 'outline' ? (
                  isRegeneratingOutline ? (
                    <div className="h-full">
                      <LoadingAnimation messageIndex={messageIndex} />
                    </div>
                  ) : (
                    <OutlineTabContent ref={editorRef} />
                  )
                ) : (
                  <TabContent ref={editorRef} sectionType={sectionType} />
                )}
              </Suspense>
            </div>
            <div className="p-4">
              <ActionToolbar
                editorRef={editorRef}
                sectionType={sectionType}
                onGenerateImprovements={handleGenerateIdeas}
                onResetOutline={
                  sectionType === 'outline'
                    ? async () => {
                        try {
                          setMessageIndex(
                            (current) =>
                              (current + 1) % LOADING_MESSAGES.length,
                          );
                          setIsRegeneratingOutline(true);

                          await regenerateOutline();
                        } catch (error) {
                          console.error('Failed to regenerate outline:', error);
                        } finally {
                          // Always reset the loading state
                          setIsRegeneratingOutline(false);
                        }
                      }
                    : undefined
                }
                onImproveStructure={
                  sectionType === 'answer' ? handleImproveStructure : undefined
                }
              />
            </div>
          </div>
        </ResizablePanel>
        <ResizableHandle />
        <ResizablePanel defaultSize={34}>
          <Suspense fallback={<LoadingFallback />}>
            <SuggestionsPane
              _content={contentString}
              _submissionId={submissionId}
              _type={sectionType}
              onAcceptImprovement={handleAcceptImprovement}
              improvements={suggestions}
              onGenerateImprovements={handleGenerateIdeas}
              isLoading={isGenerating}
              messageIndex={messageIndex}
            />
          </Suspense>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
