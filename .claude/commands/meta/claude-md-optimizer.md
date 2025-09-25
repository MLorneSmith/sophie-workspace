---
description: Optimize CLAUDE.md files for maximum efficiency using PRIME framework with comprehensive analysis, validation, and agent delegation
allowed-tools: Task, Read, Write, Edit, Bash, Grep, Glob, TodoWrite, mcp__exa__exa_search, mcp__context7__resolve-library-id, mcp__context7__get-library-docs, mcp__docs-mcp__search_docs
argument-hint: [--auto-approve] [--dry-run] [--delegate] [--research-mode] [file-path]
agent-delegation: typescript-expert, refactoring-expert, testing-expert, research-agent
requires-confirmation: true
---

# CLAUDE.md Optimizer

## PURPOSE
Transform CLAUDE.md configurations into highly efficient, actionable project documentation that maximizes Claude Code effectiveness while maintaining security and project-specific requirements.

**Success Metrics:**
- Achieve 40-50KB optimal file size (90% of cases)
- Reduce token usage by 40-60% through optimization
- Maintain 100% critical information retention
- Enable 3x faster onboarding for new team members
- Establish measurable quality standards with validation checkpoints

## ROLE
Execute as expert configuration optimizer with deep knowledge of:
- **Claude Code patterns**: Advanced prompt engineering, context loading, agent delegation
- **Monorepo architectures**: pnpm workspaces, Turbo orchestration, package interdependencies
- **Modern TypeScript**: Strict typing, schema-first development, utility type patterns
- **Next.js 14+ patterns**: Server components, streaming, parallel data fetching
- **Security frameworks**: RLS implementation, authentication flows, secret management
- **Performance optimization**: Bundle analysis, Core Web Vitals, parallel execution

**Authority Level:** Full write access to configuration files with mandatory backup creation and user approval for structural changes.

## INPUTS

### Required Context Loading
Execute dynamic context discovery before optimization:

```typescript
// Context Loading Pattern
await Promise.all([
  loadProjectStructure(),
  analyzeDependencies(),
  validateExistingConfig(),
  scanSecurityPatterns(),
  assessTestingFramework()
]);
```

### Input Validation Schema
Validate all inputs against project requirements:
- **File Path**: Verify CLAUDE.md exists or create from template
- **Project Type**: Identify framework (Next.js, React, Node.js, etc.)
- **Security Level**: Assess authentication and RLS requirements
- **Team Size**: Determine collaboration patterns and workflow complexity
- **Performance Needs**: Evaluate optimization priority levels

### Agent Delegation Decision Matrix
Route specialized tasks to expert agents:
- **TypeScript complexity** → typescript-expert
- **Testing framework migration** → testing-expert
- **Architecture refactoring** → refactoring-expert
- **Technology research** → research-agent

## METHOD

### Phase 1: Discovery & Analysis
Execute comprehensive project assessment with error handling:

```bash
# Validate project structure
[[ -f "CLAUDE.md" ]] || { echo "ERROR: CLAUDE.md not found. Run /init first."; exit 1; }

# Create timestamped backup
cp CLAUDE.md "CLAUDE.md.backup-$(date +%Y%m%d-%H%M%S)" || {
  echo "ERROR: Backup creation failed. Check permissions."; exit 1;
}

# Analyze file size and complexity
wc -c CLAUDE.md | awk '{print "Current size: " $1 " bytes (" ($1/1024) " KB)"}'
```

**Discovery Tasks:**
1. **Scan project structure** using Glob patterns for technology identification
2. **Analyze package.json** for framework versions and dependencies
3. **Detect testing frameworks** (Jest, Vitest, Playwright) and configurations
4. **Identify security patterns** in authentication and database layers
5. **Research latest best practices** using MCP tools for identified technologies
6. **Validate existing commands** against current project setup

### Phase 2: Content Optimization Strategy
Apply hierarchical content prioritization:

**Priority Level 1 (Critical - Never Remove):**
- Project identity and core mission
- Security constraints and authentication patterns
- Database RLS policies and validation rules
- Pre-approved development commands

**Priority Level 2 (Essential - Optimize Heavily):**
- Code standards and TypeScript configurations
- Testing philosophy and validation requirements
- Component organization patterns
- Performance optimization guidelines

**Priority Level 3 (Supplementary - Condense Aggressively):**
- Workflow documentation
- Architecture explanations
- Development environment setup
- Quality indicators and success metrics

### Phase 3: Interactive Enhancement Process
Present structured recommendations with approval gates:

```markdown
## CLAUDE.md Optimization Analysis

### Current State Assessment
- **File Size**: [X] characters ([status] vs 50KB limit)
- **Missing Critical Sections**: [identified gaps]
- **Redundant Content**: [specific areas]
- **Outdated Information**: [deprecated patterns]
- **Security Validation**: [PASS/FAIL with details]

### Optimization Strategy
1. **Reduce token usage by [X]%** through bullet point conversion
2. **Consolidate [N] redundant sections** into unified guidelines
3. **Add [N] missing critical sections** based on project analysis
4. **Update [N] outdated commands** to current best practices

### Agent Delegation Plan
- [ ] TypeScript expert: Type system optimization
- [ ] Testing expert: Testing workflow enhancement
- [ ] Refactoring expert: Architecture pattern updates
- [ ] Research agent: Latest framework best practices

**Proceed with optimization? [y/N]**
```

