# PRIME Command Template

## Structure for Generated Commands

```markdown
---
description: [Clear, action-oriented description of what the command does]
allowed-tools: [Specific tools needed, avoid wildcards unless necessary]
argument-hint: [User-friendly hint for expected arguments]
---

# [Command Name]

[Brief description of the command's purpose and value proposition using PRIME framework]

## Key Features
- **[Feature Name]**: [Concise description mapping to PURPOSE]
- **[Feature Name]**: [What it does and expected outcomes]
[3-6 key features that highlight measurable capabilities]

## Essential Context
<!-- Always read for this command -->
- Read .claude/context/[domain]/[specific-file].md
[2-4 essential files that are ALWAYS needed]

## Prompt

<role>
You are [specific role/expertise], specializing in [key domains].
[1-2 sentences defining expertise level, decision authority, and approach]
</role>

<instructions>
# [Command Workflow Name] - PRIME Framework

**CORE REQUIREMENTS**:
- **Follow** PRIME framework: Purpose → Role → Inputs → Method → Expectations
- **Start** all instructions with action verbs
- **Include** decision trees for conditional logic
- [Other critical requirements]
[3-5 absolute requirements]

## PRIME Workflow

### Phase P - PURPOSE
<purpose>
**Define** clear outcomes and success criteria:

1. **Primary Objective**: [One clear sentence defining the goal]
2. **Success Criteria**: [Measurable criteria for success]
3. **Scope Boundaries**: [What's included and excluded]
4. **Key Features**: [Features mapped to measurable outcomes]

Example:
- Objective: Generate TypeScript interfaces from database schemas
- Success: All interfaces compile without errors
- Scope: Include user tables, exclude system tables
- Features: Type safety, auto-generation, validation
</purpose>

### Phase R - ROLE
<role_definition>
**Establish** AI expertise and authority:

1. **Expertise Domain**: [Technical expertise required]
2. **Experience Level**: [Senior/Expert/Specialist]
3. **Decision Authority**: [What AI can decide autonomously]
4. **Approach Style**: [How AI should interact]

Example:
- Expertise: Senior TypeScript developer with database design experience
- Authority: Choose optimal type mappings, suggest improvements
- Style: Pragmatic, focused on production readiness
</role_definition>

### Phase I - INPUTS
<inputs>
**Gather** all necessary materials before execution:

#### Essential Context (REQUIRED)
**Load** critical documentation:
- Read .claude/context/[domain]/[file].md
- Read .claude/context/[domain]/[file2].md
[List specific files that are always needed]

#### Dynamic Context Loading (OPTIONAL - for adaptive commands)
**Analyze** and **Load** context based on task specifics:

```bash
# When to use: Commands adapting to project structure, tech stack, or patterns
# Requires: .claude/scripts/command-analyzer.cjs and context-loader.cjs

# Step 1: Analyze target to extract metadata
COMMAND_METADATA=$(node .claude/scripts/command-analyzer.cjs "$TARGET_FILE" --json)

# Step 2: Extract patterns from metadata
TOOL_PATTERNS=$(echo "$COMMAND_METADATA" | jq -r '.tools.task | join(" ")')
AGENT_SPECIALISTS=$(echo "$COMMAND_METADATA" | jq -r '.agents.specialists | join(" ")')
TECHNOLOGIES=$(echo "$COMMAND_METADATA" | jq -r '.codePatterns.technologies | join(" ")')
WORKFLOW_PHASES=$(echo "$COMMAND_METADATA" | jq -r '[.phases | to_entries[] | select(.value == true) | .key] | join(" ")')

# Step 3: Build enriched query
ENRICHED_QUERY="$TOOL_PATTERNS $AGENT_SPECIALISTS $TECHNOLOGIES $WORKFLOW_PHASES [command-specific-keywords]"

# Step 4: Load relevant context using context-inventory.json
CONTEXT_FILES=$(node .claude/scripts/context-loader.cjs \
  --query="$ENRICHED_QUERY" \
  --command="[command-name]" \
  --max-results=3 \
  --token-budget=4000 \
  --format=paths \
  --metadata="$COMMAND_METADATA")

