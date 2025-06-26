# Comprehensive Test Case Template

This template supports all test types: Unit, E2E, Accessibility, Integration, Performance

## Template Selection Guide

**Use the appropriate template section based on test type:**
- **Unit Tests**: Testing individual functions, components, business logic
- **E2E Tests**: Testing complete user workflows across the application
- **Accessibility Tests**: Testing WCAG compliance, keyboard navigation, screen readers
- **Integration Tests**: Testing API endpoints, service interactions, data flow
- **Performance Tests**: Testing load times, Core Web Vitals, resource usage

---

## Unit Test Template

```markdown
# Test Cases: [filename]

## File: `[file-path]`

## Status Summary
- **Created**: [YYYY-MM-DD]
- **Last Updated**: [YYYY-MM-DD]
- **Test Implementation Status**: [Not Started | In Progress | Completed | Blocked]
- **Total Test Cases**: [X]
- **Completed Test Cases**: [X]
- **Coverage**: [X]%
- **Priority**: [P1 | P2 | P3]

## Function/Component Overview
- **Purpose**: [Brief description of what this file does]
- **Dependencies**: [List of external dependencies to mock]
- **Business Logic**: [Key business rules this implements]

## Test Cases Checklist

### Core Functionality
- [ ] **Test Case**: [Happy path description]
  - **Input**: [Input parameters/data]
  - **Expected Output**: [Expected result]
  - **Status**: [❌ Not Started | 🚧 In Progress | ✅ Complete]
  - **Notes**: [Implementation notes]

### Edge Cases
- [ ] **Test Case**: [Edge case description]
  - **Input**: [Edge case input]
  - **Expected Output**: [Expected behavior]
  - **Status**: [❌ Not Started | 🚧 In Progress | ✅ Complete]

### Error Scenarios
- [ ] **Test Case**: [Error condition]
  - **Input**: [Invalid input that triggers error]
  - **Expected Output**: [Expected error handling]
  - **Status**: [❌ Not Started | 🚧 In Progress | ✅ Complete]

## Implementation Notes
- **Mock Strategy**: [How external dependencies will be mocked]
- **Test Framework**: Vitest
- **Coverage Goals**: [Specific coverage targets]
- **Blockers**: [Any current issues preventing test implementation]
```

---

## E2E Test Template

```markdown
# E2E Test Cases: [workflow-name]

## Workflow: `[workflow-description]`
## Test File: `[e2e-test-file-path]`

## Status Summary
- **Created**: [YYYY-MM-DD]
- **Last Updated**: [YYYY-MM-DD]
- **Test Implementation Status**: [Not Started | In Progress | Completed | Blocked]
- **Total Test Scenarios**: [X]
- **Completed Test Scenarios**: [X]
- **Coverage**: [X]% of critical user journey
- **Priority**: [P1 | P2 | P3]

## User Journey Overview
- **Primary User**: [User type/persona]
- **Goal**: [What the user is trying to achieve]
- **Entry Point**: [Where user starts the workflow]
- **Success Criteria**: [What constitutes successful completion]

## Test Scenarios Checklist

### Happy Path Scenarios
- [ ] **Scenario**: [Primary successful workflow]
  - **Given**: [Initial state/preconditions]
  - **When**: [User actions taken]
  - **Then**: [Expected outcomes]
  - **Status**: [❌ Not Started | 🚧 In Progress | ✅ Complete]
  - **Page Objects**: [List of page objects needed]

### Alternative Paths
- [ ] **Scenario**: [Alternative successful workflow]
  - **Given**: [Different initial conditions]
  - **When**: [Alternative user actions]
  - **Then**: [Expected alternative outcomes]
  - **Status**: [❌ Not Started | 🚧 In Progress | ✅ Complete]

### Error Handling
- [ ] **Scenario**: [Error scenario user might encounter]
  - **Given**: [Conditions that lead to error]
  - **When**: [User actions that trigger error]
  - **Then**: [Expected error handling/recovery]
  - **Status**: [❌ Not Started | 🚧 In Progress | ✅ Complete]

### Cross-Browser Testing
- [ ] **Browser**: Chromium (Desktop)
- [ ] **Browser**: Firefox (Desktop)  
- [ ] **Browser**: WebKit (Desktop)
- [ ] **Browser**: Mobile Chrome
- [ ] **Browser**: Mobile Safari

## Implementation Notes
- **Framework**: Playwright
- **Test Data**: [How test data will be managed]
- **Page Objects**: [List of page objects to create/reuse]
- **API Mocking**: [External services to mock]
- **Cleanup**: [How to clean up test data]
```

---

## Accessibility Test Template

