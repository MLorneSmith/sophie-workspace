# E2E Test Writer Agent

Usage: `/e2e-test-writer [options]`

This specialized agent writes end-to-end tests using Playwright, focusing on user journeys, cross-browser compatibility, and real-world user interactions.

## Quick Usage

```bash
/e2e-test-writer                                   # Auto-select highest priority E2E test
/e2e-test-writer --journey="user-registration"     # Test complete user journey
/e2e-test-writer --page="dashboard"                # Test specific page interactions
/e2e-test-writer --critical                        # Focus on critical user paths
/e2e-test-writer --cross-browser                   # Emphasize browser compatibility
/e2e-test-writer --accessibility                   # Include a11y checks
/e2e-test-writer --visual                         # Add visual regression tests
/e2e-test-writer --from-discovery                  # Use test-discovery recommendations
```

## 0. Priority-Driven E2E Test Selection (NEW)

### 0.1 Read Test Coverage Database for E2E Priorities

```bash
# Find the project root and database path
PROJECT_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || pwd)
DB_PATH="$PROJECT_ROOT/.claude/tracking/test-data/test-coverage-db.json"

# Read the test coverage database to identify highest priority E2E tests
if [ -f "$DB_PATH" ]; then
  echo "🔍 Reading test coverage database from: $DB_PATH"
  
  # Check for existing E2E tests to avoid duplication
  EXISTING_E2E=$(find apps/e2e/tests -name "*.spec.ts" | wc -l)
  echo "📊 Found $EXISTING_E2E existing E2E test files"
  
  # Identify critical user journeys not yet tested
  echo ""
  echo "🎯 Critical User Journeys Priority:"
  
  # Check admin package status
  ADMIN_TESTS=$(jq -r '.packages["packages/features/admin"].testFiles // 0' "$DB_PATH")
  if [ "$ADMIN_TESTS" = "0" ]; then
    echo "   ❌ P1: Admin user management flow (NO E2E TESTS)"
    echo "      - Admin login → View users → Create/Ban/Delete user"
    echo "      - Priority Score: 95/100"
  fi
  
  # Check auth package status  
  AUTH_TESTS=$(jq -r '.packages["packages/features/auth"].testFiles // 0' "$DB_PATH")
  if [ "$AUTH_TESTS" = "0" ]; then
    echo "   ❌ P1: Authentication flow (PARTIAL E2E COVERAGE)"
    echo "      - Sign up → Email verification → MFA setup → Login"
    echo "      - Priority Score: 90/100"
  fi
  
  # Check high-churn components
  echo ""
  echo "📈 High-Churn Components Needing E2E Tests:"
  jq -r '.highChurnFiles[] | select(.hasTests == false) | "   - \(.file) (\(.changes) changes)"' \
    "$DB_PATH" | head -5
  
  # Suggest critical E2E scenarios based on package gaps
  echo ""
  echo "🚀 Recommended E2E Test Scenarios:"
  
  # Get untested critical packages
  CRITICAL_PACKAGES=$(jq -r '.packages | to_entries[] | select(.value.priority == "P1" and .value.testFiles == 0) | .key' \
    "$DB_PATH")
  
  if echo "$CRITICAL_PACKAGES" | grep -q "admin"; then
    echo "   1. Admin Security Flow:"
    echo "      - Test super admin authentication"
    echo "      - Verify permission checks on critical actions"
    echo "      - Test audit logging"
  fi
  
  if echo "$CRITICAL_PACKAGES" | grep -q "auth"; then
    echo "   2. User Authentication Journey:"
    echo "      - Complete signup with email verification"
    echo "      - MFA setup and verification"
    echo "      - Password reset flow"
  fi
  
  if echo "$CRITICAL_PACKAGES" | grep -q "payments"; then
    echo "   3. Payment Processing Flow:"
    echo "      - Subscription purchase"
    echo "      - Payment failure handling"
    echo "      - Invoice generation"
  fi
else
  echo "⚠️  No test coverage database found at: $DB_PATH"
  echo "   Run /test-discovery first to generate the database."
fi
```

### 0.2 E2E Test Priority Selection Logic

