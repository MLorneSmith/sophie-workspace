# E2E Testing Fundamentals

This document provides comprehensive guidance for writing end-to-end tests using Playwright in the SlideHeroes platform.

## Core E2E Testing Principles

### 1. User-Centric Focus
- Test real user workflows, not implementation details
- Focus on critical user journeys that generate business value
- Simulate actual user behavior including delays and interactions
- Test across different user types and permission levels

### 2. Business Value Priority
- **Revenue Critical**: Authentication, course purchases, subscription flows
- **Core Features**: AI canvas workflows, course completion, content creation
- **User Experience**: Navigation, responsive design, accessibility workflows
- **Data Integrity**: User progress tracking, quiz submissions, certificate generation

### 3. Test Stability
- Write deterministic tests that pass consistently
- Handle asynchronous operations with proper waits
- Avoid timing-dependent assertions
- Use stable selectors and locators

## Playwright Framework Patterns

### Test Structure (AAA Pattern)

```typescript
import { test, expect } from '@playwright/test';

test('should complete course lesson workflow', async ({ page }) => {
  // Arrange - Set up test state
  await page.goto('/course/introduction-to-ai');
  await page.getByRole('button', { name: 'Start Lesson' }).click();

  // Act - Perform user actions
  await page.getByRole('button', { name: 'Mark Complete' }).click();
  
  // Assert - Verify expected outcomes
  await expect(page.getByText('Lesson Complete')).toBeVisible();
  await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '25');
});
```

### Page Object Model (POM)

Create reusable page objects for maintainable tests:

```typescript
// tests/pages/course.po.ts
export class CoursePage {
  constructor(private page: Page) {}

  async navigateToLesson(lessonSlug: string) {
    await this.page.goto(`/course/lessons/${lessonSlug}`);
    await this.page.waitForLoadState('networkidle');
  }

  async startLesson() {
    await this.page.getByRole('button', { name: 'Start Lesson' }).click();
    await expect(this.page.getByText('Lesson Content')).toBeVisible();
  }

  async completeLesson() {
    await this.page.getByRole('button', { name: 'Mark Complete' }).click();
    await expect(this.page.getByText('Lesson Complete')).toBeVisible();
  }

  async getProgressPercentage() {
    const progressBar = this.page.getByRole('progressbar');
    return await progressBar.getAttribute('aria-valuenow');
  }
}

// Usage in tests
test('course progression workflow', async ({ page }) => {
  const coursePage = new CoursePage(page);
  
  await coursePage.navigateToLesson('introduction');
  await coursePage.startLesson();
  await coursePage.completeLesson();
  
  const progress = await coursePage.getProgressPercentage();
  expect(progress).toBe('25');
});
```

### Authentication Patterns

Handle authentication state efficiently:

```typescript
// tests/auth.setup.ts
import { test as setup, expect } from '@playwright/test';

const authFile = 'playwright/.auth/user.json';

setup('authenticate', async ({ page }) => {
  await page.goto('/auth/signin');
  await page.getByLabel('Email').fill('test@example.com');
  await page.getByLabel('Password').fill('password123');
  await page.getByRole('button', { name: 'Sign In' }).click();

  await expect(page.getByText('Welcome back')).toBeVisible();
  
  await page.context().storageState({ path: authFile });
});

// playwright.config.ts
export default defineConfig({
  projects: [
    { name: 'setup', testMatch: /.*\.setup\.ts/ },
    {
      name: 'authenticated',
      use: { storageState: authFile },
      dependencies: ['setup'],
    }
  ]
});
```

## Critical User Workflows

### 1. Authentication & Onboarding

