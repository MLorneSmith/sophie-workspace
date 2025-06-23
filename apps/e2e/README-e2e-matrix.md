# E2E Test Matrix Documentation

This document describes the comprehensive End-to-End testing setup for SlideHeroes, including multi-browser support, mobile testing, and CI/CD integration.

## Overview

The E2E test matrix ensures SlideHeroes works consistently across:
- **Desktop Browsers**: Chrome, Firefox, Safari
- **Mobile Devices**: iPhone, Android phones, tablets
- **Different Viewports**: Desktop, tablet, mobile
- **Accessibility Standards**: WCAG 2.1 AA compliance

## Test Configuration

### Browser Matrix

| Browser        | Engine   | Desktop | Mobile | Tablet | Accessibility |
|----------------|----------|---------|--------|--------|---------------|
| Chromium       | Blink    | ✅      | ✅     | ✅     | ✅           |
| Firefox        | Gecko    | ✅      | ✅     | ❌     | ❌           |
| Safari/WebKit  | WebKit   | ✅      | ✅     | ✅     | ❌           |

### Viewport Configurations

```typescript
// Desktop viewports
Desktop Chrome: 1280x720
Desktop Firefox: 1280x720  
Desktop Safari: 1280x720

// Mobile viewports
Pixel 5: 393x851
iPhone 12: 390x844

// Tablet viewports  
iPad Pro: 1024x1366
```

## Usage

### Running Tests Locally

```bash
# Install dependencies
pnpm install

# Install Playwright browsers
pnpm --filter e2e playwright install

# Run all browsers
pnpm --filter e2e test

# Run specific browser
pnpm --filter e2e playwright test --project=chromium
pnpm --filter e2e playwright test --project=firefox
pnpm --filter e2e playwright test --project=webkit

# Run mobile tests
pnpm --filter e2e playwright test --project="Mobile Chrome"
pnpm --filter e2e playwright test --project="Mobile Safari"

# Run tablet tests
pnpm --filter e2e playwright test --project="Tablet Chrome"

# Run accessibility tests
pnpm --filter e2e playwright test --project=accessibility
```

### Running with UI Mode

```bash
# Interactive test running
pnpm --filter e2e test:ui
```

### Viewing Reports

```bash
# Show HTML report
pnpm --filter e2e report

# Show accessibility report
pnpm --filter e2e a11y:report
```

## CI/CD Integration

### GitHub Actions Workflow

The E2E test matrix is implemented in `.github/workflows/e2e-matrix.yml` with the following triggers:

#### Automatic Triggers

1. **Pull Request**: Core browsers (Chrome, Firefox) for quick validation
2. **Main Branch Push**: Extended matrix (Desktop + Mobile Chrome/Safari)
3. **Scheduled (Nightly)**: Full matrix including tablets and all combinations
4. **Manual Dispatch**: Configurable browser selection

#### Matrix Strategy

```yaml
strategy:
  fail-fast: false
  matrix:
    browser: ${{ fromJson(needs.matrix-config.outputs.browsers) }}
```

The workflow dynamically configures which browsers to test based on the trigger type.

### Artifacts and Reports

#### Test Artifacts
- **Screenshots**: Captured on test failures (full page)
- **Videos**: Recorded for failed tests in CI
- **Traces**: Playwright trace files for debugging
- **JUnit XML**: For CI/CD integration

#### Report Merging
The workflow merges results from all browser runs into a unified HTML report.

## Configuration Details

### Playwright Config Enhancements

Key improvements made to `playwright.config.ts`:

```typescript
// Enhanced parallel execution
workers: process.env.CI ? 2 : undefined,

// Multi-format reporting
reporter: [
  ["html", { outputFolder: "playwright-report", open: "never" }],
  ["junit", { outputFile: "test-results/junit.xml" }],
  ["github"], // GitHub Actions integration
  ["blob"], // For report merging
],

// Enhanced failure artifacts
screenshot: { mode: "only-on-failure", fullPage: true },
video: process.env.CI ? "retain-on-failure" : "off",

// Mobile-optimized timeouts
navigationTimeout: 10000, // Increased for mobile devices
actionTimeout: 8000,
```

### Browser Projects Configuration

```typescript
projects: [
  // Desktop browsers
  { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  { name: "firefox", use: { ...devices["Desktop Firefox"] } },
  { name: "webkit", use: { ...devices["Desktop Safari"] } },
  
  // Mobile viewports
  { name: "Mobile Chrome", use: { ...devices["Pixel 5"] } },
  { name: "Mobile Safari", use: { ...devices["iPhone 12"] } },
  { name: "Mobile Firefox", use: { ...devices["Pixel 5"], browserName: "firefox" } },

  // Tablet viewports  
  { name: "Tablet Chrome", use: { ...devices["iPad Pro"] } },
  { name: "Tablet Safari", use: { ...devices["iPad Pro"], browserName: "webkit" } },

  // Accessibility testing
  { name: "accessibility", testMatch: /.*accessibility.*\.spec\.ts/ },
]
```

