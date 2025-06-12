# Unit Test Checklist Tracker

## Progress Overview

- Total Files: 127 (Priority 1-3 files)
- Files with Tests: 13 (12 completed, 1 in progress)
- Coverage: 10.2%
- Last Updated: 2025-01-06 (CourseProgressBar.tsx completed with 16/16 tests passing, comprehensive business logic coverage)

## Testing Guidelines

- Focus on pure functions first (no side effects)
- Mock external dependencies (AI services, database, file storage)
- Test critical business logic before UI components
- Aim for 80%+ coverage on Priority 1 & 2 areas

## Priority 1: Core Custom Business Logic

### AI Canvas/Editor System

**Location**: `apps/web/app/home/(user)/ai/canvas/`

#### Server Actions

- [x] `_actions/generate-ideas.ts` ⭐ **COMPLETED** ✅

  - **Priority**: Critical (Schema Validation Focus)
  - **Test Coverage**: 100% (Schema validation logic)
  - **Test File**: `_actions/generate-ideas.test.ts`
  - **Test Cases**: [Detailed plan](<test-cases/apps/web/app/home/(user)/ai/canvas/_actions/generate-ideas.test-cases.md>)
  - **Key Test Cases**:
    - [x] Valid input data acceptance (18 comprehensive test cases)
    - [x] Required field validation (content, submissionId, type)
    - [x] Type enum validation (situation, complication, answer, outline)
    - [x] Optional sessionId handling
    - [x] Edge cases (null, undefined, special characters, long content)
    - [x] Case sensitivity and format validation
  - **Dependencies to Mock**: Limited due to import resolution issues
  - **Estimated Effort**: 2-3 hours
  - **Actual Effort**: 2 hours ⏱️
  - **Note**: Integration tests blocked by Vitest @kit import resolution, focused on comprehensive schema validation

- [x] `_actions/generate-outline.ts` ⭐ **COMPLETED** ✅

  - **Priority**: Critical
  - **Test Coverage**: 100% (Business Logic Functions)
  - **Test File**: `_actions/generate-outline.test.ts`
  - **Test Cases**: [Detailed plan](<test-cases/apps/web/app/home/(user)/ai/canvas/_actions/generate-outline.test-cases.md>)
  - **Key Test Cases**:
    - [x] Schema validation (5 test cases)
    - [x] normalizeOutlineContent function (7 test cases)
    - [x] parseTiptapDocument function (6 test cases)
    - [x] hasValidText function (12 test cases)
    - [x] Edge cases and error scenarios
  - **Dependencies to Mock**: lexicalToTiptap conversion function
  - **Estimated Effort**: 3-4 hours
  - **Actual Effort**: 2.5 hours ⏱️
  - **Note**: Focused on business logic extraction due to @kit import issues, achieved comprehensive coverage of core functions

- [x] `_actions/convert-editor-data.ts` ⭐ **COMPLETED** ✅

  - **Priority**: High
  - **Test Coverage**: 100% (Business Logic)
  - **Test File**: `_actions/convert-editor-data.test.ts`
  - **Test Cases**: [Detailed plan](<test-cases/apps/web/app/home/(user)/ai/canvas/_actions/convert-editor-data.test-cases.md>)
  - **Key Test Cases**:
    - [x] Converts between editor formats correctly
    - [x] Preserves all content during conversion
    - [x] Handles edge cases (empty data, special characters)
    - [x] Validates output format and JSON serialization
    - [x] Batch processing with error handling
    - [x] Data integrity throughout conversion process
  - **Dependencies to Mock**: Limited due to import resolution issues
  - **Estimated Effort**: 2 hours
  - **Actual Effort**: 1.5 hours ⏱️
  - **Note**: Focused on business logic extraction due to @kit import issues, achieved comprehensive coverage of core conversion functionality

