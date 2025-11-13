---
id: "creating-subagent-prompts"
title: "Creating Effective Claude Code Subagent Prompts"
version: "2.1.0"
category: "pattern"

description: "Comprehensive patterns for creating action-oriented Claude Code subagent prompts with production examples"
tags: ["subagents", "prompts", "claude-code", "orchestration", "patterns", "best-practices"]

dependencies: ["systems/pm/ccpm-system-overview.md"]
cross_references:
  - id: "dynamic-context-loading-pattern"
    type: "related"
    description: "Token optimization strategies for agent context"

created: "2025-09-16"
last_updated: "2025-09-16"
author: "create-context"
---

# Creating Effective Claude Code Subagent Prompts

## Overview

Claude Code subagents achieve 90.2% better task completion when designed with action-first patterns, specialized roles, and clear tool permissions. This guide provides production-proven patterns for creating effective subagent prompts based on 2025 best practices and real-world implementations.

## Model Configuration

### Subagent Model Support

- **Subagents** (`.claude/agents/*.md`): Support `model:` field in YAML frontmatter
- **Commands** (`.claude/commands/*.md`): Do NOT support model specification
- **Valid Values**: `opus`, `sonnet`, `haiku`, `inherit` (uses main conversation model)
- **Best Practice**: Use `inherit` for consistency, specify models only when needed

### Determining Appropriate Model Selection

#### Model Capabilities & Use Cases

| Model | Best For | Avoid For | Token Cost | Speed |
|-------|----------|-----------|------------|--------|
| **opus** | Complex analysis, architectural decisions, multi-step reasoning, creative problem-solving | Simple tasks, repetitive operations, basic CRUD | Highest | Slowest |
| **sonnet** | Code implementation, debugging, testing, standard development tasks | Extremely complex reasoning, novel architecture design | Medium | Balanced |
| **haiku** | Quick lookups, simple transformations, status checks, formatting | Complex logic, nuanced decisions, architectural planning | Lowest | Fastest |
| **inherit** | Consistency with main conversation, user preference alignment | When specific model capabilities are required | Variable | Variable |

#### Selection Decision Tree

```
1. Task Complexity Assessment
   ├─ High Complexity (Novel problems, architecture, deep analysis)
   │  └─ Use: opus
   ├─ Medium Complexity (Implementation, debugging, testing)
   │  └─ Use: sonnet or inherit
   └─ Low Complexity (Formatting, lookups, simple operations)
      └─ Use: haiku

2. Performance Requirements
   ├─ Critical Path (User waiting)
   │  └─ Prefer: haiku > sonnet > opus
   └─ Background Processing
      └─ Prefer: opus for quality

3. Error Tolerance
   ├─ Zero Tolerance (Production deployment, security)
   │  └─ Use: opus
   └─ Standard Development
      └─ Use: sonnet or inherit
```

#### Agent Type Model Recommendations

```yaml
# Orchestrators & Coordinators
- cicd-orchestrator: opus       # Complex multi-step coordination
- test-suite-architect: opus    # Test strategy planning
- clarification-loop-engine: sonnet  # Interactive refinement

# Code Analysis & Review
- code-review-expert: opus      # Deep architectural analysis
- code-search-expert: sonnet    # Pattern matching and search
- triage-expert: sonnet         # Problem diagnosis

# Implementation Specialists
- typescript-expert: sonnet     # Standard TypeScript work
- react-expert: sonnet          # Component development
- nodejs-expert: sonnet         # Backend implementation

# Testing & Quality
- jest-testing-expert: sonnet   # Test implementation
- linting-expert: haiku         # Rule-based validation
- testing-expert: sonnet        # Test architecture

# Documentation & Research
- documentation-expert: sonnet  # Content organization
- research-agent: opus          # Complex information synthesis
- log-issue: haiku             # Simple issue logging

# Database & Infrastructure
- postgres-expert: sonnet       # Query optimization
- mongodb-expert: sonnet        # NoSQL operations
- docker-expert: sonnet         # Container configuration
- devops-expert: opus          # Infrastructure architecture

# Performance & Optimization
- react-performance-expert: opus    # Complex performance analysis
- webpack-expert: sonnet            # Build configuration
- vite-expert: sonnet              # Build optimization
- refactoring-expert: opus         # Code restructuring

# Specialized Tools
- prompt-construction-expert: opus  # Complex prompt design
- oracle: opus                      # Deep reasoning tasks
- cli-expert: sonnet               # CLI tool development
```

#### Model Selection Guidelines

1. **Default to inherit** when:
   - Task matches user's current conversation complexity
   - Consistency is more important than optimization
   - Agent is part of a larger workflow

2. **Specify opus** when:
   - Novel problem-solving required
   - Multiple complex decisions needed
   - Architectural or design choices involved
   - Zero error tolerance (production, security)

3. **Specify sonnet** when:
   - Standard implementation tasks
   - Well-defined problem space
   - Balance of speed and quality needed
   - Debugging or testing work

4. **Specify haiku** when:
   - Simple, repetitive tasks
   - Fast response critical
   - Rule-based operations
   - Low complexity transformations

#### Cost-Performance Optimization

```yaml
# Parallel Agent Strategy (Optimal)
orchestrator: opus          # High-level planning
workers:
  - implementer: sonnet    # Core development
  - formatter: haiku       # Code formatting
  - logger: haiku         # Status updates

# Sequential Pipeline (Budget-conscious)
step1: haiku              # Initial validation
step2: sonnet            # Main implementation
step3: haiku             # Final checks
```

