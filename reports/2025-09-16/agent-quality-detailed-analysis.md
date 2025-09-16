# Detailed Agent Quality Analysis
Generated: 2025-09-16

## Agent-by-Agent Analysis

### cicd-orchestrator
**Score**: 89.0/100 | **Grade**: B | **Path**: ./.claude/agents/cicd/cicd-orchestrator.md

#### Scoring Breakdown
- Structure & Format: 20/20
- Best Practices: 30/30
- MCP Integration: 7/15
- Orchestration: 12/15
- Content Quality: 20/20

#### Issues Identified
- Should integrate MCP servers for this domain
- Complex agent should delegate to specialists

#### Recommendations
- Add relevant MCP server integration (context7, perplexity, etc.)

#### Frontmatter Configuration
```yaml
name: cicd-orchestrator
description: Investigates CI/CD pipeline failures and automatically creates GitHub issues for tracking. Orchestrates the entire workflow from identifying relevant documentation, investigating the failure, to logging the issue.
category: cicd
displayName: CI/CD Orchestrator
model: opus
color: blue
tools: *
```

---

### typescript-expert
**Score**: 90.0/100 | **Grade**: A | **Path**: ./.claude/agents/typescript/typescript-expert.md

#### Scoring Breakdown
- Structure & Format: 20/20
- Best Practices: 23/30
- MCP Integration: 15/15
- Orchestration: 12/15
- Content Quality: 20/20

#### Issues Identified
- Missing success/completion criteria
- Missing stopping/completion criteria
- Complex agent should delegate to specialists

#### Recommendations
- Add model: sonnet based on complexity

#### Frontmatter Configuration
```yaml
name: typescript-expert
description: TypeScript and JavaScript expert with deep knowledge of type-level programming, performance optimization, monorepo management, migration strategies, and modern tooling. Use PROACTIVELY for any TypeScript/JavaScript issues including complex type gymnastics, build performance, debugging, and architectural decisions. If a specialized expert is a better fit, I will recommend switching and stop.
category: framework
bundle: []
displayName: TypeScript
color: blue
tools: *
```

---

### clarification-loop-engine
**Score**: 93.0/100 | **Grade**: A | **Path**: ./.claude/agents/commands/clarification-loop-engine.md

#### Scoring Breakdown
- Structure & Format: 20/20
- Best Practices: 30/30
- MCP Integration: 15/15
- Orchestration: 12/15
- Content Quality: 16/20

#### Issues Identified
- Complex agent should delegate to specialists
- Missing error handling documentation

#### Recommendations
- Agent is well-structured, maintain current quality

#### Frontmatter Configuration
```yaml
name: clarification-loop-engine
description: Interactive requirements clarification specialist ensuring complete understanding through iterative Q&A cycles
category: commands
displayName: Clarification Loop Engine
tools: Read, Grep, Glob
model: sonnet
color: cyan
```

---

### nodejs-expert
**Score**: 93.0/100 | **Grade**: A | **Path**: ./.claude/agents/nodejs/nodejs-expert.md

#### Scoring Breakdown
- Structure & Format: 20/20
- Best Practices: 26/30
- MCP Integration: 15/15
- Orchestration: 15/15
- Content Quality: 17/20

#### Issues Identified
- Missing ReAct pattern or execution protocol
- Too verbose - needs condensing

#### Recommendations
- Add ReAct cycle or structured execution protocol
- Add model: sonnet based on complexity

#### Frontmatter Configuration
```yaml
name: nodejs-expert
description: Node.js runtime and ecosystem expert with deep knowledge of async patterns, module systems, performance optimization, filesystem operations, process management, and networking. Use PROACTIVELY for any Node.js runtime issues including event loop debugging, memory leaks, promise handling, module resolution, stream processing, and HTTP server configuration.
tools: Read, Write, Edit, Bash, Grep, Glob
category: framework
color: green
displayName: Node.js Expert
```

---

### docs-mcp-expert
**Score**: 93.0/100 | **Grade**: A | **Path**: ./.claude/agents/research/docs-mcp-expert.md

