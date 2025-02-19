'use client';

import { FileText, LayoutTemplate, Lightbulb, Zap } from 'lucide-react';

import { Button } from '@kit/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@kit/ui/tooltip';

export function ActionToolbar() {
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