```typescript
test.describe('Authentication Flow', () => {
  test('new user registration and onboarding', async ({ page }) => {
    await page.goto('/auth/signup');
    
    // Registration
    await page.getByLabel('Email').fill('newuser@example.com');
    await page.getByLabel('Password').fill('SecurePass123!');
    await page.getByLabel('Confirm Password').fill('SecurePass123!');
    await page.getByRole('button', { name: 'Create Account' }).click();
    
    // Email verification simulation
    await expect(page.getByText('Check your email')).toBeVisible();
    
    // Onboarding flow
    await page.goto('/onboarding'); // Simulate email click
    await page.getByLabel('Organization Name').fill('Test Company');
    await page.getByRole('button', { name: 'Continue' }).click();
    
    // Verify successful onboarding
    await expect(page.getByText('Welcome to SlideHeroes')).toBeVisible();
    await expect(page).toHaveURL('/home');
  });

  test('password reset workflow', async ({ page }) => {
    await page.goto('/auth/forgot-password');
    await page.getByLabel('Email').fill('user@example.com');
    await page.getByRole('button', { name: 'Send Reset Link' }).click();
    
    await expect(page.getByText('Reset link sent')).toBeVisible();
  });
});
```

### 2. AI Canvas Workflows

```typescript
test.describe('AI Canvas', () => {
  test('create presentation from idea to slides', async ({ page }) => {
    const canvasPage = new AICanvasPage(page);
    
    // Start with idea generation
    await canvasPage.navigateTo();
    await canvasPage.generateIdeas('AI in Education presentation');
    await expect(canvasPage.ideaCards).toHaveCount(3);
    
    // Select idea and generate outline
    await canvasPage.selectIdea(0);
    await canvasPage.generateOutline();
    await expect(canvasPage.outlineItems).toHaveCount.greaterThan(3);
    
    // Convert to storyboard
    await canvasPage.convertToStoryboard();
    await expect(canvasPage.slides).toHaveCount.greaterThan(5);
    
    // Export to PowerPoint
    await canvasPage.exportToPowerPoint();
    await expect(page.getByText('Export completed')).toBeVisible();
  });

  test('collaborative editing workflow', async ({ browser }) => {
    // Test with multiple browser contexts
    const user1Context = await browser.newContext();
    const user2Context = await browser.newContext();
    
    const user1Page = await user1Context.newPage();
    const user2Page = await user2Context.newPage();
    
    // User 1 creates presentation
    const canvas1 = new AICanvasPage(user1Page);
    await canvas1.navigateTo();
    await canvas1.createPresentation('Collaboration Test');
    
    // User 2 joins presentation
    const canvas2 = new AICanvasPage(user2Page);
    await canvas2.joinPresentation('Collaboration Test');
    
    // Verify real-time collaboration
    await canvas1.addSlide('New Slide');
    await expect(canvas2.slides).toHaveCount(2);
  });
});
```

### 3. Course Learning Workflows

```typescript
test.describe('Course Learning', () => {
  test('complete course with quiz progression', async ({ page }) => {
    const coursePage = new CoursePage(page);
    
    // Start course
    await coursePage.navigateTo('introduction-to-ai');
    await coursePage.enrollInCourse();
    
    // Complete lessons sequentially
    const lessons = ['basics', 'advanced-concepts', 'practical-applications'];
    
    for (const lesson of lessons) {
      await coursePage.navigateToLesson(lesson);
      await coursePage.completeLesson();
      
      // Verify progress updates
      const progress = await coursePage.getProgressPercentage();
      expect(Number(progress)).toBeGreaterThan(0);
    }
    
    // Take final quiz
    await coursePage.navigateToQuiz();
    await coursePage.answerQuizQuestions([
      { question: 1, answer: 'A' },
      { question: 2, answer: 'B' },
      { question: 3, answer: 'C' }
    ]);
    
    await coursePage.submitQuiz();
    await expect(page.getByText('Quiz Passed')).toBeVisible();
    
    // Verify course completion
    await expect(page.getByText('Course Completed')).toBeVisible();
    await expect(page.getByText('Download Certificate')).toBeVisible();
  });

  test('quiz retry workflow with score tracking', async ({ page }) => {
    const coursePage = new CoursePage(page);
    
    await coursePage.navigateToQuiz();
    
    // First attempt (fail)
    await coursePage.answerQuizQuestions([
      { question: 1, answer: 'Wrong' },
      { question: 2, answer: 'Wrong' }
    ]);
    await coursePage.submitQuiz();
    await expect(page.getByText('Quiz Failed')).toBeVisible();
    
    // Retry attempt (pass)
    await page.getByRole('button', { name: 'Retry Quiz' }).click();
    await coursePage.answerQuizQuestions([
      { question: 1, answer: 'Correct' },
      { question: 2, answer: 'Correct' }
    ]);
    await coursePage.submitQuiz();
    await expect(page.getByText('Quiz Passed')).toBeVisible();
    
    // Verify attempt tracking
    await expect(page.getByText('Attempt 2 of 3')).toBeVisible();
  });
});
```

