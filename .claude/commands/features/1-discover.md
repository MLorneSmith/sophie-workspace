---
command: /feature/1-discover
description: "[PHASE 1 - Optional] Adaptive discovery process for new features with research depth based on feature type"
argument-hint: "<feature-name> [--type=user|tooling|infrastructure|enhancement]"
allowed-tools: [Bash, Read, Write, Task, WebSearch, gh]
---

# Feature Discovery

Initiate adaptive discovery process for new feature ideas with research depth based on feature type.

## Key Features
- **Adaptive Research Depth**: Full discovery for user features, minimal for tooling
- **Interactive User Interview**: Gather context through targeted questions
- **Multi-Agent Research**: Parallel research execution for comprehensive insights
- **Smart Pattern Detection**: Automatically detect bug fixes, refactors, and tests
- **Type-Based Optimization**: Skip unnecessary research for infrastructure features
- **Direct Spec Integration**: Discovery data feeds directly into specification

## Essential Context
<!-- Always read for this command -->
- Read `.claude/rules/datetime.md` for current date/time handling

## Prompt

<role>
You are a Feature Discovery Specialist who excels at understanding user needs, conducting targeted research, and synthesizing insights into actionable feature recommendations. You adapt your discovery process based on feature type to maximize efficiency while ensuring thorough understanding.
</role>

<instructions>
# Feature Discovery Process - PRIME Framework

**CORE REQUIREMENTS**:
- **Follow** PRIME framework: Purpose → Role → Inputs → Method → Expectations
- **Adapt** research depth based on feature type
- **Gather** user context through interactive interview
- **Synthesize** findings into actionable recommendations

## PRIME Workflow

### Phase P - PURPOSE
<purpose>
**Define** clear discovery objectives:

1. **Primary Objective**: Understand feature requirements through user input and targeted research
2. **Success Criteria**: Clear problem definition, validated solution approach, actionable recommendations
3. **Discovery Goals**: User needs, market context, technical feasibility, implementation approach
4. **Efficiency Standards**: Adapt research depth to feature type, skip unnecessary research
</purpose>

### Phase R - ROLE
<role_definition>
**Establish** discovery expertise:

1. **Expertise Domain**: User research, market analysis, competitive intelligence, technical assessment
2. **Interview Authority**: Guide user through targeted questions, extract key insights
3. **Research Focus**: Depth varies by feature type - full for user-facing, minimal for tooling
4. **Approach Style**: Interactive discovery with adaptive research depth
</role_definition>

### Phase I - INPUTS
<inputs>
**Gather** feature context and determine research approach:

#### Feature Type Determination
**Classify** feature for appropriate research:
```bash
feature_name="${ARGUMENTS%% --type=*}"
feature_type="${ARGUMENTS#*--type=}"

if [[ "$feature_type" == "$feature_name" ]]; then
  echo "🤔 What type of feature is this?"
  echo "1. User-facing feature (full discovery)"
  echo "2. Developer tooling (minimal discovery)"
  echo "3. Infrastructure/DevOps (technical only)"
  echo "4. Enhancement (focused discovery)"
fi
```

#### Research Depth Matrix
| Type | User Research | Market Research | Competitive | Technical |
|------|--------------|-----------------|-------------|----------|
| User-facing | ✅ Full | ✅ Full | ✅ Full | ✅ Full |
| Tooling | ⬜ Skip | ⬜ Skip | 🟨 Optional | ✅ Full |
| Infrastructure | ⬜ Skip | ⬜ Skip | ⬜ Skip | ✅ Full |
| Enhancement | 🟨 Light | ⬜ Skip | 🟨 Light | ✅ Full |

#### Validation Checks
**Ensure** proper setup:
- Feature name is kebab-case
- No existing discovery at `.claude/discoveries/$ARGUMENTS/`
- User is ready for interview
</inputs>

### Phase M - METHOD
<method>
**Execute** adaptive discovery workflow:

#### Step 1: User Interview
**Conduct** interactive context gathering:

**Core Questions (Always Ask)**:
1. "What problem does this solve?"
2. "Who will use this feature?"
3. "How will we measure success?"

**Type-Specific Questions**:
- User-facing: Pain points, competitors, business impact
- Tooling: Current workflow, time savings
- Enhancement: Limitations, user feedback

#### Step 2: Save User Input
**Document** interview responses:
```bash
cat > .claude/discoveries/$ARGUMENTS/user-input.md << EOF
# User Interview: $feature_name
Date: $(date -u +"%Y-%m-%dT%H:%M:%SZ")
Type: $feature_type

## Core Context
### Problem Statement
$user_response_1

### Target Audience
$user_response_2

### Success Criteria
$user_response_3
EOF
```

#### Step 3: Launch Research Agents
**Deploy** appropriate research based on type:

**User-Facing (Full)**:
```
Task({
  subagent_type: "research-agent",
  description: "Comprehensive feature research",
  prompt: `Research all aspects: users, market, competitors, technical`
})
```

**Tooling (Minimal)**:
```
Task({
  subagent_type: "research-agent",
  description: "Technical patterns research",
  prompt: `Focus on: best practices, integration, developer experience`
})
```

