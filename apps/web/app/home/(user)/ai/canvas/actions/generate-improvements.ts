'use server';

import { z } from 'zod';

import {
  type ChatCompletionOptions,
  type ChatMessage,
  getChatCompletion,
} from '@kit/ai-gateway';
import { ConfigManager } from '@kit/ai-gateway/src/configs/config-manager';
import { createBalancedOptimizedConfig } from '@kit/ai-gateway/src/configs/templates/balanced-optimized';
import { baseInstructions } from '@kit/ai-gateway/src/prompts/partials/base-instructions';
import { improvementFormat } from '@kit/ai-gateway/src/prompts/partials/improvement-format';
import { improvementProcess } from '@kit/ai-gateway/src/prompts/partials/improvement-process';
import { presentationContext } from '@kit/ai-gateway/src/prompts/partials/presentation-context';
import { sectionAnalysis } from '@kit/ai-gateway/src/prompts/partials/section-analysis';
import {
  type BaseImprovement as _BaseImprovement,
  type ImprovementType as _ImprovementType,
} from '@kit/ai-gateway/src/prompts/types/improvements';
import { parseImprovements } from '@kit/ai-gateway/src/utils/parse-improvements';
import { enhanceAction } from '@kit/next/actions';
import { getSupabaseServerClient } from '@kit/supabase/server-client';

// Define Zod schema for request validation
const ImprovementsSchema = z.object({
  content: z.string().min(1, 'Content is required'),
  submissionId: z.string().min(1, 'Submission ID is required'),
  type: z.enum(['situation', 'complication', 'answer', 'outline']),
});

export const generateImprovementsAction = enhanceAction(
  async function (data: z.infer<typeof ImprovementsSchema>, user) {
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

      // Debug log the request
      console.log('Improvements Request:', {
        contentLength: data.content.length,
        userId: user.id,
        submissionId: data.submissionId,
        type: data.type,
      });

      // Create and normalize config
      const config = createBalancedOptimizedConfig({
        userId: user.id,
        context: `${data.type}-improvements`,
      });
      const normalizedConfig = ConfigManager.normalizeConfig(config);

      if (!normalizedConfig) {
        throw new Error('Failed to normalize config');
      }

      // Generate messages using partials
      const messages: ChatMessage[] = [
        {
          role: 'system',
          content: baseInstructions,
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
            .replace('{{content}}', data.content)
            .replace(/{{sectionType}}/g, data.type)}

${sectionAnalysis.replace(/{{sectionType}}/g, data.type)}

${improvementProcess}

${improvementFormat}`,
        },
      ];

      // Get completion from AI Gateway
      const response = await getChatCompletion(messages, {
        config: normalizedConfig,
      } as ChatCompletionOptions);

      // Calculate duration for monitoring
      const duration = performance.now() - startTime;

      // Log metrics
      console.log('AI Request Metrics:', {
        duration,
        userId: user.id,
        status: 'success',
      });

      // Parse the response using our utility
      const improvements = parseImprovements(response.content, data.type);

      // Debug log the parsed improvements
      console.log('Parsed Improvements:', improvements);

      return {
        success: true,
        data: { improvements },
      };
    } catch (error) {
      console.error('Error in improvements action:', error);

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },
  {
    schema: ImprovementsSchema,
    auth: true,
  },
);
