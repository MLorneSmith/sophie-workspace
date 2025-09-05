---
allowed-tools: Bash, Read, Write, Task, WebSearch, gh
---

# Feature Discovery

Initiate adaptive discovery process for a new feature idea, with research depth based on feature type.

## Usage
```
/feature:discover <feature_name> [--type=user|tooling|infrastructure|enhancement]
```

## Required Rules

**IMPORTANT:** Before executing this command, read and follow:
- `.claude/rules/datetime.md` - For getting real current date/time

## Preflight Checklist

Before proceeding, complete these validation steps:

1. **Validate feature name format:**
   - Must be kebab-case (lowercase, hyphens only)
   - No spaces or special characters
   - If invalid: "❌ Feature name must be kebab-case. Example: ai-templates"

2. **Check for existing discovery:**
   - Check if `.claude/discoveries/$ARGUMENTS/` exists
   - If exists: "⚠️ Discovery for '$ARGUMENTS' already exists. Continue? (yes/no)"

## Instructions

### 1. Determine Feature Type and Research Depth

First, analyze the feature to determine appropriate research level:

```bash
# Parse feature name and any --type flag
feature_name="${ARGUMENTS%% --type=*}"
feature_type="${ARGUMENTS#*--type=}"

# If no explicit type, ask user or infer from name
if [[ "$feature_type" == "$feature_name" ]]; then
  echo "🤔 What type of feature is this?"
  echo ""
  echo "1. User-facing feature (requires full discovery)"
  echo "2. Developer tooling (minimal discovery)"
  echo "3. Infrastructure/DevOps (technical discovery only)"
  echo "4. Enhancement to existing feature (focused discovery)"
  echo ""
  echo "Please specify the feature type to determine research depth."
  # Wait for user input
fi
```

#### Research Depth by Type

| Feature Type | User Research | Market Research | Competitive Analysis | Technical Assessment | User Input |
|-------------|--------------|-----------------|---------------------|---------------------|------------|
| **User-facing** | ✅ Full | ✅ Full | ✅ Full | ✅ Full | ✅ Required |
| **Tooling** | ⬜ Skip | ⬜ Skip | 🟨 Optional | ✅ Full | 🟨 Optional |
| **Infrastructure** | ⬜ Skip | ⬜ Skip | ⬜ Skip | ✅ Full | 🟨 Optional |
| **Enhancement** | 🟨 Light | ⬜ Skip | 🟨 Light | ✅ Full | ✅ Required |

### 2. Interactive User Interview

Before launching research agents, gather context from the user:

```markdown
## 💭 Quick Discovery Interview

I'll ask you a few questions to understand this feature better. Your answers will guide the research process.

### Core Questions (Always Ask)

**1. Problem Statement**
"In 1-2 sentences, what problem does $feature_name solve?"
[Wait for user response]

**2. Target Audience**  
"Who will primarily use this feature? (e.g., end users, developers, admins)"
[Wait for user response]

**3. Success Criteria**
"How will we know if this feature is successful?"
[Wait for user response]

### Conditional Questions (Based on Feature Type)

#### For User-Facing Features:
**4. User Pain Points**
"What specific user complaints or requests led to this feature idea?"
[Wait for user response]

**5. Competitive Context**
"Are you aware of competitors who have similar features? If so, who?"
[Wait for user response]

**6. Business Impact**
"What business metrics do you expect this to impact? (revenue, retention, engagement, etc.)"
[Wait for user response]

#### For Tooling/Infrastructure:
**4. Current Workflow**
"What's the current process this will improve? What are its pain points?"
[Wait for user response]

**5. Time/Cost Savings**
"How much time/effort will this save? (hours per week, deploys per month, etc.)"
[Wait for user response]

#### For Enhancements:
**4. Current Limitations**
"What specific limitations of the current feature are we addressing?"
[Wait for user response]

**5. User Feedback**
"What feedback have we received about the current implementation?"
[Wait for user response]
```