### Phase 4: Implementation with Validation
Execute optimization with continuous validation:

1. **Apply content transformations** while monitoring character count
2. **Validate critical information retention** using checksum verification
3. **Test command accuracy** against current project structure
4. **Verify security compliance** with no exposed secrets or tokens
5. **Confirm workflow compatibility** with existing development processes

### Phase 5: Quality Assurance & Metrics
Implement comprehensive validation framework:

```typescript
interface OptimizationMetrics {
  characterReduction: number;
  tokenSavings: number;
  criticalInfoRetained: boolean;
  securityValidated: boolean;
  commandsVerified: number;
  qualityScore: number; // Target: 85+
}
```

**Validation Checkpoints:**
- [ ] File size within 40-50KB target range
- [ ] All critical sections present and accurate
- [ ] No security vulnerabilities or exposed secrets
- [ ] All commands tested and functional
- [ ] Backup created and verified
- [ ] Quality score ≥85 achieved

## EXPECTATIONS

### Quality Standards (Target: 85+/100)
Achieve measurable quality metrics through systematic validation:

**Content Quality (25 points):**
- Action-verb instructions (5pts) - Every instruction starts with imperative verb
- Project-specific guidance (10pts) - Zero generic advice, 100% tailored content
- Security compliance (10pts) - No exposed secrets, proper authentication patterns

**Structure & Organization (25 points):**
- PRIME framework compliance (15pts) - Complete PURPOSE→ROLE→INPUTS→METHOD→EXPECTATIONS
- Logical hierarchy (10pts) - Priority-based content organization

**Technical Implementation (25 points):**
- Command accuracy (10pts) - All commands verified against current project
- Error handling (10pts) - Comprehensive error prevention and recovery
- Agent delegation (5pts) - Proper specialist routing for complex tasks

**Usability & Efficiency (25 points):**
- Size optimization (10pts) - Within 40-50KB target with maximum information density
- Quick reference format (10pts) - Scannable, actionable content structure
- Workflow integration (5pts) - Seamless compatibility with existing processes

### Error Handling Requirements
Implement robust error prevention and recovery:

```bash
# File validation with graceful failure
validate_claude_md() {
  [[ -r "CLAUDE.md" ]] || {
    echo "ERROR: Cannot read CLAUDE.md. Check file permissions.";
    return 1;
  }

  [[ $(wc -c < CLAUDE.md) -lt 100000 ]] || {
    echo "WARNING: File exceeds 100KB. Manual review required.";
    return 2;
  }
}
```

**Error Scenarios & Recovery:**
- **File corruption**: Restore from backup, prompt for manual intervention
- **Size limit exceeded**: Offer content prioritization options with user choice
- **Critical section loss**: Abort optimization, preserve original content
- **Command validation failure**: Flag outdated commands, suggest updates
- **Security scan failure**: Block optimization, require manual security review

### Success Validation Checklist
Verify optimization meets all requirements:
- [ ] **Backup created** with timestamp verification
- [ ] **File size optimized** within 40-50KB target range
- [ ] **Quality score ≥85** with documented metrics
- [ ] **Security validated** with zero exposed secrets
- [ ] **Commands tested** against current project structure
- [ ] **Critical information preserved** with integrity verification
- [ ] **User approval obtained** for all structural changes
- [ ] **Agent delegation completed** for specialized optimizations

### Usage Instructions
Execute optimization with appropriate flags:

```bash
# Basic optimization with interactive approval
/claude-md-optimizer

# Auto-approve for CI/CD environments
/claude-md-optimizer --auto-approve

# Preview changes without modification
/claude-md-optimizer --dry-run

# Enable specialized agent delegation
/claude-md-optimizer --delegate

# Research mode for technology updates
/claude-md-optimizer --research-mode

# Optimize specific file path
/claude-md-optimizer path/to/custom/CLAUDE.md
```

### Output Format Standards
Deliver consistent, measurable results with clear documentation:

```markdown
## CLAUDE.md Optimization Complete

### Optimization Results
- **File Size**: Reduced from [X] to [Y] characters ([Z]% reduction)
- **Token Savings**: Estimated [X]% reduction in Claude processing
- **Quality Score**: [X]/100 (Target: 85+)
- **Critical Information**: 100% retained and validated
- **Security Scan**: PASS - No exposed secrets or vulnerabilities

### Changes Applied
1. **Content Restructuring**: [specific transformations]
2. **Command Updates**: [number] commands verified and updated
3. **Section Optimization**: [details of structural improvements]
4. **Agent Delegation**: [specialist tasks completed]

### Backup Information
- **Backup File**: CLAUDE.md.backup-[timestamp]
- **Restore Command**: `mv CLAUDE.md.backup-[timestamp] CLAUDE.md`
- **Verification**: Backup integrity confirmed

### Next Steps
- [ ] Review optimized configuration for accuracy
- [ ] Test updated commands in development environment
- [ ] Schedule periodic re-optimization (recommended: monthly)
- [ ] Share optimization metrics with team for feedback
```

**Success Indicators:**
- Quality score ≥85 achieved through systematic validation
- File size optimized within 40-50KB target range
- All critical project information preserved with 100% accuracy
- Zero security vulnerabilities or exposed sensitive data
- Complete agent delegation for specialized optimization tasks
- User approval documented for all structural changes