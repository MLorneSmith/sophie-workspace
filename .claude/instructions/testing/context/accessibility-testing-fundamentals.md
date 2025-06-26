# Accessibility Testing Fundamentals

This document provides comprehensive guidance for writing accessibility tests using axe-core and other accessibility testing tools in the SlideHeroes platform.

## Core Accessibility Principles

### 1. WCAG 2.1 AA Compliance
- **Perceivable**: Information must be presentable in ways users can perceive
- **Operable**: Interface components must be operable by all users
- **Understandable**: Information and UI operation must be understandable
- **Robust**: Content must be robust enough for various assistive technologies

### 2. Universal Design Focus
- Design for users with diverse abilities and needs
- Ensure keyboard-only navigation works seamlessly
- Provide proper screen reader support
- Maintain sufficient color contrast ratios
- Support users with cognitive disabilities

### 3. Legal and Business Requirements
- ADA (Americans with Disabilities Act) compliance
- Section 508 requirements for government accessibility
- Brand reputation and inclusive user experience
- Expanded market reach and user retention

## axe-core Integration Patterns

### Basic axe-core Setup

```typescript
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility Tests', () => {
  test('homepage accessibility compliance', async ({ page }) => {
    await page.goto('/');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });
});
```

### Advanced axe Configuration

```typescript
test('AI canvas accessibility with custom rules', async ({ page }) => {
  await page.goto('/ai/canvas');
  
  const accessibilityScanResults = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'best-practice'])
    .exclude('[data-testid="third-party-widget"]') // Exclude external widgets
    .include('[data-testid="main-content"]') // Focus on main content
    .disableRules(['color-contrast']) // Temporarily disable for branded colors
    .analyze();

  expect(accessibilityScanResults.violations).toEqual([]);
  
  // Check for incomplete tests that need manual verification
  if (accessibilityScanResults.incomplete.length > 0) {
    console.warn('Manual accessibility verification needed for:', 
      accessibilityScanResults.incomplete.map(item => item.id)
    );
  }
});
```

### Component-Level Testing

```typescript
// Test specific components in isolation
test('CourseProgressBar accessibility', async ({ page }) => {
  await page.goto('/course/test-course');
  
  const progressBar = page.getByRole('progressbar');
  
  // axe-core scan
  const results = await new AxeBuilder({ page })
    .include('[role="progressbar"]')
    .analyze();
    
  expect(results.violations).toEqual([]);
  
  // Manual attribute verification
  await expect(progressBar).toHaveAttribute('aria-valuemin', '0');
  await expect(progressBar).toHaveAttribute('aria-valuemax', '100');
  await expect(progressBar).toHaveAttribute('aria-valuenow');
  await expect(progressBar).toHaveAttribute('aria-label');
});
```

## Critical Accessibility Test Scenarios

### 1. Keyboard Navigation

```typescript
test.describe('Keyboard Navigation', () => {
  test('complete course workflow using only keyboard', async ({ page }) => {
    await page.goto('/course/introduction-to-ai');
    
    // Tab through navigation
    await page.keyboard.press('Tab');
    await expect(page.getByRole('link', { name: 'Home' })).toBeFocused();
    
    await page.keyboard.press('Tab');
    await expect(page.getByRole('link', { name: 'Courses' })).toBeFocused();
    
    // Navigate to lesson using keyboard
    await page.keyboard.press('Enter');
    await page.keyboard.press('Tab'); // Tab to first lesson
    await page.keyboard.press('Enter'); // Enter lesson
    
    // Complete lesson using keyboard
    await page.keyboard.press('Tab'); // Tab to complete button
    await expect(page.getByRole('button', { name: 'Mark Complete' })).toBeFocused();
    await page.keyboard.press('Enter');
    
    // Verify completion feedback is announced
    await expect(page.getByText('Lesson completed')).toBeVisible();
    await expect(page.getByRole('status')).toContainText('Lesson completed');
  });

  test('AI canvas keyboard workflow', async ({ page }) => {
    await page.goto('/ai/canvas');
    
    // Tab to idea generation
    await page.keyboard.press('Tab');
    await expect(page.getByLabel('Presentation topic')).toBeFocused();
    
    // Type and generate ideas
    await page.keyboard.type('AI in Education');
    await page.keyboard.press('Tab'); // Tab to generate button
    await page.keyboard.press('Enter');
    
    // Navigate through generated ideas using keyboard
    await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { name: /Select idea/ }).first()).toBeFocused();
    
    await page.keyboard.press('Enter'); // Select first idea
    await expect(page.getByText('Idea selected')).toBeVisible();
  });

  test('skip links and focus management', async ({ page }) => {
    await page.goto('/course/complex-lesson');
    
    // Test skip link
    await page.keyboard.press('Tab');
    await expect(page.getByRole('link', { name: 'Skip to main content' })).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('main')).toBeFocused();
    
    // Test modal focus management
    await page.getByRole('button', { name: 'Settings' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Close' })).toBeFocused();
    
    // Escape closes modal and returns focus
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toBeHidden();
    await expect(page.getByRole('button', { name: 'Settings' })).toBeFocused();
  });
});
```

