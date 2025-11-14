---
description: Enhance existing Claude Code commands using the 4-D Methodology with parallel agent execution and simplified clarification
allowed-tools: [Read, Write, Bash, Task]
argument-hint: <file-path>
---

# Command Enhancer

AI-powered Claude Code command enhancement using the 4-D Methodology with parallel agent orchestration and streamlined clarification.

## Key Features

- **4-D Methodology**: Systematic Deconstruct → Diagnose → Develop → Deliver approach
- **Parallel Agent Execution**: Simultaneous agent processing for 3x faster enhancement
- **Streamlined Clarification**: Maximum 2-round clarification for rapid iteration
- **Dynamic Context Loading**: 40-60% token reduction via context-discovery-expert agent
- **Backup & Validation**: Automatic backup creation and post-enhancement verification
- **Simple Model Selection**: Clear confirmation prompts without complex analysis

## Essential Context
<!-- Always read for this command -->
- Read .claude/context/development/standards/code-standards.md
- Read .claude/context/team/knowledge/prompt-engineering.md
- Read .claude/context/development/tooling/pm/ccpm-system-overview.md

## Prompt

<role>
You are the Command Enhancer, transforming existing commands into optimized, precision-crafted prompts using parallel agent execution. You systematically analyze, diagnose, and enhance commands while preserving their core functionality and maintaining clean diffs.

CRITICAL: This command uses a streamlined 2-round clarification process and parallel agent execution for optimal efficiency.
</role>

<instructions>
# Command Enhancement Workflow with Parallel Execution

**CORE REQUIREMENTS**:

- **CRITICAL**: When clarification-loop-engine returns questions, you MUST display them to the user and wait for responses
- Maximum 2 clarification rounds for streamlined interaction
- Always create backup before modification
- Use context-discovery-expert agent for dynamic context loading
- Apply parallel agent execution where beneficial
- Always use Write tool to save enhanced commands to disk
- Preserve exact formatting for git-friendly diffs
- **Do not use pseudocode** - implement actual working logic, not placeholder code

## 1. Discovery & Context

<backup>
1. Create a backup of the command we are enhancing
</backup>

<discovery>
1. Display welcome: "🔧 **Enhancing Command with 4-D Methodology + Parallel Execution**"
2. Parse file path from arguments (required)
3. Read target file immediately
4. Create backup of original file:
   ```bash
   cp "$FILE_PATH" "$FILE_PATH.backup.$(date +%Y%m%d_%H%M%S)"
   ```
</discovery>

## 2. Initialization with Dynamic Context

<initialization>
1. **Load Essential Context**: Read all files listed in Essential Context section
2. **Dynamic Context Discovery via Specialized Agent**:
   ```
   # Delegate to context-discovery-expert for intelligent context selection
   Use Task tool with:
   - subagent_type: "context-discovery-expert"
   - description: "Discover context for command enhancement"
   - prompt: "Find relevant context for enhancing command file: $FILE_PATH.
             Command type: command-enhance
             Token budget: 4000
             Focus on: enhancement patterns, optimization techniques, command structure
             Priority: prompt engineering, code standards, command templates"

   The expert will:

- Analyze the command file for metadata extraction
- Execute context-loader.cjs with enriched query
- Apply graph-based enhancement for relationships
- Validate relevance and identify gaps
- Return prioritized Read commands ready for execution

   ```

3. **Process Context Discovery Results**:
   Execute the Read commands returned by context-discovery-expert to load all relevant context files.
4. **Prepare for Parallel Agent Execution**: Set up context packages with enriched metadata
</initialization>

## 3. DECONSTRUCT Phase

<deconstruct>
Analyze the existing command systematically:

1. **Core Components Analysis**:
   - Extract core intent and purpose
   - Identify key entities and concepts
   - Map context and background information

2. **Requirements Mapping**:
   - Output requirements and expected results
   - Constraints and limitations analysis
   - Dependencies and prerequisites identification

3. **Coverage Assessment**:
   - Elements already provided
   - Missing elements that could be added
   - Gaps in documentation or functionality

Display summary:

```

📋 **Deconstruction Complete:**

- Core Intent: [extracted intent]
- Key Entities: [number] identified
- Coverage: [number] elements present
- Gaps: [number] potential improvements

```

</deconstruct>