#### Scoring Breakdown
- Structure & Format: 20/20
- Best Practices: 30/30
- MCP Integration: 15/15
- Orchestration: 8/15
- Content Quality: 20/20

#### Issues Identified
- Should implement parallel execution patterns
- Should reference custom project agents like code-search-expert

#### Recommendations
- Add parallel search/execution patterns for better performance
- Add model: sonnet based on complexity

#### Frontmatter Configuration
```yaml
name: docs-mcp-expert
description: Execute documentation operations through docs-mcp server for search, indexing, version resolution, and content extraction. Use PROACTIVELY for any documentation queries, library research, or when users need API/framework documentation.
tools: mcp__docs-mcp__search_docs, mcp__docs-mcp__scrape_docs, mcp__docs-mcp__list_libraries, mcp__docs-mcp__find_version, mcp__docs-mcp__list_jobs, mcp__docs-mcp__get_job_info, mcp__docs-mcp__cancel_job, mcp__docs-mcp__remove_docs, mcp__docs-mcp__fetch_url, Read, Grep, Glob
category: research
displayName: Documentation MCP Expert
color: purple
```

---

### perplexity-search-expert
**Score**: 93.0/100 | **Grade**: A | **Path**: ./.claude/agents/research/perplexity-search-expert.md

#### Scoring Breakdown
- Structure & Format: 20/20
- Best Practices: 30/30
- MCP Integration: 15/15
- Orchestration: 8/15
- Content Quality: 20/20

#### Issues Identified
- Complex agent should delegate to specialists
- Should implement parallel execution patterns

#### Recommendations
- Add parallel search/execution patterns for better performance
- Add model: opus based on complexity

#### Frontmatter Configuration
```yaml
name: perplexity-search-expert
description: Execute advanced web searches using Perplexity API for real-time information gathering, research synthesis, and fact verification. Use PROACTIVELY for current events, technical research, comparative analysis, or when web search is needed.
tools: mcp__perplexity-ask__perplexity_ask, Read, Grep, Glob
category: research
displayName: Perplexity Search Expert
color: blue
```

---

### test-suite-architect
**Score**: 93.0/100 | **Grade**: A | **Path**: ./.claude/agents/testing/test-suite-architect.md

#### Scoring Breakdown
- Structure & Format: 20/20
- Best Practices: 30/30
- MCP Integration: 15/15
- Orchestration: 12/15
- Content Quality: 16/20

#### Issues Identified
- Complex agent should delegate to specialists
- Missing concrete examples

#### Recommendations
- Agent is well-structured, maintain current quality

#### Frontmatter Configuration
```yaml
name: test-suite-architect
description: Analyzes code and creates comprehensive test coverage, including unit tests and end-to-end tests. Invoked after implementing new features, fixing bugs, or when improving test coverage for existing code. Identifies testing gaps, proposes test strategies, and writes actual test implementations following project conventions.
category: testing
displayName: Test Suite Architect
model: sonnet
color: pink
tools: *
```

---

### cicd-investigator
**Score**: 94.0/100 | **Grade**: A | **Path**: ./.claude/agents/cicd/cicd-investigator.md

#### Scoring Breakdown
- Structure & Format: 20/20
- Best Practices: 27/30
- MCP Integration: 15/15
- Orchestration: 12/15
- Content Quality: 20/20

#### Issues Identified
- Missing stopping/completion criteria
- Complex agent should delegate to specialists

#### Recommendations
- Agent is well-structured, maintain current quality

#### Frontmatter Configuration
```yaml
name: cicd-investigator
description: Investigates CI/CD pipeline failures on GitHub. Specializes in diagnosing code-related issues that cause pipeline failures by analyzing context documents and GitHub workflow runs.
category: cicd
displayName: CI/CD Investigator
model: opus
color: pink
tools: *
```

---

### code-review-expert
**Score**: 94.0/100 | **Grade**: A | **Path**: ./.claude/agents/code-quality/code-review-expert.md

#### Scoring Breakdown
- Structure & Format: 20/20
- Best Practices: 24/30
- MCP Integration: 15/15
- Orchestration: 15/15
- Content Quality: 20/20

#### Issues Identified
- Too many advisory phrases compared to action verbs
- Missing stopping/completion criteria

