'use client';

import { Suspense, useCallback, useRef, useState } from 'react';

import { useSearchParams } from 'next/navigation';

import { $createHeadingNode } from '@lexical/rich-text';
import { useQuery } from '@tanstack/react-query';
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
import { ActionToolbar } from './action-toolbar';
import { type LexicalEditorRef } from './editor/lexical-editor';
import { TabContent } from './editor/tab-content';
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

function ErrorBoundary({ error }: { error: Error }) {
  return (
    <div className="flex h-[200px] items-center justify-center text-red-500">
      <p>Error loading editor: {error.message}</p>
    </div>
  );
}

export function EditorPanel({ sectionType }: EditorPanelProps) {
  const searchParams = useSearchParams();
  const submissionId = searchParams.get('id') ?? '';
  const supabase = useSupabase<Database>();
  const { data: content = '' } = useQuery<string>({
    queryKey: ['submission', submissionId, 'content', sectionType],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('building_blocks_submissions')
        .select('*')
        .eq('id', submissionId)
        .single();

      if (error) throw error;
      if (!data) return '';

      return (data as Record<string, string>)[sectionType] || '';
    },
  });

  const editorRef = useRef<LexicalEditorRef>(null);
  const [suggestions, setSuggestions] = useState<BaseImprovement[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [messageIndex, setMessageIndex] = useState(0);

  const handleAcceptImprovement = useCallback(
    (improvement: BaseImprovement) => {
      if (editorRef.current) {
        editorRef.current.update(() => {
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
        });
      }
    },
    [editorRef],
  );

  const handleGenerateIdeas = useCallback(async () => {
    if (!editorRef.current || !submissionId) return;

    // Increment message index before starting loading
    setMessageIndex((current) => (current + 1) % LOADING_MESSAGES.length);
    setIsGenerating(true);

    // Get content outside of try block since it's synchronous
    let content = '';
    editorRef.current.update(() => {
      const root = $getRoot();
      content = root.getTextContent();
    });

    try {
      const result = await generateIdeasAction({
        content,
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
                <TabContent ref={editorRef} sectionType={sectionType} />
              </Suspense>
            </div>
            <div className="p-4">
              <ActionToolbar
                editorRef={editorRef}
                sectionType={sectionType}
                onGenerateImprovements={handleGenerateIdeas}
              />
            </div>
          </div>
        </ResizablePanel>
        <ResizableHandle />
        <ResizablePanel defaultSize={34}>
          <Suspense fallback={<LoadingFallback />}>
            <SuggestionsPane
              content={content}
              submissionId={submissionId}
              type={sectionType}
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
