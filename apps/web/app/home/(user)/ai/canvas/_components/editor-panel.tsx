'use client';

import { Suspense } from 'react';

import { Button } from '@kit/ui/button';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@kit/ui/resizable';
import { Spinner } from '@kit/ui/spinner';

import { ActionToolbar } from './action-toolbar';
import { TabContent } from './editor/tab-content';

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
  return (
    <div className="flex h-[calc(100vh-180px)] flex-col">
      <ResizablePanelGroup direction="horizontal" className="mt-4 flex-1 gap-4">
        <ResizablePanel defaultSize={66}>
          <div className="flex h-full flex-col">
            <div className="flex-1 overflow-auto">
              <Suspense fallback={<LoadingFallback />}>
                <TabContent sectionType={sectionType} />
              </Suspense>
            </div>
            <div className="p-4">
              <ActionToolbar />
            </div>
          </div>
        </ResizablePanel>
        <ResizableHandle />
        <ResizablePanel defaultSize={34}>
          <div className="flex h-full flex-col">
            <div className="flex-1 overflow-auto rounded-lg border">
              <div className="h-full p-4">Suggestions will appear here</div>
            </div>
            <div className="p-4">
              <Button size="sm" className="w-full">
                Generate Suggestions
              </Button>
            </div>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
