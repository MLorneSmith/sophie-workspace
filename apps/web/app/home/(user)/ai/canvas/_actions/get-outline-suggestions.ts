'use server';

import { z } from 'zod';

import {
  type ChatCompletionOptions,
  type ChatMessage,
  getChatCompletion,
} from '@kit/ai-gateway';
import { createQualityOptimizedConfig } from '@kit/ai-gateway/src/configs/templates';
import { baseInstructions } from '@kit/ai-gateway/src/prompts/partials/base-instructions';
import { improvementFormat } from '@kit/ai-gateway/src/prompts/partials/improvement-format';
import { outlineRewriteInstructions } from '@kit/ai-gateway/src/prompts/partials/outline-rewrite';
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

function parseLexicalState(content: string | null): LexicalState {
  if (!content)
    return {
      root: {
        children: [],
        direction: 'ltr',
        format: '',
        indent: 0,
        type: 'root',
        version: 1,
      },
    };
  try {
    return JSON.parse(content) as LexicalState;
  } catch {
    return {
      root: {
        children: [],
        direction: 'ltr',
        format: '',
        indent: 0,
        type: 'root',
        version: 1,
      },
    };
  }
}

function getTextContent(state: LexicalState): string {
  return state.root.children
    .map((node) => node.children[0]?.text || '')
    .filter((text) => text.trim().length > 0)
    .join('\n');
}

const OutlineSuggestionsSchema = z.object({
  submissionId: z.string().min(1, 'Submission ID is required'),
});

export const getOutlineSuggestionsAction = enhanceAction(
  async function (data, user) {
    try {
      const supabase = getSupabaseServerClient();

      // Use existing query to get all content
      const { data: submission, error } = await supabase
        .from('building_blocks_submissions')
        .select('situation, complication, answer')
        .eq('id', data.submissionId)
        .single();

      if (error || !submission) {
        throw new Error('Failed to fetch submission data');
      }

      // Create a quality-optimized config for structured output
      const config = createQualityOptimizedConfig({
        userId: user.id,
        context: 'outline-suggestions',
      });

      // Parse Lexical states and extract text content
      const situationContent = getTextContent(
        parseLexicalState(submission.situation),
      );
      const complicationContent = getTextContent(
        parseLexicalState(submission.complication),
      );
      const answerContent = getTextContent(
        parseLexicalState(submission.answer),
      );

      // Combine all SCQA content for context
      const messages: ChatMessage[] = [
        {
          role: 'system',
          content: `${baseInstructions}\n\n${outlineRewriteInstructions}`,
        },
        {
          role: 'user',
          content: `Current Content:
Situation:
${situationContent}

Complication:
${complicationContent}

Answer:
${answerContent}

${improvementFormat}`,
        },
      ];

      const response = await getChatCompletion(messages, {
        config,
      } as ChatCompletionOptions);

      // Parse the JSON response
      const suggestions = JSON.parse(response);

      return {
        success: true,
        data: suggestions,
      };
    } catch (error) {
      console.error('Error in outline suggestions action:', error);

      return {
        success: false,
        error: error instanceof Error ? error.message : 'An error occurred',
      };
    }
  },
  {
    auth: true,
    schema: OutlineSuggestionsSchema,
  },
);
