# Command Quality Improvement Plan

Generated: 2025-09-17

## Current State Summary

- **Total Commands**: 57
- **Average Score**: 76.8/100
- **Target Score**: 85/100
- **Gap to Target**: 8.2 points

## Prioritized Improvement Plan

### 🔴 Phase 1: Critical Fixes (Week 1)

**Goal**: Bring all F-grade commands to at least D-grade

| Command | Current | Target | Required Actions |
|---------|---------|--------|-----------------|
| *No F-grade commands* | - | - | - |

### 🟠 Phase 2: High Priority (Week 2)

**Goal**: Upgrade D-grade commands to C-grade

| Command | Current | Target | Required Actions |
|---------|---------|--------|-----------------|
| /promote-to-staging | 63/D | 70/C | Consider delegating to: typescript-expert, refactoring-expert, testing-expert; Consider MCP servers: context7, newrelic |
| /feature/update | 63/D | 70/C | Restructure command following PRIME sequence: Purpose → Role → Inputs → Method → Expectations; Add PURPOSE phase with clear objectives and success criteria |
| /feature/plan | 64/D | 70/C | Add argument-hint to frontmatter; Consider delegating to: refactoring-expert, testing-expert, react-expert |
| /promote-to-production | 64/D | 70/C | Consider delegating to: refactoring-expert, testing-expert, react-expert; Consider MCP servers: context7, exa |
| /testwriters/test-discovery | 64/D | 70/C | Add allowed-tools to frontmatter; Consider delegating to: testing-expert, nodejs-expert, database-expert |
| /validate-and-fix | 64/D | 70/C | Implement dynamic context loading pattern for adaptability; Add validation checks in expectations phase |
| /agents-md/migration | 65/D | 70/C | Restructure command following PRIME sequence: Purpose → Role → Inputs → Method → Expectations; Implement dynamic context loading pattern for adaptability |
| /log-issue | 66/D | 70/C | Consider delegating to: typescript-expert, testing-expert, nodejs-expert; Consider MCP servers: context7, exa |
| /checkpoint/restore | 67/D | 70/C | Restructure command following PRIME sequence: Purpose → Role → Inputs → Method → Expectations; Implement dynamic context loading pattern for adaptability |
| /testwriters/e2e-test-writer | 67/D | 70/C | Consider delegating to: typescript-expert, testing-expert, nodejs-expert; Consider MCP servers: context7, exa |

### 🟡 Phase 3: Optimization (Week 3-4)

**Goal**: Bring C-grade commands to B-grade

Focus Areas:

1. **PRIME Compliance** - Add missing phases to 1 commands
2. **Action-First Design** - Convert advisory language in 0 commands
3. **Integration** - Add agent delegation to 36 commands
4. **Documentation** - Add examples to 1 commands

### 🟢 Phase 4: Excellence (Month 2)

**Goal**: Achieve 85+ average score

Strategic Improvements:

- **Implement dynamic context loading** (41 commands) - Est. +5 points average
- **Add MCP server integration** (46 commands) - Est. +5 points average
- **Add validation patterns** (26 commands) - Est. +5 points average

## Improvement Tracking Metrics

| Metric | Current | Week 1 Target | Week 2 Target | Month End Target |
|--------|---------|---------------|---------------|------------------|
| Average Score | 76.8 | 81.8 | 86.8 | 85.0 |
| A-Grade Commands | 1 | 3 | 6 | 23 |
| F-Grade Commands | 0 | 0 | 0 | 0 |
| PRIME Compliant | 23 | 28 | 38 | 46 |

## Resource Requirements

### Time Investment

- **Phase 1**: ~0 hours (0 commands × 2 hours)
- **Phase 2**: ~15 hours
- **Phase 3**: ~15 hours
- **Phase 4**: ~20 hours for strategic improvements

### Tools & Resources

- PRIME Framework Template: `.claude/templates/command-template.md`
- Command Creator: `/command/new`
- This evaluation system: `.claude/scripts/commands/command-quality-evaluator.cjs`

## Success Criteria

✅ No F-grade commands
✅ Average score ≥ 85
✅ 80% PRIME compliance
✅ All commands have error handling
✅ Top 10 commands score 90+

---
*Run command quality evaluation weekly to track progress*
