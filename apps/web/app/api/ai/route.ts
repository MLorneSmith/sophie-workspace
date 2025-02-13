import { NextResponse } from 'next/server';

import { z } from 'zod';

import { enhanceRouteHandler } from '@kit/next/routes';

const AIRequestSchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(['system', 'user', 'assistant']),
      content: z.string(),
    }),
  ),
  model: z.string(),
  provider: z
    .enum([
      'openai',
      'anthropic',
      'google-ai',
      'groq',
      'openrouter',
      'universal',
    ])
    .optional(),
  temperature: z.number().optional(),
  stream: z.boolean().optional(),
});

export const POST = enhanceRouteHandler(
  async function ({ body }) {
    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
    const gatewayId = process.env.CLOUDFLARE_GATEWAY_ID;
    const apiToken = process.env.CLOUDFLARE_API_TOKEN;

    if (!accountId || !gatewayId || !apiToken) {
      throw new Error('Missing required environment variables for AI Gateway');
    }

    const baseURL = `https://gateway.ai.cloudflare.com/v1/${accountId}/${gatewayId}/universal`;

    try {
      const response = await fetch(baseURL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiToken}`,
        },
        body: JSON.stringify({
          messages: body.messages,
          model:
            body.provider && !body.model.includes('/')
              ? `${body.provider}/${body.model}`
              : body.model,
          temperature: body.temperature ?? 0.7,
          stream: body.stream ?? false,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('AI Gateway Error:', error);
        return NextResponse.json(
          { error: 'Failed to get AI response' },
          { status: response.status },
        );
      }

      // Handle streaming response
      if (body.stream) {
        const encoder = new TextEncoder();
        const decoder = new TextDecoder();
        const stream = new ReadableStream({
          async start(controller) {
            const reader = response.body?.getReader();
            if (!reader) {
              controller.close();
              return;
            }

            try {
              while (true) {
                const { done, value } = await reader.read();
                if (done) {
                  controller.close();
                  break;
                }

                const chunk = decoder.decode(value);
                const lines = chunk
                  .split('\n')
                  .map((line) => line.trim())
                  .filter(Boolean);

                for (const line of lines) {
                  if (line === 'data: [DONE]') continue;
                  if (!line.startsWith('data: ')) continue;

                  try {
                    const data = JSON.parse(line.slice(6));
                    const content = data.choices?.[0]?.delta?.content;
                    if (content) {
                      controller.enqueue(
                        encoder.encode(
                          `data: ${JSON.stringify({
                            choices: [{ delta: { content } }],
                          })}\n\n`,
                        ),
                      );
                    }
                  } catch (e) {
                    console.error('Error parsing SSE message:', e);
                  }
                }
              }
            } catch (error) {
              console.error('Stream processing error:', error);
              controller.error(error);
            }
          },
        });

        return new Response(stream, {
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            Connection: 'keep-alive',
          },
        });
      }

      // Handle regular response
      const data = await response.json();
      return NextResponse.json({
        choices: [
          {
            message: {
              content:
                data.response || data.choices?.[0]?.message?.content || '',
            },
          },
        ],
      });
    } catch (error) {
      console.error('AI Gateway Error:', error);
      return NextResponse.json(
        { error: 'Failed to get AI response' },
        { status: 500 },
      );
    }
  },
  {
    schema: AIRequestSchema,
  },
);
