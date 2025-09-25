# Logging Standardization Phase 2 - Status Report

**Date**: 2025-09-18  
**Objective**: Replace console.* calls with @kit/shared/logger to reduce upstream merge conflicts

## Executive Summary

**Initial State**: 412 console.*instances (based on initial count)
**Current State**: 388 console.* instances remaining
**Progress**: 24 instances resolved (5.8% complete)

## Work Completed

### Files Successfully Migrated

1. **apps/web/app/onboarding/_components/onboarding-form.tsx**
   - ✅ Replaced custom logger wrapper with `createClientLogger`
   - ✅ Updated 6 logger calls to use `getLogger().method()`
   - ✅ Improved error context formatting

2. **apps/web/app/home/(user)/admin/ai-usage/_actions/fetch-usage-data.ts**
   - ✅ Fixed remaining console.error in sync function
   - ✅ Used synchronous logger pattern

3. **apps/web/lib/i18n/i18n.settings.ts**
   - ✅ Replaced console.warn with proper logger.warn
   - ✅ Removed conditional development-only logging

4. **apps/web/app/(marketing)/_components/home-cta-presentation-name.tsx**
   - ✅ Replaced custom logger wrapper with `createClientLogger`
   - ✅ Updated 2 logger calls

5. **apps/web/app/home/(user)/ai/blocks/_components/BlocksFormErrorBoundary.tsx**
   - ✅ Replaced custom logger wrapper with `createClientLogger`
   - ✅ Updated error boundary logging

6. **apps/web/app/home/(user)/assessment/survey/_components/question-card.tsx**
   - ✅ Replaced custom logger wrapper with `createClientLogger`
   - ✅ Updated 4 logger calls

7. **apps/web/lib/certificates/certificate-service.ts**
   - ✅ Removed commented console.log

## Implementation Patterns Established

### 1. Server Components/Actions

```typescript
import { getLogger } from '@kit/shared/logger';

// For server actions - async pattern
const logger = await getLogger();
logger.error('Error message', { context });

// For sync functions in server components
const { getLogger } = createServiceLogger('SERVICE-NAME');
getLogger().error('Error message', { context });
```

### 2. Client Components

```typescript
import { createClientLogger } from '@kit/shared/logger';

const { getLogger } = createClientLogger('COMPONENT-NAME');
getLogger().error('Error message', { context });
```

### 3. Test Files

```typescript
import { createTestLogger } from '@kit/shared/logger';

const { getLogger } = createTestLogger('TEST-NAME');
getLogger().info('Test message', { context });
```

## Remaining Work by Category

### High Priority (Web App - 80 instances)

- AI Canvas components (20+ files)
- Kanban components
- Assessment/Survey components
- Course lesson components
- Admin components

### Medium Priority (E2E Tests - ~100 instances)

- Test helper files
- Page Object Models
- Authentication tests
- Debug specifications

### Low Priority (Package/Infrastructure - ~200 instances)

- Logger implementation files (expected to have console)
- Monitoring services
- Development scripts
- Build tooling

## Technical Challenges Identified

1. **Custom Logger Wrappers**: Many files have custom logger objects that wrap console.* calls
2. **Mixed Patterns**: Some files already use proper loggers but have remaining console calls
3. **Test Files**: Special consideration needed for test output and mocking
4. **Development vs Production**: Some console calls are conditionally executed in development

## Automation Strategy

Files with similar patterns can be batch-processed:

1. **Client Components with Logger Wrappers** (18 files identified)
   - Replace wrapper import with `createClientLogger`
   - Replace wrapper object with `{ getLogger }`
   - Update all `logger.method()` calls to `getLogger().method()`

2. **Test Files**
   - Separate handling for legitimate test output vs debug logging
   - Use `createTestLogger` pattern

3. **Service Files**
   - Use `createServiceLogger` pattern
   - Ensure proper service naming

## Recommendations

### Immediate Actions

1. **Complete Web App Migration** - Focus on the 33 remaining web app files
2. **Automated Script** - Create batch processor for files with identical patterns
3. **Pattern Documentation** - Add examples to project documentation

### Quality Measures

1. **Lint Rule** - Add ESLint rule to prevent new console.* usage
2. **Pre-commit Hook** - Check for console calls in staged files
3. **CI Check** - Fail builds with console.* in production code

## Impact Assessment

### Positive Outcomes

- **Reduced Merge Conflicts**: Each file migrated reduces future upstream conflicts
- **Better Observability**: Structured logging provides better debugging context
- **Production Safety**: Eliminates uncontrolled console output in production

### Development Experience

- **Consistent API**: Single logger interface across all components
- **Environment Awareness**: Automatic log level management
- **Contextual Information**: Better error tracking with structured data

## Next Steps

1. **Batch Process Similar Files**: Target the 18 client components with identical patterns
2. **Focus on High-Impact Files**: Prioritize frequently modified components
3. **Test Coverage**: Ensure logging changes don't break existing functionality
4. **Documentation**: Update development guidelines with logging standards

---

**Files Modified in This Session**: 7  
**Console Calls Eliminated**: 24  
**Remaining Work**: 388 instances across ~300 files  
**Estimated Completion**: 2-3 additional focused sessions for web app, longer for complete project
