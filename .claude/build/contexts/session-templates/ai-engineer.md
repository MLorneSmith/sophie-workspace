# AI Engineer Session Template

## Pre-Session Context Loading

### Essential Reading Order

1. Load AI Engineer role: `/read .claude/roles/ai-engineer.md`
2. Review project standards: `/read CLAUDE.md`
3. Load story context: `/read .claude/build/contexts/stories/story-{{ID}}/context.md`
4. Review technical notes: `/read .claude/build/contexts/stories/story-{{ID}}/technical-notes.md`
5. Check progress: `/read .claude/build/contexts/stories/story-{{ID}}/progress.md`

### SlideHeroes AI Integration Patterns

Review existing AI implementations:

- AI Canvas tools: `/read apps/web/app/home/(user)/ai/canvas/_actions/`
- AI Gateway client: `/read packages/ai-gateway/src/`
- Usage tracking: `/read packages/supabase/src/schema/ai-usage.schema.ts`

## AI Integration Standards for SlideHeroes

### Portkey AI Gateway Usage

- **All AI requests** must go through Portkey AI Gateway
- **Server actions only** - never expose API keys to client
- **Usage tracking** - track all AI requests for billing
- **Error handling** - graceful fallbacks for AI service failures
- **Rate limiting** - implement appropriate request limits

### Implementation Patterns

```typescript
// Server Action Pattern
export const aiAction = enhanceAction(
  async (data, user) => {
    // Validate input with Zod
    const validatedData = schema.parse(data);

    // Create AI Gateway client
    const client = createAIGatewayClient({
      headers: { 'x-metadata-user-id': user.id },
    });

    // Make AI request
    const response = await client.chat.completions.create({
      messages: [{ role: 'user', content: validatedData.prompt }],
      config: 'slideheroes-config',
    });

    // Track usage
    await trackAIUsage({
      userId: user.id,
      feature: 'feature-name',
      tokensUsed: response.usage?.total_tokens || 0,
    });

    return { success: true, data: response };
  },
  { schema: inputSchema },
);
```

### Common AI Patterns in SlideHeroes

- **Outline generation**: `apps/web/app/home/(user)/ai/canvas/_actions/generate-outline.action.ts`
- **Content suggestions**: `apps/web/app/home/(user)/ai/canvas/_actions/generate-ideas.action.ts`
- **Text simplification**: `apps/web/app/home/(user)/ai/canvas/_actions/simplify-text.action.ts`
- **Cost tracking**: `apps/web/app/home/(user)/ai/canvas/_lib/contexts/cost-tracking-context.tsx`

## Session Checklist

### Context Loading

- [ ] AI Engineer role loaded and understood
- [ ] Project standards (CLAUDE.md) reviewed
- [ ] Story context fully loaded
- [ ] Technical notes and progress reviewed
- [ ] Existing AI patterns understood

### Implementation Readiness

- [ ] Story requirements clearly understood
- [ ] Acceptance criteria identified
- [ ] Technical approach planned
- [ ] Portkey integration approach defined
- [ ] Usage tracking strategy planned
- [ ] Error handling approach planned
- [ ] Test strategy defined

### Quality Standards

- [ ] Input validation with Zod schemas
- [ ] Server-only AI integration (no client exposure)
- [ ] Proper error handling and user feedback
- [ ] AI usage tracking implementation
- [ ] Rate limiting considerations
- [ ] Accessibility requirements understood
- [ ] Performance requirements defined

## Development Focus Areas

### AI Feature Development

- Prompt engineering and optimization
- Response parsing and validation
- Error handling and fallback strategies
- Usage tracking and billing integration
- Performance optimization for AI requests

### SlideHeroes AI Integration

- Canvas system integration
- Editor integration
- Presentation workflow enhancement
- User experience optimization
- Cost management and transparency

## Common AI Tasks

- Building AI-powered content generation
- Implementing AI suggestions and recommendations
- Creating intelligent automation features
- Optimizing AI request costs and performance
- Implementing AI feature analytics and tracking
