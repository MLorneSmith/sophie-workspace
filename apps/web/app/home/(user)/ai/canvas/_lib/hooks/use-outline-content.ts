'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';

import { useSupabase } from '@kit/supabase/hooks/use-supabase';

import { generateOutlineAction } from '../../_actions/generate-outline';

interface LexicalTextNode {
  text?: string;
  type: string;
  version: number;
}

interface LexicalParagraphNode {
  children: LexicalTextNode[];
  direction: string | null;
  format: string;
  indent: number;
  type: string;
  version: number;
}

interface LexicalState {
  root: {
    children: LexicalParagraphNode[];
    direction: string;
    format: string;
    indent: number;
    type: string;
    version: number;
  };
}

function hasValidText(node: LexicalParagraphNode): boolean {
  const firstChild = node.children[0];
  return (
    firstChild !== undefined &&
    typeof firstChild.text === 'string' &&
    firstChild.text.trim().length > 0
  );
}

export function useOutlineContent(submissionId: string) {
  type QueryResult = string | LexicalState;
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
          const parsed = JSON.parse(data.outline) as LexicalState;
          // Check if there's actual text content in the Lexical state
          const hasContent = parsed.root.children.some(hasValidText);
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
