# Unit Testing Prioritization Plan for SlideHeroes

## Overview

This document outlines a strategic approach to implementing unit tests for the SlideHeroes application, prioritizing custom business logic over standard Makerkit functionality. The plan focuses on areas where the most custom development work has been done, ensuring maximum value and coverage for critical application features.

## Testing Philosophy

- **Custom First**: Prioritize testing custom business logic over standard Makerkit components
- **Risk-Based**: Focus on critical paths that could break core functionality
- **Value-Driven**: Test areas with the highest business impact first
- **Incremental**: Build testing coverage systematically, starting with pure functions

## **Priority 1: Core Custom Business Logic (Start Here)**

### 1.1 AI Canvas/Editor System

**Location**: `apps/web/app/home/(user)/ai/canvas/`

**High Priority Test Targets**:

- **Server Actions**:

  - `_actions/generate-ideas.ts` - AI content generation logic
  - `_actions/generate-outline.ts` - Outline generation algorithms
  - `_actions/convert-editor-data.ts` - Data transformation between formats
  - `_actions/simplify-text.ts` - Text processing and simplification
  - `_actions/update-building-block-title.action.ts` - Title management logic

- **Utils/Services**:
  - `_lib/utils/normalize-editor-content.ts` - Content normalization (START HERE - likely pure functions)
  - `_lib/contexts/cost-tracking-context.tsx` - Cost calculation logic
  - `_lib/hooks/use-action-with-cost.ts` - Cost tracking integration

**Testing Focus**:

- Input validation and sanitization
- Content transformation accuracy
- Error handling for AI service failures
- Cost calculation correctness

### 1.2 Storyboard/Presentation System

**Location**: `apps/web/app/home/(user)/ai/storyboard/`

**High Priority Test Targets**:

- **Core Services**:
  - `_lib/services/storyboard-service.ts` - Business logic for storyboard management
  - `_lib/services/tiptap-transformer.ts` - Content format transformations
  - `_lib/services/powerpoint/pptx-generator.ts` - PowerPoint export functionality
  - `_lib/services/storyboard-service-client.ts` - Client-side service integration

**Testing Focus**:

- Slide ordering and manipulation
- Content transformation between formats
- PowerPoint generation accuracy
- Data persistence and retrieval

### 1.3 Course/Lesson System

**Location**: `apps/web/app/home/(user)/course/`

**High Priority Test Targets**:

- **Business Logic**:
  - Course progress calculations in `_components/CourseProgressBar.tsx`
  - Quiz processing logic in `lessons/[slug]/_components/QuizComponent.tsx`
  - Certificate generation logic (if any business logic)
- **Server Actions**: `_lib/server/server-actions.ts`

**Testing Focus**:

- Progress calculation accuracy
- Quiz scoring algorithms
- Course completion detection
- Data consistency between components

## **Priority 2: Payload CMS Custom Logic (High Impact)**

### 2.1 Custom Collections

**Location**: `apps/payload/src/collections/`

**High Priority Test Targets**:

- **Collection Configurations**:
  - `CourseLessons.ts` - Validation hooks and field logic
  - `CourseQuizzes.ts` - Quiz-specific validation
  - `Downloads.ts` - File handling and validation
  - `SurveyQuestions.ts` - Survey logic and validation

**Testing Focus**:

- Field validation rules
- Custom hooks execution
- Relationship integrity
- Data transformation on save/load

### 2.2 Custom Blocks

**Location**: `apps/payload/src/blocks/`

**High Priority Test Targets**:

- **Field Components**:
  - `BunnyVideo/Field.tsx` - Video ID extraction and validation
  - `YouTubeVideo/Field.tsx` - YouTube URL parsing
  - Block configuration validation

**Testing Focus**:

- Video ID extraction accuracy
- URL validation and sanitization
- Field state management
- Error handling for invalid inputs

### 2.3 Enhanced Systems

**Location**: `apps/payload/src/lib/`

**High Priority Test Targets**:

- **Core Infrastructure**:
  - `enhanced-api-wrapper.ts` - API enhancement logic
  - `request-deduplication.ts` - Deduplication algorithms
  - `form-submission-protection.ts` - Protection mechanisms
  - `storage-url-generators.ts` - URL generation logic

