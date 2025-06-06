# Write Feature Specification Command

Usage: `/write-feature-spec [feature_name]` (optional: `--template=basic|advanced|ai` `--interactive=true|false`)

This command intelligently gathers requirements and generates comprehensive feature specifications using automated analysis, external research, and focused user input.

## How It Works

The command uses a multi-layered approach to minimize manual effort while maximizing spec quality:

1. **Smart User Interview** - Targeted questions based on feature type
2. **Automated Codebase Analysis** - Pattern detection and architecture insights
3. **External Research** - Best practices and implementation approaches  
4. **Intelligent Synthesis** - Combining inputs into actionable suggestions
5. **Interactive Refinement** - User review and customization
6. **Validation & Generation** - Quality checks and final spec creation

## Usage Examples

```
/write-feature-spec user-onboarding-flow
/write-feature-spec ai-presentation-builder --template=ai
/write-feature-spec team-collaboration --interactive=false
```

## Command Execution Steps

### 1. Setup & Initialization

Parse command and prepare environment:
```typescript
const featureName = commandArgs[0];
const template = extractFlag('--template') || 'advanced';
const interactive = extractFlag('--interactive') !== 'false';

if (!featureName) {
  console.log("Please specify a feature name. Usage: /write-feature-spec [feature_name]");
  return;
}
```

Create spec generation tracking with TodoWrite:
```typescript
const specTodos = [
  {
    id: `spec-${featureName}-interview`,
    content: "Conduct user interview to gather requirements",
    status: "pending",
    priority: "high"
  },
  {
    id: `spec-${featureName}-analysis`,
    content: "Analyze codebase patterns and architecture",
    status: "pending", 
    priority: "high"
  },
  {
    id: `spec-${featureName}-research`,
    content: "Research best practices and external examples",
    status: "pending",
    priority: "medium"
  },
  {
    id: `spec-${featureName}-synthesis`,
    content: "Generate intelligent suggestions and proposals",
    status: "pending",
    priority: "high"
  },
  {
    id: `spec-${featureName}-refinement`,
    content: "Interactive refinement with user feedback",
    status: "pending",
    priority: "medium"
  },
  {
    id: `spec-${featureName}-generation`,
    content: "Generate final feature specification",
    status: "pending",
    priority: "high"
  }
];

/invoke TodoWrite { todos: specTodos }
```

### 2. Context Loading & Role Adoption

Load the feature spec template and relevant context:
```
/read .claude/specs/features/template/feature-spec-template.md
/read CLAUDE.md
/read .claude/docs/development/patterns.md
```

### 3. Smart User Interview

Mark interview todo as in_progress and begin targeted questioning:
```typescript
// Update todo status
/invoke TodoWrite { 
  todos: [{ 
    id: `spec-${featureName}-interview`,
    status: "in_progress"
  }] 
}

// Begin interview process
console.log("🎯 Let's create a feature spec for: " + featureName);
console.log("I'll ask you focused questions and use automation to fill in technical details.\n");
```

#### Core Questions (Always Asked):

**Feature Overview:**
1. **Problem Statement**: "What user problem or business need does this feature address?"
2. **Target Users**: "Who are the primary users? (e.g., 'Small consultancy owners', 'Individual consultants', 'Team leads')"
3. **Success Definition**: "What would successful implementation look like? How would you measure success?"
4. **Feature Type**: "What type of feature is this? (UI component, API integration, AI tool, CMS content, authentication, dashboard, etc.)"

**Business Context:**
5. **Priority Level**: "What's the business priority? (Critical/High/Medium/Low)"
6. **Timeline**: "Any timeline constraints or target release?"
7. **Business Value**: "What business value does this provide? (Revenue impact, user retention, operational efficiency, etc.)"

#### Dynamic Questions (Based on Feature Type):

**For UI Features:**
- "Describe the main user interaction flow"
- "Are there similar UIs in other tools you've seen that work well?"
- "Any specific responsive design requirements?"

**For AI Features:**
- "What AI capabilities are needed? (text generation, analysis, image processing, etc.)"
- "How should AI costs be managed?"
- "What's the expected input/output format?"