### 2. Screen Reader Compatibility

```typescript
test.describe('Screen Reader Support', () => {
  test('course content has proper semantic structure', async ({ page }) => {
    await page.goto('/course/introduction-to-ai');
    
    // Check heading hierarchy
    const headings = page.getByRole('heading');
    await expect(headings.first()).toHaveAttribute('aria-level', '1');
    
    // Verify proper landmarks
    await expect(page.getByRole('banner')).toBeVisible(); // Header
    await expect(page.getByRole('navigation')).toBeVisible(); // Nav
    await expect(page.getByRole('main')).toBeVisible(); // Main content
    await expect(page.getByRole('contentinfo')).toBeVisible(); // Footer
    
    // Check list structure for course content
    const lessonList = page.getByRole('list', { name: 'Course lessons' });
    await expect(lessonList).toBeVisible();
    
    const listItems = lessonList.getByRole('listitem');
    expect(await listItems.count()).toBeGreaterThan(0);
  });

  test('form accessibility and error handling', async ({ page }) => {
    await page.goto('/profile/edit');
    
    // Check form structure
    const form = page.getByRole('form', { name: 'Profile settings' });
    await expect(form).toBeVisible();
    
    // Verify label associations
    const emailField = page.getByRole('textbox', { name: 'Email address' });
    await expect(emailField).toHaveAttribute('aria-labelledby');
    
    // Test error state accessibility
    await emailField.fill('invalid-email');
    await page.getByRole('button', { name: 'Save changes' }).click();
    
    // Error should be announced and linked to field
    await expect(page.getByRole('alert')).toContainText('Please enter a valid email');
    await expect(emailField).toHaveAttribute('aria-invalid', 'true');
    await expect(emailField).toHaveAttribute('aria-describedby');
  });

  test('dynamic content announcements', async ({ page }) => {
    await page.goto('/ai/canvas');
    
    // Start AI generation
    await page.getByLabel('Presentation topic').fill('Test topic');
    await page.getByRole('button', { name: 'Generate ideas' }).click();
    
    // Verify loading state is announced
    await expect(page.getByRole('status')).toContainText('Generating ideas');
    
    // Verify completion is announced
    await expect(page.getByRole('status')).toContainText(/Generated \d+ ideas/);
    
    // Check live region for updates
    const liveRegion = page.getByRole('log');
    await expect(liveRegion).toBeVisible();
  });
});
```

### 3. Color and Visual Accessibility

