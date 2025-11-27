# Model Optimization Analysis for Commands and Agents

**Date**: 2025-09-06
**Objective**: Optimize token usage by selecting appropriate models for commands and agents

## Executive Summary

Based on analysis of 43 commands and 37 agents, we can achieve significant token savings by:

- Using **Haiku** for 30% of commands (simple operations)
- Using **Sonnet** for 45% of commands (moderate complexity)
- Reserving **Opus** for 25% of commands (complex reasoning)

**Estimated Token Savings**: 40-60% reduction in token costs

---

## Command Analysis

### Commands That Can Run as Standalone Sessions

#### ✅ **Haiku-Suitable Commands** (Low Complexity)

These commands perform simple, deterministic tasks with minimal reasoning:

| Command | Session Independent | Reasoning |
|---------|-------------------|-----------|
| `/git/status` | ✅ Yes | Simple git status check |
| `/git/checkout` | ✅ Yes | Branch switching operation |
| `/git/push` | ✅ Yes | Push to remote |
| `/checkpoint/list` | ✅ Yes | List available checkpoints |
| `/db-healthcheck` | ✅ Yes | Database connectivity check |
| `/config/bash-timeout` | ✅ Yes | Simple config update |
| `/dev/cleanup` | ✅ Yes | Clean temp files |
| `/agents-md/init` | ✅ Yes | Initialize environment |

#### 🔵 **Sonnet-Suitable Commands** (Moderate Complexity)

These commands require some analysis and pattern matching:

| Command | Session Independent | Reasoning |
|---------|-------------------|-----------|
| `/git/commit` | ✅ Yes | Analyze changes, create message |
| `/code-review` | ✅ Yes | Pattern analysis, best practices |
| `/codecheck` | ✅ Yes | Quality analysis |
| `/write-tests` | ✅ Yes | Test generation from code |
| `/validate-and-fix` | ✅ Yes | Error detection and fixing |
| `/checkpoint/create` | ✅ Yes | Create project snapshot |
| `/checkpoint/restore` | ✅ Yes | Restore from checkpoint |
| `/log-task` | ✅ Yes | Create GitHub issue |
| `/log-issue` | ✅ Yes | Log to tracking system |
| `/pr` | ✅ Yes | Create pull request |
| `/spec/validate` | ✅ Yes | Validate specification |
| `/do-task` | ✅ Yes | Execute single task |
| `/update-makerkit` | ✅ Yes | Update dependencies |
| `/test` | ✅ Yes | Run test suite |

#### 🟣 **Opus-Required Commands** (High Complexity)

These commands require deep reasoning, multi-step planning, or extensive context:

| Command | Session Independent | Reasoning |
|---------|-------------------|-----------|
| `/feature/spec` | ✅ Yes | Complex specification creation |
| `/feature/plan` | ✅ Yes | Technical architecture planning |
| `/feature/decompose` | ✅ Yes | Task breakdown and dependencies |
| `/feature/sync` | ✅ Yes | GitHub integration orchestration |
| `/feature/start` | ✅ Yes | Multi-agent coordination |
| `/feature/discover` | ✅ Yes | Feature discovery and analysis |
| `/debug-issue` | ✅ Yes | Complex debugging reasoning |
| `/cicd-debug` | ✅ Yes | CI/CD pipeline analysis |
| `/research` | ✅ Yes | In-depth research |
| `/spec/create` | ✅ Yes | Specification authoring |
| `/spec/decompose` | ✅ Yes | Complex breakdown |
| `/spec/execute` | ✅ Yes | Multi-step execution |
| `/create-subagent` | ✅ Yes | Agent architecture design |
| `/create-command` | ✅ Yes | Command design and implementation |

#### ⚠️ **Context-Dependent Commands**

These may not run as standalone sessions effectively:

| Command | Session Independent | Reasoning |
|---------|-------------------|-----------|
| `/workflow` | ❌ No | Depends on ongoing work context |
| `/feature/status` | ⚠️ Maybe | Needs feature context |
| `/feature/update` | ⚠️ Maybe | Needs existing feature context |
| `/agents-md/cli` | ⚠️ Maybe | May need session context |
| `/agents-md/migration` | ⚠️ Maybe | May need migration context |
| `/promote-to-staging` | ⚠️ Maybe | May need deployment context |
| `/promote-to-production` | ⚠️ Maybe | May need deployment context |

---

## Agent Analysis

### Agent Categories and Model Recommendations

#### ✅ **Haiku-Suitable Agents** (15 agents)

Simple, focused tasks with clear patterns:

### Code Quality & Linting

- `linting-expert` - Rule-based analysis
- `code-search` - Pattern matching

### Simple Operations

- `log-issue` - Issue creation
- `git-expert` - Git operations (when simple)

### Basic Testing

- `testing-expert` - Basic test analysis
- `jest-testing-expert` - Jest-specific patterns
- `vitest-testing-expert` - Vitest-specific patterns

### Infrastructure (Simple)

- `docker-expert` - Dockerfile analysis
- `github-actions-expert` - Workflow analysis

#### 🔵 **Sonnet-Suitable Agents** (15 agents)

Moderate complexity requiring analysis:

##### Frontend & React

