'use client';

import { forwardRef, useEffect, useRef } from 'react';

import { useSearchParams } from 'next/navigation';

import { useQuery } from '@tanstack/react-query';

import { useSupabase } from '@kit/supabase/hooks/use-supabase';
import { Spinner } from '@kit/ui/spinner';

import { Database } from '~/lib/database.types';

import {
  TiptapEditor as TiptapEditorComponent,
  type TiptapEditorRef,
} from './tiptap-editor';

interface TabContentProps {
  sectionType: 'situation' | 'complication' | 'answer' | 'outline';
}

const EMPTY_EDITOR_STATE = {
  type: 'doc',
  content: [
    {
      type: 'paragraph',
      content: [],
    },
  ],
};

export const TiptapTabContent = forwardRef<TiptapEditorRef, TabContentProps>(
  function TiptapTabContent({ sectionType }, ref) {
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

    const { data: content, isLoading } = useQuery({
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
          'type' in rawContent &&
          rawContent.type === 'doc'
        ) {
          return rawContent;
        }

        // Try to parse string content as JSON
        try {
          const parsed = JSON.parse(rawContent);
          if (
            typeof parsed === 'object' &&
            parsed !== null &&
            'type' in parsed &&
            parsed.type === 'doc'
          ) {
            return parsed;
          }

          // If it's Lexical format, convert it
          if (
            typeof parsed === 'object' &&
            parsed !== null &&
            'root' in parsed
          ) {
            // Import the conversion utility dynamically to avoid circular dependencies
            const { lexicalToTiptap } = await import(
              './utils/format-conversion'
            );
            return lexicalToTiptap(parsed);
          }

          console.debug('Invalid Tiptap state format:', parsed);
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
        <TiptapEditorComponent
          ref={ref}
          content={JSON.stringify(content ?? EMPTY_EDITOR_STATE)}
          submissionId={id}
          sectionType={sectionType}
        />
      </div>
    );
  },
);