**For API Features:**
- "What external services need integration?"
- "What's the expected data volume and performance requirements?"
- "Any specific authentication or security requirements?"

**For CMS Features:**
- "What content types need management?"
- "Who will be creating/editing this content?"
- "Any workflow or approval processes needed?"

#### User Stories Collection:
```typescript
console.log("\n📝 Let's define the core user stories:");
console.log("I'll help you structure these properly. Start with your main user story:");

// Collect primary user story
const primaryStory = collectUserStory();

// Ask for additional stories
const additionalStories = [];
while (askYesNo("Do you have additional user stories for this feature?")) {
  additionalStories.push(collectUserStory());
}

function collectUserStory() {
  const userType = ask("As a [what type of user]:");
  const functionality = ask("I want [what functionality]:");
  const benefit = ask("So that [what benefit/value]:");
  
  console.log("Great! Now let's define acceptance criteria:");
  const criteria = [];
  while (askYesNo("Add an acceptance criterion?")) {
    criteria.push(ask("Acceptance criterion:"));
  }
  
  return { userType, functionality, benefit, criteria };
}
```

### 4. Parallel Automated Analysis

While processing user input, run automated analysis:
```typescript
// Mark analysis todo as in_progress
/invoke TodoWrite { 
  todos: [{ 
    id: `spec-${featureName}-analysis`,
    status: "in_progress"
  }] 
}

// Run parallel analysis based on feature type
const analysisPromises = [
  analyzeCodebasePatterns(featureType),
  analyzeDatabaseSchema(featureType),
  findSimilarFeatures(featureName, featureType),
  analyzeSecurityPatterns(),
  analyzeIntegrationPoints(featureType)
];

const analysisResults = await Promise.all(analysisPromises);
```

#### Codebase Pattern Analysis:
```typescript
async function analyzeCodebasePatterns(featureType) {
  // Find similar components
  const similarComponents = await Task({
    description: "Find similar components",
    prompt: `Find existing components similar to ${featureType} in the SlideHeroes codebase. Look for:
    - Similar UI components in apps/web/components/
    - Related API routes or server actions
    - Existing data models or types
    - Authentication/authorization patterns
    Return specific file paths and brief descriptions.`
  });
  
  // Find existing patterns
  const existingPatterns = await Grep({
    pattern: `(${featureType}|similar_keywords)`,
    include: "*.{ts,tsx,js,jsx}"
  });
  
  return { similarComponents, existingPatterns };
}
```

#### Database Schema Analysis:
```typescript
async function analyzeDatabaseSchema(featureType) {
  // Get existing tables and relationships
  const schemaInfo = await mcp__postgres__pg_manage_schema({
    operation: "get_info"
  });
  
  // Analyze RLS policies
  const rlsPolicies = await mcp__postgres__pg_manage_rls({
    operation: "get_policies"
  });
  
  // Find relevant existing tables
  const relevantTables = findRelevantTables(schemaInfo, featureType);
  
  return { schemaInfo, rlsPolicies, relevantTables };
}
```

#### Security Pattern Analysis:
```typescript
async function analyzeSecurityPatterns() {
  // Find existing RLS patterns
  const rlsPatterns = await Grep({
    pattern: "CREATE POLICY|RLS|auth\\.uid\\(\\)",
    include: "*.sql"
  });
  
  // Find validation patterns
  const validationPatterns = await Grep({
    pattern: "z\\.|zod|schema",
    include: "*.{ts,tsx}"
  });
  
  return { rlsPatterns, validationPatterns };
}
```

### 5. External Research & Best Practices

```typescript
// Mark research todo as in_progress
/invoke TodoWrite { 
  todos: [{ 
    id: `spec-${featureName}-research`,
    status: "in_progress"
  }] 
}

// Research best practices
const researchTasks = [
  researchImplementationApproaches(featureType),
  researchSecurityBestPractices(featureType),
  researchPerformanceConsiderations(featureType),
  researchCommonPitfalls(featureType)
];

const researchResults = await Promise.all(researchTasks);
```

#### Implementation Research:
```typescript
async function researchImplementationApproaches(featureType) {
  const research = await mcp__perplexity-ask__perplexity_ask({
    messages: [{
      role: "user",
      content: `What are the best practices for implementing ${featureType} features in Next.js applications with Supabase? Include:
      - Architecture patterns
      - Database design considerations  
      - Security best practices
      - Performance optimization
      - Common implementation challenges`
    }]
  });
  
  return research;
}
```