## Test Strategy

### Coverage Levels

1. **Smoke Tests**: Critical user journeys on all browsers
2. **Feature Tests**: Detailed functionality on core browsers
3. **Regression Tests**: Full suite on nightly runs
4. **Accessibility**: WCAG compliance on Chrome

### Test Categories

| Category | Coverage | Browsers | Frequency |
|----------|----------|----------|-----------|
| Authentication | All flows | All | Every PR |
| Core Features | Major paths | Core (Chrome/Firefox) | Every PR |
| Responsive Design | Layouts | Mobile/Tablet | Main branch |
| Accessibility | WCAG 2.1 AA | Chrome | Every PR |
| Performance | Load times | Chrome | Nightly |
| Integration | API calls | All | Main branch |

## Debugging Failed Tests

### Local Debugging

```bash
# Run with debug mode
DEBUG=pw:api pnpm --filter e2e playwright test

# Run in headed mode
pnpm --filter e2e playwright test --headed

# Debug specific test
pnpm --filter e2e playwright test --debug tests/auth/auth.spec.ts
```

### CI Debugging

1. **Download Artifacts**: Test results, screenshots, videos from failed runs
2. **Trace Viewer**: Use Playwright trace viewer for step-by-step debugging
3. **Report Analysis**: Check unified HTML report for cross-browser differences

### Common Issues

#### Mobile-Specific Issues
- **Timeout Issues**: Mobile devices may be slower, timeouts are increased
- **Touch Events**: Ensure tests use appropriate mobile interactions
- **Viewport Issues**: Check responsive design breakpoints

#### Browser-Specific Issues
- **Firefox**: May have different timing, especially for animations
- **Safari**: WebKit differences in JavaScript execution
- **Chrome**: Most reliable baseline for comparison

## Performance Considerations

### Optimization Strategies

1. **Selective Browser Installation**: Only install needed browsers per job
2. **Parallel Execution**: Run multiple browsers concurrently
3. **Artifact Management**: Automatic cleanup with retention policies
4. **Report Merging**: Combine results efficiently

### Resource Usage

```yaml
# CI resource allocation
workers: 2  # Balanced performance vs resource usage
retries: 3  # Handle flaky tests
timeout: 60000  # 1-minute test timeout
```

## Maintenance

### Adding New Browsers

1. Add browser configuration to `playwright.config.ts`
2. Update matrix strategy in workflow
3. Test locally with new configuration
4. Update documentation

### Updating Browser Versions

Playwright automatically uses latest browser versions. For specific versions:

```bash
# Install specific browser version
pnpm --filter e2e playwright install chromium@1.40.0
```

### Monitor Performance

- Track test execution times across browsers
- Monitor artifact sizes
- Review failure rates by browser

## Best Practices

### Test Writing

1. **Mobile-First**: Design tests to work on smallest viewport first
2. **Browser Agnostic**: Avoid browser-specific code
3. **Responsive Testing**: Test key breakpoints
4. **Progressive Enhancement**: Test core functionality across all browsers

### CI/CD

1. **Fast Feedback**: Use core browsers for PR validation
2. **Comprehensive Coverage**: Full matrix for important branches
3. **Artifact Management**: Efficient storage and cleanup
4. **Status Reporting**: Clear feedback on test results

### Monitoring

1. **Flaky Test Detection**: Track failure patterns across browsers
2. **Performance Tracking**: Monitor execution times
3. **Coverage Analysis**: Ensure adequate test coverage

## Troubleshooting

### Common Setup Issues

```bash
# Clear Playwright cache
pnpm --filter e2e playwright uninstall --all
pnpm --filter e2e playwright install

# Reset test state
rm -rf apps/e2e/test-results/
rm -rf apps/e2e/playwright-report/

# Verify browser installation
pnpm --filter e2e playwright doctor
```

### Environment Variables

Required for CI:
```bash
SUPABASE_SERVICE_ROLE_KEY=xxx
SUPABASE_DB_WEBHOOK_SECRET=xxx
STRIPE_SECRET_KEY=xxx
STRIPE_WEBHOOK_SECRET=xxx
PLAYWRIGHT_SERVER_COMMAND='pnpm dev'
```

## Future Enhancements

### Planned Improvements

1. **Visual Regression Testing**: Screenshot comparison across browsers
2. **Performance Budgets**: Automated performance threshold checking  
3. **Cross-Device Testing**: Real device testing integration
4. **Accessibility Automation**: Enhanced a11y testing

### Metrics and Analytics

1. **Test Execution Metrics**: Duration, success rates by browser
2. **Coverage Reports**: Feature coverage across device types
3. **Trend Analysis**: Historical performance tracking

This matrix ensures SlideHeroes provides a consistent, high-quality experience across all supported browsers and devices.