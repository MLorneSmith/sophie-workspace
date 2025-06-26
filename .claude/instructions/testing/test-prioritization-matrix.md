# Comprehensive Test Prioritization Matrix

This matrix defines how we score and prioritize tests across all test types to determine the most valuable test to write next.

## Scoring Algorithm

### Business Priority (0-10 points)
- **P1 (Critical Business Functions)**: 10 points
  - AI Canvas workflows (`ai/canvas/**`)
  - Storyboard creation (`ai/storyboard/**`) 
  - Course lesson delivery (`course/lessons/**`)
  - Authentication flows (`auth/**`)
  - Payment processing (`payments/**`)
  
- **P2 (Important Features)**: 5 points
  - Course management (`course/management/**`)
  - User profile/settings (`user/**`)
  - Admin dashboard (`admin/**`)
  - Team collaboration features
  
- **P3 (Supporting Features)**: 1 point
  - Analytics (`analytics/**`)
  - Integrations (`integrations/**`)
  - Documentation tools
  - Developer utilities

### CI/CD Stage Requirements (0-15 points)

#### PR Validation Stage (5-15 points)
- **Unit tests**: 15 points (required for all PRs)
- **Accessibility tests**: 12 points (required for UI changes)
- **Security tests**: 10 points (automated scans)
- **Integration tests**: 8 points (API changes)
- **E2E tests**: 5 points (smoke tests only)
- **Performance tests**: 3 points (not required for PR)

#### Dev Branch Deployment (5-12 points)
- **Integration tests**: 12 points (service interactions)
- **E2E tests**: 10 points (core workflows)
- **Unit tests**: 8 points (comprehensive coverage)
- **Accessibility tests**: 8 points (full component testing)
- **Security tests**: 6 points (deeper scans)
- **Performance tests**: 5 points (basic benchmarks)

#### Staging Deployment (8-15 points)
- **E2E tests**: 15 points (full user journey testing)
- **Performance tests**: 12 points (Core Web Vitals, load testing)
- **Accessibility tests**: 10 points (WCAG compliance validation)
- **Integration tests**: 10 points (cross-service testing)
- **Security tests**: 8 points (penetration testing prep)
- **Unit tests**: 8 points (regression prevention)

#### Production Deployment (10-15 points)
- **All test types**: Must be passing
- **Performance tests**: 15 points (production load validation)
- **Security tests**: 15 points (final security audit)
- **E2E tests**: 12 points (critical path validation)
- **Monitoring tests**: 10 points (observability validation)

### Coverage Gap Severity (0-10 points)
- **No tests exist**: 10 points
- **Incomplete coverage (<50%)**: 8 points
- **Basic coverage (50-80%)**: 5 points
- **Good coverage (80-95%)**: 3 points
- **Flaky/outdated tests**: 6 points (need replacement)
- **Complete coverage (95%+)**: 0 points

### Recent Changes Context (0-8 points)
- **File directly modified**: 8 points
- **Related/dependent file modified**: 3 points
- **Same feature area modified**: 2 points
- **No recent changes**: 0 points

### Test Dependencies (−5 to +5 points)
- **Prerequisites missing**: -5 points (e.g., no unit tests for integration test)
- **Prerequisites incomplete**: -2 points
- **Prerequisites satisfied**: 0 points
- **Enables other high-value tests**: +3 points
- **Unblocks critical test pipeline**: +5 points

### Risk/Impact Factor (0-5 points)
- **Revenue-critical path**: 5 points
- **Security-sensitive area**: 4 points
- **High user traffic area**: 3 points
- **External integration point**: 3 points
- **Data integrity concern**: 4 points
- **Performance bottleneck**: 3 points

## Test Type Specific Considerations

### Unit Tests
- **When prioritized**: Foundation missing, recent code changes, refactoring prep
- **Dependency bonus**: +3 points if enables integration tests
- **Risk areas**: Complex business logic, data transformations, edge cases

### Integration Tests  
- **When prioritized**: API changes, service interactions, data flow testing
- **Dependency requirement**: Unit tests should exist (-2 points if missing)
- **Risk areas**: Authentication, payment flows, AI service calls

### E2E Tests
- **When prioritized**: User workflow gaps, staging/production deployment prep
- **Dependency requirement**: Unit + integration tests preferred (-1 point if missing)
- **Risk areas**: Critical user journeys, conversion funnels, onboarding

### Accessibility Tests
- **When prioritized**: UI components, form interactions, dynamic content
- **Legal compliance**: +2 points for public-facing features
- **Risk areas**: Form submissions, navigation, media content

### Performance Tests
- **When prioritized**: Staging deployment, performance regressions, new features
- **Business impact**: +3 points for revenue-critical performance
- **Risk areas**: Page load times, AI generation speed, large dataset handling

## Priority Calculation Examples

### Example 1: AI Canvas Unit Test
```
File: ai/canvas/generate-ideas.ts
Test Type: unit
Recent changes: Yes (file modified yesterday)

Score calculation:
- Business Priority (P1): 10 points
- CI/CD Stage (PR prep): 15 points  
- Coverage Gap (no tests): 10 points
- Recent Changes (direct): 8 points
- Dependencies (enables integration): +3 points
- Risk Factor (revenue-critical): 5 points
TOTAL: 51 points
```

### Example 2: Course Accessibility Test
```
File: course/components/ProgressBar.tsx  
Test Type: accessibility
Recent changes: No

Score calculation:
- Business Priority (P1): 10 points
- CI/CD Stage (staging prep): 10 points
- Coverage Gap (basic only): 5 points
- Recent Changes: 0 points
- Dependencies (satisfied): 0 points
- Risk Factor (legal compliance): 4 points
TOTAL: 29 points
```

### Example 3: Analytics Performance Test
```
File: analytics/dashboard/ChartRenderer.tsx
Test Type: performance  
Recent changes: No

Score calculation:
- Business Priority (P3): 1 point
- CI/CD Stage (not required): 3 points
- Coverage Gap (none): 10 points
- Recent Changes: 0 points
- Dependencies (satisfied): 0 points
- Risk Factor (user experience): 3 points
TOTAL: 17 points
```

## Usage in /write-tests Command

The command uses this matrix to:
1. **Score all possible test combinations** across files and test types
2. **Select the highest-scoring individual test** as session lead
3. **Fill session with same test type** in priority order
4. **Show transparent scoring** so users understand selection rationale

## Matrix Maintenance

- **Review monthly**: Adjust business priorities based on roadmap changes
- **Update after incidents**: Increase risk scores for problem areas
- **Refine based on usage**: Track which tests provide most value
- **CI/CD evolution**: Update stage requirements as pipeline matures

---
*This matrix ensures we always work on the most valuable test next, regardless of test type*