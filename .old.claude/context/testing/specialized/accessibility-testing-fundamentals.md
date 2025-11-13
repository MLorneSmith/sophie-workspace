---
# Identity
id: "accessibility-testing-fundamentals"
title: "Accessibility Testing Fundamentals"
version: "2.1.0"
category: "pattern"

# Discovery
description: "Pragmatic accessibility testing using HybridAccessibilityTester for WCAG 2.1 AA compliance without false positives in the SlideHeroes platform"
tags: ["accessibility", "testing", "wcag", "hybrid", "playwright", "lighthouse", "pragmatic", "a11y", "aria", "keyboard", "screen-reader"]

# Relationships
dependencies: []
cross_references:
  - id: "e2e-testing-fundamentals"
    type: "related"
    description: "E2E testing patterns that include accessibility checks"
  - id: "testing-fundamentals"
    type: "prerequisite"
    description: "Core testing principles and philosophy"

# Maintenance
created: "2025-09-15"
last_updated: "2025-09-15"
author: "create-context"
---

# Accessibility Testing Fundamentals

## Overview

SlideHeroes implements accessibility testing through a custom **HybridAccessibilityTester** class that combines multiple validation approaches for pragmatic WCAG 2.1 AA compliance. This approach was adopted after migrating from axe-core (commit `a43ee6da`) to reduce false positives while maintaining effective accessibility validation.

The testing strategy prioritizes **real user impact** over perfect compliance scores, allowing development to proceed while tracking known issues separately.

### Why Accessibility Matters

- **Legal Requirements**: ADA compliance, Section 508 for government contracts
- **Business Impact**: Expanded market reach (15% of global population has disabilities)
- **Brand Reputation**: Inclusive design demonstrates social responsibility
- **SEO Benefits**: Accessible sites rank better in search results
- **User Retention**: Better experience for all users, not just those with disabilities

## Key Concepts

### WCAG 2.1 Core Principles (POUR)

- **Perceivable**: Information must be presentable in ways users can perceive
- **Operable**: Interface components must be operable by all users
- **Understandable**: Information and UI operation must be understandable
- **Robust**: Content must work with various assistive technologies

### Testing Approach

- **HybridAccessibilityTester**: Custom testing class combining Lighthouse, manual WCAG checks, and contrast validation
- **Pragmatic Compliance**: Focus on critical/serious violations that affect real users
- **Environment Flexibility**: Skip patterns for CI/CD compatibility (`skipLighthouse`, `skipContrast`)
- **Risk-Based Testing**: Prioritize critical user journeys over comprehensive coverage
- **Universal Design**: Support users with diverse abilities including cognitive disabilities

## Implementation Details

### Core Architecture

The HybridAccessibilityTester combines three validation approaches:

1. **Lighthouse Integration**
   - Automated accessibility audits
   - Often skipped in CI due to Chrome launch issues
   - Provides comprehensive automated checks when available

2. **Custom WCAG Validation**
   - Missing alt text, empty buttons, form labels
   - Heading hierarchy validation
   - ARIA attribute verification
   - Landmark structure checks

3. **Color Contrast Testing**
   - Custom WCAG contrast calculations (4.5:1 normal, 3:1 large text)
   - Luminance and ratio calculations
   - Often skipped due to brand color constraints

### Violation Impact Levels

```typescript
interface A11yViolation {
  id: string;
  impact: "critical" | "serious" | "moderate" | "minor";
  description: string;
  help: string;
  helpUrl?: string;
  nodes: Array<{ html: string; target: string[] }>;
}
```

- **Critical/Serious**: Block releases, must fix immediately
- **Moderate**: Track in backlog, fix in next sprint
- **Minor**: Nice to have, low priority

## Code Examples

### Basic Usage Pattern

```typescript
import { HybridAccessibilityTester } from "./hybrid-a11y";

test('accessibility compliance', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');

  const tester = new HybridAccessibilityTester(page);
  const results = await tester.runFullAudit({
    wcagLevel: "AA",
    skipLighthouse: true,  // Common in CI environments
    skipContrast: true     // Known brand color issues
  });

  // Focus on critical violations only
  expect(
    results.wcag.violations.filter(
      v => v.impact === "critical" || v.impact === "serious"
    ).length
  ).toBe(0);
});
```

### Keyboard Navigation Testing

```typescript
test('keyboard navigation and skip links', async ({ page }) => {
  await page.goto('/');

  // Test skip link (important for screen reader users)
  await page.keyboard.press('Tab');
  const skipLink = page.getByRole('link', { name: 'Skip to main content' });
  if (await skipLink.count() > 0) {
    await expect(skipLink).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('main')).toBeFocused();
  }

  // Test tab order through interactive elements
  const interactiveSelectors = ["button", "a[href]", "input", "select", "textarea"];
  for (const selector of interactiveSelectors) {
    const elements = await page.locator(selector).all();
    for (const element of elements.slice(0, 5)) {
      if (await element.isVisible()) {
        const tabindex = await element.getAttribute("tabindex");
        // Negative tabindex should have aria-hidden
        if (tabindex === "-1") {
          const ariaHidden = await element.getAttribute("aria-hidden");
          expect(ariaHidden).toBe("true");
        }
      }
    }
  }
});
```

