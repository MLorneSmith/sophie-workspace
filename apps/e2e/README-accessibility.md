# Accessibility Testing Guide

This directory contains automated accessibility tests for the SlideHeroes application using axe-core and Playwright.

## Overview

Our accessibility testing ensures WCAG 2.1 AA compliance across all major application pages and features. Tests run automatically in the CI/CD pipeline and can be executed locally for development.

## Quick Start

```bash
# Install dependencies
pnpm install

# Run all accessibility tests
pnpm a11y:test

# View accessibility report
pnpm a11y:report
```

## Test Coverage

### Public Pages
- Homepage (/)
- Authentication pages (/auth/sign-in, /auth/sign-up)

### Authenticated Pages
- Dashboard (/home)
- AI Canvas (/home/ai/canvas)
- Storyboard (/home/ai/storyboard)
- Course pages (/home/course)
- Account settings (/home/account)
- Kanban board (/home/kanban)

### Accessibility Checks
- **Color Contrast**: WCAG AA contrast ratios (4.5:1 for normal text, 3:1 for large text)
- **Keyboard Navigation**: All interactive elements accessible via keyboard
- **Screen Reader Compatibility**: Proper ARIA attributes and semantic HTML
- **Form Accessibility**: Labels, error messages, and input associations
- **Landmark Structure**: Proper heading hierarchy and page landmarks
- **Image Accessibility**: Alt text and decorative image handling

## Test Structure

```
tests/accessibility/
├── accessibility.spec.ts          # Main accessibility tests
├── authenticated-accessibility.spec.ts  # Tests requiring login
├── accessibility.po.ts            # Page object model for reusable methods
└── README-accessibility.md        # This documentation
```

## Configuration

### WCAG Standards
Tests are configured for WCAG 2.1 AA compliance using these tags:
- `wcag2a` - WCAG 2.0 Level A
- `wcag2aa` - WCAG 2.0 Level AA  
- `wcag21aa` - WCAG 2.1 Level AA

### Axe Configuration
Configuration is stored in `.axerc.json` and includes:
- Enabled rules for WCAG compliance
- Custom rule configurations
- Output formatting options

## Running Tests

### Local Development

```bash
# Run specific accessibility tests
pnpm playwright test tests/accessibility

# Run with UI mode for debugging
pnpm playwright test tests/accessibility --ui

# Run specific test file
pnpm playwright test tests/accessibility/accessibility.spec.ts

# Generate and view report
pnpm a11y:test && pnpm a11y:report
```

### CI/CD Pipeline

Accessibility tests run automatically on:
- Pull requests to main, staging, or dev branches
- When TypeScript/JavaScript files change
- Results are uploaded as GitHub Actions artifacts
- PR comments include accessibility test status

## Test Results

### Report Formats
- **HTML Report**: Interactive report with detailed violation information
- **Console Output**: Summary of violations and passes during test execution
- **GitHub Actions**: Artifact download and PR comment integration

### Understanding Violations

Each violation includes:
- **Rule ID**: Specific axe rule that failed
- **Impact Level**: critical, serious, moderate, or minor
- **Description**: What the violation means
- **Help**: How to fix the violation
- **Help URL**: Link to detailed guidance
- **Affected Elements**: Which DOM elements have the issue

### Example Violation Output
```
🚨 VIOLATIONS FOUND:

1. color-contrast (Impact: serious)
   Description: Elements must have sufficient color contrast
   Help: Ensure the contrast ratio is at least 4.5:1
   Help URL: https://dequeuniversity.com/rules/axe/4.4/color-contrast
   Affected elements: 2
   Element 1: .text-gray-400
   Element 2: .text-blue-300
```

## Authentication Setup

For authenticated page testing, configure test user credentials:

```bash
# Set in environment or .env.local
TEST_USER_EMAIL=test@example.com
TEST_USER_PASSWORD=testpassword
```

Tests will skip authenticated pages if credentials are not available.

## Debugging Accessibility Issues