```typescript
test.describe('Visual Accessibility', () => {
  test('color contrast compliance', async ({ page }) => {
    await page.goto('/');
    
    // Run axe with specific color contrast rules
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2aa'])
      .withRules(['color-contrast'])
      .analyze();
      
    expect(results.violations).toEqual([]);
  });

  test('focus indicators are visible', async ({ page }) => {
    await page.goto('/course/introduction');
    
    // Tab through interactive elements
    const interactiveElements = [
      page.getByRole('button', { name: 'Start lesson' }),
      page.getByRole('link', { name: 'Next lesson' }),
      page.getByRole('textbox', { name: 'Notes' })
    ];
    
    for (const element of interactiveElements) {
      await element.focus();
      
      // Check that focus is visible (this would need custom CSS checking)
      const focusedElement = page.locator(':focus');
      await expect(focusedElement).toBe(element);
      
      // Verify focus indicator exists (outline, box-shadow, etc.)
      const computedStyle = await element.evaluate(el => {
        const style = window.getComputedStyle(el, ':focus');
        return {
          outline: style.outline,
          boxShadow: style.boxShadow,
          border: style.border
        };
      });
      
      // Ensure some form of focus indicator exists
      const hasFocusIndicator = 
        computedStyle.outline !== 'none' ||
        computedStyle.boxShadow !== 'none' ||
        computedStyle.border !== 'none';
        
      expect(hasFocusIndicator).toBe(true);
    }
  });

  test('reduced motion preferences', async ({ page }) => {
    // Simulate prefers-reduced-motion
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/ai/canvas');
    
    // Verify animations are disabled/reduced
    const animatedElement = page.getByTestId('idea-card');
    
    const animationDuration = await animatedElement.evaluate(el => {
      const style = window.getComputedStyle(el);
      return style.animationDuration;
    });
    
    // Animation should be disabled or very short
    expect(animationDuration === '0s' || animationDuration === '0.1s').toBe(true);
  });
});
```

### 4. Form and Input Accessibility

```typescript
test.describe('Form Accessibility', () => {
  test('quiz form accessibility', async ({ page }) => {
    await page.goto('/course/lesson/quiz');
    
    // Check fieldset and legend structure
    const fieldset = page.getByRole('group', { name: 'Question 1' });
    await expect(fieldset).toBeVisible();
    
    // Verify radio button group
    const radioGroup = page.getByRole('radiogroup', { name: 'Select your answer' });
    await expect(radioGroup).toBeVisible();
    
    const radioButtons = radioGroup.getByRole('radio');
    expect(await radioButtons.count()).toBeGreaterThan(1);
    
    // Check that each radio has proper labeling
    for (let i = 0; i < await radioButtons.count(); i++) {
      const radio = radioButtons.nth(i);
      await expect(radio).toHaveAttribute('name');
      await expect(radio).toHaveAccessibleName();
    }
    
    // Test keyboard navigation within radio group
    await radioButtons.first().focus();
    await page.keyboard.press('ArrowDown');
    await expect(radioButtons.nth(1)).toBeFocused();
    
    // Test form submission
    await radioButtons.first().click();
    await page.getByRole('button', { name: 'Submit answer' }).click();
    
    // Verify feedback is accessible
    await expect(page.getByRole('status')).toContainText('Answer submitted');
  });

  test('file upload accessibility', async ({ page }) => {
    await page.goto('/profile/avatar');
    
    const fileInput = page.getByLabel('Profile picture');
    await expect(fileInput).toHaveAttribute('type', 'file');
    await expect(fileInput).toHaveAttribute('accept', 'image/*');
    
    // Check drag and drop accessibility
    const dropZone = page.getByRole('button', { name: 'Upload profile picture' });
    await expect(dropZone).toBeVisible();
    await expect(dropZone).toHaveAttribute('aria-describedby');
    
    // Verify help text is associated
    const helpText = page.getByText('Supported formats: JPG, PNG');
    await expect(helpText).toBeVisible();
  });

  test('multi-step form accessibility', async ({ page }) => {
    await page.goto('/onboarding');
    
    // Check progress indicator
    const progressBar = page.getByRole('progressbar', { name: 'Setup progress' });
    await expect(progressBar).toHaveAttribute('aria-valuenow', '1');
    await expect(progressBar).toHaveAttribute('aria-valuemax', '3');
    
    // Navigate through steps
    await page.getByLabel('Organization name').fill('Test Company');
    await page.getByRole('button', { name: 'Continue' }).click();
    
    // Verify progress update
    await expect(progressBar).toHaveAttribute('aria-valuenow', '2');
    
    // Check step indicators
    const currentStep = page.getByRole('listitem', { name: 'Step 2: Team setup' });
    await expect(currentStep).toHaveAttribute('aria-current', 'step');
  });
});
```

### 5. Dynamic Content and ARIA

