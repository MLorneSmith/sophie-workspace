'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { $createListNode, $isListNode } from '@lexical/list';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $createHeadingNode, $isHeadingNode } from '@lexical/rich-text';
import { $wrapNodes } from '@lexical/selection';
import { $getSelection, $isRangeSelection, UNDO_COMMAND } from 'lexical';
import {
  Bold,
  Heading1,
  Italic,
  List,
  ListOrdered,
  Underline,
  Undo,
} from 'lucide-react';

import { Button } from '@kit/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@kit/ui/tooltip';

export function EditorToolbar() {
  const [editor] = useLexicalComposerContext();
  const [isH2, setIsH2] = useState(false);
  const [isBulletList, setIsBulletList] = useState(false);
  const [isNumberedList, setIsNumberedList] = useState(false);
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  // Add a ref to track component mount status
  const isMountedRef = useRef(true);

  useEffect(() => {
    // Set mounted flag to true when component mounts
    isMountedRef.current = true;

    // Store a reference to the editor for cleanup
    const editorRef = editor;

    const removeUpdateListener = editor.registerUpdateListener(
      ({ editorState }) => {
        // Skip processing if component is unmounting
        if (!isMountedRef.current) return;

        try {
          editorState.read(() => {
            try {
              const selection = $getSelection();
              if (!$isRangeSelection(selection)) return;

              // Check for heading
              const anchorNode = selection.anchor.getNode();
              const focusNode = selection.focus.getNode();
              const parentHeading =
                anchorNode.getParent() || focusNode.getParent();

              if (isMountedRef.current) {
                setIsH2(
                  $isHeadingNode(parentHeading) &&
                    parentHeading.getTag() === 'h2',
                );

                // Check for lists
                const parentList = anchorNode.getParent();
                const isList = $isListNode(parentList);
                setIsBulletList(
                  isList && parentList.getListType() === 'bullet',
                );
                setIsNumberedList(
                  isList && parentList.getListType() === 'number',
                );

                // Check for text formatting
                if ($isRangeSelection(selection)) {
                  setIsBold(selection.hasFormat('bold'));
                  setIsItalic(selection.hasFormat('italic'));
                  setIsUnderline(selection.hasFormat('underline'));
                }
              }
            } catch (error) {
              console.warn('Error reading editor state in toolbar:', error);
            }
          });
        } catch (error) {
          console.warn('Error in editor update listener:', error);
        }
      },
    );

    return () => {
      // Set mounted flag to false on unmount
      isMountedRef.current = false;

      // Wrap cleanup in try/catch to handle errors safely
      try {
        // Only attempt to clean up if the editor is still valid and available
        if (
          editorRef &&
          typeof editorRef.isEditable === 'function' &&
          editorRef.isEditable()
        ) {
          removeUpdateListener();
        }
      } catch (e) {
        console.warn('Error during EditorToolbar cleanup:', e);
      }
    };
  }, [editor]);

  const formatBold = useCallback(() => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        selection.formatText('bold');
      }
    });
  }, [editor]);

  const formatItalic = useCallback(() => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        selection.formatText('italic');
      }
    });
  }, [editor]);

  const formatUnderline = useCallback(() => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        selection.formatText('underline');
      }
    });
  }, [editor]);

  const formatHeading = useCallback(() => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        $wrapNodes(selection, () => $createHeadingNode('h2'));
      }
    });
  }, [editor]);

  const formatBulletList = useCallback(() => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        $wrapNodes(selection, () => $createListNode('bullet'));
      }
    });
  }, [editor]);

  const formatNumberedList = useCallback(() => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        $wrapNodes(selection, () => $createListNode('number'));
      }
    });
  }, [editor]);

  const undo = useCallback(() => {
    editor.dispatchCommand(UNDO_COMMAND, undefined);
  }, [editor]);

  return (
    <div className="flex gap-4">
      {/* Group 1: Heading */}
      <div className="flex gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={isH2 ? 'secondary' : 'ghost'}
              size="sm"
              onClick={formatHeading}
            >
              <Heading1 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Heading</TooltipContent>
        </Tooltip>
      </div>

      {/* Separator */}
      <div className="bg-border w-px" />

      {/* Group 2: Lists */}
      <div className="flex gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={isBulletList ? 'secondary' : 'ghost'}
              size="sm"
              onClick={formatBulletList}
            >
              <List className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Bullet List</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={isNumberedList ? 'secondary' : 'ghost'}
              size="sm"
              onClick={formatNumberedList}
            >
              <ListOrdered className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Numbered List</TooltipContent>
        </Tooltip>
      </div>

      {/* Separator */}
      <div className="bg-border w-px" />

      {/* Group 3: Text Formatting */}
      <div className="flex gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={isBold ? 'secondary' : 'ghost'}
              size="sm"
              onClick={formatBold}
            >
              <Bold className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Bold</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={isItalic ? 'secondary' : 'ghost'}
              size="sm"
              onClick={formatItalic}
            >
              <Italic className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Italic</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={isUnderline ? 'secondary' : 'ghost'}
              size="sm"
              onClick={formatUnderline}
            >
              <Underline className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Underline</TooltipContent>
        </Tooltip>
      </div>

      {/* Separator */}
      <div className="bg-border w-px" />

      {/* Group 4: Undo */}
      <div className="flex gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="sm" onClick={undo}>
              <Undo className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Undo (Ctrl+Z)</TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}
