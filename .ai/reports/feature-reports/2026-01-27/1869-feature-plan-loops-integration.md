# Feature: Loops.so Integration for Transactional Email and Event Automation

## Feature Description

Integrate Loops.so as the transactional email and event-triggered automation platform for SlideHeroes. This integration will enable sending transactional emails (password resets, course notifications, welcome emails) and triggering automated email workflows based on user events (course completion, assessment submission, onboarding milestones). Contact management will remain with an external CRM (Attio or Clarify.ai - to be determined), so this integration focuses exclusively on email delivery and event tracking.

## User Story

As a **SlideHeroes learner**
I want to **receive timely, relevant emails about my learning progress and important account notifications**
So that **I stay engaged with my courses and never miss important updates or actions I need to take**

## Problem Statement

SlideHeroes currently uses a basic SMTP-based email system (Nodemailer) that only supports simple transactional emails. There's no capability for:
- Event-triggered email automation (e.g., send encouragement email 3 days after course inactivity)
- Dynamic email content based on user progress
- Sophisticated email workflow management
- Analytics on email engagement and conversion

This limits the platform's ability to nurture learners through their journey and re-engage inactive users.

## Solution Statement

Integrate Loops.so SDK to provide:
1. **Transactional Email Delivery** - Replace or supplement existing mailer for key transactional emails
2. **Event Tracking** - Send user events to Loops to trigger automated email workflows (loops)
3. **Server-Side Integration** - All Loops API calls happen server-side to protect API keys
4. **Developer-Friendly API** - Create a `@kit/loops` package following MakerKit patterns for easy adoption

The integration will NOT sync contacts to Loops (CRM will be the source of truth), but will send emails and events referencing users by email address.

## Relevant Files

### Existing Files to Reference

- `packages/mailers/core/src/index.ts` - Core mailer entry point, pattern for `getMailer()`
- `packages/mailers/core/src/registry.ts` - Provider registry pattern for dynamic loading
- `packages/mailers/shared/src/mailer.ts` - Abstract `Mailer` class interface
- `packages/mailers/shared/src/schema/mailer.schema.ts` - Zod schema for email validation
- `packages/mailers/resend/src/index.ts` - HTTP-based mailer implementation (similar to Loops)
- `apps/web/app/(marketing)/contact/_lib/server/server-actions.ts` - Server action pattern with `enhanceAction`
- `packages/features/team-accounts/src/server/services/account-invitations-dispatcher.service.ts` - Service class pattern for email dispatch
- `apps/web/.env.example` - Environment variable patterns

### New Files to Create

#### Package Structure
```
packages/loops/
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts                    # Main exports
│   ├── client.ts                   # LoopsClient wrapper
│   ├── loops.service.ts            # LoopsService class
│   ├── schemas/
│   │   ├── transactional.schema.ts # Zod schema for transactional emails
│   │   └── event.schema.ts         # Zod schema for events
│   └── types.ts                    # TypeScript types
```

#### Integration Points
- `apps/web/.env` - Add `LOOPS_API_KEY` environment variable
- `apps/web/.env.example` - Document the new variable
- Server actions/services that need to send Loops events

## Impact Analysis

### Dependencies Affected

**New Dependencies:**
- `loops` (npm package) - Loops.so official SDK

**Packages That Will Consume This:**
- `apps/web` - Server actions and API routes
- `packages/features/*` - Feature packages that trigger user events

**No Impact On:**
- `@kit/mailers` - Loops is a separate service, not a mailer provider replacement
- Existing email functionality continues to work

### Risk Assessment

**Medium Risk**
- Loops is a third-party service with potential uptime considerations
- Requires new API key management
- Event naming conventions need careful planning for automation compatibility
- However: isolated integration, non-breaking, can be incrementally adopted

### Backward Compatibility

- Fully backward compatible
- Existing mailer system (`@kit/mailers`) remains unchanged
- Loops integration is additive, not a replacement
- Can run both systems in parallel during transition

### Performance Impact

- **Minimal**: API calls are fire-and-forget for events
- **No database impact**: Loops doesn't require local storage
- **No client bundle impact**: Server-side only
- **Async operations**: Won't block user flows