- `react-expert` - Component patterns
- `react-performance-expert` - Performance analysis
- `css-styling-expert` - Styling architecture
- `accessibility-expert` - WCAG compliance

##### Database

- `database-expert` - General database queries
- `postgres-expert` - PostgreSQL specifics
- `mongodb-expert` - MongoDB operations

### Documentation & Review

- `documentation-expert` - Doc structure
- `code-review-expert` - Code analysis

### TypeScript

- `typescript-expert` - Type system basics
- `typescript-build-expert` - Build configuration

#### 🟣 **Opus-Required Agents** (7 agents)

Complex reasoning and multi-step analysis:

### Architecture & Planning

- `ai-sdk-expert` - AI integration complexity
- `nestjs-expert` - Complex framework
- `test-suite-architect` - Test strategy design
- `refactoring-expert` - Code transformation

### Complex Debugging

- `triage-expert` - Root cause analysis
- `cicd-investigator` - Pipeline debugging
- `cicd-orchestrator` - Multi-step coordination

### Advanced TypeScript

- `typescript-type-expert` - Complex type gymnastics

### Research & Discovery

- `research-agent` - Deep research
- `oracle` - Complex reasoning

### Framework Experts

- `nextjs-expert` - Complex SSR/SSG patterns
- `devops-expert` - Infrastructure architecture
- `nodejs-expert` - Runtime complexity
- `cli-expert` - CLI architecture

---

## Implementation Recommendations

### 1. **Command Configuration File**

Create `.claude/config/model-mapping.json`:

```json
{
  "commands": {
    "/git/status": { "model": "haiku", "standalone": true },
    "/git/commit": { "model": "sonnet", "standalone": true },
    "/feature/spec": { "model": "opus", "standalone": true },
    // ... full mapping
  },
  "agents": {
    "linting-expert": { "model": "haiku" },
    "react-expert": { "model": "sonnet" },
    "ai-sdk-expert": { "model": "opus" },
    // ... full mapping
  }
}
```

### 2. **Dynamic Model Selection Logic**

```typescript
function selectModel(command: string, complexity?: string): Model {
  // Check explicit mapping first
  const mapping = config.commands[command];
  if (mapping) return mapping.model;
  
  // Fall back to complexity heuristics
  if (complexity === 'simple') return 'haiku';
  if (complexity === 'moderate') return 'sonnet';
  return 'opus'; // Safe default
}
```

### 3. **Session Management Strategy**

**Standalone Sessions** (New Context):

- All git operations
- Checkpoint operations
- Single-task executions
- Test runs
- Code quality checks

**Continued Sessions** (Preserve Context):

- Feature development workflow
- Multi-step debugging
- Context-dependent updates

### 4. **Token Usage Monitoring**

Track actual usage to refine recommendations:

```json
{
  "metrics": {
    "command": "/git/commit",
    "model": "sonnet",
    "tokens_used": 1250,
    "success_rate": 0.98,
    "fallback_to_opus": 0.02
  }
}
```

---

## Expected Token Savings

### Current State (All Opus)

- Average command: ~5,000 tokens
- 100 commands/day = 500,000 tokens

### Optimized State

- Haiku commands (30%): ~1,000 tokens avg = 30,000 tokens
- Sonnet commands (45%): ~2,500 tokens avg = 112,500 tokens  
- Opus commands (25%): ~5,000 tokens avg = 125,000 tokens
- **Total: 267,500 tokens (46.5% reduction)**

### Cost Impact

- Haiku: 80% cheaper than Opus
- Sonnet: 50% cheaper than Opus
- **Estimated cost reduction: 40-60%**

---

## Risk Mitigation

### Fallback Strategy

```typescript
async function executeWithFallback(command, initialModel) {
  try {
    return await execute(command, initialModel);
  } catch (error) {
    if (error.type === 'INSUFFICIENT_CAPABILITY') {
      // Upgrade model and retry
      const upgraded = upgradeModel(initialModel);
      return await execute(command, upgraded);
    }
    throw error;
  }
}
```

### Quality Thresholds

- Monitor success rates per model
- Automatic promotion if success < 90%
- User feedback integration

---

## Next Steps

1. **Phase 1** (Week 1)
   - Implement model mapping configuration
   - Start with low-risk Haiku commands (git, checkpoints)
   - Monitor success rates

2. **Phase 2** (Week 2)
   - Expand to Sonnet commands
   - Implement fallback mechanism
   - Gather performance metrics

3. **Phase 3** (Week 3)
   - Full rollout with all commands
   - Optimize based on metrics
   - Document learnings

---

## Appendix: Complete Agent Inventory

### Total Agents: 37

**Categories:**

- Build Tools (2): webpack, vite
- Code Quality (1): linting
- Database (3): postgres, mongodb, general
- DevOps (1): general devops
- Documentation (1): documentation
- E2E Testing (1): playwright
- Framework (1): nextjs
- Frontend (2): accessibility, css
- Git (1): git operations
- Infrastructure (2): docker, github-actions
- Node.js (1): nodejs runtime
- React (2): general, performance
- Refactoring (1): code refactoring
- Testing (3): jest, vitest, general
- TypeScript (3): general, types, build
- Specialized (12): Various complex agents

---

*Note: This analysis is based on command/agent complexity assessment. Actual token usage may vary based on specific task requirements.*