#### Security Research:
```typescript
async function researchSecurityBestPractices(featureType) {
  const securityResearch = await WebSearch({
    query: `${featureType} security best practices Next.js Supabase RLS`
  });
  
  return securityResearch;
}
```

### 6. Intelligent Suggestion Generation

```typescript
// Mark synthesis todo as in_progress  
/invoke TodoWrite { 
  todos: [{ 
    id: `spec-${featureName}-synthesis`,
    status: "in_progress"
  }] 
}

// Generate intelligent suggestions
const suggestions = generateIntelligentSuggestions({
  userInput,
  analysisResults,
  researchResults,
  featureType
});
```

#### Technical Architecture Suggestions:
```typescript
function generateArchitectureSuggestions(userInput, analysisResults) {
  const { similarComponents, existingPatterns } = analysisResults.patterns;
  
  return {
    applicationLayer: determineApplicationLayer(userInput.featureType),
    dataLayer: suggestDataLayer(userInput.userStories, analysisResults.schema),
    integrationPoints: suggestIntegrations(userInput.featureType, existingPatterns),
    recommendedPatterns: extractRecommendedPatterns(similarComponents)
  };
}
```

#### Data Model Suggestions:
```typescript
function generateDataModelSuggestions(userStories, existingSchema) {
  const entities = extractEntitiesFromUserStories(userStories);
  const relationships = determineRelationships(entities, existingSchema);
  
  return {
    suggestedTables: entities.map(entity => ({
      name: entity.name,
      columns: suggestColumns(entity),
      relationships: relationships[entity.name] || []
    })),
    rlsPolicies: generateRLSPolicies(entities),
    indexes: suggestIndexes(entities, relationships)
  };
}
```

#### Security Suggestions:
```typescript
function generateSecuritySuggestions(dataModel, existingRLS) {
  return {
    rlsPolicies: generateRLSPoliciesFromModel(dataModel, existingRLS),
    validationSchemas: generateZodSchemas(dataModel),
    authRequirements: determineAuthRequirements(dataModel),
    dataProfiling: suggestDataPrivacyMeasures(dataModel)
  };
}
```

#### Risk Assessment Generation:
```typescript
function generateRiskAssessment(featureType, complexity, dependencies) {
  const commonRisks = {
    technical: [
      { risk: "Performance degradation with large datasets", probability: "Medium", impact: "High" },
      { risk: "Integration complexity with existing systems", probability: "Low", impact: "Medium" }
    ],
    userExperience: [
      { risk: "User confusion with new interface", probability: "Medium", impact: "Medium" },
      { risk: "Mobile responsiveness issues", probability: "Low", impact: "Medium" }
    ],
    business: [
      { risk: "Feature creep during development", probability: "High", impact: "Medium" },
      { risk: "Timeline delays due to dependencies", probability: "Medium", impact: "High" }
    ]
  };
  
  return customizeRisksForFeature(commonRisks, featureType, complexity);
}
```

### 7. Interactive Refinement

```typescript
// Mark refinement todo as in_progress
/invoke TodoWrite { 
  todos: [{ 
    id: `spec-${featureName}-refinement`,
    status: "in_progress"
  }] 
}

// Present suggestions for user review
console.log("\n🤖 Based on my analysis, here are my suggestions:\n");
```

#### Architecture Review:
```typescript
console.log("📐 TECHNICAL ARCHITECTURE");
console.log("Suggested Application Layer:", suggestions.architecture.applicationLayer);
console.log("Suggested Data Layer:", suggestions.architecture.dataLayer);
console.log("Integration Points:", suggestions.architecture.integrationPoints);

const architectureApproved = askYesNo("Do these architecture suggestions look good?");
if (!architectureApproved) {
  suggestions.architecture = refineArchitecture(suggestions.architecture);
}
```

