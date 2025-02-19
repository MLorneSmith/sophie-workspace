'use client';

import { useQuery } from '@tanstack/react-query';

import { getSupabaseServerClient } from '@kit/supabase/server-client';
import { Spinner } from '@kit/ui/spinner';

import { Database } from '~/lib/database.types';

import LexicalEditor from '../editor/LexicalEditor';

interface TabContentProps {
  submissionId: string;
  sectionType: 'situation' | 'complication' | 'answer' | 'outline';
}

export default function TabContent({
  submissionId,
  sectionType,
}: TabContentProps) {
  const { data: content = '', isLoading } = useQuery<string>({
    queryKey: ['submission', submissionId, sectionType],
    queryFn: async () => {
      const supabase = getSupabaseServerClient<Database>();
      const { data, error } = await supabase
        .from('building_blocks_submissions')
        .select('*')
        .eq('id', submissionId)
        .single();

      if (error) throw error;

      // The content is already in Lexical JSON format from the initial submission
      if (!data) {
        return '';
      }

      // Type assertion to access dynamic property
      return (data as Record<string, string>)[sectionType] || '';
    },
  });

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
      submissionId={submissionId}
      sectionType={sectionType}
    />
  );
}