#### Recommendations
- Agent is well-structured, maintain current quality

#### Frontmatter Configuration
```yaml
name: code-review-expert
description: Comprehensive code review specialist covering 6 focused aspects - architecture & design, code quality, security & dependencies, performance & scalability, testing coverage, and documentation & API design. Provides deep analysis with actionable feedback. Use PROACTIVELY after significant code changes.
tools: Read, Grep, Glob, Bash
displayName: Code Review Expert
category: general
color: blue
model: opus
```

---

### prompt-construction-expert
**Score**: 94.0/100 | **Grade**: A | **Path**: ./.claude/agents/commands/prompt-construction-expert.md

#### Scoring Breakdown
- Structure & Format: 20/20
- Best Practices: 30/30
- MCP Integration: 15/15
- Orchestration: 12/15
- Content Quality: 17/20

#### Issues Identified
- Complex agent should delegate to specialists
- Too verbose - needs condensing

#### Recommendations
- Agent is well-structured, maintain current quality

#### Frontmatter Configuration
```yaml
name: prompt-construction-expert
description: Specialized agent for designing high-quality AI prompts using systematic reasoning and iterative refinement
category: commands
displayName: Prompt Construction Expert
tools: Read, Grep, Glob
model: sonnet
color: purple
```

---

### database-mongodb-expert
**Score**: 94.0/100 | **Grade**: A | **Path**: ./.claude/agents/database/database-mongodb-expert.md

#### Scoring Breakdown
- Structure & Format: 20/20
- Best Practices: 30/30
- MCP Integration: 15/15
- Orchestration: 12/15
- Content Quality: 17/20

#### Issues Identified
- Complex agent should delegate to specialists
- Too verbose - needs condensing

#### Recommendations
- Add model: sonnet based on complexity

#### Frontmatter Configuration
```yaml
name: mongodb-expert
description: Use PROACTIVELY for MongoDB-specific issues including document modeling, aggregation pipeline optimization, sharding strategies, replica set configuration, connection pool management, indexing strategies, and NoSQL performance patterns
category: database
tools: Bash(mongosh:*), Bash(mongo:*), Read, Grep, Edit
color: yellow
displayName: MongoDB Expert
```

---

### database-postgres-expert
**Score**: 94.0/100 | **Grade**: A | **Path**: ./.claude/agents/database/database-postgres-expert.md

#### Scoring Breakdown
- Structure & Format: 20/20
- Best Practices: 30/30
- MCP Integration: 15/15
- Orchestration: 12/15
- Content Quality: 17/20

#### Issues Identified
- Complex agent should delegate to specialists
- Too verbose - needs condensing

#### Recommendations
- Add model: opus based on complexity

#### Frontmatter Configuration
```yaml
name: postgres-expert
description: Use PROACTIVELY for PostgreSQL query optimization, JSONB operations, advanced indexing strategies, partitioning, connection management, and database administration with deep PostgreSQL-specific expertise
category: database
tools: Bash(psql:*), Bash(pg_dump:*), Bash(pg_restore:*), Bash(pg_basebackup:*), Read, Grep, Edit
color: cyan
displayName: PostgreSQL Expert
```

---

### log-issue
**Score**: 94.0/100 | **Grade**: A | **Path**: ./.claude/agents/dev/log-issue.md

#### Scoring Breakdown
- Structure & Format: 17/20
- Best Practices: 30/30
- MCP Integration: 15/15
- Orchestration: 12/15
- Content Quality: 20/20

#### Issues Identified
- Model mismatch: opus model doesn't match medium complexity
- Should reference custom project agents like code-search-expert

#### Recommendations
- Agent is well-structured, maintain current quality

#### Frontmatter Configuration
```yaml
name: log-issue
description: Logs issues, bugs, or problems to a tracking system or repository. Invoked after encountering an error, identifying a bug, or when a user reports a problem that needs to be tracked.
category: dev
displayName: Issue Logger
model: opus
color: cyan
tools: *
```

---

### e2e-playwright-expert
**Score**: 94.0/100 | **Grade**: A | **Path**: ./.claude/agents/e2e/e2e-playwright-expert.md