### 4. Team Management & Billing

```typescript
test.describe('Team Management', () => {
  test('invite team member and assign role', async ({ page }) => {
    const teamPage = new TeamPage(page);
    
    await teamPage.navigateTo();
    await teamPage.inviteTeamMember({
      email: 'teammate@example.com',
      role: 'editor'
    });
    
    await expect(page.getByText('Invitation sent')).toBeVisible();
    
    // Verify pending invitation
    await expect(teamPage.pendingInvitations).toContainText('teammate@example.com');
  });

  test('upgrade subscription workflow', async ({ page }) => {
    const billingPage = new BillingPage(page);
    
    await billingPage.navigateTo();
    await billingPage.selectPlan('professional');
    
    // Mock payment form (avoid real payments in tests)
    await billingPage.fillPaymentForm({
      cardNumber: '4242424242424242',
      expiry: '12/25',
      cvc: '123'
    });
    
    await billingPage.submitPayment();
    await expect(page.getByText('Subscription upgraded')).toBeVisible();
    await expect(page.getByText('Professional Plan')).toBeVisible();
  });
});
```

## Advanced E2E Patterns

### 1. API Mocking for External Services

```typescript
test('AI generation with mocked API', async ({ page }) => {
  // Mock AI service responses
  await page.route('**/api/ai/generate', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        ideas: [
          { title: 'Test Idea 1', content: 'Test content 1' },
          { title: 'Test Idea 2', content: 'Test content 2' }
        ]
      })
    });
  });

  const canvasPage = new AICanvasPage(page);
  await canvasPage.generateIdeas('Test prompt');
  
  await expect(canvasPage.ideaCards).toHaveCount(2);
  await expect(page.getByText('Test Idea 1')).toBeVisible();
});
```

### 2. Visual Regression Testing

```typescript
test('visual consistency across pages', async ({ page }) => {
  await page.goto('/home');
  await expect(page).toHaveScreenshot('homepage.png');
  
  await page.goto('/course/introduction');
  await expect(page).toHaveScreenshot('course-page.png');
  
  await page.goto('/ai/canvas');
  await expect(page).toHaveScreenshot('ai-canvas.png');
});
```

### 3. Performance Testing Integration

```typescript
test('page load performance meets thresholds', async ({ page }) => {
  // Start performance monitoring
  const start = Date.now();
  
  await page.goto('/home');
  await page.waitForLoadState('networkidle');
  
  const loadTime = Date.now() - start;
  expect(loadTime).toBeLessThan(3000); // 3 second threshold
  
  // Check Core Web Vitals
  const lcp = await page.evaluate(() => {
    return new Promise((resolve) => {
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lcpEntry = entries[entries.length - 1];
        resolve(lcpEntry.startTime);
      }).observe({ entryTypes: ['largest-contentful-paint'] });
    });
  });
  
  expect(lcp).toBeLessThan(2500); // LCP threshold
});
```

### 4. Mobile and Responsive Testing

```typescript
test.describe('Mobile Responsiveness', () => {
  test.use({ viewport: { width: 375, height: 667 } }); // iPhone SE

  test('mobile navigation workflow', async ({ page }) => {
    await page.goto('/home');
    
    // Test mobile menu
    await page.getByRole('button', { name: 'Menu' }).click();
    await expect(page.getByRole('navigation')).toBeVisible();
    
    // Test course access on mobile
    await page.getByRole('link', { name: 'Courses' }).click();
    await expect(page.getByText('Available Courses')).toBeVisible();
    
    // Verify touch interactions
    await page.getByText('Introduction to AI').tap();
    await expect(page).toHaveURL(/\/course\//);
  });
});
```

## Test Data Management

### 1. Test Database Setup