```typescript
test.describe('ARIA and Dynamic Content', () => {
  test('expandable content accessibility', async ({ page }) => {
    await page.goto('/course/lesson/details');
    
    const expandButton = page.getByRole('button', { name: 'Show lesson notes' });
    await expect(expandButton).toHaveAttribute('aria-expanded', 'false');
    
    const contentId = await expandButton.getAttribute('aria-controls');
    expect(contentId).toBeTruthy();
    
    // Expand content
    await expandButton.click();
    await expect(expandButton).toHaveAttribute('aria-expanded', 'true');
    
    const expandedContent = page.locator(`#${contentId}`);
    await expect(expandedContent).toBeVisible();
  });

  test('live regions for status updates', async ({ page }) => {
    await page.goto('/ai/canvas');
    
    // Check live regions exist
    const statusRegion = page.getByRole('status');
    const logRegion = page.getByRole('log');
    
    await expect(statusRegion).toBeVisible();
    await expect(logRegion).toBeVisible();
    
    // Trigger AI generation
    await page.getByLabel('Topic').fill('Test presentation');
    await page.getByRole('button', { name: 'Generate' }).click();
    
    // Verify status updates
    await expect(statusRegion).toContainText('Generating content');
    await expect(logRegion).toContainText('Started AI generation');
  });

  test('modal dialog accessibility', async ({ page }) => {
    await page.goto('/course/lesson');
    
    await page.getByRole('button', { name: 'Settings' }).click();
    
    const dialog = page.getByRole('dialog', { name: 'Lesson settings' });
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveAttribute('aria-modal', 'true');
    
    // Check focus trap
    const closeButton = dialog.getByRole('button', { name: 'Close' });
    await expect(closeButton).toBeFocused();
    
    // Test escape key
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    
    // Focus should return to trigger button
    await expect(page.getByRole('button', { name: 'Settings' })).toBeFocused();
  });

  test('data table accessibility', async ({ page }) => {
    await page.goto('/admin/course-analytics');
    
    const table = page.getByRole('table', { name: 'Course completion statistics' });
    await expect(table).toBeVisible();
    
    // Check table structure
    const columnHeaders = table.getByRole('columnheader');
    expect(await columnHeaders.count()).toBeGreaterThan(0);
    
    // Verify first column header has scope
    await expect(columnHeaders.first()).toHaveAttribute('scope', 'col');
    
    // Check row headers if present
    const rowHeaders = table.getByRole('rowheader');
    if (await rowHeaders.count() > 0) {
      await expect(rowHeaders.first()).toHaveAttribute('scope', 'row');
    }
    
    // Verify caption or summary
    const caption = table.locator('caption');
    if (await caption.count() > 0) {
      await expect(caption).toBeVisible();
    }
  });
});
```

## Mobile Accessibility Testing

```typescript
test.describe('Mobile Accessibility', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('touch accessibility on mobile', async ({ page }) => {
    await page.goto('/course/lesson');
    
    // Check touch target sizes (minimum 44x44px)
    const buttons = page.getByRole('button');
    
    for (let i = 0; i < await buttons.count(); i++) {
      const button = buttons.nth(i);
      const boundingBox = await button.boundingBox();
      
      if (boundingBox) {
        expect(boundingBox.width).toBeGreaterThanOrEqual(44);
        expect(boundingBox.height).toBeGreaterThanOrEqual(44);
      }
    }
  });

  test('mobile form accessibility', async ({ page }) => {
    await page.goto('/auth/signin');
    
    // Check input types for mobile keyboards
    const emailInput = page.getByLabel('Email');
    await expect(emailInput).toHaveAttribute('type', 'email');
    await expect(emailInput).toHaveAttribute('autocomplete', 'email');
    
    const passwordInput = page.getByLabel('Password');
    await expect(passwordInput).toHaveAttribute('type', 'password');
    await expect(passwordInput).toHaveAttribute('autocomplete', 'current-password');
  });
});
```

## Accessibility Testing Utils

```typescript
// utils/accessibility.ts
export class AccessibilityHelper {
  constructor(private page: Page) {}