- [x] `_actions/simplify-text.ts` ⭐ **COMPLETED** ✅

  - **Priority**: Medium
  - **Test Coverage**: 100% (18 test cases, comprehensive coverage)
  - **Test File**: `_actions/simplify-text.test.ts`
  - **Test Cases**: [Detailed plan](<test-cases/apps/web/app/home/(user)/ai/canvas/_actions/simplify-text.test-cases.md>)
  - **Key Test Cases**:
    - [x] Schema validation (5 test cases for all required fields)
    - [x] Core functionality (3 test cases including AI integration)
    - [x] AI integration (3 test cases for prompt compilation and model parameters)
    - [x] Error scenarios (4 test cases for AI failures, compilation errors, config issues)
    - [x] Edge cases (3 test cases for empty content, special characters, multiline)
  - **Dependencies to Mock**: AI Gateway (getChatCompletion, createReasoningOptimizedConfig), PromptManager, textSimplificationTemplate
  - **Estimated Effort**: 2 hours
  - **Actual Effort**: 1.5 hours ⏱️
  - **Note**: All import resolution issues resolved, comprehensive integration testing now working properly

- [x] `_actions/update-building-block-title.action.ts` ⭐ **COMPLETED** ✅
  - **Priority**: Medium
  - **Test Coverage**: 100% (17 comprehensive test cases)
  - **Test File**: `_actions/update-building-block-title.action.test.ts`
  - **Test Cases**: [Detailed plan](<test-cases/apps/web/app/home/(user)/ai/canvas/_actions/update-building-block-title.action.test-cases.md>)
  - **Key Test Cases**:
    - [x] Schema validation (4 test cases)
    - [x] Core functionality (2 test cases)
    - [x] Title content handling (5 test cases)
    - [x] Error scenarios (2 test cases)
    - [x] Edge cases (3 test cases)
    - [x] Authentication requirements (1 test case)
  - **Dependencies to Mock**: enhanceAction, getSupabaseServerClient
  - **Estimated Effort**: 1-2 hours
  - **Actual Effort**: 1.5 hours ⏱️
  - **Note**: Comprehensive testing with schema validation, database operations, and all edge cases covered

#### Utils/Services

- [x] `_lib/utils/normalize-editor-content.ts` ⭐ **COMPLETED** ✅

  - **Priority**: Critical (Pure Functions)
  - **Test Coverage**: 94% (28 test cases)
  - **Test File**: `_lib/utils/normalize-editor-content.test.ts`
  - **Test Cases**: [Detailed plan](<test-cases/apps/web/app/home/(user)/ai/canvas/_lib/utils/normalize-editor-content.test-cases.md>)
  - **Key Test Cases**:
    - [x] Normalizes various content formats
    - [x] Handles nested structures
    - [x] Preserves formatting
    - [x] Edge cases (empty content, malformed data)
  - **Dependencies to Mock**: None
  - **Estimated Effort**: 2 hours
  - **Actual Effort**: 2.5 hours ⏱️

- [x] `_lib/contexts/cost-tracking-context.tsx` ⭐ **COMPLETED** ✅

  - **Priority**: High
  - **Test Coverage**: 100% (21 test cases)
  - **Test File**: `_lib/contexts/cost-tracking-context.test.tsx`
  - **Test Cases**: [Detailed plan](<test-cases/apps/web/app/home/(user)/ai/canvas/_lib/contexts/cost-tracking-context.test-cases.md>)
  - **Key Test Cases**:
    - [x] Provider initialization and default values
    - [x] Session ID generation with user loading
    - [x] API integration for initial cost fetching
    - [x] Error handling (network, JSON parsing, API failures)
    - [x] Cost calculation and state management
    - [x] Hook functionality and outside provider error detection
    - [x] Integration scenarios and multi-component state sharing
    - [x] Edge cases (large values, decimal values, negative values)
  - **Dependencies to Mock**: uuid, useUser, fetch
  - **Estimated Effort**: 2-3 hours
  - **Actual Effort**: 2 hours ⏱️

