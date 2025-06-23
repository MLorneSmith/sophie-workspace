# Prompt Engineering

## System Message Templates

Use consistent system message templates:

```tsx
// For content generation
const systemMessage = `You are a professional content creator with expertise in ${topic}.
Your task is to create engaging, accurate content that is well-structured and easy to understand.
Format your response using Markdown.`;

// For data extraction
const systemMessage = `You are a precise data extraction assistant.
Extract the requested information from the provided text.
Return your response as a valid JSON object matching the specified schema.`;

// For conversational assistants
const systemMessage = `You are a helpful, friendly assistant for ${companyName}.
Provide accurate, concise answers to user questions.
If you don't know the answer, admit it rather than making something up.`;
```

## Prompt Structure

Follow this structure for complex prompts:

```tsx
const messages = [
  {
    role: 'system',
    content: systemMessage
  },
  {
    role: 'user',
    content: `
# Context
${context}

# Instructions
${instructions}

# Input
${userInput}

# Output Format
${outputFormat}
    `
  }
];
```

## Few-Shot Examples

Include examples for complex tasks:

```tsx
const messages = [
  { role: 'system', content: systemMessage },
  { role: 'user', content: 'Example input 1' },
  { role: 'assistant', content: 'Example output 1' },
  { role: 'user', content: 'Example input 2' },
  { role: 'assistant', content: 'Example output 2' },
  { role: 'user', content: actualUserInput }
];
```

## JSON Mode

Use JSON mode for structured outputs:

```tsx
const response = await portkeyClient.chat.completions.create({
  messages: [...],
  model: 'gpt-4-turbo',
  response_format: { type: 'json_object' },
});

// Parse the response
const data = JSON.parse(response.choices[0].message.content);
```

## Using with AI Gateway

### Basic Completion

```tsx
import { getChatCompletion } from '@kit/ai-gateway';

const result = await getChatCompletion(
  [
    { role: 'system', content: systemMessage },
    { role: 'user', content: userInput }
  ],
  {
    model: 'gpt-3.5-turbo', // Use cheaper models when possible
    temperature: 0.7,
    userId: user.id,
    feature: 'chat-assistant',
  }
);

console.log(result.content);
console.log(result.metadata.cost); // Track costs
```

### Streaming Responses

```tsx
import { getStreamingChatCompletion } from '@kit/ai-gateway';

const stream = getStreamingChatCompletion(
  messages,
  { model: 'gpt-4-turbo', userId: user.id }
);

for await (const chunk of stream) {
  // Process each chunk
  process.stdout.write(chunk);
}
```

## Prompt Templates

Use consistent template patterns for reusable prompts:

```tsx
// Create a reusable template function
function createContentTemplate(topic: string, context: string, instructions: string) {
  return [
    {
      role: 'system',
      content: `You are a professional content creator with expertise in ${topic}.
Your task is to create engaging, accurate content that is well-structured and easy to understand.
Format your response using Markdown.`
    },
    {
      role: 'user',
      content: `
# Context
${context}

# Instructions
${instructions}

# Output Format
- Use clear headings and subheadings
- Include actionable insights
- Keep paragraphs concise and scannable
      `
    }
  ];
}

// Usage
const messages = createContentTemplate(
  'digital marketing',
  'Blog post for a SaaS company',
  'Write a 500-word blog post about content marketing'
);

const result = await getChatCompletion(messages, {
  model: 'gpt-4-turbo',
  userId: user.id,
  feature: 'content-generation',
});
```

## Cost Optimization

### Model Selection by Use Case

1. **Simple tasks**: `gpt-3.5-turbo` (~$0.0005/1K tokens)
   - Basic text generation
   - Simple Q&A
   - Content summarization

2. **Complex reasoning**: `gpt-4-turbo` (~$0.01/1K tokens)
   - Complex analysis
   - Multi-step reasoning
   - Code generation

3. **High quality content**: `claude-3-opus` (~$0.015/1K tokens)
   - Creative writing
   - Detailed analysis
   - Complex technical documentation

### Token Reduction Strategies

1. **Be concise and specific** - Remove unnecessary words
2. **Remove redundant context** - Only include relevant information
3. **Use efficient examples** - Fewer, more targeted examples
4. **Truncate long inputs** - Summarize or chunk large content
5. **Use structured outputs** - JSON mode reduces completion tokens
6. **Implement prompt caching** - Cache repeated system prompts

### Cost Tracking Example

```tsx
// Track costs across different features
const features = ['chat', 'content-generation', 'code-review'];

for (const feature of features) {
  const result = await getChatCompletion(messages, {
    model: 'gpt-3.5-turbo',
    userId: user.id,
    feature, // This will be tracked separately
  });
  
  console.log(`${feature} cost: $${result.metadata.cost}`);
}