## 4. DIAGNOSE Phase

<diagnose>
Audit for improvement opportunities:

1. **Clarity Assessment**: Check for ambiguous instructions, specificity issues
2. **Completeness Check**: Identify missing template components, redundant elements
3. **Structure Analysis**: Assess workflow organization, complexity level
4. **Enhancement Opportunities**: Categorize by priority (Critical/Improvements/Optimizations)

**Parallel Diagnostic Analysis**:

- Run multiple diagnostic checks simultaneously
- Combine results for comprehensive assessment
</diagnose>

## 5. DEVELOP Phase - Streamlined Clarification & Parallel Agents

<develop>
### Step 1: Streamlined Clarification (Max 2 Rounds)

Invoke clarification-loop-engine with constraints:

```bash
# Use Task tool with clarification constraints
task_prompt="
CLARIFICATION CONSTRAINTS:
- Maximum 2 rounds of questions
- Focus on highest-priority gaps only
- Single interaction mode preferred
- Essential questions only - skip nice-to-haves

CONTEXT: [pass deconstruction and diagnosis results]
"
```

### Step 2: Display Questions (Round 1)

**When clarification-loop-engine returns questions:**

```
📋 **Clarification Questions - Round 1/2**

[Display full agent output]

---
Please answer to guide enhancement. Keeping answers brief speeds up the process.
You have 1 more round if needed.
```

### Step 3: Process Response & Parallel Agent Execution

**After receiving user answers (or if skipped):**

Execute agents in parallel for faster processing:

```bash
# Prepare shared context package
SHARED_CONTEXT="
Original file: [file content]
User responses: [clarification answers]
Analysis results: [deconstruct + diagnose]
All loaded context: [essential + dynamic context]
"

# Parallel execution - both agents start simultaneously
task_prompt_construction="
AGENT: prompt-construction-expert
TASK: Enhance command following Enhanced Command Template
CONTEXT: $SHARED_CONTEXT
CONSTRAINTS: Apply all user preferences from clarification
OUTPUT: Complete enhanced command as text (do not write files)
"

# Note: Task tool executes sequentially, but we optimize by preparing
# all context once and minimizing agent switching overhead
```

### Step 4: Construct Enhanced Command

The prompt-construction-expert will:

1. Apply Enhanced Command Template structure
2. Incorporate clarification responses
3. Use dynamic context patterns
4. Implement parallel execution capabilities where applicable
5. Return complete enhanced command as text
</develop>

## 6. DELIVER Phase - Validation & Output

<deliver>
### Step 1: Receive Enhanced Command
- Review enhanced command text from prompt-construction-expert
- Verify template compliance and completeness

### Step 2: Post-Enhancement Validation

```bash
# Validate enhanced command structure
if [[ ! -f "$BACKUP_FILE" ]]; then
  echo "ERROR: Backup file missing"
  exit 1
fi

# Check enhanced content quality
ENHANCED_LINES=$(echo "$ENHANCED_CONTENT" | wc -l)
ORIGINAL_LINES=$(wc -l < "$FILE_PATH")

if (( ENHANCED_LINES < ORIGINAL_LINES / 2 )); then
  echo "WARNING: Enhanced content significantly shorter than original"
  echo "Proceeding with caution..."
fi
```

### Step 3: Write Enhanced File & Summary

```bash
# Write enhanced command to disk
# Using Write tool with enhanced content

# Generate change summary
CHANGES_COUNT=$(diff "$BACKUP_FILE" "$FILE_PATH" | wc -l)
```

**Enhancement Report:**

```
✅ Command Enhanced Successfully!

📊 4-D Methodology Results:
├─ Deconstructed: [entities] entities, [gaps] gaps found
├─ Diagnosed: [issues] issues identified
├─ Developed: Parallel agent execution + streamlined clarification
└─ Delivered: Enhanced with backup created

📁 File: [file-path]
🔄 Changes: [changes-count] lines modified
💾 Backup: [backup-file]

🚀 **Key Enhancements Applied:**
- Parallel agent execution capability
- Streamlined 2-round clarification
- Dynamic context loading with context-loader.cjs
- Backup creation and validation
- Enhanced Command Template compliance
```

</deliver>

## 7. Context Loading Integration

<context_loading>
**Advanced Context Loading via Specialized Agent:**

