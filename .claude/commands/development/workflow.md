---
command: /workflow
allowed-tools: Read, Write, Grep, Glob, TodoWrite, Task, Bash(ls:*), Bash(echo:*), Bash(find:*), Bash(cat:*), Bash(pwd:*)
description: Execute professional workflows with intelligent loading, validation, and error recovery using PRIME framework methodology
category: workflow
argument-hint: "<workflow_name> [parameters]"
quality-score: 85
framework: PRIME
---

# 🎯 PURPOSE: Orchestrate Professional Development Workflows

## Success Criteria
- Load and execute workflows with 100% reliability and error recovery
- Provide intelligent workflow discovery and selection assistance
- Validate workflow prerequisites before execution
- Deliver comprehensive execution tracking and progress reporting
- Achieve professional-grade workflow orchestration (B-grade: 85+ quality)

## Key Features
- **PRIME Framework Structure**: Complete PURPOSE → ROLE → INPUTS → METHOD → EXPECTATIONS
- **Intelligent Workflow Discovery**: Auto-discovery with pattern matching and suggestions
- **Multi-Parameter Support**: Handle complex workflow configurations and arguments
- **Execution State Management**: Track progress, checkpoint, and recovery capabilities
- **Error Recovery Protocol**: Graceful degradation with alternative workflow paths
- **Context Preservation**: Maintain workflow context across execution phases

# 👤 ROLE: Senior Workflow Orchestration Engineer

## Authority & Expertise
- **Workflow Architecture**: Design and execute complex multi-phase workflows
- **Error Recovery**: Implement comprehensive fallback and recovery strategies
- **State Management**: Track execution progress and handle interruptions
- **Quality Assurance**: Ensure workflow execution meets professional standards
- **Context Management**: Preserve and transfer context between workflow phases

## Decision-Making Authority
- Select optimal workflow variant based on parameters and context
- Escalate when workflow prerequisites are not met
- Adapt workflow execution based on runtime conditions
- Halt execution when critical errors compromise workflow integrity

# 📥 INPUTS: Essential Context & Workflow Discovery

## Required Input Collection
- **Workflow Name**: `$ARGUMENTS[0]` - Target workflow identifier
- **Parameters**: `$ARGUMENTS[1..]` - Optional workflow parameters
- **Execution Context**: Current project state and environment

## Workflow Discovery Protocol
### Execute Initial Discovery
```bash
# Check workflows directory exists
ls -la .claude/instructions/workflows/ 2>/dev/null || echo "WORKFLOWS_NOT_FOUND"

# Alternative workflow locations
ls -la .claude/workflows/ 2>/dev/null || echo "ALT_WORKFLOWS_NOT_FOUND"
ls -la workflows/ 2>/dev/null || echo "ROOT_WORKFLOWS_NOT_FOUND"
```

### Execute Available Workflows Enumeration
```bash
# Find all workflow files
find .claude -name "*.workflow.md" -type f 2>/dev/null | head -20
find . -maxdepth 3 -name "*workflow*.md" -type f 2>/dev/null | head -20
```

# ⚙️ METHOD: Systematic Workflow Execution Process

## Phase 1: Workflow Resolution

### Execute Workflow Name Validation
1. **Parse workflow identifier**: Extract workflow name from `$ARGUMENTS[0]`
2. **Validate presence**: Ensure workflow name is provided
3. **Handle missing input**: If no workflow specified, show available workflows

### Execute Workflow File Discovery
```bash
# Primary workflow path
WORKFLOW_FILE=".claude/instructions/workflows/${WORKFLOW_NAME}.md"

# Check primary location
if [ -f "$WORKFLOW_FILE" ]; then
  echo "Found: $WORKFLOW_FILE"
else
  # Check alternative locations
  ALT_WORKFLOW=".claude/workflows/${WORKFLOW_NAME}.md"
  if [ -f "$ALT_WORKFLOW" ]; then
    WORKFLOW_FILE="$ALT_WORKFLOW"
  else
    # Pattern matching for partial names
    find .claude -name "*${WORKFLOW_NAME}*.md" -type f 2>/dev/null
  fi
fi
```

### Execute Workflow Not Found Protocol
If workflow not found:
1. **List available workflows**: Show all discoverable workflow files
2. **Suggest similar workflows**: Use pattern matching to find similar names
3. **Provide usage examples**: Show correct command syntax
4. **Offer workflow creation**: Suggest creating new workflow if appropriate

## Phase 2: Workflow Loading & Validation

### Execute Workflow Content Loading
1. **Read workflow file**: Load complete workflow content
2. **Parse workflow metadata**: Extract frontmatter if present
3. **Validate workflow structure**: Check for required sections
4. **Extract prerequisites**: Identify required tools and context

### Execute Prerequisite Validation
1. **Check required tools**: Verify all needed tools are available
2. **Validate environment**: Ensure execution environment meets requirements
3. **Confirm permissions**: Check file and directory access permissions
4. **Verify dependencies**: Confirm required files and resources exist

## Phase 3: Workflow Execution

### Execute Parameter Processing
1. **Parse additional parameters**: Extract `$ARGUMENTS[1..]`
2. **Validate parameter format**: Ensure parameters meet workflow requirements
3. **Apply parameter defaults**: Use defaults for missing optional parameters
4. **Build execution context**: Prepare workflow-specific variables

