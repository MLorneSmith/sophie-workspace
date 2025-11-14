# Testing & Quality Documentation

Comprehensive testing strategies and quality assurance patterns for SlideHeroes.

## Overview

This directory contains documentation for all testing approaches used in the SlideHeroes platform, from unit tests to E2E, accessibility, and performance testing.

## Files in This Category

### Core Testing Principles

#### [fundamentals.md](./fundamentals.md)
Core testing principles, TypeScript patterns, type-safe mocking, and test organization.

**When to use**: Starting with testing, understanding AAA pattern, writing type-safe tests, creating test factories.

### Test Types

#### [integration-testing.md](./integration-testing.md)
Integration test strategies for authentication, AI services, payments, database transactions, and file uploads.

**When to use**: Testing workflows that span multiple components, testing API integrations, database operations.

#### [e2e-testing.md](./e2e-testing.md)
Playwright E2E patterns including Page Object Model, test data management, and parallel execution.

**When to use**: Testing complete user workflows, cross-browser testing, visual regression testing.

#### [accessibility-testing.md](./accessibility-testing.md)
Accessibility testing with WCAG 2.1 compliance, keyboard navigation, screen reader support.

**When to use**: Ensuring WCAG compliance, testing keyboard accessibility, validating ARIA attributes.

#### [performance-testing.md](./performance-testing.md)
Performance testing patterns including Core Web Vitals, load testing, memory monitoring.

**When to use**: Optimizing performance, testing under load, monitoring memory usage, measuring Core Web Vitals.

### Configuration & Infrastructure

#### [vitest-configuration.md](./vitest-configuration.md)
Vitest setup, workspace configuration, mocking patterns, coverage requirements.

**When to use**: Setting up new test suites, configuring test environments, troubleshooting Vitest issues.

## Testing Strategy

### Test Pyramid

```
         /\
        /  \    E2E Tests (Few)
       /____\   - Critical user journeys
      /      \  - Cross-browser validation
     /________\
    /          \ Integration Tests (Some)
   /____________\  - API workflows
  /              \ - Database operations
 /________________\ Unit Tests (Many)
                    - Business logic
                    - Component behavior
```

### When to Write Each Type

| Test Type | Purpose | Quantity | Speed |
|-----------|---------|----------|-------|
| **Unit** | Function/component logic | 70% | Fast |
| **Integration** | Feature workflows | 20% | Medium |
| **E2E** | Critical user paths | 10% | Slow |

## Common Workflows

### Setting Up Tests for a New Feature

1. **Unit tests first**: [fundamentals.md](./fundamentals.md)
   - Test business logic in isolation
   - Mock external dependencies
   - Achieve 80%+ coverage

2. **Integration tests**: [integration-testing.md](./integration-testing.md)
   - Test database operations
   - Test API integrations
   - Verify auth workflows

3. **E2E tests (selective)**: [e2e-testing.md](./e2e-testing.md)
   - Only for critical user journeys
   - Focus on happy paths
   - Consider ROI before adding

### Testing a New Component

1. [fundamentals.md](./fundamentals.md) - Component unit tests
2. [accessibility-testing.md](./accessibility-testing.md) - A11y validation
3. [e2e-testing.md](./e2e-testing.md) - If component is part of critical flow

### Testing API Integration

1. [fundamentals.md](./fundamentals.md) - Mock API for unit tests
2. [integration-testing.md](./integration-testing.md) - Real API integration tests
3. [vitest-configuration.md](./vitest-configuration.md) - Configure test environment

## Prerequisites

Before writing tests:

- **Required reading**: [fundamentals.md](./fundamentals.md) for core principles
- **Environment**: Local test environment configured
- **Dependencies**: Vitest, Playwright, testing-library installed

## Quality Standards

### Coverage Requirements

- **Overall**: Minimum 80% code coverage
- **Critical paths**: 100% coverage required
- **New code**: Must include tests before merge
- **Types**: No `any` types in test code

### Test Quality Checklist

- [ ] Tests follow AAA pattern (Arrange, Act, Assert)
- [ ] Descriptive test names explaining behavior
- [ ] No flaky tests (must pass consistently)
- [ ] Fast execution (unit tests < 100ms each)
- [ ] Proper cleanup (no test pollution)
- [ ] Type-safe mocks (no `any` types)

## Running Tests

### Unit Tests
```bash
pnpm test:unit              # Run all unit tests
pnpm test:unit --watch      # Watch mode
pnpm test:coverage          # With coverage report
```

### Integration Tests
```bash
pnpm test:integration       # Run integration tests
```

### E2E Tests
```bash
pnpm test:e2e              # Run all E2E tests
pnpm test:e2e --ui         # Interactive UI mode
pnpm test:e2e --headed     # See browser
```

### All Tests
```bash
pnpm test                  # Run all test suites
```

See [../tools/cli-references.md](../tools/cli-references.md) for complete testing commands.

## Troubleshooting

### Common Issues

| Issue | Solution | Reference |
|-------|----------|-----------|
| Type errors in mocks | Use proper TypeScript patterns | [fundamentals.md](./fundamentals.md) |
| Flaky E2E tests | Improve wait strategies | [e2e-testing.md](./e2e-testing.md) |
| Integration test failures | Check test database state | [integration-testing.md](./integration-testing.md) |
| Vitest config issues | Review workspace setup | [vitest-configuration.md](./vitest-configuration.md) |

### Getting Help

1. Check the specific test type documentation
2. Review [fundamentals.md](./fundamentals.md) for core patterns
3. Search existing tests for similar patterns
4. Consult [../development/](../development/) for feature patterns

## Related Documentation

- **Development**: [../development/](../development/) - Feature implementation patterns
- **Infrastructure**: [../infrastructure/ci-cd-complete.md](../infrastructure/ci-cd-complete.md) - CI/CD test automation
- **Tools**: [../tools/cli-references.md](../tools/cli-references.md) - Test command reference

## Best Practices

### Test Philosophy

> **When tests fail, fix the code, not the test.**

Tests should reveal bugs and missing features. Fixing tests to pass without addressing root causes hides problems.

### Writing Effective Tests

1. **Test behavior, not implementation**: Focus on what code does, not how
2. **One assertion per test**: Makes failures easier to diagnose
3. **Descriptive names**: `it('should reject invalid email format')` not `it('works')`
4. **Avoid test interdependence**: Each test should run independently
5. **Use factories for test data**: Don't repeat object creation
6. **Mock at boundaries**: External APIs, not internal functions

### Performance

- Unit tests should be fast (< 100ms each)
- Use `test.concurrent()` for independent tests
- Minimize test setup/teardown overhead
- Run integration tests in parallel when safe

---

*Last updated: 2025-11-14*
