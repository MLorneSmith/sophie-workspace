'use server';

import { z } from 'zod';
import { enhanceAction } from '@kit/next/actions';
import { createPortkeyClient } from '../../../../../api/ai/config/portkey';

// Initialize Portkey client
const portkey = createPortkeyClient();

// Define Zod schema for request validation
const SuggestionsSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  field: z.enum(['audience', 'situation', 'complication', 'answer'], {
    description: 'Must be one of: audience, situation, complication, answer'
  })
});

// Helper function to generate prompts based on field type
function generatePrompt(field: string, title: string): string {
  switch (field) {
    case 'audience':
      return `Based on "${title}" provide 4 possible audiences for a presentation. Limit each suggestion to 4 words maximum. Return in JSON format: { "suggestions": ["audience 1", "audience 2", "audience 3", "audience 4"] }`;
    case 'situation':
      return `Based on "${title}" provide 3 suggestions to improve the situation description. Return in JSON format: { "suggestions": ["improvement 1", "improvement 2", "improvement 3"] }`;
    case 'complication':
      return `Based on "${title}" provide 3 suggestions to make the complication more compelling. Return in JSON format: { "suggestions": ["suggestion 1", "suggestion 2", "suggestion 3"] }`;
    case 'answer':
      return `Based on "${title}" provide 3 suggestions to make the answer more impactful. Return in JSON format: { "suggestions": ["suggestion 1", "suggestion 2", "suggestion 3"] }`;
    default:
      throw new Error('Invalid field type');
  }
}

export const getSuggestions = enhanceAction(
  async (data: z.infer<typeof SuggestionsSchema>, user) => {
    try {
      // Start performance tracking
      const startTime = performance.now();

      // Debug log the request
      console.log('Suggestions Request:', {
        title: data.title,
        field: data.field,
        userId: user.id
      });

      // Make API call through Portkey
      const response = await portkey.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'You are an AI assistant helping improve presentation content. Always respond in the requested JSON format.'
          },
          {
            role: 'user',
            content: generatePrompt(data.field, data.title)
          }
        ],
        model: 'gpt-4-turbo-preview',
        temperature: 0.7,
        max_tokens: 150,
        response_format: { type: "json_object" }
      });

      // Debug log the raw response
      console.log('Portkey Raw Response:', response);

      // Calculate duration for monitoring
      const duration = performance.now() - startTime;

      // Log metrics
      console.log('AI Request Metrics:', {
        field: data.field,
        duration,
        tokens: response.usage?.total_tokens ?? 0,
        userId: user.id,
        status: 'success'
      });

      // Parse and validate response
      const content = response.choices?.[0]?.message?.content;
      
      // Debug log the content
      console.log('Response Content:', content);
      
      if (!content) {
        console.error('No content in response. Full response:', response);
        throw new Error('No content in response');
      }

      let suggestions;
      try {
        suggestions = JSON.parse(content);
        // Debug log the parsed suggestions
        console.log('Parsed Suggestions:', suggestions);
      } catch (error) {
        console.error('JSON Parse Error:', error);
        console.error('Content that failed to parse:', content);
        throw new Error('Invalid JSON response from AI');
      }

      // Validate response format
      if (!suggestions.suggestions || !Array.isArray(suggestions.suggestions)) {
        console.error('Invalid suggestions format:', suggestions);
        throw new Error('Invalid response format from AI');
      }

      // Prepare the response
      const actionResponse = {
        success: true,
        data: suggestions.suggestions
      };

      // Debug log the final response
      console.log('Final Action Response:', actionResponse);

      return actionResponse;

    } catch (error) {
      console.error('Error in suggestions action:', error);

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  },
  {
    schema: SuggestionsSchema
  }
);