```typescript
interface E2ETestPriority {
  journey: string;
  description: string;
  testType: 'e2e';
  score: number;
  reason: string;
  criticalSteps: string[];
  affectedPackages: string[];
  estimatedDuration: string;
}

async function selectNextE2ETest(): Promise<E2ETestPriority | null> {
  // Read test coverage database
  const dbPath = '.claude/tracking/test-data/test-coverage-db.json';
  if (!fs.existsSync(dbPath)) {
    console.log('⚠️  No test coverage database. Run /test-discovery first.');
    return null;
  }
  
  const db = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
  
  // Identify critical journeys based on untested packages
  const criticalJourneys = identifyCriticalJourneys(db);
  
  // Check existing E2E tests to avoid duplication
  const existingTests = await getExistingE2ETests();
  
  // Filter out already tested journeys
  const untestedJourneys = criticalJourneys.filter(
    journey => !existingTests.includes(journey.name)
  );
  
  if (untestedJourneys.length === 0) {
    console.log('✅ All critical E2E journeys are covered!');
    return null;
  }
  
  // Return highest priority journey
  const priority = untestedJourneys[0];
  console.log(`🎯 Selected E2E Journey: ${priority.journey}`);
  console.log(`📝 Reason: ${priority.reason}`);
  console.log(`📦 Affects: ${priority.affectedPackages.join(', ')}`);
  
  return priority;
}

function identifyCriticalJourneys(db: any): E2ETestPriority[] {
  const journeys: E2ETestPriority[] = [];
  
  // Check for admin package gaps
  if (db.packages['packages/features/admin']?.testFiles === 0) {
    journeys.push({
      journey: 'admin-user-management',
      description: 'Admin user management and security flow',
      testType: 'e2e',
      score: 95,
      reason: 'Critical security functions with no test coverage',
      criticalSteps: [
        'Admin authentication',
        'User creation with validation',
        'User ban/delete operations',
        'Permission verification'
      ],
      affectedPackages: ['admin', 'auth', 'supabase'],
      estimatedDuration: '45-60 seconds'
    });
  }
  
  // Check for auth package gaps
  if (db.packages['packages/features/auth']?.testFiles === 0) {
    journeys.push({
      journey: 'complete-authentication-flow',
      description: 'End-to-end authentication with MFA',
      testType: 'e2e',
      score: 90,
      reason: 'Authentication affects all users, no integration tests',
      criticalSteps: [
        'User registration',
        'Email verification',
        'MFA setup',
        'Login with MFA',
        'Password reset'
      ],
      affectedPackages: ['auth', 'accounts', 'email'],
      estimatedDuration: '60-90 seconds'
    });
  }
  
  // Add more journey identification logic based on package gaps
  
  return journeys.sort((a, b) => b.score - a.score);
}
```

### 0.3 Database Update After E2E Test Creation

```bash
# After successfully creating E2E tests, update the database
update_e2e_test_database() {
  local journey="$1"
  local test_file="$2"
  local scenarios_count="$3"
  
  # Use absolute path to database
  local PROJECT_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || pwd)
  local DB_PATH="$PROJECT_ROOT/.claude/tracking/test-data/test-coverage-db.json"
  
  if [ -f "$DB_PATH" ]; then
    # Update E2E test count
    jq --arg file "$test_file" --argjson count "$scenarios_count" \
      '.summary.coverageByType.e2e.files += 1 |
       .summary.coverageByType.e2e.tests += $count |
       .packages["apps/e2e"].testFiles += 1 |
       .packages["apps/e2e"].testCases += $count' \
      "$DB_PATH" > tmp.json && mv tmp.json "$DB_PATH"
    
    # Mark related packages as having E2E coverage
    case "$journey" in
      *admin*)
        jq '.packages["packages/features/admin"].hasE2ECoverage = true' \
          "$DB_PATH" > tmp.json && mv tmp.json "$DB_PATH"
        ;;
      *auth*)
        jq '.packages["packages/features/auth"].hasE2ECoverage = true' \
          "$DB_PATH" > tmp.json && mv tmp.json "$DB_PATH"
        ;;
    esac
    
    # Update timestamp
    jq --arg updated "$(date -u +%Y-%m-%dT%H:%M:%SZ)" '.lastUpdated = $updated' \
      "$DB_PATH" > tmp.json && mv tmp.json "$DB_PATH"
    
    echo "✅ Updated test coverage database"
    echo "   Added E2E test: $test_file"
    echo "   Scenarios covered: $scenarios_count"
    
    # Check for more priorities
    echo ""
    echo "   📊 Coverage Status:"
    jq -r '.summary.coverageByType.e2e | "   E2E Tests: \(.files) files, \(.tests) scenarios"' "$DB_PATH"
  fi
}
```