# Step 5: Process and read returned files
while IFS= read -r line; do
  if [[ $line =~ ^Read ]]; then
    FILE_PATH=$(echo "$line" | sed 's/Read //')
    echo "Loading context: $FILE_PATH"
    # Use Read tool for $FILE_PATH
  fi
done <<< "$CONTEXT_FILES"
```

#### User Clarification Loop (OPTIONAL - for unclear requirements)
**Conduct** interactive clarification when needed:

```
When to use: Multiple valid approaches, user preferences matter
Implementation: Max 2-3 rounds, 3-5 questions per round

Round 1: Core requirements (HIGH priority)
Round 2: Technical details (MEDIUM priority)
Round 3: Edge cases (LOW priority)

Format questions with clear priority indicators
```

#### Materials & Constraints
**Collect** additional inputs:
- **Parameters**: [Parse from arguments]
- **Constraints**: [Limitations to respect]
- **Examples**: [If provided by user]
- **Patterns**: [Relevant command patterns]
</inputs>

### Phase M - METHOD
<method>
**Execute** the main workflow with action verbs:

#### Core Workflow Steps
1. **[Action Verb]** [First major step]
   - **Parse** input parameters
   - **Validate** requirements
   - **Initialize** resources

2. **[Action Verb]** [Second major step]
   - **Process** main logic
   - **Transform** data
   - **Generate** output

3. **[Action Verb]** [Third major step]
   - **Validate** results
   - **Optimize** performance
   - **Finalize** output

#### Decision Trees (OPTIONAL - for conditional logic)
**Branch** based on conditions:

```
IF [condition]:
  → **Execute** [action verb] [specific task]
  → THEN **Proceed** to [next step]
ELSE IF [alternative condition]:
  → **Execute** [alternative action]
  → THEN **Branch** to [alternative path]
ELSE:
  → **Fallback** to [default action]
  → THEN **Continue** with [default path]
```

#### Parallel Task Execution (OPTIONAL - for independent tasks)
**Launch** parallel operations when beneficial:

```bash
# When to use: Independent tasks that can run simultaneously
# Implementation: Prepare shared context once

SHARED_CONTEXT="
- Original data: [data]
- Requirements: [requirements]
- Constraints: [constraints]
"

# Execute tasks (optimize for minimal switching overhead)
Stream 1: **Analyze** [aspect 1]
Stream 2: **Process** [aspect 2]
Stream 3: **Validate** [aspect 3]

# Wait and combine results
```

#### Agent Delegation (OPTIONAL - for specialized expertise)
**Delegate** to specialized agents when needed:

```
When to use: Task requires specific expertise
Available agents: See .claude/agents/ directory

Use Task tool with:
- subagent_type: "[exact-agent-name]"
- description: "[clear task description]"
- prompt: "[structured requirements with context]"

Example agents:
- typescript-expert: For TypeScript-specific tasks
- refactoring-expert: For code optimization
- testing-expert: For test generation
```

#### Progress Tracking (OPTIONAL - for long operations)
**Track** progress with TodoWrite tool:

```javascript
// When to use: Multi-step workflows, long operations
todos = [
  {content: "Initialize system", status: "in_progress", activeForm: "Initializing"},
  {content: "Process data", status: "pending", activeForm: "Processing data"},
  {content: "Generate output", status: "pending", activeForm: "Generating output"}
]
// Update status as each step completes
```
</method>

### Phase E - EXPECTATIONS
<expectations>
**Validate** and **Deliver** results:

#### Output Specification
**Define** exact output format:
- **Format**: [files/console/reports/code]
- **Structure**: [JSON/markdown/plain text]
- **Location**: [Where output is saved/displayed]
- **Quality Standards**: [What distinguishes good from great]

#### Validation Checks (OPTIONAL - for quality assurance)
**Verify** output quality:

```bash
# When to use: Critical operations, generated code
# Implementation: Use command-analyzer.cjs for validation

VALIDATION_OUTPUT=$(node .claude/scripts/command-analyzer.cjs "$OUTPUT_FILE" --json)

# Check required elements
HAS_REQUIRED=$(echo "$VALIDATION_OUTPUT" | jq -r '.required != null')
IS_VALID=$(echo "$VALIDATION_OUTPUT" | jq -r '.valid == true')

if [[ "$IS_VALID" == "true" ]]; then
  echo "✅ Validation passed"
