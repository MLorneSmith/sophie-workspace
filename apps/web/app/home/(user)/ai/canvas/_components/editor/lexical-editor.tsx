'use client';

import { useCallback } from 'react';

import { ListItemNode, ListNode } from '@lexical/list';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import LexicalErrorBoundary from '@lexical/react/LexicalErrorBoundary';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { useMutation } from '@tanstack/react-query';
import { EditorState } from 'lexical';
import debounce from 'lodash/debounce';

import { useSupabase } from '@kit/supabase/hooks/use-supabase';

import { EditorToolbar } from './editor-toolbar';

interface LexicalEditorProps {
  content: string;
  submissionId: string;
  sectionType: 'situation' | 'complication' | 'answer' | 'outline';
}

const theme = {
  // Theme styling
  paragraph: 'mb-2',
  text: {
    bold: 'font-bold',
    italic: 'italic',
    underline: 'underline',
  },
};

export function LexicalEditor({
  content,
  submissionId,
  sectionType,
}: LexicalEditorProps) {
  const supabase = useSupabase();

  // Mutation for saving content
  const { mutate: updateContent } = useMutation({
    mutationFn: async (newContent: string) => {
      const { error } = await supabase
        .from('building_blocks_submissions')
        .update({ [sectionType]: newContent })
        .eq('id', submissionId);

      if (error) throw error;
    },
  });

  // Debounced save handler
  const debouncedSave = useCallback(
    debounce((editorState: EditorState) => {
      editorState.read(() => {
        // Convert editor state to JSON
        const json = JSON.stringify(editorState);
        updateContent(json);
      });
    }, 1000),
    [updateContent],
  );

  // Editor change handler
  const onChange = useCallback(
    (editorState: EditorState) => {
      debouncedSave(editorState);
    },
    [debouncedSave],
  );

  const initialConfig = {
    namespace: `slideheroes-${sectionType}`,
    theme,
    onError: (error: Error) => {
      console.error('Lexical Editor Error:', error);
    },
    editorState: content,
    nodes: [ListNode, ListItemNode],
    onChange,
  };

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <div className="relative min-h-[200px] rounded-lg border">
        <EditorToolbar />
        <div className="p-4">
          <RichTextPlugin
            contentEditable={
              <ContentEditable className="min-h-[200px] outline-none" />
            }
            placeholder={
              <div className="pointer-events-none absolute top-[1.125rem] text-gray-400 select-none">
                Enter your content...
              </div>
            }
            ErrorBoundary={LexicalErrorBoundary}
          />
        </div>
        <HistoryPlugin />
        <ListPlugin />
      </div>
    </LexicalComposer>
  );
}