#### Data Model Review:
```typescript
console.log("\n🗄️ DATA MODEL SUGGESTIONS");
suggestions.dataModel.suggestedTables.forEach(table => {
  console.log(`Table: ${table.name}`);
  console.log(`Columns: ${table.columns.join(', ')}`);
  console.log(`Relationships: ${table.relationships.join(', ')}`);
});

const dataModelApproved = askYesNo("Does this data model look appropriate?");
if (!dataModelApproved) {
  suggestions.dataModel = refineDataModel(suggestions.dataModel);
}
```

#### Security Review:
```typescript
console.log("\n🔒 SECURITY SUGGESTIONS");
console.log("RLS Policies:", suggestions.security.rlsPolicies.length);
console.log("Validation Requirements:", suggestions.security.validationSchemas.length);

const securityApproved = askYesNo("Are the security suggestions appropriate?");
if (!securityApproved) {
  suggestions.security = refineSecuritySuggestions(suggestions.security);
}
```

### 8. Implementation Planning

```typescript
// Generate implementation phases
const implementationPlan = generateImplementationPlan(userStories, suggestions);

console.log("\n🚀 IMPLEMENTATION PLAN");
implementationPlan.phases.forEach((phase, index) => {
  console.log(`Phase ${index + 1}: ${phase.name}`);
  console.log(`Timeline: ${phase.timeline}`);
  console.log(`Deliverables: ${phase.deliverables.join(', ')}`);
});

const planApproved = askYesNo("Does this implementation plan look reasonable?");
if (!planApproved) {
  implementationPlan = refineImplementationPlan(implementationPlan);
}
```

### 9. Final Specification Generation

```typescript
// Mark generation todo as in_progress
/invoke TodoWrite { 
  todos: [{ 
    id: `spec-${featureName}-generation`,
    status: "in_progress"
  }] 
}

// Load template and populate with all gathered information
const template = await Read({
  file_path: ".claude/specs/features/template/feature-spec-template.md"
});

const populatedSpec = populateTemplate(template, {
  userInput,
  suggestions, 
  researchResults,
  implementationPlan
});
```

#### Template Population Functions:
```typescript
function populateTemplate(template, data) {
  let spec = template;
  
  // Document Metadata
  spec = spec.replace('[Feature Name]', data.userInput.featureName);
  spec = spec.replace('[1.0]', '1.0');
  spec = spec.replace('[Draft/Review/Approved/In Development/Complete]', 'Draft');
  spec = spec.replace('[Name(s)]', 'Claude Feature Spec Generator');
  spec = spec.replace('[YYYY-MM-DD]', new Date().toISOString().split('T')[0]);
  
  // Executive Summary
  spec = spec.replace('[Describe the user problem...]', data.userInput.problemStatement);
  spec = spec.replace('[High-level description...]', generateSolutionOverview(data));
  spec = spec.replace('[Expected business impact...]', data.userInput.businessValue);
  
  // User Experience
  spec = populateUserStories(spec, data.userInput.userStories);
  spec = populateUserJourney(spec, data.userInput.userStories);
  
  // Technical Specifications
  spec = populateTechnicalSpecs(spec, data.suggestions);
  spec = populateDataModel(spec, data.suggestions.dataModel);
  spec = populateSecuritySpecs(spec, data.suggestions.security);
  
  // Implementation Plan
  spec = populateImplementationPlan(spec, data.implementationPlan);
  
  // Risk Assessment
  spec = populateRiskAssessment(spec, data.suggestions.risks);
  
  return spec;
}
```

### 10. Validation & Quality Assurance

```typescript
// Validate completeness
const validation = validateSpecCompleteness(populatedSpec);
if (!validation.isComplete) {
  console.log("⚠️ Missing required sections:");
  validation.missingSections.forEach(section => {
    console.log(`- ${section}`);
  });
  
  const continueAnyway = askYesNo("Continue with incomplete spec?");
  if (!continueAnyway) {
    // Guide user through filling missing sections
    populatedSpec = fillMissingSections(populatedSpec, validation.missingSections);
  }
}
```

### 11. Final Save & Summary

