import { getAIProvider } from './providers/factory';

// Example 1: Using OpenAI through Cloudflare AI Gateway
const openaiExample = async () => {
  const ai = getAIProvider('openai');
  const response = await ai.complete({
    messages: [
      {
        role: 'user',
        content:
          'Create an outline for a business presentation about digital transformation.',
      },
    ],
    model: 'gpt-4-turbo',
  });
  console.log('OpenAI Response:', response.content);
};

// Example 2: Using Anthropic Claude through Cloudflare AI Gateway
const anthropicExample = async () => {
  const ai = getAIProvider('anthropic');
  const response = await ai.complete({
    messages: [
      {
        role: 'user',
        content: 'Help me improve this presentation outline...',
      },
    ],
    model: 'claude-3-opus',
    temperature: 0.7,
  });
  console.log('Anthropic Response:', response.content);
};

// Example 3: Using Google AI (Gemini) through Cloudflare AI Gateway
const googleAIExample = async () => {
  const ai = getAIProvider('google-ai');
  const response = await ai.complete({
    messages: [
      {
        role: 'user',
        content: 'Suggest creative presentation ideas.',
      },
    ],
    model: 'gemini-pro',
  });
  console.log('Google AI Response:', response.content);
};

// Example 4: Using Groq through Cloudflare AI Gateway with streaming
const groqStreamingExample = async () => {
  const ai = getAIProvider('groq');
  const stream = ai.streamComplete({
    messages: [
      {
        role: 'system',
        content: 'You are a presentation expert.',
      },
      {
        role: 'user',
        content: 'Create an engaging presentation introduction.',
      },
    ],
    model: 'mixtral-8x7b',
    temperature: 0.7,
  });

  console.log('Groq Streaming Response:');
  for await (const chunk of stream) {
    process.stdout.write(chunk.content);
  }
};

// Example 5: Using OpenRouter through Cloudflare AI Gateway
const openRouterExample = async () => {
  const ai = getAIProvider('openrouter');
  const response = await ai.complete({
    messages: [
      {
        role: 'user',
        content: 'Suggest presentation design tips.',
      },
    ],
    model: 'openrouter/mistral-large',
  });
  console.log('OpenRouter Response:', response.content);
};

// Example 6: Error handling
const errorHandlingExample = async () => {
  try {
    const ai = getAIProvider('openai');
    await ai.complete({
      messages: [
        {
          role: 'user',
          content: 'Generate a presentation template.',
        },
      ],
      model: 'gpt-4',
    });
  } catch (error) {
    console.error('AI Gateway Error:', error);
  }
};

// Required environment variables:
/*
CLOUDFLARE_ACCOUNT_ID=your_account_id
CLOUDFLARE_GATEWAY_ID=slideheroes-ai-gateway
CLOUDFLARE_API_TOKEN=your_api_token
OPENAI_API_KEY=your_openai_key
GROQ_API_KEY=your_groq_key
ANTHROPIC_API_KEY=your_anthropic_key
GOOGLE_AI_API_KEY=your_google_ai_key
OPENROUTER_API_KEY=your_openrouter_key
DEFAULT_AI_PROVIDER=openai
DEFAULT_AI_MODEL=gpt-4-turbo
*/