  async runFullAccessibilityAudit(options: {
    tags?: string[];
    exclude?: string[];
    include?: string[];
  } = {}) {
    const { tags = ['wcag2a', 'wcag2aa'], exclude = [], include = [] } = options;
    
    let axeBuilder = new AxeBuilder({ page: this.page }).withTags(tags);
    
    if (exclude.length > 0) {
      axeBuilder = axeBuilder.exclude(exclude.join(', '));
    }
    
    if (include.length > 0) {
      axeBuilder = axeBuilder.include(include.join(', '));
    }
    
    const results = await axeBuilder.analyze();
    
    return {
      violations: results.violations,
      incomplete: results.incomplete,
      passes: results.passes,
      summary: {
        violationCount: results.violations.length,
        incompleteCount: results.incomplete.length,
        passCount: results.passes.length
      }
    };
  }

  async checkKeyboardNavigation(startElement?: Locator) {
    const focusableElements = await this.page.locator(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    ).all();
    
    if (startElement) {
      await startElement.focus();
    } else {
      await this.page.keyboard.press('Tab');
    }
    
    const navigationResults = [];
    
    for (let i = 0; i < focusableElements.length; i++) {
      const currentlyFocused = this.page.locator(':focus');
      const focusedElement = await currentlyFocused.first();
      
      navigationResults.push({
        elementIndex: i,
        tagName: await focusedElement.evaluate(el => el.tagName),
        role: await focusedElement.getAttribute('role'),
        accessibleName: await focusedElement.getAttribute('aria-label') || 
                        await focusedElement.textContent(),
        hasFocusIndicator: await this.checkFocusIndicator(focusedElement)
      });
      
      await this.page.keyboard.press('Tab');
    }
    
    return navigationResults;
  }

  private async checkFocusIndicator(element: Locator): Promise<boolean> {
    const styles = await element.evaluate(el => {
      const computedStyle = window.getComputedStyle(el, ':focus');
      return {
        outline: computedStyle.outline,
        boxShadow: computedStyle.boxShadow,
        borderColor: computedStyle.borderColor
      };
    });
    
    return styles.outline !== 'none' || 
           styles.boxShadow !== 'none' || 
           styles.borderColor !== 'transparent';
  }
}

// Usage in tests
test('comprehensive accessibility audit', async ({ page }) => {
  const a11yHelper = new AccessibilityHelper(page);
  
  await page.goto('/course/lesson');
  
  const auditResults = await a11yHelper.runFullAccessibilityAudit();
  expect(auditResults.violations).toEqual([]);
  
  const keyboardResults = await a11yHelper.checkKeyboardNavigation();
  expect(keyboardResults.every(result => result.hasFocusIndicator)).toBe(true);
});
```

## CI/CD Integration

```typescript
// Generate accessibility reports
test.afterEach(async ({ page }, testInfo) => {
  if (testInfo.status !== testInfo.expectedStatus) {
    const a11yHelper = new AccessibilityHelper(page);
    const auditResults = await a11yHelper.runFullAccessibilityAudit();
    
    await testInfo.attach('accessibility-report', {
      body: JSON.stringify(auditResults, null, 2),
      contentType: 'application/json'
    });
  }
});
```

## Best Practices Summary

### 1. Testing Strategy
- **Automated**: Use axe-core for WCAG compliance checking
- **Manual**: Test keyboard navigation and screen reader experience
- **Integrated**: Include in CI/CD pipeline with failure thresholds
- **Continuous**: Test accessibility with every component change

### 2. Priority Areas
- **Forms and inputs**: Critical for user interaction
- **Navigation**: Essential for site usability
- **Dynamic content**: Ensure updates are announced
- **Media**: Provide alternatives for audio/video content

### 3. Common Issues to Catch
- Missing or incorrect ARIA attributes
- Insufficient color contrast
- Inaccessible forms and error states
- Missing keyboard navigation
- Improper heading hierarchy
- Images without alt text

### 4. Testing Tools Integration
- **axe-core**: Automated WCAG compliance
- **Playwright**: Keyboard and interaction testing
- **Manual testing**: Screen reader and real user testing
- **Browser extensions**: axe DevTools for development

Remember: Accessibility testing should be integrated throughout the development process, not added as an afterthought. Automated tools catch many issues, but manual testing with real assistive technologies is essential for a truly accessible experience.