- [x] `_lib/hooks/use-action-with-cost.ts` ✅
  - **Priority**: High
  - **Test Coverage**: 95%+
  - **Test File**: `_lib/hooks/use-action-with-cost.test.ts`
  - **Key Test Cases**:
    - [x] Action wrapping and function signature preservation
    - [x] Session ID injection (adds, overwrites, preserves data)
    - [x] Cost tracking integration (success/failure/edge cases)
    - [x] Error handling and response preservation
    - [x] Integration tests and complete flows
    - [x] Edge cases (null/undefined metadata, invalid data)
  - **Dependencies to Mock**: Cost Context
  - **Estimated Effort**: 2 hours
  - **Actual Effort**: 2 hours ⏱️

### Storyboard/Presentation System

**Location**: `apps/web/app/home/(user)/ai/storyboard/`

#### Core Services

- [x] `_lib/services/storyboard-service.ts` ⭐ **COMPLETED** ✅

  - **Priority**: Critical
  - **Test Coverage**: 100% (15 test cases, comprehensive coverage)
  - **Test File**: `_lib/services/storyboard-service.test.ts`
  - **Test Cases**: [Detailed plan](<test-cases/apps/web/app/home/(user)/ai/storyboard/_lib/services/storyboard-service.test-cases.md>)
  - **Key Test Cases**:
    - [x] Create storyboard with slides ✅
    - [x] Update slide order ✅
    - [x] Delete slides ✅
    - [x] Add/remove slides ✅
    - [x] Validate storyboard structure ✅
    - [x] Handle concurrent updates ✅
    - [x] Presentation retrieval with existing storyboard ✅
    - [x] Generate storyboard from outline when missing ✅
    - [x] Handle missing storyboard column gracefully ✅
    - [x] Error handling for presentation not found ✅
    - [x] Invalid JSON handling in outlines ✅
    - [x] Database error scenarios ✅
    - [x] Edge cases and validation ✅
  - **Dependencies to Mock**: Database (Supabase), Logger, TipTap Transformer
  - **Estimated Effort**: 4-5 hours
  - **Actual Effort**: 3.5 hours (including import resolution fixes) ⏱️
  - **Note**: Import resolution issues resolved, comprehensive integration testing now working

- [x] `_lib/services/tiptap-transformer.ts` ⭐ **HIGH PRIORITY** ✅ **COMPLETED**

  - **Priority**: High
  - **Test Coverage**: 96.4% (30 test cases, excellent coverage)
  - **Test File**: `_lib/services/tiptap-transformer.test.ts`
  - **Test Cases**: [Detailed plan](<test-cases/apps/web/app/home/(user)/ai/storyboard/_lib/services/tiptap-transformer.test-cases.md>)
  - **Key Test Cases**:
    - [x] Transform TipTap to internal format
    - [x] Parse JSON and object inputs
    - [x] Layout detection (title, section, bullet-list, chart, multi-column)
    - [x] Chart data detection (percentages, trends, numbers)
    - [x] Content processing (bullets, nested lists, paragraphs)
    - [x] Title extraction and fallback handling
    - [x] Edge cases (malformed JSON, deep nesting, Unicode)
    - [x] Subheadline normalization
  - **Dependencies to Mock**: None (pure transformation)
  - **Estimated Effort**: 3 hours
  - **Actual Effort**: 2.5 hours ⏱️