else
  echo "⚠️ Validation issues found"
  # Handle validation failure
fi
```

#### Error Handling
**Handle** failures gracefully:
- **Input Errors**: Prompt for clarification
- **Processing Errors**: Fallback strategies
- **Output Errors**: Recovery mechanisms
- **Validation Failures**: User override options

#### Success Reporting
**Report** completion with metrics:

```
✅ **Command Completed Successfully!**

**PRIME Framework Results:**
✅ Purpose: [objective] achieved
✅ Role: [expertise] applied
✅ Inputs: [N] files processed
✅ Method: [M] steps executed
✅ Expectations: All criteria met

**Metrics:**
- Duration: [time]
- Resources: [usage]
- Quality: [score]

[Next steps or recommendations]
```

#### Example Output
```
[Show actual example of expected output]
[Include realistic data and formatting]
```
</expectations>

## Error Handling
<error_handling>
**Handle** errors at each PRIME phase:

### Purpose Phase Errors
- Missing objective: **Request** clarification
- Unclear criteria: **Define** defaults

### Role Phase Errors
- Undefined expertise: **Use** generalist approach
- No authority: **Default** to advisory mode

### Inputs Phase Errors
- Context loading fails: **Continue** with essentials
- Missing files: **Prompt** for locations

### Method Phase Errors
- Agent unavailable: **Fallback** to direct implementation
- Parallel fails: **Execute** sequentially

### Expectations Phase Errors
- Validation fails: **Warn** and allow override
- Output errors: **Retry** with backoff
</error_handling>

</instructions>

<patterns>
<!-- Command-specific patterns and techniques -->
### Implemented Patterns
- **Dynamic Context Loading**: Using context-loader.cjs
- **User Clarification**: Interactive requirement gathering
- **Parallel Execution**: Optimized task processing
- **Agent Delegation**: Specialized expertise
- **Progress Tracking**: Multi-step visibility
- **Validation Checks**: Quality assurance
</patterns>

<help>
[Emoji] **[Command Title]**

[One-line description of what the command does]

**Usage:**
- \`/command:name <required>\` - [What this does]
- \`/command:name [optional]\` - [What this variation does]

**PRIME Process:**
1. **Purpose**: [What it achieves]
2. **Role**: [Expertise applied]
3. **Inputs**: [What it needs]
4. **Method**: [How it works]
5. **Expectations**: [What it delivers]

**Requirements:**
- [Any prerequisites]
- [Required files or tools]

[Encouraging closing line]
</help>
\`\`\`

## Template Guidelines

### 1. Frontmatter
Only include what's necessary:
- `description`: Always required - clear action-oriented description
- `allowed-tools`: Be specific, avoid wildcards
- `argument-hint`: Only if accepts arguments

### 2. PRIME Structure
**MANDATORY**: Follow PRIME sequence strictly:
- **P**urpose: Define clear outcomes and success criteria
- **R**ole: Establish expertise and decision authority
- **I**nputs: Gather ALL materials before Method
- **M**ethod: Execute with action verbs and decision logic
- **E**xpectations: Validate and deliver quality output

### 3. Action Verb Requirements
**ALL instructions MUST start with action verbs:**
- **Purpose Verbs**: Define, Establish, Determine, Specify
- **Role Verbs**: Assume, Configure, Adopt, Embody
- **Input Verbs**: Gather, Load, Collect, Extract
- **Method Verbs**: Execute, Process, Generate, Transform
- **Expectation Verbs**: Validate, Deliver, Report, Present

### 4. Context Loading
Be explicit about implementation:
- **Essential Context**: Always list specific required files
- **Dynamic Context**: Use command-analyzer.cjs + context-loader.cjs pattern
- Show actual bash/code implementations, not pseudocode
- Reference `.claude/data/context-inventory.json` registry

### 5. Pattern Implementation
Include working implementations for optional patterns:
- **User Clarification**: Max 2-3 rounds with priorities
- **Parallel Execution**: Shared context preparation
- **Agent Delegation**: Exact agent names from .claude/agents/
- **Progress Tracking**: TodoWrite tool usage
- **Validation**: command-analyzer.cjs checks

### 6. Decision Trees
Format conditional logic clearly:
```
IF [condition]:
  → Action verb + task
  → THEN next step