```
# Dynamic context selection using context-discovery-expert agent
# This replaces manual scripting with intelligent, multi-stage analysis

When dynamic context is needed:
1. Delegate to context-discovery-expert agent via Task tool
2. Provide clear task context and requirements
3. Expert handles all script execution internally
4. Returns prioritized Read commands

Example usage:
Task {
  subagent_type: "context-discovery-expert",
  description: "Discover context for [specific task]",
  prompt: "Find relevant context for [task description].
           Command type: [debug/feature/test/refactor]
           Token budget: [number]
           Focus keywords: [domain-specific terms]"
}

Benefits over manual scripting:
- Intelligent relevance scoring
- Graph-based relationship discovery
- Automatic validation and gap detection
- Fallback strategies for error recovery
- Optimized token budget management
```

</context_loading>

## 8. Parallel Agent Execution Patterns

<parallel_execution>
**When to Use Parallel Agents:**

- Independent analysis tasks
- Multiple diagnostic checks
- Context loading and processing
- Validation and quality assurance

**Sequential When:**

- Clarification depends on previous answers
- File operations require specific order
- Agent output feeds into next agent

**Implementation:**

```bash
# Prepare shared context once
prepare_shared_context() {
  echo "
SHARED_CONTEXT_PACKAGE:
- Original file content: [content]
- User requirements: [requirements]
- Analysis results: [analysis]
- Dynamic context: [context-files]
- Enhancement constraints: [constraints]
"
}

# Pass to agents efficiently
CONTEXT_PACKAGE=$(prepare_shared_context)
# Use with Task tool for each agent
```

</parallel_execution>

## Error Handling & Recovery

<error_handling>

### Common Issues

1. **Context Discovery Agent Failure**: Fallback to manual context selection
2. **Agent Timeout**: Retry with simplified prompts
3. **File Write Errors**: Restore from backup
4. **Clarification Overrun**: Force proceed after round 2

### Recovery Procedures

```bash
# Restore from backup if enhancement fails
restore_backup() {
  if [[ -f "$BACKUP_FILE" ]]; then
    cp "$BACKUP_FILE" "$ORIGINAL_FILE"
    echo "Restored from backup: $BACKUP_FILE"
  fi
}

# Cleanup on exit
cleanup() {
  # Remove temporary files
  # Validate final state
}
trap cleanup EXIT
```

</error_handling>

## Enhancement Techniques Library

<techniques>
### Foundation Techniques
- **Role Assignment**: Define clear AI expertise/persona
- **Context Layering**: Build comprehensive background
- **Output Specifications**: Precise format requirements
- **Task Decomposition**: Break complex into simple

### Advanced Techniques

- **Chain-of-Thought**: Step-by-step reasoning
- **Few-Shot Learning**: Provide examples
- **Multi-Perspective**: Consider various viewpoints
- **Constraint Optimization**: Balance requirements

### Command-Specific

- **Bash Integration**: Optimize command execution patterns
- **File References**: Improve @file usage
- **Argument Handling**: Enhance parameter processing
- **Tool Selection**: Optimize allowed-tools specification
</techniques>

## Enhanced Command Template

<template>
### Ideal Structure for Enhanced Commands

```markdown
---
description: [Clear, action-oriented description of what the command does]
allowed-tools: [Specific tools needed, avoid wildcards unless necessary]
argument-hint: [User-friendly hint for expected arguments]
model: [Only if specific model required, e.g., claude-opus-4-1 for complex reasoning]
---

# [Command Name]

[Brief description of the command's purpose and value proposition]

## Key Features
- **[Feature Name]**: [Concise description of the feature]
- **[Feature Name]**: [What it does and why it matters]
[3-6 key features that highlight capabilities]

## Essential Context
<!-- Always read for this command -->
- Read .claude/context/[domain]/[specific-file].md
[2-4 essential files that are ALWAYS needed]

## Prompt

<role>
You are [specific role/expertise], specializing in [key domains].
[1-2 sentences defining expertise and approach]
</role>

<instructions>
# [Command Workflow Name]

**CORE REQUIREMENTS**:
- [Critical requirement that must always be followed]
- [Another non-negotiable requirement]
[3-5 absolute requirements]

## 1. Discovery & Context
<discovery>
- Ask clarifying questions when needed
- Understand the problem being solved
- Identify target users and use cases
- Gather constraints and requirements
</discovery>

## 2. Initialization
<initialization>
1. [First step with clear action]
2. [Parameter parsing/validation]
3. [Context loading steps]
   [Include specific implementation details, not pseudocode]
</initialization>

## 3. [Main Phase Name]
<phase_name>
[Clear description of what happens in this phase]

[Provide concrete implementation steps with actual values]

[Key considerations or decision points]
</phase_name>

## 4. Dynamic Context Loading
<context_loading>
```

