# Build Feature Command

Usage: `/build-feature [feature_spec_name]`

This command reads a feature specification from `.claude/specs/features/` and systematically implements the feature according to the spec requirements.

## How It Works

When you run `/build-feature [name]`, the command will:
1. Look for a file at `.claude/specs/features/approved/[name].md`
2. Read and parse the feature specification
3. Create a comprehensive implementation plan
4. Execute the implementation in phases
5. Verify the implementation with tests
6. Update documentation

## Usage Examples

```
/build-feature user-onboarding-flow
/build-feature ai-presentation-builder
/build-feature course-progress-tracking
/build-feature team-collaboration-tools
```

## Command Execution Steps

### 1. Parse Command Input and Validate

Extract the feature spec name and validate it exists:
```typescript
const featureSpecName = commandArgs[0];
if (!featureSpecName) {
  console.log("Please specify a feature spec name. Usage: /build-feature [feature_spec_name]");
  listAvailableSpecs();
  return;
}
```

### 2. Load Feature Specification

Attempt to read the corresponding feature spec file:
```
/read .claude/specs/features/approved/${featureSpecName}.md
```

If the file doesn't exist, check other locations and list available specs:
```bash
# Check if spec exists in draft folder
ls .claude/specs/features/draft/${featureSpecName}.md 2>/dev/null && echo "Found in draft - move to approved first"

# List all available specs by status
echo "Available approved specs:"
ls .claude/specs/features/approved/*.md 2>/dev/null || echo "No approved specs found"

echo "Available draft specs:"
ls .claude/specs/features/draft/*.md 2>/dev/null || echo "No draft specs found"
```

### 3. Adopt Appropriate Role

Based on the feature type in the spec, load the relevant role:
```typescript
// Determine primary role based on feature type
const roleMapping = {
  'ui': '.claude/roles/ui-engineer.md',
  'api': '.claude/roles/data-engineer.md', 
  'ai': '.claude/roles/ai-engineer.md',
  'cms': '.claude/roles/cms-engineer.md',
  'auth': '.claude/roles/security-engineer.md',
  'system': '.claude/roles/architecture-engineer.md'
};

// Load primary role
/read ${roleMapping[featureSpec.primaryType]}
```

### 4. Load Development Context

Read essential development guidelines and patterns:
```
/read CLAUDE.md
/read .claude/docs/development/patterns.md
/read .claude/docs/security/guidelines.md
/read .claude/docs/testing/strategy.md
```

### 5. Parse Feature Specification

Extract and validate key information from the spec:
```typescript
const featureSpec = parseFeatureSpecification(specContent);

// Validate required sections
const requiredSections = [
  'userStories',
  'technicalSpecifications', 
  'implementationPlan',
  'securityRequirements',
  'testingStrategy'
];

validateSpecCompleteness(featureSpec, requiredSections);
```

### 6. Create Implementation Plan with TodoWrite

Use the TodoWrite tool to create a comprehensive task breakdown:
```typescript
// Create implementation plan based on spec phases
const implementationTodos = [];

// Phase 1: Foundation
implementationTodos.push({
  id: `${featureSpecName}-foundation-setup`,
  content: "Set up foundational components and data structures",
  status: "pending",
  priority: "high"
});

// Phase 2: Core Implementation  
for (const userStory of featureSpec.userStories) {
  implementationTodos.push({
    id: `${featureSpecName}-story-${userStory.id}`,
    content: `Implement: ${userStory.title}`,
    status: "pending", 
    priority: userStory.priority || "medium"
  });
}

// Phase 3: Integration & Testing
implementationTodos.push({
  id: `${featureSpecName}-testing-setup`,
  content: "Create comprehensive test suite",
  status: "pending",
  priority: "high"
});

// Phase 4: Security & Validation
implementationTodos.push({
  id: `${featureSpecName}-security-review`,
  content: "Implement security requirements and RLS policies",
  status: "pending",
  priority: "high"
});

// Phase 5: Documentation & Verification
implementationTodos.push({
  id: `${featureSpecName}-documentation`,
  content: "Update documentation and verify implementation",
  status: "pending",
  priority: "medium"
});

// Create todos
/invoke TodoWrite { todos: implementationTodos }
```

