# Testing Examples - SlideHeroes Project

This document contains concrete, working test examples from the SlideHeroes codebase organized by feature type.

## Server Actions with enhanceAction

### Testing AI Generation Actions

```typescript
// From: generate-ideas.test.ts
import { Portkey } from 'portkey-ai';

import { generateIdeas } from './generate-ideas';

vi.mock('portkey-ai');
vi.mock('@/lib/enhanceAction', () => ({
  enhanceAction: vi.fn((handler) => handler),
}));

describe('generateIdeas', () => {
  const mockCreate = vi.fn();

  beforeEach(() => {
    vi.mocked(Portkey).mockImplementation(
      () =>
        ({
          completions: { create: mockCreate },
        }) as any,
    );
  });

  it('should validate required topic', async () => {
    const result = await generateIdeas({ topic: '' });

    expect(result).toEqual({
      success: false,
      error: 'Validation error',
      issues: [
        {
          path: ['topic'],
          message: 'Topic must be at least 3 characters',
        },
      ],
    });
  });

  it('should generate ideas successfully', async () => {
    mockCreate.mockResolvedValueOnce({
      choices: [
        {
          message: {
            content: JSON.stringify([
              { title: 'Idea 1', description: 'Description 1' },
              { title: 'Idea 2', description: 'Description 2' },
            ]),
          },
        },
      ],
    });

    const result = await generateIdeas({
      topic: 'Climate Change',
      count: 2,
    });

    expect(result).toEqual({
      success: true,
      data: {
        ideas: [
          { title: 'Idea 1', description: 'Description 1' },
          { title: 'Idea 2', description: 'Description 2' },
        ],
      },
    });
  });
});
```

### Testing Database Operations

```typescript
// From: update-building-block-title.action.test.ts
import { createClient } from '@/lib/supabase/server';

import { updateBuildingBlockTitleAction } from './update-building-block-title.action';

vi.mock('@/lib/supabase/server');

describe('updateBuildingBlockTitleAction', () => {
  const mockSupabase = {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      }),
    },
    from: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    single: vi.fn(),
  };

  beforeEach(() => {
    vi.mocked(createClient).mockReturnValue(mockSupabase as any);
  });

  it('should update building block title', async () => {
    mockSupabase.single.mockResolvedValueOnce({
      data: {
        id: 'block-123',
        title: 'Updated Title',
        userId: 'user-123',
      },
      error: null,
    });

    const result = await updateBuildingBlockTitleAction({
      id: 'block-123',
      title: 'Updated Title',
    });

    expect(result).toEqual({
      success: true,
      data: {
        id: 'block-123',
        title: 'Updated Title',
        userId: 'user-123',
      },
    });

    expect(mockSupabase.from).toHaveBeenCalledWith('building_blocks');
    expect(mockSupabase.eq).toHaveBeenCalledWith('id', 'block-123');
  });
});
```

## React Component Testing

### Testing Interactive Components

```typescript
// From: QuizComponent.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QuizComponent } from './QuizComponent';

const mockHandleAnswer = vi.fn();
const mockQuiz = {
  questions: [
    {
      id: '1',
      question: 'What is React?',
      options: ['Library', 'Framework', 'Language', 'Database'],
      correctAnswer: 0
    }
  ]
};

describe('QuizComponent', () => {
  it('should handle answer selection', async () => {
    const user = userEvent.setup();

    render(
      <QuizComponent
        quiz={mockQuiz}
        onAnswer={mockHandleAnswer}
      />
    );

    const firstOption = screen.getByRole('radio', { name: 'Library' });
    await user.click(firstOption);

    expect(mockHandleAnswer).toHaveBeenCalledWith(0);
  });

  it('should show feedback after answer', async () => {
    render(
      <QuizComponent
        quiz={mockQuiz}
        onAnswer={mockHandleAnswer}
        showFeedback
      />
    );

    const wrongOption = screen.getByRole('radio', { name: 'Framework' });
    fireEvent.click(wrongOption);

    expect(screen.getByText('Incorrect!')).toBeInTheDocument();
    expect(screen.getByText('The correct answer is: Library')).toBeInTheDocument();
  });
});
```

### Testing with React Query

```typescript
// From: CourseProgressBar.test.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { CourseProgressBar } from './CourseProgressBar';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('CourseProgressBar', () => {
  it('should display progress percentage', () => {
    render(
      <CourseProgressBar
        completed={7}
        total={10}
      />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText('70% Complete')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '70');
  });
});
```

## Enhanced API Wrapper Testing

### Complex Request Handling

