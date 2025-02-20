'use server';

import { z } from 'zod';

import {
  type ChatCompletionOptions,
  type ChatMessage,
  getChatCompletion,
} from '@kit/ai-gateway';
import { ConfigManager } from '@kit/ai-gateway/src/configs/config-manager';
import { createBalancedOptimizedConfig } from '@kit/ai-gateway/src/configs/templates/balanced-optimized';
import { enhanceAction } from '@kit/next/actions';

// Define Zod schema for request validation
const SituationImprovementsSchema = z.object({
  content: z.string().min(1, 'Content is required'),
});

export const generateSituationImprovementsAction = enhanceAction(
  async function (data: z.infer<typeof SituationImprovementsSchema>, user) {
    try {
      // Start performance tracking
      const startTime = performance.now();

      // Debug log the request
      console.log('Situation Improvements Request:', {
        contentLength: data.content.length,
        userId: user.id,
      });

      // Create and normalize config
      const config = createBalancedOptimizedConfig({
        userId: user.id,
        context: 'situation-improvements',
      });
      const normalizedConfig = ConfigManager.normalizeConfig(config);

      if (!normalizedConfig) {
        throw new Error('Failed to normalize config');
      }

      // Generate messages
      const messages: ChatMessage[] = [
        {
          role: 'system',
          content:
            'You are a professional presentation expert who provides concise, relevant suggestions for improving presentation content. You analyze the provided content and suggest specific improvements that make the content clearer, more impactful, and better structured.',
        },
        {
          role: 'user',
          content: `Analyze this situation content and provide 3 specific improvements:\n\n${data.content}\n\nFor each improvement, provide:\n1. A short headline describing the improvement\n2. A brief rationale explaining why this improvement helps\n3. A specific suggestion for the new content\n4. 2-3 supporting points that elaborate on the suggestion`,
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

      // Parse and format the response
      const improvements = response
        .split('\n\n')
        .filter(Boolean)
        .map((improvement, index) => {
          const lines = improvement.split('\n').filter(Boolean);

          // Ensure we have enough lines for a valid improvement
          if (lines.length < 4) {
            console.warn('Invalid improvement format:', improvement);
            return null;
          }

          const [headlineLine, rationaleLine, summaryLine, ...supportingLines] =
            lines;

          if (
            !headlineLine ||
            !rationaleLine ||
            !summaryLine ||
            supportingLines.length === 0
          ) {
            console.warn('Missing required lines in improvement:', improvement);
            return null;
          }

          return {
            id: `imp_${index + 1}`,
            headline: headlineLine.replace(/^\d+\.\s*/, '').trim(),
            rationale: rationaleLine.trim(),
            summaryPoint: summaryLine.trim(),
            supportingPoints: supportingLines.map((line) =>
              line.replace(/^[•-]\s*/, '').trim(),
            ),
          };
        });

      // Filter out any invalid improvements and debug log
      const validImprovements = improvements.filter(
        (imp): imp is NonNullable<typeof imp> => imp !== null,
      );
      console.log('Parsed Improvements:', validImprovements);

      return {
        success: true,
        data: { improvements: validImprovements },
      };
    } catch (error) {
      console.error('Error in situation improvements action:', error);

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },
  {
    schema: SituationImprovementsSchema,
    auth: true,
  },
);
