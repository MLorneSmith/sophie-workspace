'use server';

import { z } from 'zod';

import { enhanceAction } from '@kit/next/actions';
import { getSupabaseServerClient } from '@kit/supabase/server-client';

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

const EMPTY_LEXICAL_STATE: LexicalState = {
  root: {
    children: [],
    direction: 'ltr',
    format: '',
    indent: 0,
    type: 'root',
    version: 1,
  },
};

const SPACER_PARAGRAPH: LexicalParagraphNode = {
  children: [{ text: '', type: 'text', version: 1 }],
  direction: 'ltr',
  format: '',
  indent: 0,
  type: 'paragraph',
  version: 1,
};

function parseLexicalState(content: string | null): LexicalState {
  if (!content) return EMPTY_LEXICAL_STATE;
  try {
    return JSON.parse(content) as LexicalState;
  } catch {
    return EMPTY_LEXICAL_STATE;
  }
}

function hasValidText(node: LexicalParagraphNode): boolean {
  const firstChild = node.children[0];
  return (
    firstChild !== undefined &&
    typeof firstChild.text === 'string' &&
    firstChild.text.trim().length > 0
  );
}

const GenerateOutlineSchema = z.object({
  submissionId: z.string().min(1, 'Submission ID is required'),
});

export const generateOutlineAction = enhanceAction(
  async function (data: z.infer<typeof GenerateOutlineSchema>, _user) {
    try {
      const supabase = getSupabaseServerClient();

      // Fetch the submission data
      const { data: submission, error } = await supabase
        .from('building_blocks_submissions')
        .select('situation, complication, answer')
        .eq('id', data.submissionId)
        .single();

      if (error || !submission) {
        throw new Error('Failed to fetch submission data');
      }

      // Parse each section's content
      const situationState = parseLexicalState(submission.situation);
      const complicationState = parseLexicalState(submission.complication);
      const answerState = parseLexicalState(submission.answer);

      // Create a combined Lexical state
      const outlineContent: LexicalState = {
        root: {
          children: [
            // Situation paragraphs
            ...situationState.root.children.filter(hasValidText),
            // Add spacing if there was content
            ...(situationState.root.children.some(hasValidText)
              ? [SPACER_PARAGRAPH]
              : []),

            // Complication paragraphs
            ...complicationState.root.children.filter(hasValidText),
            // Add spacing if there was content
            ...(complicationState.root.children.some(hasValidText)
              ? [SPACER_PARAGRAPH]
              : []),

            // Answer paragraphs
            ...answerState.root.children.filter(hasValidText),
          ],
          direction: 'ltr',
          format: '',
          indent: 0,
          type: 'root',
          version: 1,
        },
      };

      // Update the outline field in the database with stringified Lexical state
      const { error: updateError } = await supabase
        .from('building_blocks_submissions')
        .update({ outline: JSON.stringify(outlineContent) })
        .eq('id', data.submissionId);

      if (updateError) {
        throw new Error('Failed to update outline');
      }

      return {
        success: true,
        data: JSON.stringify(outlineContent),
      };
    } catch (error) {
      console.error('Error in generate outline action:', error);

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },
  {
    schema: GenerateOutlineSchema,
    auth: true,
  },
);