### Modal Focus Management

```typescript
test('modal dialog accessibility', async ({ page }) => {
  await page.goto('/course/lesson');

  const triggerButton = page.getByRole('button', { name: 'Settings' });
  await triggerButton.click();

  const dialog = page.getByRole('dialog');
  if (await dialog.count() > 0) {
    // Check modal attributes
    await expect(dialog).toHaveAttribute('aria-modal', 'true');

    // Verify focus moved to modal
    const closeButton = dialog.getByRole('button', { name: 'Close' });
    await expect(closeButton).toBeFocused();

    // Test escape key closes modal and returns focus
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(triggerButton).toBeFocused();
  }
});
```

### Mobile Accessibility

```typescript
test('mobile touch targets', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto('/');

  // Check touch target sizes (WCAG 2.1 requires 44x44px minimum)
  const buttons = page.getByRole('button');
  for (let i = 0; i < Math.min(5, await buttons.count()); i++) {
    const button = buttons.nth(i);
    const box = await button.boundingBox();
    if (box) {
      expect(box.width).toBeGreaterThanOrEqual(44);
      expect(box.height).toBeGreaterThanOrEqual(44);
    }
  }
});
```

### Screen Reader Landmarks

```typescript
test('semantic landmarks', async ({ page }) => {
  await page.goto('/');

  // Verify proper landmark structure
  const landmarks = {
    banner: page.getByRole('banner'),      // Header
    navigation: page.getByRole('navigation'), // Nav
    main: page.getByRole('main'),          // Main content
    contentinfo: page.getByRole('contentinfo') // Footer
  };

  for (const [role, element] of Object.entries(landmarks)) {
    if (await element.count() > 0) {
      await expect(element.first()).toBeVisible();
    }
  }
});
```

## Related Files

- `/apps/e2e/tests/accessibility/hybrid-a11y.ts` - HybridAccessibilityTester implementation
- `/tests/accessibility/accessibility.spec.ts` - Main accessibility test suite
- `/apps/e2e/tests/accessibility/accessibility-hybrid.spec.ts` - E2E accessibility tests
- `/apps/e2e/.axerc.json` - Legacy axe configuration (deprecated)

## Common Patterns

### CI/CD Configuration

```typescript
// Standard CI configuration - skip unstable checks
const ciConfig = {
  wcagLevel: "AA",
  skipLighthouse: true,  // Chrome launch issues in containers
  skipContrast: true     // Known brand color violations
};
```

### Progressive Testing Strategy

```typescript
// Phase 1: Critical paths only
const criticalPaths = ["/", "/auth/sign-in", "/auth/sign-up"];

// Phase 2: Authenticated flows
const authenticatedPaths = ["/home", "/home/ai/canvas", "/home/course"];

// Phase 3: Full coverage (future)
const fullCoverage = ["/**/*.tsx"];
```

### Critical Elements to Test

The HybridAccessibilityTester validates these critical patterns:

- **Images**: Alt text presence and quality
- **Buttons**: Text content or aria-label
- **Forms**: Label associations and error handling
- **Headings**: Proper hierarchy (h1 → h2 → h3)
- **Focus**: Keyboard navigation and visible indicators
- **Modals**: Focus trap and return focus on close
- **Live Regions**: Dynamic content announcements
- **Tables**: Proper headers and scope attributes
- **Mobile**: Touch target sizes (44x44px minimum)

## Troubleshooting

### Issue: Lighthouse Failures in CI

**Symptoms**: `Cannot launch Chrome` or `ES module` errors
**Cause**: Container environment incompatibility
**Solution**: Set `skipLighthouse: true` in test configuration

### Issue: Color Contrast Failures

**Symptoms**: Brand colors fail WCAG contrast requirements
**Cause**: Design requirements conflict with WCAG ratios
**Solution**:

```typescript
{
  skipContrast: true  // Track in GitHub issue instead
}
```

### Issue: False Positives from Automated Tools

**Symptoms**: axe-core reports violations that don't affect users
**Cause**: Overly strict automated validation
**Solution**: Migration to HybridAccessibilityTester with manual validation

### Issue: Flaky Test Results

**Symptoms**: Tests pass locally but fail in CI
**Cause**: Network timing or dynamic content
**Solution**:

```typescript
await page.waitForLoadState('networkidle');
// Or wait for specific elements
await page.waitForSelector('[data-testid="content-loaded"]');
```

### Issue: Focus Not Visible

**Symptoms**: Keyboard navigation works but focus indicators missing
**Cause**: CSS removes outline without replacement
**Solution**: Ensure focus styles use outline, box-shadow, or border changes

## See Also

- [[e2e-testing-fundamentals]] - End-to-end testing patterns and Playwright usage
- [[testing-fundamentals]] - Core testing philosophy and best practices
- [[cicd-pipeline-updated-design]] - CI/CD integration for accessibility tests
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/) - Official WCAG reference
- [WebAIM Resources](https://webaim.org/) - Practical accessibility guidance
