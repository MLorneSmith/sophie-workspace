'use client';

import { useState } from 'react';

import {
  FileText,
  LayoutTemplate,
  Lightbulb,
  Maximize2,
  Redo2,
  Save,
  Undo2,
  Zap,
} from 'lucide-react';

import { Button } from '@kit/ui/button';
import { Input } from '@kit/ui/input';
import { PageBody } from '@kit/ui/page';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@kit/ui/resizable';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@kit/ui/tabs';
import { Tooltip, TooltipContent, TooltipTrigger } from '@kit/ui/tooltip';

import { HomeLayoutPageHeader } from '../../_components/home-page-header';
import TabContent from './components/tabs/TabContent';

interface CanvasPageProps {
  title: string;
  description: string;
  submissionId?: string;
}

function TopBar() {
  return (
    <div className="flex items-center justify-between border-b p-4">
      <Input
        placeholder="Untitled Document"
        className="max-w-[200px] text-lg font-semibold"
      />
      <div className="flex gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon">
              <Undo2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Undo</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon">
              <Redo2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Redo</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon">
              <Save className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Save</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon">
              <Maximize2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Fullscreen</TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}

function ActionToolbar() {
  return (
    <div className="flex gap-2 border-t p-4">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline" size="sm">
            <FileText className="mr-2 h-4 w-4" />
            Simplify Text
          </Button>
        </TooltipTrigger>
        <TooltipContent>Make the text clearer and simpler</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline" size="sm">
            <Zap className="mr-2 h-4 w-4" />
            Add Action Verbs
          </Button>
        </TooltipTrigger>
        <TooltipContent>Enhance with dynamic action verbs</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline" size="sm">
            <Lightbulb className="mr-2 h-4 w-4" />
            Add Ideas
          </Button>
        </TooltipTrigger>
        <TooltipContent>Generate additional ideas</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline" size="sm">
            <LayoutTemplate className="mr-2 h-4 w-4" />
            Improve Structure
          </Button>
        </TooltipTrigger>
        <TooltipContent>Enhance document structure</TooltipContent>
      </Tooltip>
    </div>
  );
}

interface EditorPanelProps {
  submissionId: string;
  sectionType: 'situation' | 'complication' | 'answer' | 'outline';
}

function EditorPanel({ submissionId, sectionType }: EditorPanelProps) {
  return (
    <div className="flex h-[calc(100vh-300px)] flex-col">
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel defaultSize={66}>
          <div className="flex h-full flex-col">
            <div className="flex-1 p-4">
              <TabContent
                submissionId={submissionId}
                sectionType={sectionType}
              />
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

export default function CanvasPage({
  title,
  description,
  submissionId,
}: CanvasPageProps) {
  const [activeTab, setActiveTab] = useState('situation');

  if (!submissionId) {
    return <div>No submission ID provided</div>;
  }

  return (
    <>
      <HomeLayoutPageHeader title={title} description={description} />

      <PageBody>
        <div className="flex flex-col">
          <TopBar />
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="flex-1"
          >
            <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0">
              <TabsTrigger
                value="situation"
                className="data-[state=active]:border-primary rounded-none border-b-2 border-transparent px-4 py-2 data-[state=active]:bg-transparent"
              >
                Situation
              </TabsTrigger>
              <TabsTrigger
                value="complication"
                className="data-[state=active]:border-primary rounded-none border-b-2 border-transparent px-4 py-2 data-[state=active]:bg-transparent"
              >
                Complication
              </TabsTrigger>
              <TabsTrigger
                value="answer"
                className="data-[state=active]:border-primary rounded-none border-b-2 border-transparent px-4 py-2 data-[state=active]:bg-transparent"
              >
                Answer
              </TabsTrigger>
              <TabsTrigger
                value="outline"
                className="data-[state=active]:border-primary rounded-none border-b-2 border-transparent px-4 py-2 data-[state=active]:bg-transparent"
              >
                Outline
              </TabsTrigger>
            </TabsList>
            <TabsContent value="situation" className="mt-0">
              <EditorPanel
                submissionId={submissionId}
                sectionType="situation"
              />
            </TabsContent>
            <TabsContent value="complication" className="mt-0">
              <EditorPanel
                submissionId={submissionId}
                sectionType="complication"
              />
            </TabsContent>
            <TabsContent value="answer" className="mt-0">
              <EditorPanel submissionId={submissionId} sectionType="answer" />
            </TabsContent>
            <TabsContent value="outline" className="mt-0">
              <EditorPanel submissionId={submissionId} sectionType="outline" />
            </TabsContent>
          </Tabs>
        </div>
      </PageBody>
    </>
  );
}
