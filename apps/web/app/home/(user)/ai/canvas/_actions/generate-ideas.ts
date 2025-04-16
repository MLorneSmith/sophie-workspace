'use server';

import { z } from 'zod';

import {
  type ChatCompletionOptions,
  type ChatMessage,
  getChatCompletion,
} from '@kit/ai-gateway';
import { ConfigManager } from '@kit/ai-gateway/src/configs/config-manager';
import { createOpenAIOnlyConfig } from '@kit/ai-gateway/src/configs/templates/openai-only';
import { ideasCreatorSystem } from '@kit/ai-gateway/src/prompts/messages/system/ideas-creator';
import { baseInstructions } from '@kit/ai-gateway/src/prompts/partials/base-instructions';
import { improvementFormat } from '@kit/ai-gateway/src/prompts/partials/improvement-format';
import { presentationContext } from '@kit/ai-gateway/src/prompts/partials/presentation-context';
import {
  type BaseImprovement as _BaseImprovement,
  type ImprovementType as _ImprovementType,
} from '@kit/ai-gateway/src/prompts/types/improvements';
import { parseImprovements } from '@kit/ai-gateway/src/utils/parse-improvements';
import { enhanceAction } from '@kit/next/actions';
import { getSupabaseServerClient } from '@kit/supabase/server-client';

// Define Zod schema for request validation
const IdeasSchema = z.object({
  content: z.string().min(1, 'Content is required'),
  submissionId: z.string().min(1, 'Submission ID is required'),
  type: z.enum(['situation', 'complication', 'answer', 'outline']),
});

// Create a wrapper function that handles empty content
export const generateIdeasAction = enhanceAction(
  async function (data: z.infer<typeof IdeasSchema>, user) {
    try {
      // Start performance tracking
      const startTime = performance.now();

      // Get the submission data from the database
      const supabase = getSupabaseServerClient();
      const { data: submission, error } = await supabase
        .from('building_blocks_submissions')
        .select(
          'title, audience, situation, complication, question_type, answer',
        )
        .eq('id', data.submissionId)
        .single();

      if (error || !submission) {
        throw new Error('Failed to fetch submission data');
      }

      // If content is empty, use a placeholder
      const contentToUse =
        data.content.trim() ||
        'No content provided yet. Please suggest some initial ideas.';

      // Debug log the request
      console.log('Ideas Request:', {
        contentLength: contentToUse.length,
        userId: user.id,
        submissionId: data.submissionId,
        type: data.type,
      });

      // Create and normalize config using OpenAI-only config to avoid authentication issues
      const config = createOpenAIOnlyConfig({
        userId: user.id,
        context: `${data.type}-ideas`,
      });
      const normalizedConfig = ConfigManager.normalizeConfig(config);

      if (!normalizedConfig) {
        throw new Error('Failed to normalize config');
      }

      // Generate messages using partials
      const messages: ChatMessage[] = [
        {
          role: 'system',
          content: `${baseInstructions}\n\n${ideasCreatorSystem}`,
        },
        {
          role: 'user',
          content: `${presentationContext
            .replace('{{title}}', submission.title)
            .replace('{{audience}}', submission.audience || 'General audience')
            .replace('{{situation}}', submission.situation || '')
            .replace('{{complication}}', submission.complication || '')
            .replace('{{questionType}}', submission.question_type || '')
            .replace('{{answer}}', submission.answer || '')
            .replace('{{content}}', contentToUse)
            .replace(/{{sectionType}}/g, data.type)}

Current content to enhance with new ideas:
${contentToUse}

${improvementFormat}`,
        },
      ];

      // Get completion from AI Gateway
      const response = await getChatCompletion(messages, {
        config: normalizedConfig,
        userId: user.id,
        feature: `canvas-${data.type}-ideas`,
      } as ChatCompletionOptions);

      // Calculate duration for monitoring
      const duration = performance.now() - startTime;

      // Log metrics
      console.log('AI Request Metrics:', {
        duration,
        userId: user.id,
        status: 'success',
      });

      // Parse the response using our utility - extract content from CompletionResult
      const improvements = parseImprovements(response.content, data.type);

      // Debug log the parsed improvements
      console.log('Parsed Ideas:', improvements);

      return {
        success: true,
        data: { improvements },
      };
    } catch (error) {
      console.error('Error in ideas action:', error);

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },
  {
    schema: IdeasSchema,
    auth: true,
  },
);