### Security Considerations

- **API Key Protection**: `LOOPS_API_KEY` must be server-side only
- **No Client Exposure**: SDK only used in server components/actions
- **Input Validation**: All data validated with Zod before sending to Loops
- **Email Validation**: Validate email addresses before API calls
- **Rate Limiting**: Consider implementing rate limits for event sending

## Pre-Feature Checklist

Before starting implementation:
- [ ] Obtain Loops.so API key from https://app.loops.so/settings?page=api
- [ ] Create transactional email templates in Loops dashboard
- [ ] Define event naming conventions (e.g., `courseStarted`, `lessonCompleted`)
- [ ] Review existing email touchpoints to identify Loops candidates
- [ ] Verify Loops dashboard access for team members
- [ ] Plan which emails move to Loops vs stay with current mailer

## Documentation Updates Required

- `CLAUDE.md` - Add Loops.so section under Core Technologies
- `apps/web/.env.example` - Document `LOOPS_API_KEY`
- `packages/loops/README.md` - Package documentation
- API documentation for internal developers on using the Loops service

## Rollback Plan

**Disable Feature:**
1. Remove `LOOPS_API_KEY` from environment (service will throw errors)
2. Or: Add `LOOPS_ENABLED=false` feature flag (recommended approach)

**Graceful Degradation:**
- Wrap all Loops calls in try-catch
- Log failures but don't break user flows
- Fall back to existing mailer for critical transactional emails

**Monitoring:**
- Log all Loops API errors to application logger
- Track email delivery success rates in Loops dashboard
- Alert on sudden drop in event volume

## Implementation Plan

### Phase 1: Foundation

Create the `@kit/loops` package with core SDK wrapper, types, and schemas.

### Phase 2: Core Implementation

Implement the LoopsService class with methods for:
- Sending transactional emails
- Sending events
- Error handling and logging

### Phase 3: Integration

Add server actions and integrate with key user flows:
- Welcome email on signup
- Course enrollment confirmation
- Assessment completion event
- Onboarding progress events

## Step by Step Tasks

### Step 1: Create Package Structure

- Create `packages/loops/` directory
- Create `package.json` with dependencies (`loops`, `zod`, `server-only`)
- Create `tsconfig.json` extending base config
- Add package to workspace in root `pnpm-workspace.yaml` (if needed)
- Add package alias `@kit/loops` to relevant `tsconfig.json` files

### Step 2: Define TypeScript Types and Schemas

- Create `src/types.ts` with interfaces for:
  - `TransactionalEmailParams`
  - `LoopsEventParams`
  - `LoopsServiceConfig`
- Create `src/schemas/transactional.schema.ts` with Zod validation
- Create `src/schemas/event.schema.ts` with Zod validation for events

### Step 3: Implement Loops Client Wrapper

- Create `src/client.ts` with singleton LoopsClient initialization
- Handle missing API key gracefully (throw descriptive error)
- Add `'server-only'` directive to prevent client-side imports
- Export `getLoopsClient()` function

### Step 4: Implement LoopsService Class

- Create `src/loops.service.ts` with `LoopsService` class
- Implement `sendTransactionalEmail(params)` method
- Implement `sendEvent(params)` method
- Add structured logging with `@kit/shared/logger`
- Handle errors gracefully with proper error types
- Create factory function `createLoopsService()`

### Step 5: Create Package Exports

- Create `src/index.ts` exporting:
  - `createLoopsService`
  - `getLoopsClient`
  - Types and schemas
- Update `package.json` exports field

### Step 6: Configure Environment Variables

- Add `LOOPS_API_KEY` to `apps/web/.env.example` with documentation
- Add `LOOPS_ENABLED` feature flag (optional, defaults to true if API key exists)
- Add to `.env.local` for development (do not commit actual key)

### Step 7: Add Package to Web App

- Run `pnpm add @kit/loops@workspace:* --filter web`
- Verify TypeScript can resolve the package

### Step 8: Create Server Action for Testing

- Create test server action in `apps/web/app/api/` or server action
- Send a test event to verify integration works
- Test transactional email sending