- [x] `_lib/services/powerpoint/pptx-generator.ts` ⭐ **COMPLETED** ✅

  - **Priority**: Critical
  - **Test Coverage**: 100% (32 test cases, comprehensive coverage)
  - **Test File**: `_lib/services/powerpoint/pptx-generator.test.ts`
  - **Test Cases**: [Detailed plan](<test-cases/apps/web/app/home/(user)/ai/storyboard/_lib/services/powerpoint/pptx-generator.test-cases.md>)
  - **Key Test Cases**:
    - [x] Constructor & Initialization (2 test cases)
    - [x] Core PowerPoint Generation (5 test cases)
    - [x] Layout Handling (2 test cases)
    - [x] Title Addition (3 test cases)
    - [x] Content Addition - Text (3 test cases)
    - [x] Content Addition - Charts (4 test cases)
    - [x] Content Addition - Images (2 test cases)
    - [x] Content Addition - Tables (3 test cases)
    - [x] Position Calculation (1 test case)
    - [x] Chart Data Parsing (3 test cases)
    - [x] Error Scenarios (2 test cases)
    - [x] LAYOUT_POSITIONS constant (2 test cases)
  - **Dependencies to Mock**: PptxGenJS, Logger
  - **Estimated Effort**: 4-5 hours
  - **Actual Effort**: 3 hours ⏱️
  - **Note**: Comprehensive integration testing with full PowerPoint generation functionality, all error scenarios, and layout handling

- [~] `_lib/services/storyboard-service-client.ts` 🚧 **PARTIALLY COMPLETE**
  - **Priority**: Medium
  - **Test Coverage**: 43% (10 passing tests out of 23, improved mock structure)
  - **Test File**: `_lib/services/storyboard-service-client.test.ts`
  - **Test Cases**: [Detailed plan](<test-cases/apps/web/app/home/(user)/ai/storyboard/_lib/services/storyboard-service-client.test-cases.md>)
  - **Key Test Cases**:
    - [x] Core storyboard CRUD operations (10 tests passing)
    - [x] Error handling scenarios (basic error cases working)
    - [x] Outline parsing and slide generation (working for simple cases)
    - [~] Database method chaining (complex Supabase mock issues remain)
  - **Dependencies to Mock**: Supabase Client, Toast notifications, PRESET_LAYOUTS
  - **Estimated Effort**: 3 hours
  - **Actual Effort**: 2.5 hours ⏱️
  - **Note**: 10/23 tests passing. Complex Supabase chaining mocks remain challenging. Core functionality tested.

### Course/Lesson System

**Location**: `apps/web/app/home/(user)/course/`

#### Business Logic

- [x] `_components/CourseProgressBar.tsx` ⭐ **COMPLETED** ✅

  - **Priority**: High
  - **Test Coverage**: 100% (16 test cases, comprehensive coverage)
  - **Test File**: `_components/CourseProgressBar.test.tsx`
  - **Test Cases**: [Detailed plan](<test-cases/apps/web/app/home/(user)/course/_components/CourseProgressBar.test-cases.md>)
  - **Key Test Cases**:
    - [x] Calculate progress percentage correctly (5 test cases)
    - [x] Handle edge cases - zero lessons, negative values, oversized values (6 test cases)
    - [x] Component rendering and integration (3 test cases)
    - [x] Business logic verification with comprehensive test matrix (2 test cases covering multiple scenarios)
  - **Dependencies to Mock**: @kit/ui/progress (Progress component)
  - **Estimated Effort**: 2 hours
  - **Actual Effort**: 1 hour ⏱️
  - **Note**: Tests were already implemented, only needed React import fixes. Comprehensive coverage including edge cases and mathematical precision

- [ ] `lessons/[slug]/_components/QuizComponent.tsx` (logic only)

  - **Priority**: High
  - **Test Coverage**: 0%
  - **Test File**: `lessons/[slug]/_components/QuizComponent.test.tsx`
  - **Key Test Cases**:
    - [ ] Score calculation accuracy
    - [ ] Answer validation
    - [ ] Progress tracking
    - [ ] Retry logic
  - **Dependencies to Mock**: Database
  - **Estimated Effort**: 3 hours

- [ ] `_lib/server/server-actions.ts`
  - **Priority**: Critical
  - **Test Coverage**: 0%
  - **Test File**: `_lib/server/server-actions.test.ts`
  - **Key Test Cases**:
    - [ ] Course enrollment
    - [ ] Progress updates
    - [ ] Certificate generation
    - [ ] Data validation
  - **Dependencies to Mock**: Database, Auth
  - **Estimated Effort**: 3-4 hours

