'use client';

import { useCallback, useState } from 'react';

import { useSearchParams } from 'next/navigation';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Check, Maximize2, Minimize2, Redo2, Save, Undo2 } from 'lucide-react';

import { Button, buttonVariants } from '@kit/ui/button';
import { Input } from '@kit/ui/input';
import { Tooltip, TooltipContent, TooltipTrigger } from '@kit/ui/tooltip';
import { cn } from '@kit/ui/utils';

import { updateBuildingBlockTitleAction } from '../_actions/update-building-block-title.action';
import { useSaveContext } from '../_lib/contexts/save-context';
import { useCanvasTitle } from '../_lib/hooks/use-canvas-title';

export function TopBar() {
  const { manualSave, saveStatus } = useSaveContext();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const { data, isLoading } = useCanvasTitle(id);
  const queryClient = useQueryClient();

  const { mutate } = useMutation({
    mutationFn: (title: string) =>
      updateBuildingBlockTitleAction({ id: id!, title }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['canvas-title', id] });
    },
  });

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!id) return;
    mutate(e.target.value);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  return (
    <div className="flex items-center justify-between border-b p-4">
      <div className="flex items-center gap-4">
        <Input
          placeholder={isLoading ? 'Loading...' : 'Untitled Document'}
          value={data?.data?.title ?? ''}
          className="w-[400px] text-lg font-semibold"
          onChange={handleTitleChange}
          disabled={isLoading}
        />
      </div>
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
            <Button
              variant="ghost"
              size="icon"
              onClick={manualSave}
              disabled={saveStatus === 'saving'}
              className="relative"
            >
              {saveStatus === 'saved' ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {saveStatus === 'saving' && (
                <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-blue-500" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {saveStatus === 'saving'
              ? 'Saving...'
              : saveStatus === 'saved'
                ? 'Saved'
                : 'Save'}
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" onClick={toggleFullscreen}>
              {isFullscreen ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>Fullscreen</TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}