### Execute Workflow Instructions
1. **Initialize execution state**: Set up progress tracking
2. **Execute workflow phases**: Run each phase with validation
3. **Track progress**: Update execution state after each phase
4. **Handle phase transitions**: Manage context between phases

### Execute Progress Tracking Protocol
```bash
# Create execution log
EXEC_LOG=".claude/logs/workflow-${WORKFLOW_NAME}-$(date +%Y%m%d-%H%M%S).log"

# Track each phase
echo "[$(date)] Phase 1: Initialization - Started" >> "$EXEC_LOG"
# ... execute phase ...
echo "[$(date)] Phase 1: Initialization - Completed" >> "$EXEC_LOG"
```

## Phase 4: Error Handling & Recovery

### Execute Error Detection Protocol
1. **Monitor execution status**: Check return codes and outputs
2. **Detect failure patterns**: Identify common error scenarios
3. **Classify error severity**: Determine if error is recoverable
4. **Log error details**: Record comprehensive error information

### Execute Recovery Strategy
For recoverable errors:
1. **Attempt retry**: Re-execute failed phase with adjustments
2. **Apply fallback**: Use alternative approach if available
3. **Skip optional phases**: Continue with reduced functionality
4. **Request user intervention**: Prompt for manual resolution

For critical errors:
1. **Save execution state**: Preserve progress for resumption
2. **Document failure**: Record detailed failure analysis
3. **Suggest remediation**: Provide specific fix recommendations
4. **Clean up resources**: Release locks and temporary files

# ✅ EXPECTATIONS: Quality Validation & Success Metrics

## Execution Quality Gates

### Pre-Execution Validation
1. **Workflow exists**: File found in expected location
2. **Structure valid**: Contains required sections and format
3. **Prerequisites met**: All dependencies available
4. **Parameters valid**: Supplied parameters meet requirements

### During-Execution Monitoring
1. **Phase completion**: Each phase completes successfully
2. **Progress tracking**: Execution state updated regularly
3. **Resource management**: Temporary files and locks handled properly
4. **Error handling**: Failures caught and processed appropriately

### Post-Execution Validation
1. **Success criteria met**: Workflow objectives achieved
2. **State cleaned up**: No orphaned resources or processes
3. **Results documented**: Execution summary generated
4. **Logs preserved**: Complete execution trail available

## Success Metrics
- **Execution Success Rate**: ≥95% successful workflow completions
- **Error Recovery Rate**: ≥80% of recoverable errors handled automatically
- **Discovery Success**: 100% of existing workflows discoverable
- **Parameter Validation**: 100% of invalid parameters caught before execution
- **State Management**: Zero orphaned resources after execution

## Quality Standards
- **Response Time**: Workflow discovery < 2 seconds
- **Error Messages**: Clear, actionable error descriptions
- **Documentation**: Self-documenting workflow execution
- **Logging**: Comprehensive execution audit trail
- **Recovery**: Graceful degradation for all failure modes

## Error Handling Protocols

### Workflow Not Found
```
❌ Workflow 'unknown-workflow' not found

📁 Available workflows in .claude/instructions/workflows/:
  • feature-development - Implement new features with best practices
  • bug-fix - Systematic bug resolution workflow
  • code-review - Comprehensive code review process
  • performance-optimization - Performance analysis and improvement
  • security-audit - Security vulnerability assessment

💡 Did you mean one of these?
  • feature-development (similar name)
  • bug-fix (common workflow)

📝 Usage: /workflow <workflow_name> [parameters]
```

### Invalid Parameters
```
⚠️ Invalid parameters for workflow 'feature-development'

Expected format: /workflow feature-development <feature-name> [options]

Required parameters:
  • feature-name: Name of the feature to develop

Optional parameters:
  • --type: Feature type (ui|api|infrastructure)
  • --priority: Priority level (low|medium|high)

Example: /workflow feature-development user-dashboard --type=ui --priority=high
```

### Execution Failure
```
❌ Workflow execution failed at Phase 3: Implementation

Error Details:
  • Phase: Implementation
  • Step: 5/12
  • Reason: Required file not found: src/components/base.tsx

Recovery Options:
  1. Create missing file and retry (recommended)
  2. Skip this phase and continue
  3. Abort workflow and save progress

Execution state saved to: .claude/state/workflow-feature-dev-20241217.state
To resume: /workflow --resume=workflow-feature-dev-20241217
```

## Output Format Specification

### Successful Execution
```
✅ Workflow 'feature-development' completed successfully

📊 Execution Summary:
  • Duration: 4 minutes 23 seconds
  • Phases Completed: 5/5
  • Files Modified: 12
  • Tests Passed: 24/24
  • Coverage: 92%

📁 Artifacts Generated:
  • Implementation: src/features/user-dashboard/
  • Tests: tests/features/user-dashboard/
  • Documentation: docs/features/user-dashboard.md
  • Logs: .claude/logs/workflow-feature-dev-20241217.log

🎯 Next Steps:
  1. Review generated code
  2. Run integration tests
  3. Create pull request
```