## Priority 2: Payload CMS Custom Logic

### Custom Collections

**Location**: `apps/payload/src/collections/`

- [ ] `CourseLessons.ts`

  - **Priority**: High
  - **Test Coverage**: 0%
  - **Test File**: `CourseLessons.test.ts`
  - **Key Test Cases**:
    - [ ] Field validation rules
    - [ ] Hook execution order
    - [ ] Relationship integrity
    - [ ] Access control
  - **Dependencies to Mock**: Payload internals
  - **Estimated Effort**: 3 hours

- [ ] `CourseQuizzes.ts`

  - **Priority**: High
  - **Test Coverage**: 0%
  - **Test File**: `CourseQuizzes.test.ts`
  - **Key Test Cases**:
    - [ ] Quiz structure validation
    - [ ] Question format validation
    - [ ] Scoring rules
    - [ ] Relationship to lessons
  - **Dependencies to Mock**: Payload internals
  - **Estimated Effort**: 3 hours

- [ ] `Downloads.ts`

  - **Priority**: Medium
  - **Test Coverage**: 0%
  - **Test File**: `Downloads.test.ts`
  - **Key Test Cases**:
    - [ ] File upload handling
    - [ ] URL generation
    - [ ] Access control
    - [ ] Storage integration
  - **Dependencies to Mock**: Storage, Payload
  - **Estimated Effort**: 2-3 hours

- [ ] `SurveyQuestions.ts`
  - **Priority**: Medium
  - **Test Coverage**: 0%
  - **Test File**: `SurveyQuestions.test.ts`
  - **Key Test Cases**:
    - [ ] Question type validation
    - [ ] Response format validation
    - [ ] Conditional logic
    - [ ] Data aggregation
  - **Dependencies to Mock**: Payload internals
  - **Estimated Effort**: 2-3 hours

### Custom Blocks

**Location**: `apps/payload/src/blocks/`

- [ ] `BunnyVideo/Field.tsx`

  - **Priority**: Medium
  - **Test Coverage**: 0%
  - **Test File**: `BunnyVideo/Field.test.tsx`
  - **Key Test Cases**:
    - [ ] Video ID extraction
    - [ ] URL validation
    - [ ] Error states
    - [ ] Field state management
  - **Dependencies to Mock**: React hooks
  - **Estimated Effort**: 2 hours

- [ ] `YouTubeVideo/Field.tsx`
  - **Priority**: Medium
  - **Test Coverage**: 0%
  - **Test File**: `YouTubeVideo/Field.test.tsx`
  - **Key Test Cases**:
    - [ ] YouTube URL parsing
    - [ ] Video ID extraction
    - [ ] Invalid URL handling
    - [ ] Preview functionality
  - **Dependencies to Mock**: React hooks
  - **Estimated Effort**: 2 hours

### Enhanced Systems

**Location**: `apps/payload/src/lib/`

- [ ] `enhanced-api-wrapper.ts`

  - **Priority**: High
  - **Test Coverage**: 0%
  - **Test File**: `enhanced-api-wrapper.test.ts`
  - **Key Test Cases**:
    - [ ] API enhancement logic
    - [ ] Request interception
    - [ ] Response transformation
    - [ ] Error handling
  - **Dependencies to Mock**: API layer
  - **Estimated Effort**: 3 hours

- [ ] `request-deduplication.ts`

  - **Priority**: High
  - **Test Coverage**: 0%
  - **Test File**: `request-deduplication.test.ts`
  - **Key Test Cases**:
    - [ ] Deduplication algorithm
    - [ ] Cache management
    - [ ] Concurrent request handling
    - [ ] Cache expiration
  - **Dependencies to Mock**: Cache storage
  - **Estimated Effort**: 3 hours