```typescript
// Create the specs directory structure if it doesn't exist
await Bash({
  command: "mkdir -p .claude/specs/features/{draft,approved,archived}",
  description: "Create specs directory structure"
});

// Save the completed specification to draft folder
const specFilePath = `.claude/specs/features/draft/${featureName}.md`;
await Write({
  file_path: specFilePath,
  content: populatedSpec
});

// Mark all todos as completed
const completedTodos = specTodos.map(todo => ({
  ...todo,
  status: "completed"
}));

/invoke TodoWrite { todos: completedTodos }

// Provide completion summary
console.log(`\n✅ Feature Specification Complete!\n`);
console.log(`📁 Saved to: ${specFilePath}`);
console.log(`📊 Status: Draft (ready for review)`);
console.log(`🎯 Feature: ${featureName}`);
console.log(`📋 User Stories: ${userInput.userStories.length}`);
console.log(`🔧 Implementation Phases: ${implementationPlan.phases.length}`);
console.log(`⚡ Automation Used:`);
console.log(`   - Codebase pattern analysis`);
console.log(`   - External best practices research`); 
console.log(`   - Security requirement generation`);
console.log(`   - Risk assessment generation`);
console.log(`   - Implementation planning`);
console.log(`\n🚀 Next Steps:`);
console.log(`1. Review: Read the generated specification in draft/`);
console.log(`2. Refine: Make any needed adjustments`);
console.log(`3. Approve: Run /manage-specs approve ${featureName}`);
console.log(`4. Implement: Run /build-feature ${featureName}`);
console.log(`\n📖 Spec Management Commands:`);
console.log(`   /manage-specs status ${featureName}  # Check current status`);
console.log(`   /manage-specs list draft             # See all draft specs`);
```

## Advanced Features

### Template Variations
```typescript
// Different templates for different feature types
const templates = {
  'basic': 'Basic feature template with essential sections',
  'advanced': 'Comprehensive template with all sections',
  'ai': 'AI-specific template with model, costs, and safety considerations',
  'api': 'API-focused template with endpoints, schemas, and performance',
  'ui': 'UI-focused template with components, interactions, and responsive design'
};
```

### Non-Interactive Mode
```typescript
// For automated spec generation with minimal prompts
if (!interactive) {
  // Use sensible defaults and automated analysis only
  // Generate basic spec that can be refined later
  // Focus on technical analysis and pattern detection
}
```

### Resume Capability
```typescript
// Save progress and allow resumption
const progressFile = `.claude/specs/features/.progress-${featureName}.json`;
if (fileExists(progressFile)) {
  const resume = askYesNo("Found existing progress. Resume where you left off?");
  if (resume) {
    const progress = JSON.parse(await Read({ file_path: progressFile }));
    // Resume from saved state
  }
}
```

## Error Handling

### Automation Failures
```typescript
try {
  const codebaseAnalysis = await analyzeCodebasePatterns(featureType);
} catch (error) {
  console.log("⚠️ Codebase analysis failed, continuing with manual input");
  // Fallback to manual specification
}
```

### Incomplete User Input
```typescript
function validateUserInput(input) {
  const required = ['featureName', 'problemStatement', 'userStories'];
  const missing = required.filter(field => !input[field]);
  
  if (missing.length > 0) {
    console.log("Missing required information:");
    missing.forEach(field => console.log(`- ${field}`));
    return false;
  }
  
  return true;
}
```

### External Service Failures
```typescript
async function researchWithFallback(featureType) {
  try {
    return await mcp__perplexity-ask__perplexity_ask(/* ... */);
  } catch (error) {
    try {
      return await WebSearch(/* ... */);
    } catch (fallbackError) {
      console.log("External research unavailable, using built-in knowledge");
      return getBuiltInBestPractices(featureType);
    }
  }
}
```

## Integration Notes

### With Build-Feature Command
The generated specifications are designed to work seamlessly with the build-feature command:
- Consistent format and structure
- Complete technical specifications
- Implementation-ready user stories
- Security requirements clearly defined

### With Project Standards
All generated specifications follow SlideHeroes standards:
- Security-first approach with RLS policies
- TypeScript strict typing requirements
- Server Component preferences
- enhanceAction wrapper usage
- Zod validation patterns

### Quality Assurance
- Validates against template requirements
- Checks for SlideHeroes pattern compliance
- Ensures measurable success metrics
- Verifies security requirements are addressed
- Confirms implementation plan is actionable