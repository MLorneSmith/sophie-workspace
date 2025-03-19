'use client';

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';

import { EditorToolbar } from './editor-toolbar';

export function ToolbarPlugin() {
  const [_editor] = useLexicalComposerContext();

  return (
    <div className="border-b p-2">
      <EditorToolbar />
    </div>
  );
}
