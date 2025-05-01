'use client';

import { useEffect, useState } from 'react';

import { ChevronLeft } from 'lucide-react';

import { Button } from '@kit/ui/button';
import { Card } from '@kit/ui/card';
import { Skeleton } from '@kit/ui/skeleton';
import { toast } from '@kit/ui/sonner';

import { usePresentationStoryboard } from '../_lib/hooks/use-presentation-storyboard';
import { SortableSlideList } from './sortable-slide-list';

interface StoryboardPanelProps {
  presentationId: string;
  onBack: () => void;
}

export function StoryboardPanel({
  presentationId,
  onBack,
}: StoryboardPanelProps) {
  const { data, isLoading, isError, saveStoryboard } =
    usePresentationStoryboard(presentationId);
  const [storyboardData, setStoryboardData] = useState<any>(null);

  useEffect(() => {
    if (data && !isLoading) {
      setStoryboardData(data);
    }
  }, [data, isLoading]);

  const handleSave = async () => {
    try {
      await saveStoryboard(storyboardData);
      toast.success('Storyboard saved successfully');
    } catch (error) {
      console.error('Error saving storyboard:', error);
      toast.error('Failed to save storyboard');
    }
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <Skeleton className="h-8 w-52" />
          <Skeleton className="h-10 w-24" />
        </div>
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card className="p-6">
        <div className="flex flex-col items-center justify-center space-y-4 py-12 text-center">
          <div className="text-xl font-medium">
            Failed to load storyboard data
          </div>
          <p className="text-muted-foreground">
            There was an error loading the storyboard for this presentation.
          </p>
          <Button onClick={onBack} variant="secondary">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
        </div>
      </Card>
    );
  }

  if (!storyboardData) {
    return (
      <Card className="p-6">
        <div className="flex flex-col items-center justify-center space-y-4 py-12 text-center">
          <div className="text-xl font-medium">No storyboard found</div>
          <p className="text-muted-foreground">
            This presentation doesn't have a storyboard yet.
          </p>
          <Button onClick={onBack} variant="secondary">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="flex flex-col space-y-4">
      <div className="flex items-center justify-between">
        <Button onClick={onBack} variant="ghost" className="gap-2">
          <ChevronLeft className="h-4 w-4" />
          Back to presentation selection
        </Button>
        <Button onClick={handleSave}>Save Storyboard</Button>
      </div>

      <SortableSlideList
        slides={storyboardData.slides || []}
        onSlidesChange={(slides) =>
          setStoryboardData({ ...storyboardData, slides })
        }
      />
    </div>
  );
}