### 3. Save User Input

Create initial discovery document with user responses:

```bash
# Save user interview responses
cat > .claude/discoveries/$ARGUMENTS/user-input.md << 'EOF'
# User Interview: $feature_name

**Date**: $(date -u +"%Y-%m-%dT%H:%M:%SZ")
**Feature Type**: $feature_type

## Core Context

### Problem Statement
$user_response_1

### Target Audience
$user_response_2

### Success Criteria
$user_response_3

## Additional Context
[Type-specific responses saved here]

---
*User input captured by Claude Discovery Assistant*
EOF
```

### 4. Adaptive Research Execution

Based on feature type, execute appropriate research:

#### For User-Facing Features (Full Discovery)

```yaml
Task:
  description: "Comprehensive feature discovery"
  subagent_type: "research-agent"
  prompt: |
    Conduct comprehensive research for user-facing feature: $ARGUMENTS
    
    User Context (from interview):
    [Include user-input.md content]
    
    Research Requirements:
    1. USER RESEARCH
       - Target personas based on: "$target_audience"
       - Pain points related to: "$problem_statement"
       - User journey mapping
       - Behavioral patterns
    
    2. MARKET RESEARCH
       - Market size and trends
       - Similar solutions in market
       - Pricing models
       - Adoption patterns
    
    3. COMPETITIVE ANALYSIS
       - Analyze competitors mentioned: "$competitors"
       - Feature comparison matrix
       - Strengths and weaknesses
       - Differentiation opportunities
    
    4. TECHNICAL ASSESSMENT
       - Implementation complexity
       - Architecture impact
       - Performance considerations
       - Security implications
    
    Save findings to:
    - .claude/discoveries/$ARGUMENTS/research/comprehensive.md
    
    Time limit: 30 minutes
    Include sources for all findings.
```

#### For Tooling Features (Minimal Discovery)

```yaml
Task:
  description: "Technical discovery for tooling"
  subagent_type: "research-agent"
  prompt: |
    Conduct focused technical research for tooling feature: $ARGUMENTS
    
    User Context:
    - Problem: "$problem_statement"
    - Current workflow: "$current_workflow"
    - Expected savings: "$time_savings"
    
    Research Requirements:
    1. TECHNICAL PATTERNS
       - Best practices for similar tools
       - Implementation patterns
       - Common pitfalls
    
    2. INTEGRATION POINTS
       - How this fits with existing tooling
       - Dependencies and conflicts
       - Migration considerations
    
    Skip user research and market analysis.
    Focus on developer experience and technical implementation.
    
    Save to: .claude/discoveries/$ARGUMENTS/research/technical.md
    
    Time limit: 15 minutes
```

#### For Infrastructure Features (Technical Only)

```yaml
Task:
  description: "Infrastructure research"
  subagent_type: "research-agent"  
  prompt: |
    Research infrastructure/DevOps patterns for: $ARGUMENTS
    
    Context:
    - Problem: "$problem_statement"
    - Current setup: "$current_workflow"
    
    Focus Areas:
    1. Industry best practices
    2. Security considerations
    3. Scalability patterns
    4. Cost optimization
    5. Monitoring and observability
    
    Skip all user/market research.
    
    Save to: .claude/discoveries/$ARGUMENTS/research/infrastructure.md
    
    Time limit: 15 minutes
```

#### For Enhancement Features (Focused Discovery)

```yaml
Task:
  description: "Enhancement research"
  subagent_type: "research-agent"
  prompt: |
    Research enhancement opportunities for: $ARGUMENTS
    
    Current Limitations: "$current_limitations"
    User Feedback: "$user_feedback"
    
    Focus on:
    1. User feedback analysis
    2. Quick competitive check
    3. Technical improvement options
    4. Migration path from current implementation
    
    Save to: .claude/discoveries/$ARGUMENTS/research/enhancement.md
    
    Time limit: 20 minutes
```