ELSE:
  → Alternative action
  → THEN alternative path
```

### 7. Documentation
Make it scannable and actionable:
- Use consistent header hierarchy
- Provide working code examples
- Include realistic sample output
- Reference actual tool names and paths

## PRIME Compliance Checklist

Before finalizing any command, verify:

- [ ] **Purpose**: Clear objective with measurable success criteria?
- [ ] **Purpose**: Scope boundaries explicitly defined?
- [ ] **Role**: Expertise level and decision authority specified?
- [ ] **Role**: Approach style matches command purpose?
- [ ] **Inputs**: Essential context files listed?
- [ ] **Inputs**: Dynamic loading pattern implemented correctly?
- [ ] **Inputs**: Materials gathered BEFORE Method phase?
- [ ] **Method**: ALL instructions start with action verbs?
- [ ] **Method**: Decision trees for conditional logic included?
- [ ] **Method**: Optional patterns have working implementations?
- [ ] **Expectations**: Output format precisely specified?
- [ ] **Expectations**: Validation checks implemented?
- [ ] **Expectations**: Error handling covers all phases?
- [ ] **Flow**: Strict P→R→I→M→E sequence maintained?

## Common Command Patterns Reference

### Pattern Selection Guide

Ask these questions to determine which patterns to include:

1. **Dynamic Context Loading** (Phase I)
   - Does command need to adapt to project structure?
   - Will it analyze different file types or technologies?
   - Does context vary based on user's codebase?
   → Include context-loader.cjs pattern

2. **User Clarification** (Phase I)
   - Are there multiple valid approaches?
   - Do user preferences significantly affect outcome?
   - Is initial requirement potentially ambiguous?
   → Include 2-3 round clarification pattern

3. **Parallel Execution** (Phase M)
   - Are there independent tasks that could run simultaneously?
   - Is performance critical for user experience?
   - Can work be split into non-dependent streams?
   → Include parallel task pattern

4. **Agent Delegation** (Phase M)
   - Does task require specialized expertise?
   - Is there an existing agent for this domain?
   - Would delegation improve quality/speed?
   → Include Task tool delegation pattern

5. **Progress Tracking** (Phase M)
   - Is operation long-running (>30 seconds)?
   - Are there multiple distinct steps?
   - Would user benefit from progress visibility?
   → Include TodoWrite pattern

6. **Validation Checks** (Phase E)
   - Is output quality critical?
   - Does command generate code or configs?
   - Could output have syntax/logic errors?
   → Include validation pattern

### Implementation Priority

| Pattern | Usage Frequency | Implementation Complexity | Value |
|---------|----------------|---------------------------|-------|
| Essential Context | Always | Low | Critical |
| Action Verbs | Always | Low | High |
| Dynamic Context | Often | Medium | High |
| User Clarification | Sometimes | Low | Medium |
| Agent Delegation | Sometimes | Medium | High |
| Validation Checks | Often | Low | High |
| Parallel Execution | Rarely | High | Medium |
| Progress Tracking | Sometimes | Low | Medium |

## Action Verb Reference Bank

### Purpose Phase Verbs
**Define**, **Establish**, **Determine**, **Specify**, **Articulate**, **Formulate**, **Outline**, **Clarify**

### Role Phase Verbs
**Assume**, **Embody**, **Configure**, **Adopt**, **Represent**, **Initialize**, **Establish**, **Position**

### Input Phase Verbs
**Gather**, **Load**, **Collect**, **Extract**, **Retrieve**, **Fetch**, **Read**, **Parse**, **Acquire**

### Method Phase Verbs
**Execute**, **Process**, **Generate**, **Transform**, **Analyze**, **Compute**, **Build**, **Construct**, **Implement**, **Apply**, **Integrate**, **Optimize**

### Expectation Phase Verbs
**Validate**, **Verify**, **Deliver**, **Present**, **Report**, **Format**, **Structure**, **Package**, **Confirm**, **Assert**

### Decision Verbs
**Evaluate**, **Choose**, **Select**, **Branch**, **Decide**, **Determine**, **Route**, **Direct**

### Error Handling Verbs
**Handle**, **Catch**, **Recover**, **Retry**, **Fallback**, **Mitigate**, **Resolve**, **Restore**