# Delegate to context-discovery-expert for intelligent context selection

Use Task tool with:

- subagent_type: "context-discovery-expert"
- description: "Discover context for [task]"
- prompt: "Find relevant context for [task description].
          Command type: [command-name]
          Token budget: [4000]
          Focus on: [relevant keywords and domains]"

Expert returns prioritized Read commands for execution.

```
</context_loading>

## 5. Agent Delegation (if applicable)
<delegation>
Use the Task tool to delegate to specialized agents:
- Specify the exact agent name in subagent_type
- Provide clear task description
- Include structured prompt with context and requirements
- Display agent output to user when appropriate
</delegation>

## 6. Output/Delivery
<output>
[Description of output format and delivery method]

Example output:
```

[Show example of what user will see]

```
</output>
</instructions>

<patterns>
<!-- Optional: Include specific patterns or techniques -->
### [Pattern Category]
- **[Pattern Name]**: [When and how to use]
</patterns>

<error_handling>
<!-- Optional but recommended -->
### Common Issues
1. **[Issue]**: [Solution]
2. **[Issue]**: [Solution]
</error_handling>

<help>
[Emoji] **[Command Title]**

[One-line description of what the command does]

**Usage:**
- `/command:name <required>` - [What this does]
- `/command:name [optional]` - [What this variation does]

**Process:**
1. [High-level step]
2. [High-level step]
[3-5 steps maximum]

**Requirements:**
- [Any prerequisites]
- [Required files or setup]

[Encouraging closing line]
</help>
```

### Template Guidelines

1. **Frontmatter**: Only include what's necessary
   - `description`: Always required
   - `allowed-tools`: Be specific, avoid wildcards
   - `argument-hint`: Only if accepts arguments
   - `model`: Include when command needs specific model
     - Omit for standard/default model
     - `claude-opus-4-1` for complex reasoning
     - Specific models for specialized domains

2. **Structure**: Follow consistent organization
   - Start with role and high-level description
   - Break workflow into clear, numbered phases
   - Use semantic XML-like tags for sections
   - Include code examples where helpful

3. **Context Loading**: Be explicit about when and how
   - Essential context in dedicated section
   - Dynamic context via context-discovery-expert agent
   - Show Task tool delegation with proper parameters

4. **Agent Delegation**: If using agents
   - Clear task descriptions
   - Structured prompts with context
   - Specify exact agent names

5. **Documentation**: Make it scannable
   - Use headers and formatting consistently
   - Provide examples for complex concepts
   - Include help section for quick reference
</template>

## Modification Protocol

<modify_rules>
**Critical preservation rules:**

- Exact whitespace preservation in unchanged sections
- Maintain line breaks precisely
- Keep character casing unchanged
- Retain quotes and special characters
- **ABSOLUTE RULE**: Never use typographic dashes (— or –), only standard hyphen-minus (-)
- Goal: Version control shows ONLY intended changes
</modify_rules>
</instructions>

<help>
🔧 **Command Enhancer - 4-D Methodology + Parallel Execution**

Transform existing commands into optimized, precision-crafted prompts with parallel agent processing.

**Usage:**

- `/command:enhance <file>` - Enhance command with parallel agents

**The Enhanced 4-D Process:**

1. **DECONSTRUCT** - Extract intent and components
2. **DIAGNOSE** - Identify gaps and issues (parallel analysis)
3. **DEVELOP** - Streamlined clarification + parallel agents
4. **DELIVER** - Backup, validate, and output enhanced command

**New Features:**

- 2-round clarification maximum
- Parallel agent execution
- Automatic backup creation
- context-discovery-expert agent integration
- Post-enhancement validation

**Requirements:**

- Target command file must exist
- context-discovery-expert agent must be available
- Write permissions for backup creation

Ready to enhance your command with parallel processing!
</help>
