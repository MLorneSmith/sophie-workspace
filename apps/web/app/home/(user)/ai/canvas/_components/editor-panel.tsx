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
    <div className="flex h-[calc(100vh-300px)] flex-col">
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel defaultSize={66}>
          <div className="flex h-full flex-col">
            <div className="flex-1 p-4">
              <TabContent sectionType={sectionType} />
            </div>
            <ActionToolbar />
          </div>
        </ResizablePanel>
        <ResizableHandle />
        <ResizablePanel defaultSize={34}>
          <div className="flex h-full flex-col p-4">
            <div className="mb-4 flex-1 rounded-lg border p-4">
              Suggestions will appear here
            </div>
            <Button className="w-full">Generate Suggestions</Button>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
