# Agent Source Attribution Summary

Generated: 2025-09-16

## Key Findings

### Source Distribution (42 Total Agents)

| Source | Count | Percentage | Status |
|--------|-------|------------|--------|
| **claudekit** | 32 | 76% | All exact matches (unmodified) |
| **custom** | 9 | 21% | Unique to this project |
| **anthropic** | 1 | 3% | test-suite-architect |

### Custom Agents (Unique to This Project)

1. **clarification-loop-engine** - Requirements clarification
2. **code-search** - File and code discovery
3. **code-search-expert** - Advanced search capabilities
4. **oracle** - General-purpose agent
5. **prompt-construction-expert** - AI prompt design
6. **refactoring-expert** - Code refactoring
7. **research-agent** - In-depth research
8. **triage-expert** - Problem diagnosis
9. **cicd-orchestrator** - CI/CD pipeline orchestration

### Quality Distribution

- **Excellent**: 5 agents (12%)
- **Good**: 13 agents (31%)
- **Needs Improvement**: 22 agents (52%)
- **Untested**: 2 agents (5%)

### Overlapping Agents (4 Groups)

1. **TypeScript Group**: typescript-expert, typescript-type-expert, typescript-build-expert
2. **Testing Group**: jest-testing-expert, vitest-testing-expert, testing-expert
3. **React Group**: react-expert, react-performance-expert
4. **CI/CD Group**: cicd-investigator, cicd-orchestrator, github-actions-expert

## Source Verification Method

The script (`create-agent-inventory.cjs`) performs the following checks:

1. **Dynamic claudekit detection**: Searches the cloned claudekit repository
2. **Content comparison**: Exact byte-for-byte comparison to detect modifications
3. **Known source mapping**: Maintains list of known anthropic agents
4. **Fallback to custom**: Agents not found in other sources marked as custom

## Recommendations

### Immediate Actions
1. **Consolidate overlapping agents** - Reduce from 42 to ~35 agents
2. **Focus on custom agents** - These 9 agents represent unique value
3. **Update modified agents** - All claudekit agents are unmodified (consider updating from upstream)

### Quality Improvements Needed
- 22 agents (52%) marked as "needs-improvement"
- Focus on adding examples, tests, and step-by-step instructions
- Prioritize frequently-used agents for improvements

### Maintenance Strategy
1. **Track upstream changes** - Monitor claudekit repository for updates
2. **Document custom agents** - Add comprehensive documentation for the 9 unique agents
3. **Regular quality audits** - Use the inventory for quarterly reviews

## Script Location
- **Inventory Generator**: `.claude/scripts/create-agent-inventory.cjs`
- **Output**: `.claude/data/agents-inventory.json`
- **claudekit Source**: `/home/msmith/projects/claudekit/` (cloned locally)

## Next Steps
1. Review the 9 custom agents for documentation completeness
2. Consider contributing valuable custom agents back to claudekit
3. Implement automated quality checks in CI/CD pipeline
4. Set up periodic sync with claudekit repository for updates