```typescript
// tests/fixtures/database.ts
export async function setupTestData() {
  // Create test users
  const testUser = await createUser({
    email: 'test@example.com',
    name: 'Test User',
    role: 'user'
  });

  // Create test courses
  const testCourse = await createCourse({
    title: 'Test Course',
    slug: 'test-course',
    lessons: [
      { title: 'Lesson 1', content: 'Test content' },
      { title: 'Lesson 2', content: 'Test content' }
    ]
  });

  return { testUser, testCourse };
}

// Use in tests
test.beforeEach(async () => {
  await setupTestData();
});
```

### 2. Environment-Specific Configuration

```typescript
// playwright.config.ts
export default defineConfig({
  use: {
    baseURL: process.env.CI 
      ? 'https://staging.slideheroes.com'
      : 'http://localhost:3000',
  },
  
  projects: [
    {
      name: 'staging',
      use: { baseURL: 'https://staging.slideheroes.com' }
    },
    {
      name: 'production-smoke',
      use: { 
        baseURL: 'https://slideheroes.com',
        testMatch: '**/smoke/**'
      }
    }
  ]
});
```

## Best Practices

### 1. Selector Strategies

```typescript
// ✅ Good - Semantic selectors
await page.getByRole('button', { name: 'Submit' });
await page.getByLabel('Email Address');
await page.getByText('Welcome back');

// ✅ Good - Data attributes for test hooks
await page.getByTestId('submit-button');

// ❌ Bad - Fragile selectors
await page.locator('.btn-primary.submit-btn'); // CSS classes change
await page.locator('xpath=//div[3]/button[1]'); // Position-dependent
```

### 2. Waiting Strategies

```typescript
// ✅ Good - Wait for specific conditions
await expect(page.getByText('Data loaded')).toBeVisible();
await page.waitForResponse(response => 
  response.url().includes('/api/courses') && response.status() === 200
);

// ❌ Bad - Arbitrary waits
await page.waitForTimeout(5000); // Flaky and slow
```

### 3. Error Handling

```typescript
test('handles network failures gracefully', async ({ page }) => {
  // Simulate network failure
  await page.route('**/api/**', route => route.abort());
  
  await page.goto('/course/test-course');
  
  // Verify error handling
  await expect(page.getByText('Unable to load course')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Retry' })).toBeVisible();
});
```

### 4. Test Organization

```typescript
// Group related tests
test.describe('Course Management', () => {
  test.describe('As Student', () => {
    test.use({ storageState: 'student-auth.json' });
    
    test('can view enrolled courses', async ({ page }) => {});
    test('can complete lessons', async ({ page }) => {});
  });
  
  test.describe('As Instructor', () => {
    test.use({ storageState: 'instructor-auth.json' });
    
    test('can create courses', async ({ page }) => {});
    test('can view student progress', async ({ page }) => {});
  });
});
```

## CI/CD Integration

### 1. GitHub Actions Configuration

```yaml
# .github/workflows/e2e-tests.yml
- name: Run E2E tests
  run: pnpm --filter e2e playwright test
  env:
    PLAYWRIGHT_BASE_URL: ${{ secrets.STAGING_URL }}
    
- name: Upload test results
  uses: actions/upload-artifact@v4
  if: failure()
  with:
    name: playwright-report
    path: apps/e2e/playwright-report/
```

### 2. Parallel Test Execution

```typescript
// Run tests in parallel across CI workers
export default defineConfig({
  workers: process.env.CI ? 2 : 1,
  
  projects: [
    { name: 'Desktop Chrome', use: devices['Desktop Chrome'] },
    { name: 'Desktop Firefox', use: devices['Desktop Firefox'] },
    { name: 'Mobile Safari', use: devices['iPhone 12'] }
  ]
});
```

## Summary

E2E tests should focus on:

1. **Critical User Journeys**: Authentication, course completion, AI workflows
2. **Business Value**: Revenue-generating and user-retention features  
3. **Cross-browser Compatibility**: Desktop and mobile experiences
4. **Integration Points**: API interactions, third-party services
5. **Performance**: Page load times and user experience metrics

Remember: E2E tests are expensive to run and maintain. Focus on high-value scenarios that unit and integration tests cannot adequately cover.