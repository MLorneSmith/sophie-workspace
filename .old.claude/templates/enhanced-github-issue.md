# Enhanced GitHub Issue Template for CCPM

## Template Structure

### Feature Issue Template

```markdown
# {{ISSUE_TYPE}}: {{FEATURE_TITLE}}

## 📋 Executive Summary
{{EXECUTIVE_SUMMARY}}

## 🎯 Problem Statement
{{PROBLEM_STATEMENT}}

### Current State
{{CURRENT_STATE_DESCRIPTION}}

### Desired State
{{DESIRED_STATE_DESCRIPTION}}

### Business Value
{{BUSINESS_VALUE}}

## ✅ Acceptance Criteria
{{#each ACCEPTANCE_CRITERIA}}
- [ ] {{this}}
{{/each}}

## 🛠 Technical Approach

### Architecture Overview
{{ARCHITECTURE_OVERVIEW}}

### Implementation Strategy
{{IMPLEMENTATION_STRATEGY}}

### Key Components
{{#each KEY_COMPONENTS}}
- **{{name}}**: {{description}}
{{/each}}

## 📊 Task Breakdown

### Summary Metrics
- **Total Tasks**: {{TOTAL_TASKS}}
- **Parallel Streams**: {{PARALLEL_STREAMS}}
- **Estimated Duration**: {{ESTIMATED_DURATION}}
- **Complexity Score**: {{COMPLEXITY_SCORE}}/10

### Task Dependency Graph
```mermaid
{{TASK_DEPENDENCY_GRAPH}}
```

### Parallel Task Streams

{{#each PARALLEL_STREAMS}}

#### Stream {{@index}}: {{name}}

{{#each tasks}}

- [ ] **{{id}}**: {{name}} (~{{effort}})
{{/each}}
{{/each}}

### Sequential Dependencies

{{#each SEQUENTIAL_TASKS}}
{{@index}}. [ ] **{{id}}**: {{name}} (~{{effort}})

- Depends on: {{depends_on}}
- Blocks: {{blocks}}
{{/each}}

## 📦 Dependencies & Prerequisites

### Technical Dependencies

{{#each TECHNICAL_DEPENDENCIES}}

- **{{name}}** ({{version}}): {{purpose}}
{{/each}}

### Related Issues

- Depends on: {{DEPENDS_ON_ISSUES}}
- Blocks: {{BLOCKS_ISSUES}}
- Related to: {{RELATED_ISSUES}}

## 📁 Implementation Details

### Files to Modify

{{#each FILES_TO_MODIFY}}

- `{{path}}`: {{changes}}
{{/each}}

### New Files to Create

{{#each NEW_FILES}}

- `{{path}}`: {{purpose}}
{{/each}}

### Database Changes

{{#if DATABASE_CHANGES}}
{{DATABASE_CHANGES}}
{{else}}
No database changes required.
{{/if}}

## 🚀 Implementation Phases

{{#each IMPLEMENTATION_PHASES}}

### Phase {{number}}: {{name}}

**Duration**: {{duration}}
**Objective**: {{objective}}

Tasks:
{{#each tasks}}

- {{this}}
{{/each}}

**Deliverables**: {{deliverables}}
{{/each}}

## 📈 Success Metrics

### Performance Targets

{{#each PERFORMANCE_TARGETS}}

- {{metric}}: {{target}}
{{/each}}

### Quality Gates

{{#each QUALITY_GATES}}

- [ ] {{this}}
{{/each}}

## 👥 Team & Resources

### Recommended Assignees

- **Lead**: {{LEAD_ASSIGNEE}}
- **Reviewers**: {{REVIEWERS}}
- **Stakeholders**: {{STAKEHOLDERS}}

### Recommended Specialists

{{#each RECOMMENDED_SPECIALISTS}}

- **{{role}}**: {{reason}}
{{/each}}

## 🔗 Resources & Documentation

### Specifications

- [Feature Specification]({{SPEC_URL}})
- [Implementation Plan]({{PLAN_URL}})

### External Resources

{{#each EXTERNAL_RESOURCES}}

- [{{title}}]({{url}}): {{description}}
{{/each}}

### Related Documentation

{{#each RELATED_DOCS}}

- [{{title}}]({{url}})
{{/each}}

## 📝 Implementation Notes

{{IMPLEMENTATION_NOTES}}

## 🏷 Metadata

- **Feature ID**: `{{FEATURE_ID}}`
- **Created**: {{CREATED_DATE}}
- **Last Updated**: {{UPDATED_DATE}}
- **Status**: {{STATUS}}
- **Priority**: {{PRIORITY}}
- **Complexity**: {{COMPLEXITY}}
- **Estimated Effort**: {{TOTAL_EFFORT}}
- **Target Release**: {{TARGET_RELEASE}}

---
*This issue was generated from CCPM Implementation Plan using the enhanced tracking system.*
*Source: `.claude/tracking/implementations/{{FEATURE_ID}}/`*

```

