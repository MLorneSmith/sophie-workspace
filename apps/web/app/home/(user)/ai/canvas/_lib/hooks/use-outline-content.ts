'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';

import { useSupabase } from '@kit/supabase/hooks/use-supabase';

import { generateOutlineAction } from '../../_actions/generate-outline';

interface TiptapNode {
  type: string;
  content?: TiptapNode[];
  attrs?: Record<string, any>;
  marks?: { type: string }[];
  text?: string;
}

interface TiptapDocument {
  type: string;
  content: TiptapNode[];
}

function hasValidText(doc: TiptapDocument): boolean {
  if (!doc.content || doc.content.length === 0) return false;

  // Check if any paragraph or heading has text content
  return doc.content.some((node) => {
    if (node.type === 'paragraph' || node.type === 'heading') {
      if (!node.content) return false;

      return node.content.some((child: TiptapNode) => {
        return (
          child.type === 'text' &&
          typeof child.text === 'string' &&
          child.text.trim().length > 0
        );
      });
    }
    return false;
  });
}

export function useOutlineContent(submissionId: string) {
  type QueryResult = string | TiptapDocument;
  const supabase = useSupabase();
  const queryClient = useQueryClient();

  const query = useQuery<QueryResult>({
    queryKey: ['submission', submissionId, 'content', 'outline'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('building_blocks_submissions')
        .select('outline, situation, complication, answer')
        .eq('id', submissionId)
        .single();

      if (error) throw error;
      if (!data) return '';

      // If outline exists and has actual content, return it
      if (data.outline) {
        try {
          const parsed = JSON.parse(data.outline) as TiptapDocument;
          // Check if there's actual text content in the Tiptap document
          const hasContent = hasValidText(parsed);
          if (hasContent) return data.outline;
        } catch {
          // If parsing fails, treat as empty
        }
      }

      // If no outline, generate it
      const result = await generateOutlineAction({ submissionId });
      if (!result.success) {
        throw new Error(result.error || 'Failed to generate outline');
      }

      return result.data ? JSON.stringify(result.data) : '';
    },
  });

  const regenerateOutline = async () => {
    const result = await generateOutlineAction({ submissionId });
    if (result.success && result.data) {
      // Update the cache with new outline
      queryClient.setQueryData(
        ['submission', submissionId, 'content', 'outline'],
        result.data,
      );
      return JSON.stringify(result.data);
    }
    throw new Error(result.error || 'Failed to regenerate outline');
  };

  return {
    ...query,
    regenerateOutline,
  };
}