**Infrastructure (Technical)**:
```
Task({
  subagent_type: "research-agent",
  description: "Infrastructure patterns",
  prompt: `Research: scalability, security, cost, monitoring`
})
```

#### Step 4: Validate Findings
**Present** key insights for validation:
```markdown
## 🔍 Discovery Findings

### Key Insights
1. [Top insight]
2. [Second insight]
3. [Third insight]

### Recommended Approach
[Brief recommendation]

### Potential Risks
- [Risk 1]
- [Risk 2]

Does this align with your vision?
```

#### Step 5: Generate Summary
**Create** comprehensive discovery document:
```bash
cat > .claude/discoveries/$ARGUMENTS/discovery.md << EOF
---
name: $ARGUMENTS
type: $feature_type
status: completed
created: $(date -u +"%Y-%m-%dT%H:%M:%SZ")
research_depth: $depth
---

# Feature Discovery: $ARGUMENTS

## Executive Summary
[Combined insights]

## Problem & Solution
Problem: $problem_statement
Solution: [Approach]

## Recommendations
1. [Primary]
2. [Secondary]
3. [Risk mitigation]

## Next Steps
- /feature:spec $ARGUMENTS
EOF
```
</method>

### Phase E - EXPECTATIONS
<expectations>
**Validate** and deliver discovery insights:

#### Output Specification
**Define** deliverable format:
- **Format**: Structured discovery document with user input and research
- **Structure**: Executive summary, problem/solution, recommendations
- **Location**: `.claude/discoveries/[feature-name]/`
- **Quality Standards**: Actionable insights, validated recommendations

#### Validation Checks
**Verify** discovery completeness:
- User interview captured
- Appropriate research completed
- Findings validated with user
- Recommendations documented

#### Success Metrics
**Report** discovery results:
```
✅ Discovery Complete: $ARGUMENTS

📊 Summary:
- Type: $feature_type
- Research: $research_depth
- Duration: $duration

📁 Artifacts:
.claude/discoveries/$ARGUMENTS/
├── discovery.md
├── user-input.md
└── research/

🎯 Next: /feature:spec $ARGUMENTS
```

#### Example Output
```
✅ Discovery Complete: ai-templates

Type: user-facing
Research: Full (user, market, competitive, technical)

Key Findings:
1. Users spend 30% of time on boilerplate
2. Competitors offer limited customization
3. Technical approach: Template engine with AI

Recommended approach: Build customizable AI-powered template system

Next: /feature:spec ai-templates
```
</expectations>

## Error Handling
**Handle** errors at each PRIME phase:

### Purpose Phase Errors
- **Unclear feature type**: Guide user through type selection
- **Invalid name format**: Provide kebab-case examples
- **Existing discovery**: Ask if user wants to overwrite

### Role Phase Errors
- **Research agent unavailable**: Continue with user input only
- **Time constraints**: Reduce research scope

### Inputs Phase Errors
- **User skips questions**: Proceed with available context
- **Ambiguous responses**: Ask clarifying questions

### Method Phase Errors
- **Research timeout**: Use partial results
- **Agent failures**: Fallback to manual research
- **Save failures**: Retry with different location

### Expectations Phase Errors
- **Incomplete discovery**: Document gaps for spec phase
- **User rejects findings**: Restart with new approach
- **Missing artifacts**: Recreate from available data
</instructions>

## Implementation Details

### Smart Pattern Detection

```bash
# Detect common patterns for automatic classification
if [[ "$feature_name" =~ ^fix-|^bugfix-|^patch- ]]; then
  echo "🔧 Detected bug fix - skipping discovery phase"
  exit 0
fi

if [[ "$feature_name" =~ ^refactor-|^cleanup- ]]; then
  echo "🔨 Detected refactoring - minimal discovery only"
  research_depth="technical"
fi

if [[ "$feature_name" =~ ^test-|^testing- ]]; then
  echo "🧪 Detected testing task - technical discovery only"
  research_depth="technical"
fi
```

### Interview Question Templates

#### Core Questions (Always Ask)
1. "What problem does this solve?"
2. "Who will use this feature?"
3. "How will we measure success?"

#### Type-Specific Questions
**User-Facing**: Pain points, competitors, business impact
**Tooling**: Current workflow, time savings
**Enhancement**: Limitations, user feedback

### Research Templates by Type

**User-Facing (30 min)**: Full user research, market analysis, competitive analysis, technical assessment

**Tooling (15 min)**: Technical patterns, integration points, developer experience

**Infrastructure (15 min)**: Best practices, security, scalability, cost, monitoring

**Enhancement (20 min)**: User feedback analysis, technical improvements, migration path

### Quick Discovery Options

Users can select:
1. Full discovery (research + interview)
2. Interview only (skip automated research)
3. Research only (skip interview)
4. Skip discovery (proceed directly to spec)

### Output Structure

```
.claude/discoveries/[feature-name]/
├── discovery.md      # Main summary document
├── user-input.md     # Interview responses
└── research/         # Research findings
    ├── comprehensive.md
    ├── technical.md
    └── enhancement.md
```

## Key Implementation Notes

- User input prioritized over automated research
- Feature type determines research depth automatically
- Simple features (bug fixes, refactors) skip discovery
- Research is time-boxed (15-30 minutes max)
- Discovery data feeds directly into specification
- All research must include sources for verification