### Task Issue Template
```markdown
# Task: {{TASK_TITLE}}

## 📋 Overview
{{TASK_OVERVIEW}}

## 🎯 Objectives
{{#each OBJECTIVES}}
- {{this}}
{{/each}}

## ✅ Definition of Done
{{#each DEFINITION_OF_DONE}}
- [ ] {{this}}
{{/each}}

## 🛠 Implementation Details

### Technical Approach
{{TECHNICAL_APPROACH}}

### Code Changes Required
{{#each CODE_CHANGES}}
- **{{file}}**: {{change}}
{{/each}}

### Testing Requirements
{{#each TESTING_REQUIREMENTS}}
- [ ] {{this}}
{{/each}}

## 📦 Dependencies

### Prerequisites
{{#each PREREQUISITES}}
- {{this}}
{{/each}}

### Blocks
{{#each BLOCKS}}
- #{{this}}
{{/each}}

## 📊 Effort & Complexity

- **Estimated Time**: {{ESTIMATED_TIME}}
- **Story Points**: {{STORY_POINTS}}
- **Complexity**: {{COMPLEXITY}}
- **Risk Level**: {{RISK_LEVEL}}

## 👤 Assignment

- **Recommended Specialist**: {{SPECIALIST_TYPE}}
- **Required Skills**: {{REQUIRED_SKILLS}}
- **Assignee**: {{ASSIGNEE}}

## 🔗 Context

- **Parent Feature**: #{{PARENT_FEATURE}}
- **Implementation Stream**: {{STREAM_NAME}}
- **Phase**: {{PHASE}}

## 📝 Implementation Notes

{{IMPLEMENTATION_NOTES}}

## 🏷 Labels

{{#each LABELS}}
- `{{this}}`
{{/each}}

---
*Part of Feature #{{PARENT_FEATURE}}*
*Task ID: `{{TASK_ID}}`*
```

## Variable Extraction Functions

