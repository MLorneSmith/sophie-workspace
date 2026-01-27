# Perplexity Research: Claude Code Slash Commands for Code Quality Audits

**Date**: 2026-01-27
**Agent**: perplexity-expert
**Search Type**: Chat API + Search API (combined research)

## Query Summary

Researched best-in-class examples of Claude Code slash commands (custom commands/skills) that conduct code quality audits, with focus on:
- Security vulnerability detection
- Static analysis integration
- Code smell detection
- Complexity analysis
- Best practices validation
- Multi-file analysis patterns

Timeframe focus: September 2025 - January 2026

---

## Key Findings

### 1. Official Anthropic /security-review Command

**Source**: [Anthropic Blog - Automate Security Reviews](https://www.anthropic.com/news/automate-security-reviews-with-claude-code) (August 2025)

Anthropic released an official `/security-review` slash command built into Claude Code that provides:

**Capabilities**:
- SQL injection risk detection
- Cross-site scripting (XSS) vulnerability identification
- Authentication and authorization flaw detection
- Insecure data handling identification
- Dependency vulnerability scanning
- Hardcoded credentials detection (with contextual false-positive filtering)

**Key Features**:
- Pre-commit security analysis workflow
- Detailed severity ratings with line-specific references
- Automatic remediation suggestions
- Can be customized by copying `security-review.md` to `.claude/commands/`

**GitHub Action Integration**: [anthropics/claude-code-security-review](https://github.com/anthropics/claude-code-security-review)
- 2.6k stars, actively maintained
- Triggers automatically on pull requests
- False positive filtering with customizable instructions
- Supports custom security scan instructions

---

### 2. wshobson/commands Repository (57 Production-Ready Commands)

**Source**: [github.com/wshobson/commands](https://github.com/wshobson/commands)

A comprehensive collection providing **57 slash commands** (15 workflows, 42 tools) organized into `tools/` and `workflows/` directories.

**Security & Audit Commands**:

| Command | Type | Purpose |
|---------|------|---------|
| `/tools:security-scan` | Tool | SAST/DAST analysis, dependency scanning, secret detection |
| `/tools:deps-audit` | Tool | Security vulnerabilities, license compliance, version conflicts |
| `/tools:compliance-check` | Tool | GDPR, regulatory requirements verification |
| `/workflows:security-hardening` | Workflow | Zero-trust architecture implementation |
| `/tools:multi-agent-review` | Tool | Multi-perspective code reviews (architecture, security, quality) |

**Code Quality Commands**:

| Command | Type | Purpose |
|---------|------|---------|
| `/tools:tech-debt` | Tool | Complexity analysis, risk scoring, remediation planning |
| `/tools:refactor-clean` | Tool | Pattern detection, dead code removal, structure optimization |
| `/tools:code-explain` | Tool | AST analysis, complexity metrics, flow diagrams |
| `/workflows:full-review` | Workflow | Multi-perspective analysis (architecture, security, performance, quality) |

**Notable Pattern**: Uses multi-agent orchestration where workflows coordinate multiple specialist agents for comprehensive analysis.

---

### 3. claudekit by carlrannaberg (Real-time Guardrails)

**Source**: [github.com/carlrannaberg/claudekit](https://github.com/carlrannaberg/claudekit)

A toolkit providing smart guardrails and workflow automation with **6 specialized agents analyzing code in parallel**.

**Key Code Quality Features**:

| Feature | Description |
|---------|-------------|
| `/code-review` | 6 specialized agents analyze in parallel with technology-specific expertise |
| TypeScript Guard | Blocks `any` types and type errors as Claude edits |
| `lint-changed` hook | Runs linting validation on changed files (Biome, ESLint) |
| `check-any-changed` hook | Forbids any types in changed TypeScript files |
| `typecheck-changed` hook | Run TypeScript type checking on file changes |
| `test-changed` hook | Runs tests for changed files |

**Unique Approach**: Uses PreToolUse/PostToolUse hooks for real-time validation during editing, not just post-hoc review.

**Installation**:
```bash
npm install -g claudekit
claudekit setup
```

---

### 4. Claude Command Suite by qdhenry (148+ Commands)

**Source**: [github.com/qdhenry/Claude-Command-Suite](https://github.com/qdhenry/Claude-Command-Suite)
- 782 stars, 76 forks

**Security & Audit Commands**:

| Command | Purpose |
|---------|---------|
| `/security:security-audit` | Comprehensive security assessment |
| `/security:dependency-audit` | Audit dependencies for vulnerabilities |
| `/security:security-hardening` | Harden application security configuration |
| `/dev:code-review` | Review entire codebase |

**Architecture**: Namespace-organized commands (`/dev:*`, `/test:*`, `/security:*`, `/deploy:*`) with 54 AI agents.

---

### 5. PaulDuvall/claude-code (58 AI-Powered Commands)

**Source**: [github.com/PaulDuvall/claude-code](https://github.com/PaulDuvall/claude-code)

**Core Security Commands**:

| Command | Purpose |
|---------|---------|
| `/xsecurity` | Comprehensive security scan (vulnerabilities, secrets, security issues) |
| `/xsecurity secrets` | Quick check for exposed credentials |
| `/xquality` | Code quality checks (format, lint, type-check) |
| `/xquality fix` | Auto-fix common quality issues |

**Hybrid Hook Architecture**: Lightweight trigger scripts (30-150 lines) that delegate to AI subagents:
- `pre-write-security.sh` - Security analysis before file changes
- `pre-commit-quality.sh` - Quality checks before git commits
- `on-error-debug.sh` - Automatic debugging assistance

**Claude Code Integration Example**:
```json
{
  "hooks": {
    "PreToolUse": [{
      "matcher": "Edit|Write|MultiEdit",
      "hooks": [{
        "command": "~/.claude/hooks/pre-write-security.sh",
        "blocking": true
      }]
    }]
  }
}
```

---

### 6. buildwithclaude.com Marketplace

**Source**: [buildwithclaude.com](https://www.buildwithclaude.com/command/security-audit)

Community-maintained marketplace for Claude Code plugins, skills, and commands.

**Featured Security Audit Command**:
```
/security_audit
```

**Systematic security audit steps**:
1. Technology stack identification
2. Security tools/configuration review
3. Dependency vulnerability scanning (`npm audit`, `pip check`, `cargo audit`)
4. Authentication mechanism review
5. Input validation and sanitization checks (SQL injection, XSS)
6. Data protection practices
7. Hardcoded secrets scanning
8. Infrastructure security review
9. Security headers and CORS configuration
10. Structured findings with severity levels (Critical, High, Medium, Low)

**Installation**:
```bash
# macOS/Linux
curl -fsSL https://buildwithclaude.com/install/security-audit | bash
```

---

### 7. Official Claude Code Plugins (anthropics/claude-code)

**Source**: [github.com/anthropics/claude-code/plugins](https://github.com/anthropics/claude-code/blob/main/plugins/README.md)

**Code Review Plugin**:
- `/code-review` command with 5 parallel Sonnet agents
- CLAUDE.md compliance checking
- Bug detection
- Historical context analysis
- PR history review
- Confidence-based scoring to filter false positives

**PR Review Toolkit Plugin**:
- `/pr-review-toolkit:review-pr` with aspects: comments, tests, errors, types, code, simplify
- 6 specialized agents: `comment-analyzer`, `pr-test-analyzer`, `silent-failure-hunter`, `type-design-analyzer`, `code-reviewer`, `code-simplifier`

**Security Guidance Plugin**:
- PreToolUse hook monitoring 9 security patterns:
  - Command injection
  - XSS
  - eval usage
  - Dangerous HTML
  - pickle deserialization
  - os.system calls

---

### 8. ruvnet/claude-flow Security Audit Configuration

**Source**: [github.com/ruvnet/claude-flow/wiki/CLAUDE-MD-Security-Audit](https://github.com/ruvnet/claude-flow/wiki/CLAUDE-MD-Security-Audit)

**Advanced Multi-Agent Security Swarm Pattern**:

Demonstrates parallel security assessment using agent swarms:
- Security Auditor Agent (vulnerability scanning, OWASP compliance)
- Penetration Tester Agent (network attacks, application testing)
- Code Analyzer Agent (SAST, DAST, dependency scanning)
- Compliance Officer Agent (regulatory checks, policy validation)
- Threat Hunter Agent (threat modeling, attack simulation)
- Security Monitor Agent (real-time monitoring, incident response)

**Tool Integration**:
```bash
# Parallel vulnerability scanning
nmap -sV -sC -O -A target.com
nikto -h https://target.com
sqlmap -u 'https://target.com/login' --batch
semgrep --config=auto --json -o semgrep_results.json .
bandit -r . -f json -o bandit_results.json
trivy fs --security-checks vuln,config .
```

---

### 9. kenneth1003/claude-code-review (CLI Tool)

**Source**: [github.com/kenneth1003/claude-code-review](https://github.com/kenneth1003/claude-code-review)

Standalone CLI tool for git-based code review using Claude Code.

**Features**:
- Automatic git diff analysis between branches
- Multi-language support
- Standard and detailed review modes
- Structured Markdown reports

**Review Categories**:
- Security vulnerabilities
- Performance bottlenecks
- Logic errors/bugs
- Architecture issues
- Maintainability
- Test coverage
- Documentation quality

**Usage**:
```bash
npx ccr init
npx ccr review feature/user-auth main --detail
```

---

## Key Patterns & Techniques

### 1. Multi-Agent Orchestration
Most sophisticated audit commands use multiple specialized agents analyzing in parallel:
- Architecture agent
- Security agent
- Performance agent
- Quality agent
- Testing agent

### 2. Hook-Based Real-Time Validation
Modern approaches use Claude Code hooks for continuous validation:
- `PreToolUse` - Block dangerous operations before they execute
- `PostToolUse` - Validate changes after file modifications
- `UserPromptSubmit` - Inject context at session start

### 3. Structured Output Formats
Best practices include:
- Severity ratings (Critical/High/Medium/Low)
- Line-specific references
- Remediation suggestions with code examples
- SARIF report format support

### 4. False Positive Filtering
Advanced commands include filtering for:
- Denial of Service concerns (low impact)
- Generic input validation without proven impact
- Test/mock data
- Known safe patterns

### 5. Integration with External Tools
Sophisticated commands integrate with:
- Semgrep (SAST)
- Trivy (container security)
- npm audit / pip-audit / cargo audit
- TruffleHog (secret scanning)
- ESLint / Biome (linting)

---

## Sources & Citations

1. [Anthropic Blog - Automate Security Reviews](https://www.anthropic.com/news/automate-security-reviews-with-claude-code)
2. [anthropics/claude-code-security-review](https://github.com/anthropics/claude-code-security-review) - 2.6k stars
3. [wshobson/commands](https://github.com/wshobson/commands) - 57 production-ready commands
4. [carlrannaberg/claudekit](https://github.com/carlrannaberg/claudekit) - Real-time guardrails
5. [qdhenry/Claude-Command-Suite](https://github.com/qdhenry/Claude-Command-Suite) - 782 stars, 148+ commands
6. [PaulDuvall/claude-code](https://github.com/PaulDuvall/claude-code) - 58 commands with hook architecture
7. [buildwithclaude.com](https://www.buildwithclaude.com/command/security-audit) - Community marketplace
8. [anthropics/claude-code/plugins](https://github.com/anthropics/claude-code/blob/main/plugins/README.md) - Official plugins
9. [ruvnet/claude-flow](https://github.com/ruvnet/claude-flow/wiki/CLAUDE-MD-Security-Audit) - Security swarm patterns
10. [kenneth1003/claude-code-review](https://github.com/kenneth1003/claude-code-review) - CLI review tool
11. [Claude Code Support - Automated Security Reviews](https://support.claude.com/en/articles/11932705-automated-security-reviews-in-claude-code)
12. [YouTube - Claude Code Security Review Demo](https://www.youtube.com/watch?v=HYVZry51CKk) - AI Coding Daily

---

## Key Takeaways

1. **Official `/security-review` is the baseline** - Built-in, well-maintained, integrates with GitHub Actions
2. **wshobson/commands is the most comprehensive** - 57 commands covering security, quality, architecture
3. **claudekit provides real-time protection** - Hook-based validation catches issues during editing
4. **Multi-agent patterns are the state-of-art** - Parallel specialist agents provide comprehensive coverage
5. **buildwithclaude.com is the community hub** - Marketplace for discovering and sharing commands
6. **Hybrid hook architecture is emerging** - Lightweight triggers delegating to AI subagents

---

## Related Searches

- Claude Code plugin development best practices
- MCP (Model Context Protocol) security servers
- Claude Code enterprise security configuration
- Pre-commit hooks for AI-assisted development
- SAST/DAST integration with AI coding assistants
