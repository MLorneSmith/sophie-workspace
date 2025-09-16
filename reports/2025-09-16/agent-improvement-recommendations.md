# Agent Quality Improvement Recommendations
Generated: 2025-09-16

## Priority Matrix

### 🔴 Critical Priority (Score < 50)
Agents requiring immediate refactoring:


### 🟡 Important Priority (Score 50-70)
Agents needing significant improvements:


### 🟢 Moderate Priority (Score 70-85)
Agents needing minor improvements:


## Improvement Templates

### Template 1: Action-First Conversion
```markdown
# [Agent Name]

You are a [specific role] that EXECUTES [primary function].

## Execution Protocol
1. **Analyze**: [Current state assessment]
2. **Execute**: [Primary action with tools]
3. **Verify**: [Result validation]
4. **Complete**: [Success criteria met]

## Success Criteria
- [Measurable outcome 1]
- [Measurable outcome 2]
```

### Template 2: MCP Server Integration
```yaml
tools: [...existing, mcp__context7__get-library-docs, mcp__exa__exa_search, mcp__perplexity-ask__perplexity_ask]
```

### Template 3: Parallel Execution Pattern
```markdown
## Parallel Search Strategy
Execute multiple searches simultaneously:
- Search 1: Pattern matching with ripgrep
- Search 2: AST analysis with ast-grep
- Search 3: Metadata extraction
All executed in ONE tool invocation batch for 3-5x performance gain.
```

## Implementation Roadmap

### Week 1: Quick Wins
1. **Add missing tool definitions** (0 agents)
2. **Add missing examples** (1 agents)
3. **Fix model selections** (1 agents)
4. **Add success criteria** (1 agents)

### Week 2: Structural Improvements
1. **Convert to action-first patterns** (0 agents)
2. **Add ReAct/execution protocols** (1 agents)
3. **Implement error handling** (1 agents)
4. **Specify output formats** (0 agents)

### Week 3: Advanced Enhancements
1. **Integrate MCP servers** (1 agents)
2. **Add parallel execution** (2 agents)
3. **Implement delegation patterns** (14 agents)
4. **Reference custom project agents** (10 agents)

## Success Metrics

### Before Improvements
- Average Score: 95.3/100
- Grade A Agents: 31
- Grade F Agents: 0

### Target After Improvements
- Average Score: >75/100
- Grade A Agents: >10
- Grade F Agents: 0

## Agent Consolidation Opportunities

Based on the analysis, these agents have significant overlap and could be merged:

- **cicd-investigator + cicd-orchestrator**: Both handle CI/CD failures, could be unified
- **jest-testing-expert + vitest-testing-expert + testing-expert**: Significant testing framework overlap
- **typescript-expert + typescript-type-expert + typescript-build-expert**: Could be consolidated into comprehensive TypeScript expert