```javascript
// Functions to extract content from implementation plans

function extractExecutiveSummary(content) {
  // Extract first paragraph or summary section
  const summaryMatch = content.match(/^#{1,2}\s+(?:Executive\s+)?Summary\s*\n([\s\S]*?)(?=\n#{1,2}\s+|\n---|\z)/im);
  if (summaryMatch) return summaryMatch[1].trim();

  // Fallback to first paragraph
  const firstPara = content.split('\n\n')[0];
  return firstPara || "Feature implementation as specified in the implementation plan.";
}

function extractProblemStatement(content) {
  const patterns = [
    /^#{1,3}\s+Problem\s+Statement\s*\n([\s\S]*?)(?=\n#{1,3}\s+|\n---|\z)/im,
    /^#{1,3}\s+Background\s*\n([\s\S]*?)(?=\n#{1,3}\s+|\n---|\z)/im,
    /^#{1,3}\s+Context\s*\n([\s\S]*?)(?=\n#{1,3}\s+|\n---|\z)/im
  ];

  for (const pattern of patterns) {
    const match = content.match(pattern);
    if (match) return match[1].trim();
  }

  return "Problem statement to be extracted from implementation context.";
}

function extractAcceptanceCriteria(content) {
  const patterns = [
    /^#{1,3}\s+Acceptance\s+Criteria\s*\n([\s\S]*?)(?=\n#{1,3}\s+|\n---|\z)/im,
    /^#{1,3}\s+Success\s+Criteria\s*\n([\s\S]*?)(?=\n#{1,3}\s+|\n---|\z)/im,
    /^#{1,3}\s+Requirements\s*\n([\s\S]*?)(?=\n#{1,3}\s+|\n---|\z)/im
  ];

  for (const pattern of patterns) {
    const match = content.match(pattern);
    if (match) {
      // Extract bullet points
      const criteria = match[1].match(/^\s*[-*]\s+(.+)$/gm) || [];
      return criteria.map(c => c.replace(/^\s*[-*]\s+/, '').trim());
    }
  }

  return [
    "Implementation complete according to specification",
    "All unit tests passing",
    "Integration tests passing",
    "Documentation updated",
    "Code review approved"
  ];
}

function generateTaskDependencyGraph(tasksDir) {
  const graph = ['graph TD'];
  const tasks = [];

  // Read all task files
  const taskFiles = fs.readdirSync(tasksDir)
    .filter(f => f.match(/^\d{3}\.md$/))
    .sort();

  for (const file of taskFiles) {
    const content = fs.readFileSync(path.join(tasksDir, file), 'utf-8');
    const taskId = file.replace('.md', '');
    const name = extractFrontmatterField(content, 'name') || `Task ${taskId}`;
    const dependsOn = extractFrontmatterArray(content, 'depends_on') || [];

    tasks.push({ id: taskId, name, dependsOn });
  }

  // Generate mermaid graph
  for (const task of tasks) {
    const label = `${task.id}["${task.name}"]`;
    graph.push(`  ${label}`);

    for (const dep of task.dependsOn) {
      graph.push(`  ${dep} --> ${task.id}`);
    }
  }

  return graph.join('\n');
}

function calculateComplexityScore(content, taskCount) {
  let score = 5; // Base score

  // Adjust based on task count
  if (taskCount > 15) score += 3;
  else if (taskCount > 10) score += 2;
  else if (taskCount > 5) score += 1;

  // Adjust based on keywords
  const complexityKeywords = {
    high: ['complex', 'difficult', 'challenging', 'intricate', 'advanced'],
    medium: ['moderate', 'standard', 'typical', 'normal'],
    low: ['simple', 'basic', 'straightforward', 'easy']
  };

  const lowerContent = content.toLowerCase();

  for (const word of complexityKeywords.high) {
    if (lowerContent.includes(word)) {
      score = Math.min(10, score + 1);
    }
  }

  for (const word of complexityKeywords.low) {
    if (lowerContent.includes(word)) {
      score = Math.max(1, score - 1);
    }
  }

  return score;
}

function generateLabels(content, taskCount, featureName) {
  const labels = ['feature', 'implementation', `feature:${featureName}`];

  // Add priority label
  if (content.match(/\b(critical|urgent|blocker|asap)\b/i)) {
    labels.push('priority:high');
  } else if (content.match(/\b(important|needed|required)\b/i)) {
    labels.push('priority:medium');
  } else {
    labels.push('priority:normal');
  }

  // Add complexity label
  const complexity = calculateComplexityScore(content, taskCount);
  if (complexity >= 8) labels.push('complexity:high');
  else if (complexity >= 5) labels.push('complexity:medium');
  else labels.push('complexity:low');

  // Add type label
  if (content.match(/\b(bug|fix|repair|patch)\b/i)) {
    labels.push('type:bugfix');
  } else if (content.match(/\b(enhance|improve|optimize)\b/i)) {
    labels.push('type:enhancement');
  } else if (content.match(/\b(refactor|restructure|reorganize)\b/i)) {
    labels.push('type:refactor');
  } else if (content.match(/\b(document|docs|documentation)\b/i)) {
    labels.push('type:documentation');
  } else {
    labels.push('type:feature');
  }

  // Add size label based on task count
  if (taskCount > 10) labels.push('size:xl');
  else if (taskCount > 7) labels.push('size:l');
  else if (taskCount > 4) labels.push('size:m');
  else if (taskCount > 1) labels.push('size:s');
  else labels.push('size:xs');

  return labels;
}
```

## Usage Example

```bash
# Generate enhanced GitHub issue
node .claude/scripts/github/enhance-github-issue.js \
  --feature="user-authentication" \
  --template="feature" \
  --output="/tmp/enhanced-issue.md"

# Create issue with enhanced content
gh issue create \
  --title "Feature: Enhanced User Authentication System" \
  --body-file "/tmp/enhanced-issue.md" \
  --label "$(generateLabels)" \
  --assignee "@me" \
  --milestone "v2.0"
```

## Benefits of Enhanced Template

1. **Comprehensive Context**: Provides complete feature context without referencing local files
2. **Actionable Content**: Clear objectives, acceptance criteria, and task breakdown
3. **Visual Clarity**: Mermaid graphs for task dependencies
4. **Rich Metadata**: Detailed labels, effort estimates, and assignments
5. **Traceability**: Links between features, tasks, and documentation
6. **Progress Tracking**: Built-in checkboxes and metrics
7. **Team Collaboration**: Clear ownership and review assignments
8. **Stakeholder Friendly**: Executive summary and business value sections

## Implementation Notes

- Use Handlebars.js or similar templating engine for variable substitution
- Extract content using robust regex patterns with fallbacks
- Generate visual elements (graphs, charts) dynamically
- Validate all URLs before including in issue
- Ensure markdown compatibility with GitHub's flavor
- Test with various implementation plan formats