```markdown
# Accessibility Test Cases: [component-name]

## Component: `[component-file-path]`
## Test File: `[a11y-test-file-path]`

## Status Summary
- **Created**: [YYYY-MM-DD]
- **Last Updated**: [YYYY-MM-DD]
- **Test Implementation Status**: [Not Started | In Progress | Completed | Blocked]
- **Total A11y Test Cases**: [X]
- **Completed A11y Test Cases**: [X]
- **WCAG Compliance Level**: [A | AA | AAA]
- **Priority**: [P1 | P2 | P3]

## Component Overview
- **Type**: [Form | Navigation | Interactive | Content | Media]
- **User Interactions**: [List of all interactive elements]
- **Dynamic Content**: [Content that changes based on state]
- **ARIA Requirements**: [Required ARIA attributes]

## WCAG 2.1 AA Test Cases

### Keyboard Navigation
- [ ] **Test Case**: Tab navigation order
  - **Test**: All interactive elements reachable via Tab
  - **Expected**: Logical tab order, no keyboard traps
  - **Status**: [❌ Not Started | 🚧 In Progress | ✅ Complete]

- [ ] **Test Case**: Keyboard shortcuts
  - **Test**: All mouse interactions have keyboard equivalents
  - **Expected**: Enter/Space activate buttons, arrow keys for navigation
  - **Status**: [❌ Not Started | 🚧 In Progress | ✅ Complete]

### Screen Reader Compatibility
- [ ] **Test Case**: ARIA labels and descriptions
  - **Test**: All interactive elements have accessible names
  - **Expected**: Screen reader announces purpose of each element
  - **Status**: [❌ Not Started | 🚧 In Progress | ✅ Complete]

- [ ] **Test Case**: State announcements
  - **Test**: Dynamic state changes announced
  - **Expected**: Loading states, errors, success messages announced
  - **Status**: [❌ Not Started | 🚧 In Progress | ✅ Complete]

### Visual Accessibility
- [ ] **Test Case**: Color contrast
  - **Test**: All text meets 4.5:1 contrast ratio
  - **Expected**: WCAG AA contrast requirements met
  - **Status**: [❌ Not Started | 🚧 In Progress | ✅ Complete]

- [ ] **Test Case**: Focus indicators
  - **Test**: All focusable elements have visible focus indicators
  - **Expected**: Clear focus outline on all interactive elements
  - **Status**: [❌ Not Started | 🚧 In Progress | ✅ Complete]

### Touch Accessibility (Mobile)
- [ ] **Test Case**: Touch target size
  - **Test**: All touch targets minimum 44x44px
  - **Expected**: Adequate spacing for finger interaction
  - **Status**: [❌ Not Started | 🚧 In Progress | ✅ Complete]

## Implementation Notes
- **Framework**: axe-core with Playwright/Jest
- **Testing Tools**: [Screen reader testing approach]
- **Automated Checks**: [axe-core rule sets to run]
- **Manual Testing**: [Manual testing procedures]
```

---

## Integration Test Template

```markdown
# Integration Test Cases: [service/api-name]

## Service/API: `[service-file-path]`
## Test File: `[integration-test-file-path]`

## Status Summary
- **Created**: [YYYY-MM-DD]
- **Last Updated**: [YYYY-MM-DD]
- **Test Implementation Status**: [Not Started | In Progress | Completed | Blocked]
- **Total Integration Test Cases**: [X]
- **Completed Integration Test Cases**: [X]
- **Coverage**: [X]% of API endpoints/service interactions
- **Priority**: [P1 | P2 | P3]

## Integration Overview
- **Service Type**: [API Endpoints | Database Operations | External Service]
- **Dependencies**: [List of services this integrates with]
- **Authentication**: [Auth requirements]
- **Data Flow**: [How data flows through the integration]

## API Endpoint Test Cases

### Success Scenarios
- [ ] **Test Case**: [Endpoint] - Successful request
  - **Method**: [GET | POST | PUT | DELETE]
  - **Input**: [Request payload/parameters]
  - **Expected**: [Status code, response shape, side effects]
  - **Status**: [❌ Not Started | 🚧 In Progress | ✅ Complete]

### Authentication & Authorization
- [ ] **Test Case**: Valid authentication
  - **Setup**: [Valid auth credentials]
  - **Expected**: [Successful access to protected resources]
  - **Status**: [❌ Not Started | 🚧 In Progress | ✅ Complete]

- [ ] **Test Case**: Invalid authentication
  - **Setup**: [Invalid/missing auth credentials]
  - **Expected**: [401 Unauthorized response]
  - **Status**: [❌ Not Started | 🚧 In Progress | ✅ Complete]

### Data Validation
- [ ] **Test Case**: Valid data submission
  - **Input**: [Valid data matching schema]
  - **Expected**: [Successful processing and storage]
  - **Status**: [❌ Not Started | 🚧 In Progress | ✅ Complete]

- [ ] **Test Case**: Invalid data rejection
  - **Input**: [Invalid data violating schema]
  - **Expected**: [400 Bad Request with validation errors]
  - **Status**: [❌ Not Started | 🚧 In Progress | ✅ Complete]

### Error Handling
- [ ] **Test Case**: External service failure
  - **Setup**: [Mock external service failure]
  - **Expected**: [Graceful error handling, appropriate response]
  - **Status**: [❌ Not Started | 🚧 In Progress | ✅ Complete]

## Implementation Notes
- **Framework**: [Playwright Request | Supertest | Custom]
- **Test Database**: [How to handle test data]
- **External Services**: [Mocking strategy for external APIs]
- **Cleanup**: [How to clean up test data]
- **Environment**: [Test environment configuration]
```