### 7. Implementation Execution

Execute implementation in phases according to the feature spec:

#### Phase 1: Foundation Setup

Mark foundation todo as in_progress and begin implementation:
```typescript
// Update todo status
/invoke TodoWrite { todos: [{ 
  id: `${featureSpecName}-foundation-setup`,
  status: "in_progress",
  // ... other todo properties
}] }

// Database schema setup
if (featureSpec.dataModel) {
  // Create migration files
  // Set up Supabase tables
  // Define RLS policies
}

// API structure setup  
if (featureSpec.apiRequirements) {
  // Create server actions
  // Set up validation schemas
  // Define error handling patterns
}

// UI component foundations
if (featureSpec.uiComponents) {
  // Create base components
  // Set up shared types
  // Configure routing if needed
}
```

#### Phase 2: Core Feature Implementation

Implement each user story systematically:
```typescript
for (const userStory of featureSpec.userStories) {
  // Mark story as in_progress
  /invoke TodoWrite { todos: [{ 
    id: `${featureSpecName}-story-${userStory.id}`,
    status: "in_progress"
  }] }
  
  // Implement acceptance criteria
  for (const criteria of userStory.acceptanceCriteria) {
    implementAcceptanceCriteria(criteria);
  }
  
  // Verify user story completion
  verifyUserStoryImplementation(userStory);
  
  // Mark story as completed
  /invoke TodoWrite { todos: [{ 
    id: `${featureSpecName}-story-${userStory.id}`,
    status: "completed"
  }] }
}
```

#### Phase 3: Security Implementation

Implement security requirements following SlideHeroes patterns:
```typescript
// Mark security todo as in_progress
/invoke TodoWrite { todos: [{ 
  id: `${featureSpecName}-security-review`,
  status: "in_progress"
}] }

// RLS Policies
if (featureSpec.rlsPolicies) {
  // Create RLS policies according to spec
  // Test policies with sample data
  // Verify access control works correctly
}

// Input Validation
if (featureSpec.inputValidation) {
  // Create Zod schemas
  // Implement server-side validation
  // Add client-side validation feedback
}

// API Security
if (featureSpec.apiSecurity) {
  // Use enhanceAction wrapper
  // Implement rate limiting if specified
  // Add audit logging if required
}
```

#### Phase 4: Testing Implementation

Create comprehensive test suite:
```typescript
// Mark testing todo as in_progress
/invoke TodoWrite { todos: [{ 
  id: `${featureSpecName}-testing-setup`,
  status: "in_progress"
}] }

// Unit Tests
if (featureSpec.unitTests) {
  // Test utility functions
  // Test business logic
  // Test validation schemas
}

// Integration Tests  
if (featureSpec.integrationTests) {
  // Test API endpoints
  // Test database operations
  // Test RLS policies
}

// End-to-End Tests
if (featureSpec.e2eTests) {
  // Test critical user journeys
  // Test error scenarios
  // Test performance requirements
}

// Run test suite and verify coverage
runTestSuite();
verifyTestCoverage(featureSpec.coverageTargets);
```

#### Phase 5: Documentation & Verification

Complete implementation with documentation and final verification:
```typescript
// Mark documentation todo as in_progress
/invoke TodoWrite { todos: [{ 
  id: `${featureSpecName}-documentation`,
  status: "in_progress"
}] }

// Update documentation
updateApiDocumentation(featureSpec.apiRequirements);
updateUserDocumentation(featureSpec.userExperience);
updateTechnicalDocumentation(featureSpec.technicalSpecs);

// Verify success metrics are trackable
implementSuccessMetrics(featureSpec.successMetrics);

// Final verification
verifyAllAcceptanceCriteria(featureSpec.userStories);
verifySecurityRequirements(featureSpec.securityRequirements);
verifyPerformanceRequirements(featureSpec.performanceRequirements);
```