#### Scoring Breakdown
- Structure & Format: 20/20
- Best Practices: 30/30
- MCP Integration: 15/15
- Orchestration: 12/15
- Content Quality: 17/20

#### Issues Identified
- Complex agent should delegate to specialists
- Too verbose - needs condensing

#### Recommendations
- Add model: sonnet based on complexity

#### Frontmatter Configuration
```yaml
name: playwright-expert
description: Expert in Playwright end-to-end testing, cross-browser automation, visual regression testing, and CI/CD integration
category: testing
tools: Bash, Read, Write, Edit, MultiEdit, Grep, Glob
color: blue
displayName: Playwright Expert
```

---

### ai-sdk-expert
**Score**: 94.0/100 | **Grade**: A | **Path**: ./.claude/agents/framework/ai-sdk-expert.md

#### Scoring Breakdown
- Structure & Format: 20/20
- Best Practices: 30/30
- MCP Integration: 15/15
- Orchestration: 12/15
- Content Quality: 17/20

#### Issues Identified
- Should reference custom project agents like code-search-expert
- Too verbose - needs condensing

#### Recommendations
- Add model: opus based on complexity

#### Frontmatter Configuration
```yaml
name: ai-sdk-expert
description: Expert in Vercel AI SDK v5 handling streaming, model integration, tool calling, hooks, state management, edge runtime, prompt engineering, and production patterns. Use PROACTIVELY for any AI SDK implementation, streaming issues, provider integration, or AI application architecture. Detects project setup and adapts approach.
category: framework
displayName: AI SDK by Vercel (v5)
color: blue
tools: *
```

---

### git-expert
**Score**: 94.0/100 | **Grade**: A | **Path**: ./.claude/agents/git/git-expert.md

#### Scoring Breakdown
- Structure & Format: 20/20
- Best Practices: 30/30
- MCP Integration: 15/15
- Orchestration: 12/15
- Content Quality: 17/20

#### Issues Identified
- Should reference custom project agents like code-search-expert
- Too verbose - needs condensing

#### Recommendations
- Add model: sonnet based on complexity

#### Frontmatter Configuration
```yaml
name: git-expert
description: Git expert with deep knowledge of merge conflicts, branching strategies, repository recovery, performance optimization, and security patterns. Use PROACTIVELY for any Git workflow issues including complex merge conflicts, history rewriting, collaboration patterns, and repository management. If a specialized expert is a better fit, I will recommend switching and stop.
category: general
color: orange
displayName: Git Expert
tools: *
```

---

### code-search-expert
**Score**: 97.0/100 | **Grade**: A | **Path**: ./.claude/agents/code-quality/code-search-expert.md

#### Scoring Breakdown
- Structure & Format: 20/20
- Best Practices: 30/30
- MCP Integration: 15/15
- Orchestration: 12/15
- Content Quality: 20/20

#### Issues Identified
- Should reference custom project agents like code-search-expert

#### Recommendations
- Agent is well-structured, maintain current quality

#### Frontmatter Configuration
```yaml
name: code-search-expert
description: Execute advanced file and code discovery using ripgrep, ast-grep, and semantic analysis to find hard-to-locate files, patterns, and dependencies. Use PROACTIVELY for complex searches, missing files, dependency analysis, or when basic search fails.
tools: Read, Grep, Glob, Bash
model: haiku
category: code-quality
displayName: Code Search Expert
color: orange
```

---

### code-search
**Score**: 97.0/100 | **Grade**: A | **Path**: ./.claude/agents/code-quality/code-search.md

#### Scoring Breakdown
- Structure & Format: 20/20
- Best Practices: 30/30
- MCP Integration: 15/15
- Orchestration: 12/15
- Content Quality: 20/20

#### Issues Identified
- Should reference custom project agents like code-search-expert

#### Recommendations
- Agent is well-structured, maintain current quality

#### Frontmatter Configuration
```yaml
name: code-search
description: A specialized agent for searching through codebases to find relevant files. Use PROACTIVELY when searching for specific files, functions, or patterns. Returns focused file lists, not comprehensive answers.
tools: Read, Grep, Glob, LS
model: sonnet
color: purple
category: tools
displayName: Code Search
disableHooks: [typecheck-project, lint-project, test-project, self-review]
```