## Key Principles

### 1. Context Isolation Architecture

- **200K Token Windows**: Each subagent operates independently
- **No Context Pollution**: Prevents degradation from mixed responsibilities
- **Specialized Knowledge**: Domain-specific context per agent

### 2. Action-First Design

**Effective Pattern**:

```yaml
# For Subagents (.claude/agents/*.md)
name: specialist-name
description: "Single sentence describing core function"
tools: [specific-tool-list]  # Optional, inherits all if omitted
displayName: Human-Readable Name  # Optional
category: domain  # Optional
model: opus|sonnet|haiku|inherit  # Optional, subagents only
---

# Role Definition
You are a [specific role] specialized in [exact domain].

# Core Responsibilities
1. [Primary task - action verb]
2. [Secondary task - action verb]
3. [Verification task - action verb]

# Constraints
- NEVER [specific forbidden actions]
- ALWAYS [required verification steps]
- ONLY work within [defined scope]

# Success Criteria
[Measurable completion conditions]
```

### 3. Tool Permission Layers

```yaml
Level 1: Read-only (browsing, status)
Level 2: Safe mods (docs, comments)
Level 3: Code changes (with validation)
Level 4: System ops (deployment, APIs)
```

## Production Patterns

### ReAct (Reasoning-Acting) Implementation

```markdown
## Execution Protocol
1. **Observation**: [Current state assessment]
2. **Thought**: [Reasoning about next step]
3. **Action**: [Tool invocation with parameters]
4. **Verification**: [Result validation]
5. **Decision**: [Continue/Complete/Escalate]

## Stopping Criteria
Task complete when:
- All requirements met
- Tests pass with >80% coverage
- No critical issues remain
```

### Orchestrator-Worker Pattern

```yaml
# Lead Agent (model: opus or inherit)
role: orchestrator
responsibilities:
  - Task decomposition
  - Agent coordination
  - Result synthesis

# Worker Agents (model: sonnet or inherit)
role: specialist
responsibilities:
  - Single domain focus
  - Autonomous execution
  - Status reporting
```

## Common Antipatterns

### Advisory Mode (Avoid)

❌ "What should I do about..."
❌ "How would you approach..."
❌ "Can you help me with..."

### Execution Mode (Prefer)

✅ "Create X with requirements Y"
✅ "Fix issue Z in file A"
✅ "Deploy feature B to staging"

## Real-World Examples

### Code Review Expert (Production)

```markdown
---
name: code-review-expert
description: Deep analysis covering architecture, quality, security, performance, testing, and documentation
tools: Read, Grep, Glob, Bash
model: opus  # Uses Opus for complex analysis tasks
---

# Code Review Expert

You are a senior architect providing actionable feedback.

## Review Focus Areas
1. **Architecture & Design** - Module organization, patterns
2. **Code Quality** - Readability, complexity, DRY
3. **Security** - Vulnerabilities, authentication
4. **Performance** - Algorithms, caching, async
5. **Testing** - Meaningful assertions, edge cases
6. **Documentation** - API docs, breaking changes

## Execution Protocol
1. Gather context from project docs
2. Detect architectural patterns
3. Analyze code systematically
4. Provide root cause analysis
5. Suggest specific solutions

## Success Metrics
- All critical issues identified
- Actionable solutions provided
- No false positives
```

### Three-Stage Pipeline (PubNub)

```
PM-Spec → Architect-Review → Implementer-Tester
   ↓            ↓                    ↓
Requirements  Validation        Implementation
```

## Performance Metrics

| Pattern | Success Rate | Speed Gain |
|---------|-------------|------------|
| Single Agent | 27.3% | 1x |
| Sequential Pipeline | 54.8% | 1.5x |
| Parallel Orchestration | 72.5% | 3-5x |
| Graph Topology | 79.4% | 10x |

## Context Management

### Dynamic Loading Strategy

```yaml
Level 1: Current task (always included)
Level 2: Recent history (summarized)
Level 3: Relevant docs (retrieved)
Level 4: Project context (indexed)
```

### Token Optimization

- **Target**: 2000 tokens per context
- **Maximum**: 3000 tokens hard limit
- **Compression**: Hierarchical summarization
- **Caching**: Reuse across similar tasks

## Validation Patterns

### Built-in Quality Gates

```markdown
## Validation Protocol
- Pre-execution: Verify inputs/permissions
- Mid-execution: Confirm step completion
- Post-execution: Validate against criteria
- Error states: Specific failure details
```

### Agent-as-Judge

- Automated evaluation using other agents
- Multi-dimensional scoring
- Regression testing for behavior changes

## Implementation Checklist

### Essential Components

- [ ] Clear role definition with boundaries
- [ ] Specific tool permissions
- [ ] Measurable success criteria
- [ ] Error handling procedures
- [ ] State tracking mechanisms

### Advanced Features

- [ ] Parallel execution capability
- [ ] Dynamic context selection
- [ ] Self-criticism loops
- [ ] Rollback procedures
- [ ] Performance monitoring

## Troubleshooting

### Common Issues

1. **Role Drift**: Add explicit constraints
2. **Context Loss**: Implement checkpoints
3. **Infinite Loops**: Define termination conditions
4. **Handoff Failures**: Structured output formats

## See Also

- [[systems/pm/ccpm-system-overview.md]]: Parallel execution framework
- [[systems/claude-code/dynamic-context-loading-pattern.md]]: Token optimization