## 1. User Journey Analysis

### 1.1 Journey Mapping

```typescript
interface UserJourney {
  name: string;
  description: string;
  actors: string[]; // e.g., ['student', 'instructor', 'admin']
  preconditions: string[];
  steps: JourneyStep[];
  expectedOutcomes: string[];
  criticalPath: boolean;
  dataRequirements: DataRequirement[];
}

interface JourneyStep {
  action: string;
  element: string; // selector or description
  validation: string[];
  alternativePaths?: JourneyStep[];
  errorConditions?: string[];
}

async function mapUserJourney(feature: string): Promise<UserJourney> {
  // Analyze feature to understand user flow
  const journey: UserJourney = {
    name: feature,
    description: `End-to-end test for ${feature}`,
    actors: identifyActors(feature),
    preconditions: identifyPreconditions(feature),
    steps: analyzeUserSteps(feature),
    expectedOutcomes: defineExpectedOutcomes(feature),
    criticalPath: isCriticalPath(feature),
    dataRequirements: identifyDataNeeds(feature)
  };
  
  return journey;
}
```

### 1.2 Critical Path Identification

```
CRITICAL PATH ANALYSIS PROMPT:
Identify the critical user journeys for testing.

APPLICATION CONTEXT:
[APP_DESCRIPTION]

BUSINESS PRIORITIES:
- Revenue-generating paths (payments, subscriptions)
- User onboarding and activation
- Core feature usage
- Security-critical operations (auth, permissions)

Analyze and rank user journeys by criticality:

1. HIGHEST PRIORITY (Revenue/Security):
   - User registration → payment → activation
   - Login → course purchase → access content
   
2. HIGH PRIORITY (Core Features):
   - Create content → publish → share
   - Search → view → interact
   
3. MEDIUM PRIORITY (Supporting Features):
   - Profile management
   - Settings configuration

For each journey, identify:
- Entry point
- Key interactions
- Success criteria
- Failure modes
- Recovery paths
```

## 2. Page Object Model Generation

### 2.1 Automatic POM Creation

```typescript
// Page Object Model Template
class [PageName]Page {
  readonly page: Page;
  
  // Locators
  readonly [elementName]: Locator;
  
  constructor(page: Page) {
    this.page = page;
    
    // Initialize locators
    this.[elementName] = page.locator('[selector]');
  }
  
  // Actions
  async [actionName]([parameters]) {
    // Implement action
  }
  
  // Assertions
  async [assertionName]() {
    // Implement assertion
  }
  
  // Helper methods
  async waitForPageLoad() {
    await this.page.waitForLoadState('networkidle');
  }
}
```

### 2.2 POM Generation Prompt

```
PAGE OBJECT MODEL PROMPT:
Generate a Page Object Model for comprehensive E2E testing.

PAGE URL: [URL]
PAGE PURPOSE: [DESCRIPTION]

ANALYZE THE PAGE FOR:
1. Interactive elements (buttons, links, forms)
2. Data display elements (tables, lists, cards)
3. Navigation elements
4. Dynamic content areas
5. Modal/popup triggers

GENERATE POM WITH:
✅ Semantic locator strategies (data-testid preferred)
✅ Reusable action methods
✅ Built-in wait strategies
✅ Error handling
✅ Assertion helpers

EXAMPLE STRUCTURE:
```typescript
export class CourseDashboardPage {
  readonly page: Page;
  
  // Navigation
  readonly navHome: Locator;
  readonly navCourses: Locator;
  readonly navProfile: Locator;
  
  // Course Cards
  readonly courseCards: Locator;
  readonly enrollButton: Locator;
  readonly progressBar: Locator;
  
  // Filters
  readonly categoryFilter: Locator;
  readonly searchInput: Locator;
  readonly sortDropdown: Locator;
  
  constructor(page: Page) {
    this.page = page;
    
    // Navigation
    this.navHome = page.getByRole('link', { name: 'Home' });
    this.navCourses = page.getByRole('link', { name: 'Courses' });
    
    // Course elements
    this.courseCards = page.locator('[data-testid="course-card"]');
    this.enrollButton = page.getByRole('button', { name: 'Enroll Now' });
    
    // Filters
    this.searchInput = page.getByPlaceholder('Search courses...');
    this.categoryFilter = page.locator('[data-testid="category-filter"]');
  }
  