```typescript
// From: enhanced-api-wrapper.test.ts
import { RouteHandler } from '@payloadcms/next/types';

import { enhancedApiWrapper } from './enhanced-api-wrapper';

describe('enhancedApiWrapper', () => {
  const mockHandler: RouteHandler = vi.fn().mockResolvedValue(
    new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }),
  );

  it('should handle concurrent identical requests', async () => {
    const wrapped = enhancedApiWrapper(mockHandler);
    const req = new Request('http://localhost/api/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: 'test' }),
    });

    // Send multiple identical requests
    const [res1, res2, res3] = await Promise.all([
      wrapped(req, {} as any),
      wrapped(req, {} as any),
      wrapped(req, {} as any),
    ]);

    // Handler should only be called once due to deduplication
    expect(mockHandler).toHaveBeenCalledTimes(1);

    // All responses should be successful
    expect(await res1.json()).toEqual({ success: true });
    expect(await res2.json()).toEqual({ success: true });
    expect(await res3.json()).toEqual({ success: true });
  });

  it('should apply rate limiting', async () => {
    const wrapped = enhancedApiWrapper(mockHandler, {
      rateLimit: { maxRequests: 2, windowMs: 1000 },
    });

    const req = () => new Request('http://localhost/api/test');

    await wrapped(req(), {} as any);
    await wrapped(req(), {} as any);

    const res3 = await wrapped(req(), {} as any);
    expect(res3.status).toBe(429);
    expect(await res3.json()).toEqual({
      error: 'Too many requests',
    });
  });
});
```

## AI Integration Testing

### Testing Portkey AI Calls

```typescript
// From: simplify-text.test.ts
describe('simplifyText', () => {
  it('should handle AI errors gracefully', async () => {
    mockCreate.mockRejectedValueOnce(new Error('AI service unavailable'));

    const result = await simplifyText({
      text: 'Complex technical jargon',
      level: 'simple',
    });

    expect(result).toEqual({
      success: false,
      error: 'Failed to simplify text. Please try again.',
    });
  });

  it('should handle malformed AI responses', async () => {
    mockCreate.mockResolvedValueOnce({
      choices: [
        {
          message: { content: 'not-json-response' },
        },
      ],
    });

    const result = await simplifyText({
      text: 'Some text',
      level: 'simple',
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('Invalid response format');
  });
});
```

## File Operation Testing

### Testing File Uploads

```typescript
// From: storage-url-generators.test.ts
describe('storage operations', () => {
  const mockSupabase = createMockSupabaseClient();

  it('should generate public URLs', () => {
    const mockGetPublicUrl = vi.fn().mockReturnValue({
      data: { publicUrl: 'https://storage.example.com/file.pdf' },
    });

    mockSupabase.storage.from = vi.fn().mockReturnValue({
      getPublicUrl: mockGetPublicUrl,
    });

    const url = getPublicFileUrl(mockSupabase, 'bucket', 'file.pdf');

    expect(url).toBe('https://storage.example.com/file.pdf');
    expect(mockSupabase.storage.from).toHaveBeenCalledWith('bucket');
    expect(mockGetPublicUrl).toHaveBeenCalledWith('file.pdf');
  });

  it('should handle upload errors', async () => {
    const mockUpload = vi.fn().mockResolvedValue({
      data: null,
      error: { message: 'Upload failed' },
    });

    mockSupabase.storage.from = vi.fn().mockReturnValue({
      upload: mockUpload,
    });

    const result = await uploadFile(mockSupabase, file);

    expect(result).toEqual({
      success: false,
      error: 'Upload failed',
    });
  });
});
```

## Environment Variable Testing

### Using Vitest's stubEnv

```typescript
// From: form-submission-protection.test.ts
describe('form protection with env vars', () => {
  it('should use different salt in production', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('FORM_PROTECTION_SALT', 'prod-salt-123');

    const token = generateFormToken('test-form');
    expect(token).toMatch(/^[a-f0-9]{64}$/);

    vi.stubEnv('NODE_ENV', 'development');
    const devToken = generateFormToken('test-form');
    expect(devToken).not.toBe(token);
  });
});
```

## Test Utilities and Helpers

### Creating Reusable Test Helpers

```typescript
// Test data factories
export const testFactories = {
  storyboard: (overrides = {}) => ({
    id: 'story-123',
    title: 'Test Presentation',
    description: 'Test Description',
    userId: 'user-123',
    slides: [],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
  }),

  slide: (overrides = {}) => ({
    id: 'slide-123',
    title: 'Slide Title',
    content: { type: 'doc', content: [] },
    order: 0,
    ...overrides,
  }),
};

// Custom assertions
export function expectSuccessResponse(result: any) {
  expect(result).toEqual({
    success: true,
    data: expect.any(Object),
  });
}

export function expectErrorResponse(result: any, errorMessage?: string) {
  expect(result).toEqual({
    success: false,
    error: errorMessage || expect.any(String),
  });
}
```

## Edge Case Testing

### Special Characters and Unicode

```typescript
describe('edge cases', () => {
  it('should handle special characters in titles', async () => {
    const specialChars = '🚀 Test & <script>alert("xss")</script>';

    const result = await updateTitle({
      id: '123',
      title: specialChars,
    });

    expect(result.success).toBe(true);
    expect(result.data.title).toBe('🚀 Test & <script>alert("xss")</script>');
  });

  it('should handle very long inputs', async () => {
    const longText = 'a'.repeat(10000);

    const result = await processText({ text: longText });

    expect(result).toEqual({
      success: false,
      error: 'Text exceeds maximum length of 5000 characters',
    });
  });
});
```

## Performance Testing

### Testing Response Times

```typescript
describe('performance', () => {
  it('should complete within acceptable time', async () => {
    const start = performance.now();

    await generateOutline({
      topic: 'Quick Test',
      maxItems: 5,
    });

    const duration = performance.now() - start;
    expect(duration).toBeLessThan(3000); // 3 seconds max
  });
});
```