---

## Performance Test Template

```markdown
# Performance Test Cases: [feature/page-name]

## Feature/Page: `[feature-description]`
## Test File: `[performance-test-file-path]`

## Status Summary
- **Created**: [YYYY-MM-DD]
- **Last Updated**: [YYYY-MM-DD]
- **Test Implementation Status**: [Not Started | In Progress | Completed | Blocked]
- **Total Performance Test Cases**: [X]
- **Completed Performance Test Cases**: [X]
- **Performance Budget**: [Defined | In Progress | Not Set]
- **Priority**: [P1 | P2 | P3]

## Performance Overview
- **Critical Path**: [User journey being measured]
- **Key Metrics**: [LCP, FID, CLS, Custom metrics]
- **Performance Budget**: [Target values for each metric]
- **User Impact**: [How performance affects user experience]

## Core Web Vitals Test Cases

### Largest Contentful Paint (LCP)
- [ ] **Test Case**: LCP under 2.5 seconds
  - **Measurement**: Time to render largest content element
  - **Target**: < 2.5 seconds (Good), < 4.0 seconds (Needs Improvement)
  - **Status**: [❌ Not Started | 🚧 In Progress | ✅ Complete]

### First Input Delay (FID)
- [ ] **Test Case**: FID under 100ms
  - **Measurement**: Time from first user interaction to browser response
  - **Target**: < 100ms (Good), < 300ms (Needs Improvement)
  - **Status**: [❌ Not Started | 🚧 In Progress | ✅ Complete]

### Cumulative Layout Shift (CLS)
- [ ] **Test Case**: CLS under 0.1
  - **Measurement**: Visual stability of page content
  - **Target**: < 0.1 (Good), < 0.25 (Needs Improvement)
  - **Status**: [❌ Not Started | 🚧 In Progress | ✅ Complete]

### Custom Performance Metrics
- [ ] **Test Case**: [Custom metric name]
  - **Measurement**: [What is being measured]
  - **Target**: [Performance target]
  - **Status**: [❌ Not Started | 🚧 In Progress | ✅ Complete]

### Load Testing
- [ ] **Test Case**: [Concurrent user load]
  - **Setup**: [Number of concurrent users]
  - **Target**: [Response time under load]
  - **Status**: [❌ Not Started | 🚧 In Progress | ✅ Complete]

### Bundle Size
- [ ] **Test Case**: JavaScript bundle size
  - **Measurement**: Total JS bundle size
  - **Target**: [Size limit in KB]
  - **Status**: [❌ Not Started | 🚧 In Progress | ✅ Complete]

## Implementation Notes
- **Framework**: [Lighthouse CI | k6 | Custom]
- **Measurement Tools**: [List of tools used]
- **Test Environment**: [Environment that mirrors production]
- **Baseline**: [Current performance baseline]
- **Monitoring**: [How performance is monitored ongoing]
```

---

## Template Usage Instructions

### Selecting the Right Template

1. **Unit Tests**: Use for individual functions, components, business logic
2. **E2E Tests**: Use for complete user workflows and user journeys  
3. **Accessibility Tests**: Use for UI components and interactive elements
4. **Integration Tests**: Use for API endpoints and service interactions
5. **Performance Tests**: Use for pages, features, and performance-critical paths

### Creating Test Case Documentation

1. Copy the appropriate template section
2. Replace all `[placeholder]` values with actual information
3. Customize test cases based on specific requirements
4. Update checklist as tests are implemented
5. Keep status updated for tracking progress

### Cross-References Between Test Types

When creating test case documentation, reference related tests:

```markdown
## Related Tests
- **Unit Tests**: [Link to unit test cases]
- **Integration Tests**: [Link to integration test cases]  
- **E2E Tests**: [Link to E2E test cases]
- **Accessibility Tests**: [Link to accessibility test cases]
- **Performance Tests**: [Link to performance test cases]
```

This creates a comprehensive testing matrix ensuring all aspects are covered.

---

## Legacy Unit Test Template (Preserved)

For backward compatibility, the original unit test setup is preserved:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { [functionName] } from '[relative path]';

// Mock dependencies
vi.mock('[dependency path]', () => ({
  // Mock implementation
}));

describe('[Function/Module Name]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Test cases below
});
```