  async navigateTo() {
    await this.page.goto('/dashboard');
    await this.page.waitForLoadState('domcontentloaded');
  }
  
  async searchCourse(query: string) {
    await this.searchInput.fill(query);
    await this.searchInput.press('Enter');
    await this.page.waitForResponse('**/api/courses/search');
  }
  
  async enrollInCourse(courseName: string) {
    const course = this.courseCards.filter({ hasText: courseName });
    await course.locator(this.enrollButton).click();
    await this.page.waitForURL('**/enrollment/success');
  }
  
  async verifyCourseVisible(courseName: string) {
    await expect(this.courseCards.filter({ hasText: courseName })).toBeVisible();
  }
}
```
```

## 3. Test Generation with Playwright Best Practices

### 3.1 Journey-Based Test Generation

```
E2E TEST GENERATION PROMPT:
Generate comprehensive E2E tests for the user journey.

USER JOURNEY:
[JOURNEY_DETAILS]

PAGE OBJECTS AVAILABLE:
[POM_CLASSES]

TEST REQUIREMENTS:
✅ Test happy path completely
✅ Test critical error scenarios
✅ Include accessibility checks
✅ Add visual regression snapshots at key points
✅ Test on multiple viewports (mobile, tablet, desktop)
✅ Include network failure scenarios
✅ Test loading states and skeletons
✅ Verify analytics events

PLAYWRIGHT TEST STRUCTURE:
```typescript
import { test, expect } from '@playwright/test';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { CoursePage } from './pages/CoursePage';

