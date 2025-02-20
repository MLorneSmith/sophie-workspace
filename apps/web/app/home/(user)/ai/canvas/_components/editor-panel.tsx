'use client';

import { Button } from '@kit/ui/button';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@kit/ui/resizable';

import { ActionToolbar } from './action-toolbar';
import { TabContent } from './editor/tab-content';

interface EditorPanelProps {
  sectionType: 'situation' | 'complication' | 'answer' | 'outline';
}

export function EditorPanel({ sectionType }: EditorPanelProps) {
  return (
    <div className="flex h-[calc(100vh-180px)] flex-col">
      <ResizablePanelGroup direction="horizontal" className="mt-4 flex-1 gap-4">
        <ResizablePanel defaultSize={66}>
          <div className="flex h-full flex-col">
            <div className="flex-1 overflow-auto">
              <TabContent sectionType={sectionType} />
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
