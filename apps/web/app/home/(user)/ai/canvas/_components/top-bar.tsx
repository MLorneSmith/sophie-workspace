'use client';

import { useSearchParams } from 'next/navigation';

import { Maximize2, Redo2, Save, Undo2 } from 'lucide-react';

import { Button } from '@kit/ui/button';
import { Input } from '@kit/ui/input';
import { Tooltip, TooltipContent, TooltipTrigger } from '@kit/ui/tooltip';

import { useCanvasTitle } from '../_lib/hooks/use-canvas-title';

export function TopBar() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const { data, isLoading } = useCanvasTitle(id);

  return (
    <div className="flex items-center justify-between border-b p-4">
      <Input
        placeholder={isLoading ? 'Loading...' : 'Untitled Document'}
        value={data?.data?.title ?? ''}
        className="max-w-[200px] text-lg font-semibold"
        readOnly
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
