'use client';

import { useSearchParams } from 'next/navigation';

import { useQuery } from '@tanstack/react-query';

import { useSupabase } from '@kit/supabase/hooks/use-supabase';
import { Spinner } from '@kit/ui/spinner';

import { Database } from '~/lib/database.types';

import { LexicalEditor } from './lexical-editor';

interface TabContentProps {
  sectionType: 'situation' | 'complication' | 'answer' | 'outline';
}

export function TabContent({ sectionType }: TabContentProps) {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const supabase = useSupabase<Database>();

  const { data: content = '', isLoading } = useQuery<string>({
    queryKey: ['submission', id, sectionType],
    queryFn: async () => {
      if (!id) return '';

      const { data, error } = await supabase
        .from('building_blocks_submissions')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      // The content is already in Lexical JSON format from the initial submission
      if (!data) {
        return '';
      }

      // Type assertion to access dynamic property
      return (data as Record<string, string>)[sectionType] || '';
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
    <LexicalEditor
      content={content}
      submissionId={id}
      sectionType={sectionType}
    />
  );
}
