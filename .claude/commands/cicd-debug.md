# CI/CD Debug Command

Usage: `/cicd-debug [options]`

Options:
- `[workflow_name]` - Specific GitHub Actions workflow name (e.g., "e2e-sharded")
- `[run_id]` - Specific workflow run ID from GitHub Actions
- `latest` - Debug the most recent failure (default if no options provided)
- `[error_message]` - Partial error message to search for in logs

This command orchestrates a comprehensive investigation of failing CI/CD pipelines using specialized subagents, automatically creating GitHub issues for tracking.

## Subagent Architecture

This command implements an **Orchestrator-Worker Pattern** with specialized agents:
- **cicd-orchestrator**: Meta-agent that coordinates the workflow
- **cicd-investigator**: Analyzes failures and identifies root causes
- **log-issue**: Creates comprehensive GitHub issues

## Execution Flow

### 1. Pre-flight Context Gathering

Before launching agents, gather essential context to minimize latency:

```bash
# Parallel execution of context gathering
gh run list --limit 5 --json conclusion,status,displayTitle,workflowName | jq '.[] | select(.conclusion == "failure")'
```

### 2. Launch CI/CD Orchestrator Agent

Invoke the orchestrator with **specific, structured context**:

```
/task cicd-orchestrator "Investigate CI/CD pipeline failure for [specific details]:
- Workflow: [workflow_name or 'latest failure']
- Run ID: [run_id if available]
- Error Pattern: [error_message if provided]
- Repository: [owner/repo]

Required outputs:
1. Root cause analysis with evidence
2. GitHub issue number and link
3. Actionable fix recommendations
4. Prevention measures

Constraints:
- Sanitize sensitive information before creating issues
- Complete investigation within 5 minutes
- Validate findings before issue creation"
```

### 3. Orchestrator Workflow (Best Practices Applied)

The cicd-orchestrator implements these **research-backed patterns**:

#### Phase 1: Context Discovery (Selective Context Passing)
- Read `.claude/data/context-inventory.json` for CI/CD documentation
- **Only pass relevant context** to avoid context bloat
- Prioritize documents based on failure type
- Build focused understanding of affected systems

#### Phase 2: Parallel Investigation (Performance Optimization)
Launch **parallel subagents** for independent tasks:

```
/task cicd-investigator "Analyze workflow logs for [run_id]"
/task cicd-investigator "Check recent commits affecting [workflow_path]"
/task cicd-investigator "Review test results and coverage changes"
```

Each investigator receives:
- **Specific scope** (single responsibility principle)
- **Clear success criteria** (evidence-based findings)
- **Output format requirements** (structured JSON/Markdown)

#### Phase 3: Issue Creation (Error Handling & Validation)
Launch log-issue agent with **validated findings**:

```
/task log-issue "Create GitHub issue with:
- Title: [validated_title]
- Root Cause: [evidence_based_analysis]
- Reproduction: [verified_steps]
- Fix: [actionable_recommendations]

Validation checklist:
✓ Sensitive data sanitized
✓ Root cause has evidence
✓ Steps are reproducible
✓ Fix is actionable"
```

#### Phase 4: Result Consolidation (Orchestrator Pattern)
The orchestrator:
- **Validates all agent outputs** before proceeding
- **Handles agent failures** with fallback strategies
- **Consolidates findings** into cohesive report
- **Tracks progress** with real-time status updates

## Usage Examples (With Best Practices)

### Debug Latest Failure
```
/cicd-debug
```
**What happens:**
1. Pre-flight check identifies latest failure
2. Orchestrator launched with structured context
3. Parallel investigation by specialized agents
4. Validated issue creation
5. Consolidated report with actionable steps

### Debug Specific Workflow
```
/cicd-debug e2e-sharded
```
**Optimization:** Passes workflow-specific context to reduce investigation scope

### Debug Specific Run
```
/cicd-debug 12345678
```
**Direct targeting:** Skips discovery phase for faster investigation

### Debug by Error Pattern
```
/cicd-debug "timeout waiting for expect"
```
**Pattern matching:** Focuses agents on specific error signatures

## Information Gathering

Before launching the orchestrator, this command may gather initial context:

### Check Recent Workflow Runs
```bash
gh run list --limit 10 --json conclusion,status,displayTitle,createdAt,workflowName
```

### Get Specific Run Details
```bash
gh run view [run_id] --json conclusion,status,displayTitle,jobs
```

