'use client';

import { forwardRef } from 'react';

import { useSearchParams } from 'next/navigation';

import { Spinner } from '@kit/ui/spinner';

import { useOutlineContent } from '../../_lib/hooks/use-outline-content';
import {
  LexicalEditor as LexicalEditorComponent,
  type LexicalEditorRef,
} from './lexical-editor';

const EMPTY_EDITOR_STATE = {
  root: {
    children: [
      {
        children: [],
        direction: null,
        format: '',
        indent: 0,
        type: 'paragraph',
        version: 1,
      },
    ],
    direction: null,
    format: '',
    indent: 0,
    type: 'root',
    version: 1,
  },
};

export const OutlineTabContent = forwardRef<LexicalEditorRef>(
  function OutlineTabContent(_, ref) {
    const searchParams = useSearchParams();
    const id = searchParams.get('id');

    const { data: content, isLoading } = useOutlineContent(id || '');

    if (!id) {
      return <div>No submission ID provided</div>;
    }

    if (isLoading) {
      return (
        <div className="flex h-[200px] items-center justify-center">
          <Spinner className="h-6 w-6" />
        </div>
      );
    }

    // Handle content that might be string or LexicalState
    const editorState =
      typeof content === 'string'
        ? content
          ? JSON.parse(content)
          : EMPTY_EDITOR_STATE
        : content;

    return (
      <div className="h-full">
        <LexicalEditorComponent
          ref={ref}
          content={JSON.stringify(editorState)}
          submissionId={id}
          sectionType="outline"
        />
      </div>
    );
  },
);