---

### database-expert
**Score**: 97.0/100 | **Grade**: A | **Path**: ./.claude/agents/database/database-expert.md

#### Scoring Breakdown
- Structure & Format: 20/20
- Best Practices: 30/30
- MCP Integration: 15/15
- Orchestration: 12/15
- Content Quality: 20/20

#### Issues Identified
- Complex agent should delegate to specialists

#### Recommendations
- Add model: opus based on complexity

#### Frontmatter Configuration
```yaml
name: database-expert
description: Use PROACTIVELY for database performance optimization, schema design issues, query performance problems, connection management, and transaction handling across PostgreSQL, MySQL, MongoDB, and SQLite with ORM integration
category: database
tools: Bash(psql:*), Bash(mysql:*), Bash(mongosh:*), Bash(sqlite3:*), Read, Grep, Edit
color: purple
displayName: Database Expert
```

---

### devops-expert
**Score**: 97.0/100 | **Grade**: A | **Path**: ./.claude/agents/devops/devops-expert.md

#### Scoring Breakdown
- Structure & Format: 20/20
- Best Practices: 30/30
- MCP Integration: 15/15
- Orchestration: 15/15
- Content Quality: 17/20

#### Issues Identified
- Too verbose - needs condensing

#### Recommendations
- Add model: sonnet based on complexity

#### Frontmatter Configuration
```yaml
name: devops-expert
description: DevOps and Infrastructure expert with comprehensive knowledge of CI/CD pipelines, containerization, orchestration, infrastructure as code, monitoring, security, and performance optimization. Use PROACTIVELY for any DevOps, deployment, infrastructure, or operational issues. If a specialized expert is a better fit, I will recommend switching and stop.
category: devops
color: red
displayName: DevOps Expert
tools: *
```

---

### documentation-expert
**Score**: 97.0/100 | **Grade**: A | **Path**: ./.claude/agents/documentation/documentation-expert.md

#### Scoring Breakdown
- Structure & Format: 20/20
- Best Practices: 30/30
- MCP Integration: 15/15
- Orchestration: 15/15
- Content Quality: 17/20

#### Issues Identified
- Too verbose - needs condensing

#### Recommendations
- Add model: opus based on complexity

#### Frontmatter Configuration
```yaml
name: documentation-expert
description: Expert in documentation structure, cohesion, flow, audience targeting, and information architecture. Use PROACTIVELY for documentation quality issues, content organization, duplication, navigation problems, or readability concerns. Detects documentation anti-patterns and optimizes for user experience.
tools: Read, Grep, Glob, Bash, Edit, MultiEdit
category: tools
color: purple
displayName: Documentation Expert
```

---

### frontend-accessibility-expert
**Score**: 97.0/100 | **Grade**: A | **Path**: ./.claude/agents/frontend/frontend-accessibility-expert.md

#### Scoring Breakdown
- Structure & Format: 20/20
- Best Practices: 30/30
- MCP Integration: 15/15
- Orchestration: 12/15
- Content Quality: 20/20

#### Issues Identified
- Complex agent should delegate to specialists

#### Recommendations
- Add model: sonnet based on complexity

#### Frontmatter Configuration
```yaml
name: accessibility-expert
description: WCAG 2.1/2.2 compliance, WAI-ARIA implementation, screen reader optimization, keyboard navigation, and accessibility testing expert. Use PROACTIVELY for accessibility violations, ARIA errors, keyboard navigation issues, screen reader compatibility problems, or accessibility testing automation needs.
tools: Read, Grep, Glob, Bash, Edit, MultiEdit, Write
category: frontend
color: yellow
displayName: Accessibility Expert
```

---

### frontend-css-styling-expert
**Score**: 97.0/100 | **Grade**: A | **Path**: ./.claude/agents/frontend/frontend-css-styling-expert.md

#### Scoring Breakdown
- Structure & Format: 20/20
- Best Practices: 30/30
- MCP Integration: 15/15
- Orchestration: 12/15
- Content Quality: 20/20

