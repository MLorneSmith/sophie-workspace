'use client';

import { useState } from 'react';

import { useSearchParams } from 'next/navigation';

import { AlertCircle } from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '@kit/ui/alert';
import { PageBody } from '@kit/ui/page';
import { Toaster } from '@kit/ui/sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@kit/ui/tabs';

import { HomeLayoutPageHeader } from '../../../_components/home-page-header';
import { CostTrackingProvider } from '../_lib/contexts/cost-tracking-context';
import { SaveContextProvider } from '../_lib/contexts/save-context';
import { EditorPanel } from './editor-panel';
import { ErrorBoundary } from './error-boundary';
import { TopBar } from './top-bar';

interface CanvasPageProps {
  title: string;
  description: string;
}

export function CanvasPage({ title, description }: CanvasPageProps) {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const [activeTab, setActiveTab] = useState('situation');

  if (!id) {
    return <div>No submission ID provided</div>;
  }

  return (
    <ErrorBoundary
      fallback={
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Something went wrong. Please try refreshing the page.
          </AlertDescription>
        </Alert>
      }
    >
      <CostTrackingProvider>
        <SaveContextProvider>
          <Toaster />
          <HomeLayoutPageHeader title={title} description={description} />

          <PageBody>
            <div className="flex flex-col">
              <TopBar />
              <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="flex-1 px-4"
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
        </SaveContextProvider>
      </CostTrackingProvider>
    </ErrorBoundary>
  );
}