**Testing Focus**:

- Request deduplication effectiveness
- API wrapper functionality
- URL generation accuracy
- Security protection mechanisms

## **Priority 3: Integration Points (Medium-High Impact)**

### 3.1 Custom API Routes

**Location**: `apps/web/app/api/`

**High Priority Test Targets**:

- `ai-usage/session-cost/route.ts` - Cost tracking API
- `courses/[courseId]/lessons/route.ts` - Course data API

**Testing Focus**:

- Request/response validation
- Error handling
- Authentication/authorization
- Data consistency

### 3.2 Kanban System

**Location**: `apps/web/app/home/(user)/kanban/`

**High Priority Test Targets**:

- `_lib/api/tasks.ts` - Task management API
- `_lib/server/server-actions.ts` - Server-side task operations
- Task state management logic

**Testing Focus**:

- Task CRUD operations
- State transitions
- Data persistence
- Drag-and-drop logic (if contains business logic)

## **Priority 4: Utility Functions (Medium Impact)**

### 4.1 Shared Utilities

**Locations**: `apps/web/lib/`, `apps/payload/src/lib/`

**Test Targets**:

- Data transformation functions
- Validation schemas
- Custom hooks with business logic
- Helper functions

## **Areas to Deprioritize (Standard Makerkit)**

- Authentication flows (`auth/`) - Standard Makerkit implementation
- Billing system (`billing/`) - Standard subscription logic
- Standard admin functionality - Makerkit admin features
- Marketing pages (`(marketing)/`) - Static content
- Dev tools (`apps/dev-tool/`) - Development utilities

## **Recommended Testing Implementation Strategy**

### Phase 1: Foundation (Week 1-2)

1. **Set up testing infrastructure** (Vitest configuration)
2. **Start with pure functions**:
   - `normalize-editor-content.ts`
   - Content transformation utilities
   - Validation functions
3. **Test calculation logic**:
   - Cost tracking
   - Progress calculations

### Phase 2: Core Business Logic (Week 3-4)

1. **AI generation functions**:
   - Outline generation
   - Ideas generation
   - Content transformation
2. **Storyboard services**:
   - Slide management
   - PowerPoint generation
3. **Course logic**:
   - Progress tracking
   - Quiz processing

### Phase 3: Integration Testing (Week 5-6)

1. **API route handlers**
2. **Payload collection hooks**
3. **File upload/storage functions**
4. **Database operations**

### Phase 4: Component Logic (Week 7-8)

1. **Complex form validation**
2. **Custom field components**
3. **Interactive UI behaviors**
4. **State management**

## **Testing Best Practices for This Project**

### Pure Functions First

- Start with functions that have no side effects
- Easy to test and provide immediate confidence
- Examples: content normalization, calculations, transformations

### Mock External Dependencies

- AI services (OpenAI, Claude)
- File storage (R2, S3)
- Database operations
- Third-party APIs

### Test Critical Paths

- User workflows that generate revenue
- Data integrity operations
- Security-sensitive functions
- Performance-critical operations

### Error Handling

- Invalid input scenarios
- Network failures
- Service unavailability
- Edge cases and boundary conditions

## **Success Metrics**

- **Coverage**: Aim for 80%+ coverage on Priority 1 & 2 areas
- **Critical Path Coverage**: 100% coverage on revenue-generating features
- **Regression Prevention**: Tests prevent breaking changes to core features
- **Development Velocity**: Tests enable confident refactoring and feature additions

## **Tools and Framework**

- **Testing Framework**: Vitest (as specified in project standards)
- **Mocking**: Vitest mock utilities for external services
- **Test Data**: Factory functions for consistent test data
- **Coverage**: Built-in Vitest coverage reporting

## **Next Steps**

1. **Immediate**: Set up Vitest configuration if not already done
2. **Week 1**: Start with `normalize-editor-content.ts` testing
3. **Week 1**: Test `storyboard-service.ts` core functions
4. **Week 2**: Add tests for AI generation actions
5. **Ongoing**: Progress through priority list systematically

This prioritization ensures maximum value from testing efforts by focusing on custom business logic while avoiding redundant testing of standard Makerkit functionality.