#### Issues Identified
- Should reference custom project agents like code-search-expert

#### Recommendations
- Add model: sonnet based on complexity

#### Frontmatter Configuration
```yaml
name: css-styling-expert
description: CSS architecture and styling expert with deep knowledge of modern CSS features, responsive design, CSS-in-JS optimization, performance, accessibility, and design systems. Use PROACTIVELY for CSS layout issues, styling architecture, responsive design problems, CSS-in-JS performance, theme implementation, cross-browser compatibility, and design system development. If a specialized expert is better fit, I will recommend switching and stop.
tools: Read, Edit, MultiEdit, Grep, Glob, Bash, LS
category: frontend
color: pink
displayName: CSS Styling Expert
```

---

### react-expert
**Score**: 97.0/100 | **Grade**: A | **Path**: ./.claude/agents/react/react-expert.md

#### Scoring Breakdown
- Structure & Format: 20/20
- Best Practices: 30/30
- MCP Integration: 15/15
- Orchestration: 12/15
- Content Quality: 20/20

#### Issues Identified
- Complex agent should delegate to specialists

#### Recommendations
- Add model: sonnet based on complexity

#### Frontmatter Configuration
```yaml
name: react-expert
description: React component patterns, hooks, and performance expert. Use PROACTIVELY for React component issues, hook errors, re-rendering problems, or state management challenges.
tools: Read, Grep, Glob, Bash, Edit, MultiEdit, Write
category: framework
color: cyan
bundle: []
displayName: React Expert
```

---

### context7-expert
**Score**: 97.0/100 | **Grade**: A | **Path**: ./.claude/agents/research/context7-expert.md

#### Scoring Breakdown
- Structure & Format: 20/20
- Best Practices: 30/30
- MCP Integration: 15/15
- Orchestration: 12/15
- Content Quality: 20/20

#### Issues Identified
- Should reference custom project agents like code-search-expert

#### Recommendations
- Add model: opus based on complexity

#### Frontmatter Configuration
```yaml
name: context7-expert
description: Execute documentation retrieval and analysis using Context7 MCP server for comprehensive library research. Use PROACTIVELY for documentation lookup, API reference queries, version comparisons, or best practices extraction.
tools: mcp__context7__resolve-library-id, mcp__context7__get-library-docs, Read, Grep, Glob
category: research
displayName: Context7 Documentation Expert
color: green
```

---

### research-agent
**Score**: 97.0/100 | **Grade**: A | **Path**: ./.claude/agents/research/research-agent.md

#### Scoring Breakdown
- Structure & Format: 20/20
- Best Practices: 30/30
- MCP Integration: 15/15
- Orchestration: 12/15
- Content Quality: 20/20

#### Issues Identified
- Should reference custom project agents like code-search-expert

#### Recommendations
- Agent is well-structured, maintain current quality

#### Frontmatter Configuration
```yaml
name: research-agent
description: Orchestrates specialized research agents to conduct comprehensive investigations across multiple sources. Coordinates context7-expert, docs-mcp-expert, and perplexity-search-expert in parallel for optimal research performance.
tools: Task, Bash, Glob, Grep, LS, Read, Edit, MultiEdit, Write, NotebookEdit, WebFetch, TodoWrite, WebSearch, BashOutput, KillBash, mcp__exa__exa_search
category: research
displayName: Research Orchestrator
model: sonnet
color: red
```

---

### test-analysis-agent
**Score**: 97.0/100 | **Grade**: A | **Path**: ./.claude/agents/testing/test-analysis-agent.md

#### Scoring Breakdown
- Structure & Format: 20/20
- Best Practices: 30/30
- MCP Integration: 15/15
- Orchestration: 12/15
- Content Quality: 20/20

#### Issues Identified
- Complex agent should delegate to specialists

#### Recommendations
- Agent is well-structured, maintain current quality

#### Frontmatter Configuration
```yaml
name: test-analysis-agent
description: Analyzes code paths and verifies test quality using multi-stage reasoning
category: testing
displayName: Test Analysis Agent
tools: Read, Grep, Glob, Bash
model: sonnet
color: green
```

---