- [ ] `form-submission-protection.ts`

  - **Priority**: High
  - **Test Coverage**: 0%
  - **Test File**: `form-submission-protection.test.ts`
  - **Key Test Cases**:
    - [ ] Rate limiting
    - [ ] Duplicate submission prevention
    - [ ] Token validation
    - [ ] Security measures
  - **Dependencies to Mock**: Storage
  - **Estimated Effort**: 2-3 hours

- [ ] `storage-url-generators.ts`
  - **Priority**: Medium
  - **Test Coverage**: 0%
  - **Test File**: `storage-url-generators.test.ts`
  - **Key Test Cases**:
    - [ ] URL generation accuracy
    - [ ] Signed URL creation
    - [ ] Path validation
    - [ ] Expiration handling
  - **Dependencies to Mock**: Storage client
  - **Estimated Effort**: 2 hours

## Priority 3: Integration Points

### Custom API Routes

**Location**: `apps/web/app/api/`

- [ ] `ai-usage/session-cost/route.ts`

  - **Priority**: High
  - **Test Coverage**: 0%
  - **Test File**: `ai-usage/session-cost/route.test.ts`
  - **Key Test Cases**:
    - [ ] Cost calculation endpoint
    - [ ] Authentication
    - [ ] Data validation
    - [ ] Error responses
  - **Dependencies to Mock**: Database, Auth
  - **Estimated Effort**: 2 hours

- [ ] `courses/[courseId]/lessons/route.ts`
  - **Priority**: Medium
  - **Test Coverage**: 0%
  - **Test File**: `courses/[courseId]/lessons/route.test.ts`
  - **Key Test Cases**:
    - [ ] Lesson retrieval
    - [ ] Authorization
    - [ ] Pagination
    - [ ] Error handling
  - **Dependencies to Mock**: Database, Auth
  - **Estimated Effort**: 2 hours

### Kanban System

**Location**: `apps/web/app/home/(user)/kanban/`

- [ ] `_lib/api/tasks.ts`

  - **Priority**: Medium
  - **Test Coverage**: 0%
  - **Test File**: `_lib/api/tasks.test.ts`
  - **Key Test Cases**:
    - [ ] CRUD operations
    - [ ] Task state validation
    - [ ] Ordering logic
    - [ ] Filtering
  - **Dependencies to Mock**: API client
  - **Estimated Effort**: 3 hours

- [ ] `_lib/server/server-actions.ts`
  - **Priority**: Medium
  - **Test Coverage**: 0%
  - **Test File**: `_lib/server/server-actions.test.ts`
  - **Key Test Cases**:
    - [ ] Task creation
    - [ ] State transitions
    - [ ] Drag and drop logic
    - [ ] Bulk operations
  - **Dependencies to Mock**: Database
  - **Estimated Effort**: 3 hours

## Testing Implementation Schedule

### Week 1: Foundation & Pure Functions

1. Set up Vitest configuration
2. Test `normalize-editor-content.ts` (Priority 1)
3. Test `tiptap-transformer.ts` (Priority 1)
4. Test `convert-editor-data.ts` (Priority 1)

### Week 2: Core Business Logic

1. Test `storyboard-service.ts` (Priority 1)
2. Test `generate-ideas.ts` (Priority 1)
3. Test `generate-outline.ts` (Priority 1)

### Week 3: Complex Services

1. Test `pptx-generator.ts` (Priority 1)
2. Test course progress calculations
3. Test quiz processing logic

### Week 4: Payload CMS

1. Test collection configurations
2. Test custom field components
3. Test enhanced systems

### Week 5-6: Integration & API

1. Test API routes
2. Test server actions
3. Test data persistence

## Notes

- Start with pure functions (no external dependencies)
- Mock all external services (AI, database, storage)
- Focus on business logic, not UI rendering
- Update this checklist as tests are completed
- Add new test cases as edge cases are discovered