### Step 9: Integrate with User Signup Flow

- Identify signup completion point in auth flow
- Add Loops event: `userSignedUp`
- Consider sending welcome transactional email via Loops

### Step 10: Integrate with Course Enrollment

- Find course enrollment server action/service
- Add Loops event: `courseEnrolled` with course metadata
- Include `courseId`, `courseName` as event properties

### Step 11: Integrate with Lesson/Module Completion

- Find lesson completion handler
- Add Loops event: `lessonCompleted`
- Include progress percentage, lesson details

### Step 12: Integrate with Assessment Completion

- Find assessment submission handler
- Add Loops event: `assessmentCompleted`
- Include score, assessment type, pass/fail status

### Step 13: Write Unit Tests

- Create `packages/loops/src/__tests__/` directory
- Test LoopsService with mocked Loops client
- Test schema validation
- Test error handling scenarios

### Step 14: Write Integration Tests

- Test actual API calls in test environment (if Loops provides sandbox)
- Or: Mock at network level with MSW

### Step 15: Run Validation Commands

- Execute all validation commands to ensure zero regressions
- Fix any type errors, lint issues, or test failures

## Testing Strategy

### Unit Tests

- `LoopsService.sendTransactionalEmail()` - validates params, calls client correctly
- `LoopsService.sendEvent()` - validates event data, handles errors
- Schema validation - rejects invalid emails, missing required fields
- Error handling - service doesn't throw, logs errors, returns failure result

### Integration Tests

- Mock Loops API responses with MSW
- Test full flow from server action to Loops client call
- Verify correct payload structure sent to Loops

### E2E Tests

- Not directly testable (external API)
- Verify user flows that trigger Loops events complete successfully
- Use Loops dashboard to verify events received in test environment

### Edge Cases

- Missing `LOOPS_API_KEY` - should throw clear error at initialization
- Invalid email address - should reject before API call
- Loops API timeout - should not block user flow
- Rate limiting from Loops - should handle gracefully
- Empty event properties - should be allowed
- Very long event property values - should validate max lengths

## Acceptance Criteria

1. `@kit/loops` package exists and is properly typed
2. `LOOPS_API_KEY` environment variable documented and working
3. `sendTransactionalEmail()` successfully sends emails via Loops
4. `sendEvent()` successfully sends events to Loops
5. All Loops calls are server-side only (no client bundle impact)
6. Errors are logged but don't break user flows
7. At least one user event is integrated (e.g., `userSignedUp`)
8. Unit tests pass with >80% coverage for the package
9. `pnpm typecheck` passes with zero errors
10. `pnpm lint` passes with zero errors
11. Documentation is updated

## Validation Commands

Execute every command to validate the feature works correctly with zero regressions.

```bash
# Type checking - must pass with zero errors
pnpm typecheck

# Linting - must pass with zero errors
pnpm lint

# Unit tests - must pass
pnpm test:unit

# Build - must complete successfully
pnpm build

# Verify package is properly linked
pnpm --filter web exec -- node -e "require('@kit/loops')"

# Run specific package tests (once tests exist)
pnpm --filter @kit/loops test
```

## Notes

### Event Naming Conventions

Use camelCase for event names, matching JavaScript conventions:
- `userSignedUp`
- `courseEnrolled`
- `lessonCompleted`
- `assessmentCompleted`
- `onboardingStepCompleted`

### Data Variables for Transactional Emails

When creating transactional emails in Loops dashboard, use these standard variables:
- `firstName` - User's first name
- `email` - User's email
- `courseName` - For course-related emails
- `actionUrl` - CTA link URL

### Future Considerations

1. **Contact Sync**: When CRM is set up (Attio/Clarify.ai), consider bi-directional sync patterns
2. **Bulk Events**: For high-volume events, consider batching
3. **Event Queue**: For resilience, consider queuing events via Trigger.dev or similar
4. **Analytics Dashboard**: Build internal dashboard showing Loops engagement metrics

### Dependencies to Install

```bash
pnpm add loops --filter @kit/loops
pnpm add zod --filter @kit/loops  # If not already a peer dep
```