### vitest-testing-expert
**Score**: 97.0/100 | **Grade**: A | **Path**: ./.claude/agents/testing/vitest-testing-expert.md

#### Scoring Breakdown
- Structure & Format: 20/20
- Best Practices: 27/30
- MCP Integration: 15/15
- Orchestration: 15/15
- Content Quality: 20/20

#### Issues Identified
- Missing stopping/completion criteria

#### Recommendations
- Add model: sonnet based on complexity

#### Frontmatter Configuration
```yaml
name: vitest-testing-expert
description: Vitest testing framework expert for Vite integration, Jest migration, browser mode testing, and performance optimization
category: testing
color: cyan
displayName: Vitest Testing Expert
tools: *
```

---

### triage-expert
**Score**: 97.0/100 | **Grade**: A | **Path**: ./.claude/agents/triage/triage-expert.md

#### Scoring Breakdown
- Structure & Format: 20/20
- Best Practices: 30/30
- MCP Integration: 15/15
- Orchestration: 12/15
- Content Quality: 20/20

#### Issues Identified
- Should reference custom project agents like code-search-expert

#### Recommendations
- Add model: sonnet based on complexity

#### Frontmatter Configuration
```yaml
name: triage-expert
description: Context gathering and initial problem diagnosis specialist. Use PROACTIVELY when encountering errors, performance issues, or unexpected behavior before engaging specialized experts.
tools: Read, Grep, Glob, Bash, Edit
category: general
displayName: Triage Expert
color: orange
disableHooks: [typecheck-project, lint-project, test-project, self-review]
```

---

### framework-nextjs-expert
**Score**: 100.0/100 | **Grade**: A | **Path**: ./.claude/agents/framework/framework-nextjs-expert.md

#### Scoring Breakdown
- Structure & Format: 20/20
- Best Practices: 30/30
- MCP Integration: 15/15
- Orchestration: 15/15
- Content Quality: 20/20

#### Issues Identified
- No critical issues found

#### Recommendations
- Add model: sonnet based on complexity

#### Frontmatter Configuration
```yaml
name: nextjs-expert
description: Next.js framework expert specializing in App Router, Server Components, performance optimization, and full-stack patterns. Use PROACTIVELY for Next.js routing issues, hydration errors, build problems, or deployment challenges.
tools: Read, Grep, Glob, Bash, Edit, MultiEdit, Write
category: framework
color: purple
displayName: Next.js Expert
```

---

### infrastructure-docker-expert
**Score**: 100.0/100 | **Grade**: A | **Path**: ./.claude/agents/infrastructure/infrastructure-docker-expert.md

#### Scoring Breakdown
- Structure & Format: 20/20
- Best Practices: 30/30
- MCP Integration: 15/15
- Orchestration: 15/15
- Content Quality: 20/20

#### Issues Identified
- No critical issues found

#### Recommendations
- Add model: sonnet based on complexity

#### Frontmatter Configuration
```yaml
name: docker-expert
description: Docker containerization expert with deep knowledge of multi-stage builds, image optimization, container security, Docker Compose orchestration, and production deployment patterns. Use PROACTIVELY for Dockerfile optimization, container issues, image size problems, security hardening, networking, and orchestration challenges.
category: devops
color: blue
displayName: Docker Expert
tools: *
```

---

### refactoring-expert
**Score**: 100.0/100 | **Grade**: A | **Path**: ./.claude/agents/refactoring/refactoring-expert.md

#### Scoring Breakdown
- Structure & Format: 20/20
- Best Practices: 30/30
- MCP Integration: 15/15
- Orchestration: 15/15
- Content Quality: 20/20

#### Issues Identified
- No critical issues found

#### Recommendations
- Add model: sonnet based on complexity

#### Frontmatter Configuration
```yaml
name: refactoring-expert
description: Expert in systematic code refactoring, code smell detection, and structural optimization. Use PROACTIVELY when encountering duplicated code, long methods, complex conditionals, or any code quality issues. Detects code smells and applies proven refactoring techniques without changing external behavior.
tools: Read, Grep, Glob, Edit, MultiEdit, Bash
category: general
displayName: Refactoring Expert
color: purple
```

---