test.describe('[Journey Name]', () => {
  let loginPage: LoginPage;
  let dashboardPage: DashboardPage;
  let coursePage: CoursePage;
  
  test.beforeEach(async ({ page }) => {
    // Initialize page objects
    loginPage = new LoginPage(page);
    dashboardPage = new DashboardPage(page);
    coursePage = new CoursePage(page);
    
    // Common setup
    await page.goto('/');
  });
  
  test('should complete full user journey successfully', async ({ page }) => {
    // Step 1: Login
    await loginPage.navigateTo();
    await loginPage.login('user@example.com', 'password');
    await expect(page).toHaveURL('/dashboard');
    
    // Step 2: Navigate to course
    await dashboardPage.searchCourse('JavaScript');
    await dashboardPage.enrollInCourse('Advanced JavaScript');
    
    // Step 3: Access course content
    await coursePage.waitForPageLoad();
    await expect(coursePage.videoPlayer).toBeVisible();
    await coursePage.startLesson();
    
    // Step 4: Verify completion
    await coursePage.completeLesson();
    await expect(coursePage.progressBar).toHaveText('1/10 completed');
    
    // Visual regression checkpoint
    await expect(page).toHaveScreenshot('course-progress.png');
  });
  
  test('should handle network errors gracefully', async ({ page }) => {
    // Simulate network failure
    await page.route('**/api/courses/*', route => 
      route.abort('failed')
    );
    
    await dashboardPage.navigateTo();
    await dashboardPage.searchCourse('Python');
    
    // Verify error handling
    await expect(page.getByText('Unable to load courses')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Retry' })).toBeVisible();
  });
  
  test('should be accessible', async ({ page }) => {
    // Accessibility scan
    await dashboardPage.navigateTo();
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2aa', 'wcag21aa'])
      .analyze();
      
    expect(accessibilityScanResults.violations).toEqual([]);
  });
});
```
```

### 3.2 Cross-Browser Testing Strategies

```typescript
// playwright.config.ts configuration for cross-browser testing
const config: PlaywrightTestConfig = {
  projects: [
    {
      name: 'chromium-desktop',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 }
      }
    },
    {
      name: 'firefox-desktop',
      use: {
        ...devices['Desktop Firefox'],
        viewport: { width: 1920, height: 1080 }
      }
    },
    {
      name: 'webkit-desktop',
      use: {
        ...devices['Desktop Safari'],
        viewport: { width: 1920, height: 1080 }
      }
    },
    {
      name: 'mobile-chrome',
      use: {
        ...devices['Pixel 5']
      }
    },
    {
      name: 'mobile-safari',
      use: {
        ...devices['iPhone 12']
      }
    },
    {
      name: 'tablet-ipad',
      use: {
        ...devices['iPad (gen 7)']
      }
    }
  ]
};
```

### 3.3 Browser-Specific Test Adjustments

```
CROSS-BROWSER PROMPT:
Generate tests that handle browser-specific behaviors.

BROWSER DIFFERENCES TO HANDLE:
1. Safari: Different date picker behavior
2. Firefox: Stricter security policies
3. Mobile: Touch vs click events
4. Viewport: Responsive design breakpoints

TEST PATTERN:
```typescript
test.describe('Cross-browser compatibility', () => {
  test('handles date input across browsers', async ({ page, browserName }) => {
    await page.goto('/form');
    
    const dateInput = page.locator('input[type="date"]');
    
    if (browserName === 'webkit') {
      // Safari-specific date handling
      await dateInput.click();
      await page.keyboard.type('2025-01-06');
    } else {
      // Standard date input
      await dateInput.fill('2025-01-06');
    }
    
    await expect(dateInput).toHaveValue('2025-01-06');
  });
  
  test('responsive design on different viewports', async ({ page, viewport }) => {
    await page.goto('/');
    
    if (viewport?.width && viewport.width < 768) {
      // Mobile layout assertions
      await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();
      await expect(page.locator('[data-testid="desktop-nav"]')).toBeHidden();
    } else {
      // Desktop layout assertions
      await expect(page.locator('[data-testid="desktop-nav"]')).toBeVisible();
      await expect(page.locator('[data-testid="mobile-menu"]')).toBeHidden();
    }
  });
});
```
```

## 4. Advanced E2E Testing Patterns

### 4.1 Network Interception and Mocking

```typescript
// Network mocking strategies
test('mocks API responses for consistent testing', async ({ page }) => {
  // Mock successful response
  await page.route('**/api/user/profile', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: '123',
        name: 'Test User',
        email: 'test@example.com'
      })
    });
  });
  
  // Mock error response
  await page.route('**/api/payment/process', async route => {
    await route.fulfill({
      status: 500,
      body: 'Payment processing failed'
    });
  });
  
  // Mock slow network
  await page.route('**/api/courses', async route => {
    await page.waitForTimeout(3000); // Simulate slow response
    await route.continue();
  });
  
  // Intercept and modify requests
  await page.route('**/api/analytics', async route => {
    const postData = route.request().postData();
    console.log('Analytics event:', postData);
    await route.continue();
  });
});
```

### 4.2 Authentication State Management

```typescript
// Reusable authentication setup
async function authenticateUser(page: Page, role: 'student' | 'instructor' | 'admin') {
  const users = {
    student: { email: 'student@test.com', password: 'student123' },
    instructor: { email: 'instructor@test.com', password: 'instructor123' },
    admin: { email: 'admin@test.com', password: 'admin123' }
  };
  
  const user = users[role];
  
  // Option 1: UI-based login
  await page.goto('/login');
  await page.fill('[data-testid="email"]', user.email);
  await page.fill('[data-testid="password"]', user.password);
  await page.click('[data-testid="login-button"]');
  await page.waitForURL('/dashboard');
  
  // Option 2: API-based login (faster)
  const response = await page.request.post('/api/auth/login', {
    data: user
  });
  const { token } = await response.json();
  
  // Set authentication token
  await page.context().addCookies([{
    name: 'auth-token',
    value: token,
    domain: 'localhost',
    path: '/'
  }]);
}

// Use in tests
test.beforeEach(async ({ page }) => {
  await authenticateUser(page, 'student');
});
```

### 4.3 Visual Regression Testing

```
VISUAL REGRESSION PROMPT:
Add visual regression tests at critical UI states.

VISUAL CHECKPOINTS:
1. Initial page load
2. After user interactions
3. Error states
4. Loading states
5. Success states
6. Different data states (empty, single, multiple items)

IMPLEMENTATION:
```typescript
test('visual regression for course dashboard', async ({ page }) => {
  await page.goto('/dashboard');
  
  // Full page screenshot
  await expect(page).toHaveScreenshot('dashboard-full.png', {
    fullPage: true,
    animations: 'disabled'
  });
  
  // Component-level screenshot
  const courseCard = page.locator('[data-testid="course-card"]').first();
  await expect(courseCard).toHaveScreenshot('course-card.png');
  
  // Hover state
  await courseCard.hover();
  await expect(courseCard).toHaveScreenshot('course-card-hover.png');
  
  // Error state
  await page.route('**/api/courses', route => route.abort());
  await page.reload();
  await expect(page.locator('.error-message')).toHaveScreenshot('error-state.png');
  
  // Loading state
  await page.route('**/api/courses', async route => {
    await page.waitForTimeout(1000);
    await route.continue();
  });
  await page.reload();
  await expect(page.locator('.loading-skeleton')).toHaveScreenshot('loading-state.png', {
    animations: 'disabled'
  });
});
```
```

### 4.4 Performance Monitoring During E2E

```typescript
test('monitors performance metrics', async ({ page }) => {
  // Collect performance metrics
  const metrics: any[] = [];
  
  page.on('load', async () => {
    const performanceTiming = JSON.parse(
      await page.evaluate(() => JSON.stringify(window.performance.timing))
    );
    
    metrics.push({
      url: page.url(),
      domContentLoaded: performanceTiming.domContentLoadedEventEnd - performanceTiming.navigationStart,
      load: performanceTiming.loadEventEnd - performanceTiming.navigationStart
    });
  });
  
  // Navigate through journey
  await page.goto('/');
  await page.click('a[href="/courses"]');
  await page.click('[data-testid="course-link"]');
  
  // Assert performance budgets
  for (const metric of metrics) {
    expect(metric.domContentLoaded).toBeLessThan(3000); // 3 seconds
    expect(metric.load).toBeLessThan(5000); // 5 seconds
  }
  
  // Core Web Vitals
  const vitals = await page.evaluate(() => {
    return new Promise((resolve) => {
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        resolve({
          LCP: entries.find(e => e.entryType === 'largest-contentful-paint')?.startTime,
          FID: entries.find(e => e.entryType === 'first-input')?.processingStart,
          CLS: entries.filter(e => e.entryType === 'layout-shift')
            .reduce((sum, entry: any) => sum + entry.value, 0)
        });
      }).observe({ entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift'] });
    });
  });
  
  expect(vitals.LCP).toBeLessThan(2500); // Good LCP
  expect(vitals.CLS).toBeLessThan(0.1); // Good CLS
});
```

## 5. Accessibility Testing Integration

### 5.1 Comprehensive A11y Checks

```typescript
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility compliance', () => {
  test('meets WCAG 2.1 AA standards', async ({ page }) => {
    await page.goto('/');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2aa', 'wcag21aa'])
      .exclude('[data-testid="third-party-widget"]') // Exclude external content
      .analyze();
    
    // Log violations for debugging
    if (accessibilityScanResults.violations.length > 0) {
      console.table(accessibilityScanResults.violations.map(v => ({
        id: v.id,
        impact: v.impact,
        description: v.description,
        nodes: v.nodes.length
      })));
    }
    
    expect(accessibilityScanResults.violations).toEqual([]);
  });
  
  test('keyboard navigation works correctly', async ({ page }) => {
    await page.goto('/');
    
    // Tab through interactive elements
    await page.keyboard.press('Tab');
    await expect(page.locator(':focus')).toHaveAttribute('data-testid', 'skip-link');
    
    await page.keyboard.press('Tab');
    await expect(page.locator(':focus')).toHaveAttribute('data-testid', 'main-nav');
    
    // Test keyboard interaction
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL('/dashboard');
    
    // Test escape key for modals
    await page.click('[data-testid="open-modal"]');
    await page.keyboard.press('Escape');
    await expect(page.locator('[role="dialog"]')).toBeHidden();
  });
  
  test('screen reader announcements', async ({ page }) => {
    await page.goto('/');
    
    // Check for ARIA live regions
    const liveRegion = page.locator('[aria-live="polite"]');
    
    // Trigger an action that should announce
    await page.click('[data-testid="add-to-cart"]');
    
    // Verify announcement
    await expect(liveRegion).toContainText('Item added to cart');
  });
});
```

## 6. Data-Driven Testing

### 6.1 Test Data Management

```typescript
// Test data fixtures
const testData = {
  users: [
    { email: 'new.user@test.com', password: 'Test123!', role: 'student' },
    { email: 'existing.user@test.com', password: 'Test456!', role: 'instructor' }
  ],
  courses: [
    { title: 'JavaScript Basics', category: 'Programming', price: 49.99 },
    { title: 'Advanced React', category: 'Frontend', price: 79.99 }
  ],
  invalidInputs: [
    { email: 'invalid-email', error: 'Invalid email format' },
    { email: 'a@b', error: 'Email domain is invalid' },
    { password: '123', error: 'Password too short' },
    { password: 'noNumbers', error: 'Password must contain numbers' }
  ]
};

test.describe('Data-driven tests', () => {
  // Parameterized tests
  for (const user of testData.users) {
    test(`registration flow for ${user.role}`, async ({ page }) => {
      await page.goto('/register');
      await page.fill('[data-testid="email"]', user.email);
      await page.fill('[data-testid="password"]', user.password);
      await page.selectOption('[data-testid="role"]', user.role);
      await page.click('[data-testid="register-button"]');
      
      await expect(page).toHaveURL('/welcome');
      await expect(page.locator('h1')).toContainText(`Welcome, ${user.role}`);
    });
  }
  
  // Negative test cases
  testData.invalidInputs.forEach(({ email, password, error }) => {
    test(`shows error for invalid input: ${error}`, async ({ page }) => {
      await page.goto('/register');
      
      if (email) await page.fill('[data-testid="email"]', email);
      if (password) await page.fill('[data-testid="password"]', password);
      
      await page.click('[data-testid="register-button"]');
      await expect(page.locator('.error-message')).toContainText(error);
    });
  });
});
```

### 6.2 Dynamic Test Data Generation

```typescript
import { faker } from '@faker-js/faker';

function generateTestUser() {
  return {
    email: faker.internet.email(),
    password: faker.internet.password({ length: 12, memorable: false }),
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    phone: faker.phone.number(),
    address: {
      street: faker.location.streetAddress(),
      city: faker.location.city(),
      zip: faker.location.zipCode()
    }
  };
}

test('handles dynamic user data', async ({ page }) => {
  const testUser = generateTestUser();
  
  await page.goto('/register');
  await page.fill('[data-testid="email"]', testUser.email);
  await page.fill('[data-testid="password"]', testUser.password);
  await page.fill('[data-testid="firstName"]', testUser.firstName);
  await page.fill('[data-testid="lastName"]', testUser.lastName);
  
  await page.click('[data-testid="register-button"]');
  
  // Verify registration with dynamic data
  await expect(page).toHaveURL('/profile');
  await expect(page.locator('[data-testid="user-email"]')).toContainText(testUser.email);
});
```

## 7. Error Recovery and Flaky Test Prevention

### 7.1 Retry Strategies

```typescript
// Smart retry with different strategies
async function retryAction(
  action: () => Promise<void>,
  options: {
    retries?: number;
    delay?: number;
    backoff?: boolean;
  } = {}
) {
  const { retries = 3, delay = 1000, backoff = true } = options;
  
  for (let i = 0; i < retries; i++) {
    try {
      await action();
      return;
    } catch (error) {
      if (i === retries - 1) throw error;
      
      const waitTime = backoff ? delay * Math.pow(2, i) : delay;
      await page.waitForTimeout(waitTime);
    }
  }
}

test('handles flaky network conditions', async ({ page }) => {
  await page.goto('/dashboard');
  
  // Retry flaky action
  await retryAction(async () => {
    await page.click('[data-testid="load-more"]');
    await expect(page.locator('[data-testid="course-card"]')).toHaveCount(20);
  }, { retries: 3, delay: 2000 });
});
```

### 7.2 Smart Waiting Strategies

```
WAIT STRATEGY PROMPT:
Generate tests with intelligent waiting strategies.

WAITING PATTERNS:
1. Wait for specific network requests
2. Wait for DOM mutations to stabilize
3. Wait for animations to complete
4. Wait for specific text content
5. Custom wait conditions

IMPLEMENTATION:
```typescript
test('uses smart waiting strategies', async ({ page }) => {
  await page.goto('/');
  
  // Wait for specific API call
  const responsePromise = page.waitForResponse('**/api/courses');
  await page.click('[data-testid="load-courses"]');
  const response = await responsePromise;
  expect(response.status()).toBe(200);
  
  // Wait for element with specific text
  await page.waitForSelector('text=Course loaded successfully');
  
  // Wait for animations
  await page.locator('.animated-element').waitFor({ state: 'visible' });
  await page.waitForTimeout(300); // Animation duration
  
  // Custom wait condition
  await page.waitForFunction(() => {
    const elements = document.querySelectorAll('[data-testid="course-card"]');
    return elements.length >= 10;
  });
  
  // Wait for DOM to stabilize
  await page.waitForLoadState('domcontentloaded');
  await page.waitForLoadState('networkidle');
});
```
```

## 8. Test Organization and Reporting

### 8.1 Test Suite Structure

```typescript
// Organized test structure
test.describe('E2E Test Suite', () => {
  test.describe('Authentication Flows', () => {
    test.describe('Registration', () => {
      test('new user registration', async ({ page }) => {});
      test('registration with existing email', async ({ page }) => {});
      test('registration validation', async ({ page }) => {});
    });
    
    test.describe('Login', () => {
      test('successful login', async ({ page }) => {});
      test('login with invalid credentials', async ({ page }) => {});
      test('password reset flow', async ({ page }) => {});
    });
  });
  
  test.describe('Core Features', () => {
    test.describe('Course Management', () => {
      test('browse courses', async ({ page }) => {});
      test('enroll in course', async ({ page }) => {});
      test('complete lesson', async ({ page }) => {});
    });
  });
  
  test.describe('Payment Flows', () => {
    test.describe('Checkout', () => {
      test('successful payment', async ({ page }) => {});
      test('payment failure handling', async ({ page }) => {});
      test('apply discount code', async ({ page }) => {});
    });
  });
});
```

### 8.2 Custom Reporting

```typescript
import { Reporter, TestCase, TestResult } from '@playwright/test/reporter';

class CustomE2EReporter implements Reporter {
  onTestEnd(test: TestCase, result: TestResult) {
    if (result.status === 'failed') {
      console.log(`❌ Failed: ${test.title}`);
      console.log(`   Journey: ${test.parent?.title}`);
      console.log(`   Duration: ${result.duration}ms`);
      console.log(`   Error: ${result.error?.message}`);
      
      // Log failed step
      const failedStep = result.steps.find(s => s.error);
      if (failedStep) {
        console.log(`   Failed at: ${failedStep.title}`);
      }
    }
  }
  
  onEnd() {
    console.log('\n📊 E2E Test Summary:');
    console.log(`   Critical Paths: ${this.criticalPathResults()}`);
    console.log(`   Browser Coverage: ${this.browserCoverage()}`);
    console.log(`   Performance: ${this.performanceMetrics()}`);
  }
}
```

## 9. Command Workflow

### 9.1 Execution Flow

```typescript
async function executeE2ETestWriter(options: Options) {
  // 1. Analyze user journey
  const journey = await mapUserJourney(options.journey || options.page);
  
  // 2. Check for existing Page Objects
  const existingPOMs = await findPageObjects();
  const requiredPOMs = identifyRequiredPOMs(journey);
  
  // 3. Generate missing Page Objects
  for (const pom of requiredPOMs) {
    if (!existingPOMs.includes(pom)) {
      await generatePageObject(pom);
    }
  }
  
  // 4. Generate E2E tests
  const tests = await generateE2ETests(journey, {
    includeCrossBrowser: options.crossBrowser,
    includeAccessibility: options.accessibility,
    includeVisualRegression: options.visual,
    includePerformance: options.performance
  });
  
  // 5. Add data fixtures
  const fixtures = await generateTestData(journey);
  
  // 6. Write test files
  const testPath = getE2ETestPath(journey.name);
  await writeFile(testPath, tests);
  await writeFile(`${testPath}.fixtures.ts`, fixtures);
  
  // 7. Run initial test
  await runPlaywrightTest(testPath);
  
  // 8. Update tracking
  await updateTestDatabase(journey.name, 'e2e', testPath);
}
```

## Usage Examples

```bash
# Test complete user journey
/e2e-test-writer --journey="student-enrollment"

# Test specific page
/e2e-test-writer --page="course-dashboard"

# Critical paths only
/e2e-test-writer --critical

# Full cross-browser suite
/e2e-test-writer --journey="checkout" --cross-browser

# With accessibility checks
/e2e-test-writer --journey="registration" --accessibility

# Visual regression included
/e2e-test-writer --page="landing" --visual

# From test discovery
/e2e-test-writer --from-discovery

# Everything
/e2e-test-writer --journey="complete-course" --cross-browser --accessibility --visual
```

## Key Features

- **User journey mapping** for realistic test scenarios
- **Automatic Page Object Model** generation
- **Cross-browser testing** with device emulation
- **Visual regression** testing integration
- **Accessibility testing** with axe-core
- **Network mocking** and interception
- **Performance monitoring** during tests
- **Data-driven testing** with fixtures
- **Smart retry strategies** for flaky test prevention
- **Comprehensive error handling** and recovery