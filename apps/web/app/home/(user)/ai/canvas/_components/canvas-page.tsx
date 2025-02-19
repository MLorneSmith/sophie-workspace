'use client';

import { useState } from 'react';

import { useSearchParams } from 'next/navigation';

import { PageBody } from '@kit/ui/page';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@kit/ui/tabs';

import { HomeLayoutPageHeader } from '../../../_components/home-page-header';
import { EditorPanel } from './editor-panel';
import { TopBar } from './top-bar';

interface CanvasPageProps {
  title: string;
  description: string;
}

export function CanvasPage({ title, description }: CanvasPageProps) {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');

  if (!id) {
    return <div>No submission ID provided</div>;
  }
  const [activeTab, setActiveTab] = useState('situation');

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
              <EditorPanel sectionType="situation" />
            </TabsContent>
            <TabsContent value="complication" className="mt-0">
              <EditorPanel sectionType="complication" />
            </TabsContent>
            <TabsContent value="answer" className="mt-0">
              <EditorPanel sectionType="answer" />
            </TabsContent>
            <TabsContent value="outline" className="mt-0">
              <EditorPanel sectionType="outline" />
            </TabsContent>
          </Tabs>
        </div>
      </PageBody>
    </>
  );
}