### 8. Code Quality & Standards Compliance

Ensure all code follows SlideHeroes standards:
```bash
# Run linting and formatting
pnpm lint:fix
pnpm format:fix

# Run type checking
pnpm typecheck

# Run tests
pnpm test

# Verify database migrations
pnpm supabase:web:test
```

### 9. Feature Verification

Verify the feature meets all requirements:
```typescript
const verificationResults = {
  userStoriesCompleted: checkUserStoriesCompletion(featureSpec.userStories),
  securityRequirementsMet: checkSecurityCompliance(featureSpec.securityRequirements),
  performanceTargetsMet: checkPerformanceTargets(featureSpec.performanceRequirements),
  testCoverageMet: checkTestCoverage(featureSpec.testingStrategy),
  documentationComplete: checkDocumentationCompleteness(featureSpec)
};

generateVerificationReport(verificationResults);
```

### 10. Completion Summary

Provide comprehensive completion summary:
```
✅ Feature Implementation Complete!

📋 Feature: [Feature Name]
🎯 User Stories Implemented: [X/Y]  
🔒 Security Requirements: ✅ Met
🧪 Test Coverage: [X]% (Target: [Y]%)
📊 Performance Targets: ✅ Met
📚 Documentation: ✅ Complete

📁 Files Created/Modified:
  - [component files]
  - [API routes/actions]
  - [database migrations]
  - [test files]

🚀 Next Steps:
1. Review implementation against feature spec
2. Test feature in development environment
3. Create pull request for code review
4. Deploy to staging for stakeholder review
5. Monitor success metrics post-deployment

💡 Deployment Notes:
- [Any special deployment considerations]
- [Environment variables to set]
- [Database migrations to run]
```

## Error Handling

### Missing Feature Spec
```
❌ Feature spec '[name]' not found in .claude/specs/features/approved/

📁 Available approved specs:
- user-authentication-flow
- presentation-builder  
- team-dashboard

📝 Available draft specs:
- user-onboarding-flow (move to approved to implement)
- ai-chat-feature (move to approved to implement)

💡 To create a new feature spec:
1. Run: /write-feature-spec [name]
2. Review the generated spec in draft/
3. Move to approved/ when ready: mv .claude/specs/features/draft/[name].md .claude/specs/features/approved/
4. Run: /build-feature [name]

🔄 To move draft to approved:
mv .claude/specs/features/draft/[name].md .claude/specs/features/approved/
```

### Incomplete Feature Spec
```
⚠️ Feature spec validation failed!

Missing required sections:
- [ ] Technical Specifications
- [ ] Security Requirements  
- [x] User Stories
- [x] Implementation Plan

Please complete the feature spec before implementation.
```

### Implementation Failures
```
❌ Implementation failed at Phase [X]

Error: [specific error message]

Current Progress:
- [x] Phase 1: Foundation ✅
- [~] Phase 2: Core Implementation ⚠️ 
- [ ] Phase 3: Security Implementation
- [ ] Phase 4: Testing
- [ ] Phase 5: Documentation

Suggestion: Fix the error and resume with:
/build-feature [name] --resume-from-phase-2
```

## Advanced Options

### Resume Implementation
```
/build-feature [name] --resume-from-phase-[X]
```

### Specific Phase Implementation
```
/build-feature [name] --phase=[phase_name]
```

### Dry Run Mode
```
/build-feature [name] --dry-run
```

## Integration Notes

### With Other Commands
- Use `/write-unit-tests` for comprehensive test coverage
- Use `/log-issue` if bugs are discovered during implementation  
- Use `/debug-issue` for implementation problems

### Feature Spec Requirements
The feature spec must include:
- Complete user stories with acceptance criteria
- Technical architecture specifications
- Security and RLS requirements
- Testing strategy and coverage targets
- Success metrics and monitoring requirements

### SlideHeroes Patterns
All implementations must follow:
- Server Components preference
- enhanceAction wrapper for server actions
- Zod validation for all inputs
- RLS policies for data access
- TypeScript strict typing
- Proper error handling and user feedback