### Using Browser DevTools
1. Open Chrome DevTools (F12)
2. Go to "Lighthouse" tab
3. Run accessibility audit
4. Compare results with our automated tests

### Common Issues and Fixes

#### Color Contrast
```css
/* ❌ Insufficient contrast */
.text-gray-400 { color: #9CA3AF; } /* 2.8:1 ratio */

/* ✅ Sufficient contrast */
.text-gray-600 { color: #4B5563; } /* 5.2:1 ratio */
```

#### Missing Labels
```tsx
{/* ❌ No label */}
<input type="email" placeholder="Enter email" />

{/* ✅ Proper label */}
<label htmlFor="email">Email Address</label>
<input id="email" type="email" placeholder="Enter email" />
```

#### Missing Alt Text
```tsx
{/* ❌ No alt text */}
<img src="/logo.png" />

{/* ✅ Descriptive alt text */}
<img src="/logo.png" alt="SlideHeroes company logo" />

{/* ✅ Decorative image */}
<img src="/pattern.png" alt="" role="presentation" />
```

#### Keyboard Navigation
```tsx
{/* ❌ Div button without keyboard support */}
<div onClick={handleClick}>Click me</div>

{/* ✅ Proper button element */}
<button onClick={handleClick}>Click me</button>

{/* ✅ Custom component with keyboard support */}
<div 
  role="button" 
  tabIndex={0}
  onClick={handleClick}
  onKeyDown={(e) => e.key === 'Enter' && handleClick()}
>
  Click me
</div>
```

## Integration with Development Workflow

### Pre-commit Hooks
Consider adding accessibility checks to pre-commit hooks:

```bash
# In .husky/pre-commit
pnpm a11y:test --reporter=line
```

### IDE Integration
Install accessibility linting in your IDE:
- **VS Code**: axe Accessibility Linter extension
- **WebStorm**: Accessibility inspection tools

### Component Development
Test components during development:

```typescript
// In component tests
import { AxeBuilder } from '@axe-core/playwright';

test('MyComponent is accessible', async ({ page }) => {
  await page.goto('/component-preview');
  
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa'])
    .analyze();
    
  expect(results.violations).toEqual([]);
});
```

## Best Practices

### Writing Accessible Code
1. Use semantic HTML elements (`<button>`, `<nav>`, `<main>`)
2. Provide text alternatives for images
3. Ensure sufficient color contrast
4. Support keyboard navigation
5. Use proper heading hierarchy
6. Label form inputs clearly
7. Provide focus indicators

### Test Maintenance
1. Run tests regularly during development
2. Update tests when adding new pages/features
3. Review and fix violations promptly
4. Keep axe-core dependencies updated
5. Monitor test performance and reliability

### Performance Considerations
- Tests run on CI for all PRs but are non-blocking
- Use `continue-on-error: true` to prevent CI failures
- Cache Playwright browsers for faster CI runs
- Run accessibility tests in parallel when possible

## Troubleshooting

### Common Issues

#### Tests Skip Authentication
- Verify `TEST_USER_EMAIL` and `TEST_USER_PASSWORD` are set
- Check that auth page object methods are working
- Ensure test user account exists and is active

#### False Positives
- Review violation details carefully
- Check if element is actually invisible/decorative
- Use axe rule configuration to disable problematic rules if justified

#### Performance Issues
- Reduce test scope for large pages
- Use `include`/`exclude` selectors to focus testing
- Consider splitting large test files

#### CI Failures
- Check browser installation in CI
- Verify environment variables are set
- Review artifact uploads for detailed error reports

## Resources

- [axe-core Rules Documentation](https://github.com/dequelabs/axe-core/blob/develop/doc/rule-descriptions.md)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Playwright Accessibility Testing](https://playwright.dev/docs/accessibility-testing)
- [axe DevTools](https://www.deque.com/axe/devtools/)
- [Web Accessibility Initiative](https://www.w3.org/WAI/)

## Support

For questions about accessibility testing:
1. Check existing test failures and violations
2. Review this documentation and linked resources
3. Test manually with screen readers or browser tools
4. Consult WCAG guidelines for specific requirements