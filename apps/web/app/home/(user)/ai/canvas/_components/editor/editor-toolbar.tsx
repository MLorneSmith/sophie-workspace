'use client';

import {
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
} from '@lexical/list';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $createHeadingNode, HeadingNode } from '@lexical/rich-text';
import { $setBlocksType } from '@lexical/selection';
import {
  $createParagraphNode,
  $getSelection,
  $isRangeSelection,
  FORMAT_ELEMENT_COMMAND,
  FORMAT_TEXT_COMMAND,
} from 'lexical';
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Heading1,
  Italic,
  List,
  ListOrdered,
  Underline,
} from 'lucide-react';

import { Button } from '@kit/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@kit/ui/tooltip';

export function EditorToolbar() {
  const [editor] = useLexicalComposerContext();

  const formatText = (format: 'bold' | 'italic' | 'underline') => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, format);
  };

  const formatAlignment = (alignment: 'left' | 'center' | 'right') => {
    editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, alignment);
  };

  const insertUnorderedList = () => {
    editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
  };

  const insertOrderedList = () => {
    editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
  };

  const toggleHeading = () => {
    editor.update(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) return;

      const isHeading = selection.getNodes().some((node) => {
        const parent = node.getParent();
        return parent instanceof HeadingNode;
      });

      if (isHeading) {
        $setBlocksType(selection, () => $createParagraphNode());
      } else {
        $setBlocksType(selection, () => $createHeadingNode('h2'));
      }
    });
  };

  return (
    <div className="flex items-center gap-1 border-b p-2">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => formatText('bold')}
          >
            <Bold className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Bold</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => formatText('italic')}
          >
            <Italic className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Italic</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => formatText('underline')}
          >
            <Underline className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Underline</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" onClick={toggleHeading}>
            <Heading1 className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Toggle Heading</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" onClick={insertUnorderedList}>
            <List className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Bullet List</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" onClick={insertOrderedList}>
            <ListOrdered className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Numbered List</TooltipContent>
      </Tooltip>

      <div className="bg-border mx-2 h-4 w-px" />

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => formatAlignment('left')}
          >
            <AlignLeft className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Align Left</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => formatAlignment('center')}
          >
            <AlignCenter className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Align Center</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => formatAlignment('right')}
          >
            <AlignRight className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Align Right</TooltipContent>
      </Tooltip>
    </div>
  );
}