### 5. Quick Validation with User

After research completes, present key findings for validation:

```markdown
## 🔍 Discovery Findings

Based on my research and your input, here are the key findings:

### Key Insights
1. [Top insight from research]
2. [Second key insight]
3. [Third key insight]

### Recommended Approach
[Brief recommendation based on research]

### Potential Risks
- [Risk 1]
- [Risk 2]

**Does this align with your vision for the feature? Any corrections or additions?**
[Wait for user feedback]
```

### 6. Generate Discovery Summary

Create final discovery document combining research and user input:

```bash
# Merge user input and research findings
cat > .claude/discoveries/$ARGUMENTS/discovery.md << 'EOF'
---
name: $ARGUMENTS
type: $feature_type
status: completed
created: $(date -u +"%Y-%m-%dT%H:%M:%SZ")
research_depth: [full|minimal|technical|focused]
---

# Feature Discovery: $ARGUMENTS

## Executive Summary
[Combined insights from user input and research]

## Problem & Solution
**Problem**: $problem_statement
**Solution Approach**: [From research and user input]

## Target Users
$target_audience
[Enhanced with research findings]

## Success Metrics
$success_criteria
[Enhanced with industry benchmarks]

## Research Findings
[Relevant findings based on feature type]

## Recommendations
1. [Primary recommendation]
2. [Secondary recommendation]
3. [Risk mitigation suggestion]

## Next Steps
- Proceed to specification: /feature:spec $ARGUMENTS
- Additional research needed: [Specify areas]
- Stakeholder review required: [List stakeholders]

---
*Discovery completed with research depth: $research_depth*
EOF
```

### 7. Skip Options

Allow users to skip discovery for simple features:

```bash
echo "💡 Quick Discovery Options:"
echo ""
echo "1. Full discovery (research + interview)"
echo "2. Interview only (skip automated research)"  
echo "3. Research only (skip interview)"
echo "4. Skip discovery (proceed directly to spec)"
echo ""
echo "Select option (1-4):"
```

### 8. Smart Defaults

For common patterns, provide smart defaults:

```bash
# Detect common patterns
if [[ "$feature_name" =~ ^fix-|^bugfix-|^patch- ]]; then
  echo "🔧 Detected bug fix - skipping discovery phase"
  echo "Proceeding directly to specification..."
  exit 0
fi

if [[ "$feature_name" =~ ^refactor-|^cleanup- ]]; then
  echo "🔨 Detected refactoring task - minimal discovery only"
  research_depth="technical"
fi

if [[ "$feature_name" =~ ^test-|^testing- ]]; then
  echo "🧪 Detected testing task - technical discovery only"
  research_depth="technical"
fi
```

## Output

```
✅ Discovery Complete for: $ARGUMENTS

📊 Discovery Summary:
  Type: $feature_type
  Research Depth: $research_depth
  User Input: Captured
  Research: $research_status
  Duration: $duration

📁 Artifacts:
  .claude/discoveries/$ARGUMENTS/
  ├── discovery.md (main summary)
  ├── user-input.md (interview responses)
  └── research/ (research findings)

📋 Key Findings:
  - [Finding 1]
  - [Finding 2]
  - [Finding 3]

🎯 Recommended Next Steps:
  1. Review discovery findings
  2. Proceed to specification: /feature:spec $ARGUMENTS
  3. The spec command will automatically use this discovery data

🔗 GitHub Issue: #$discovery_number (if created)
```

## Important Notes

- User input is prioritized over automated research
- Feature type determines research depth automatically
- Simple features can skip discovery entirely
- Research is time-boxed (15-30 minutes max)
- Discovery feeds directly into specification
- All research must include sources

## Error Handling

- If research agent fails, continue with user input only
- If user skips questions, proceed with available information
- Partial discovery is better than no discovery
- User can always add context during specification phase