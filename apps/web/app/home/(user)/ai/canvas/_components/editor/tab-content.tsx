'use client';

import { forwardRef, useEffect, useRef } from 'react';

import { useSearchParams } from 'next/navigation';

import { useQuery } from '@tanstack/react-query';

import { useSupabase } from '@kit/supabase/hooks/use-supabase';
import { Spinner } from '@kit/ui/spinner';

import { Database } from '~/lib/database.types';

import {
  LexicalEditor as LexicalEditorComponent,
  type LexicalEditorRef,
} from './lexical-editor';

interface TabContentProps {
  sectionType: 'situation' | 'complication' | 'answer' | 'outline';
}

interface LexicalState {
  root: {
    children: unknown[];
    direction: string | null;
    format: string;
    indent: number;
    type: string;
    version: number;
  };
}

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

export const TabContent = forwardRef<LexicalEditorRef, TabContentProps>(
  function TabContent({ sectionType }, ref) {
    const searchParams = useSearchParams();
    const id = searchParams.get('id');
    const supabase = useSupabase<Database>();
    // Add a ref to track component mount status
    const isMountedRef = useRef(true);

    useEffect(() => {
      // Set mounted flag to true when component mounts
      isMountedRef.current = true;

      return () => {
        // Set mounted flag to false on unmount
        isMountedRef.current = false;
      };
    }, []);

    const { data: content, isLoading } = useQuery<LexicalState>({
      queryKey: ['submission', id, sectionType],
      queryFn: async () => {
        if (!id) return EMPTY_EDITOR_STATE;

        const { data, error } = await supabase
          .from('building_blocks_submissions')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;
        if (!data) return EMPTY_EDITOR_STATE;

        const rawContent = (data as Record<string, any>)[sectionType];
        console.debug('Loading content:', { sectionType, rawContent });

        if (!rawContent) return EMPTY_EDITOR_STATE;

        // If content is already stored as JSON object, validate and return it
        if (
          typeof rawContent === 'object' &&
          rawContent !== null &&
          'root' in rawContent
        ) {
          return rawContent as LexicalState;
        }

        // Try to parse string content as JSON
        try {
          const parsed = JSON.parse(rawContent);
          if (
            typeof parsed === 'object' &&
            parsed !== null &&
            'root' in parsed
          ) {
            return parsed as LexicalState;
          }
          console.debug('Invalid Lexical state format:', parsed);
          return EMPTY_EDITOR_STATE;
        } catch (e) {
          console.debug('Failed to parse content as JSON:', e);
          return EMPTY_EDITOR_STATE;
        }
      },
      enabled: !!id,
    });

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

    return (
      <div className="h-full">
        <LexicalEditorComponent
          ref={ref}
          content={JSON.stringify(content ?? EMPTY_EDITOR_STATE)}
          submissionId={id}
          sectionType={sectionType}
        />
      </div>
    );
  },
);