### View Workflow Logs
```bash
gh run view [run_id] --log
```

## Output Format

The command will produce a structured report:

```markdown
## CI/CD Pipeline Investigation Report

### 🔍 Root Cause
[Clear explanation of why the pipeline failed]

### 📊 Technical Details
- **Failed Workflow**: [workflow_name]
- **Run ID**: [run_id]
- **Failure Time**: [timestamp]
- **Error Type**: [categorized error]
- **Affected Components**: [list]

### 🎫 GitHub Issue
Created issue #[number]: [title]
Link: https://github.com/[owner]/[repo]/issues/[number]

### ✅ Recommended Actions
1. [Immediate fix step 1]
2. [Immediate fix step 2]
3. [Verification step]

### 🛡️ Prevention Measures
- [Long-term improvement 1]
- [Long-term improvement 2]
```

## Error Handling (Multi-Level Strategy)

Based on best practices, the command implements **resilient error handling**:

### Agent-Level Failures
```
if agent_fails:
  - Log failure with context
  - Attempt retry with reduced scope
  - Fallback to manual investigation
  - Report partial results
```

### Orchestrator-Level Recovery
- **Missing Context**: Proceeds with default CI/CD locations
- **Investigation Timeout**: Returns partial findings within deadline
- **API Failures**: Switches to local file analysis
- **Validation Failures**: Requests human review before issue creation

### System-Level Monitoring
- Track agent success rates
- Alert on repeated failures
- Maintain audit trail in `.claude/scratch/cicd/`

## Common CI/CD Issues Addressed

This command is optimized to investigate:

- **Test Failures**: Flaky tests, timeouts, environment issues
- **Build Errors**: Dependency conflicts, compilation errors
- **Deployment Issues**: Environment variables, secrets, permissions
- **Resource Problems**: Memory limits, disk space, concurrency
- **Integration Failures**: API changes, service unavailability
- **Configuration Errors**: Workflow syntax, matrix configurations

## Integration with Other Commands

Works seamlessly with:
- `/log-issue` - For manual issue creation if needed
- `/test` - To reproduce failures locally
- `/debug-issue` - To debug the created issue later
- `/workflow` - To understand the overall workflow

## Best Practices (Research-Driven Implementation)

### 1. **Prompt Engineering**
- Use **action-oriented descriptions** for automatic agent invocation
- Provide **specific constraints and timeouts** to prevent runaway agents
- Include **validation criteria** in every agent prompt
- Define **clear output formats** for predictable results

### 2. **Context Management**
- Practice **selective context passing** - only share what's necessary
- Maintain **context isolation** between agents to prevent pollution
- Use **structured data formats** (JSON/YAML) for agent communication
- Implement **context versioning** for reproducibility

### 3. **Performance Optimization**
- Launch **parallel agents** for independent investigations
- Use **agent caching** for repeated similar investigations
- Implement **early termination** when root cause is found
- Monitor **agent latency** and optimize critical paths

### 4. **Error Resilience**
- Design for **graceful degradation** when agents fail
- Implement **validation checkpoints** between agent phases
- Maintain **fallback strategies** for each agent type
- Log all **agent interactions** for debugging

### 5. **Monitoring & Feedback**
- Track **agent success metrics** over time
- Collect **pattern library** of common failures
- Update **agent prompts** based on performance data
- Share **learnings** across agent configurations

## Advanced Features

### Agent Coordination Protocols
```yaml
coordination:
  pattern: orchestrator-worker
  communication: structured-handoff
  error_handling: multi-level
  monitoring: real-time
  validation: checkpoint-based
```

### Parallel Execution Strategy
```
# Launch multiple investigators simultaneously
parallel_tasks:
  - log_analysis: cicd-investigator
  - commit_review: cicd-investigator
  - dependency_check: cicd-investigator
  
consolidation:
  method: weighted-consensus
  validation: cross-reference
```

### State Management
```
state_tracking:
  location: .claude/scratch/cicd/
  format: structured-json
  retention: 30-days
  privacy: sanitized
```

## Notes

- Implements **Orchestrator-Worker Pattern** for scalable investigation
- Uses **parallel subagent execution** for reduced latency
- Applies **selective context passing** to optimize performance
- Includes **multi-level error handling** for resilience
- Maintains **structured audit trail** in `.claude/scratch/cicd/`
- Follows **single responsibility principle** for each agent
- Validates **all findings** before issue creation
- Sanitizes **sensitive information** automatically