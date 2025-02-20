'use client';

import { useCallback } from 'react';

import { ListItemNode, ListNode } from '@lexical/list';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import LexicalErrorBoundary from '@lexical/react/LexicalErrorBoundary';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { HeadingNode } from '@lexical/rich-text';
import { useMutation } from '@tanstack/react-query';
import { EditorState } from 'lexical';
import debounce from 'lodash/debounce';

import { useSupabase } from '@kit/supabase/hooks/use-supabase';

import { EditorToolbar } from './editor-toolbar';
import './editor.css';

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
  list: {
    ul: 'list-disc ml-4',
    ol: 'list-decimal ml-4',
    listitem: 'mb-1',
  },
  nestedList: {
    list: 'ml-4',
    listitem: 'list-circle',
  },
  heading: {
    h2: 'text-xl font-bold mb-2',
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
    nodes: [ListNode, ListItemNode, HeadingNode],
    onChange,
  };

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <div className="editor-shell relative flex h-full flex-col">
        <EditorToolbar />
        <div className="flex-1 rounded-lg border p-4">
          <RichTextPlugin
            contentEditable={
              <div className="h-full">
                <ContentEditable className="h-full outline-none" />
              </div>
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
