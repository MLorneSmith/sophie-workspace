'use client';

import { useState } from 'react';

import { useSearchParams } from 'next/navigation';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Maximize2, Minimize2, Redo2, Save, Undo2 } from 'lucide-react';

import { Button } from '@kit/ui/button';
import { Input } from '@kit/ui/input';
import { Tooltip, TooltipContent, TooltipTrigger } from '@kit/ui/tooltip';

import { updateBuildingBlockTitleAction } from '../_actions/update-building-block-title.action';
import { useCanvasTitle } from '../_lib/hooks/use-canvas-title';

export function TopBar() {
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
      <Input
        placeholder={isLoading ? 'Loading...' : 'Untitled Document'}
        value={data?.data?.title ?? ''}
        className="w-[400px] text-lg font-semibold"
        onChange={handleTitleChange}
        disabled={isLoading}
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
