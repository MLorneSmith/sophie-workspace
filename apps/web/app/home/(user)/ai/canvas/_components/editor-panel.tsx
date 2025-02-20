'use client';

import { Suspense, useCallback, useRef } from 'react';

import { useQuery } from '@tanstack/react-query';

import { type SituationImprovement } from '@kit/ai-gateway/src/configs/use-cases/situation-improvements/types';
import { useSupabase } from '@kit/supabase/hooks/use-supabase';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@kit/ui/resizable';
import { Spinner } from '@kit/ui/spinner';

import { Database } from '~/lib/database.types';

import { ActionToolbar } from './action-toolbar';
import { type LexicalEditorRef } from './editor/lexical-editor';
import { TabContent } from './editor/tab-content';
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
  const supabase = useSupabase<Database>();
  const { data: content = '' } = useQuery<string>({
    queryKey: ['submission', 'content', sectionType],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('building_blocks_submissions')
        .select('*')
        .single();

      if (error) throw error;
      if (!data) return '';

      return (data as Record<string, string>)[sectionType] || '';
    },
  });

  const editorRef = useRef<LexicalEditorRef>(null);

  const handleAcceptImprovement = useCallback(
    (improvement: SituationImprovement) => {
      if (editorRef.current) {
        editorRef.current.insertContent(
          `${improvement.summaryPoint}\n\n${improvement.supportingPoints
            .map((point) => `• ${point}`)
            .join('\n')}`,
        );
      }
    },
    [editorRef],
  );

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
              <ActionToolbar />
            </div>
          </div>
        </ResizablePanel>
        <ResizableHandle />
        <ResizablePanel defaultSize={34}>
          <Suspense fallback={<LoadingFallback />}>
            <SuggestionsPane
              content={content}
              onAcceptImprovement={handleAcceptImprovement}
            />
          </Suspense>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
