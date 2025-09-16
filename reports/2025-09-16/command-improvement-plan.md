# Command Quality Improvement Plan
Generated: 2025-09-16

## Current State Summary
- **Total Commands**: 56
- **Average Score**: 60.8/100
- **Target Score**: 85/100
- **Gap to Target**: 24.2 points

## Prioritized Improvement Plan

### 🔴 Phase 1: Critical Fixes (Week 1)
**Goal**: Bring all F-grade commands to at least D-grade

| Command | Current | Target | Required Actions |
|---------|---------|--------|-----------------|
| /git/checkout | 39/F | 60/D | Restructure command following PRIME sequence: Purpose → Role → Inputs → Method → Expectations; Add PURPOSE phase with clear objectives and success criteria |
| /feature/start | 46/F | 60/D | Add argument-hint to frontmatter; Restructure command following PRIME sequence: Purpose → Role → Inputs → Method → Expectations |
| /config/bash-timeout | 46/F | 60/D | Restructure command following PRIME sequence: Purpose → Role → Inputs → Method → Expectations; Add PURPOSE phase with clear objectives and success criteria |
| /checkpoint/create | 47/F | 60/D | Restructure command following PRIME sequence: Purpose → Role → Inputs → Method → Expectations; Add PURPOSE phase with clear objectives and success criteria |
| /checkpoint/restore | 47/F | 60/D | Restructure command following PRIME sequence: Purpose → Role → Inputs → Method → Expectations; Add PURPOSE phase with clear objectives and success criteria |
| /dev/cleanup | 47/F | 60/D | Restructure command following PRIME sequence: Purpose → Role → Inputs → Method → Expectations; Add ROLE phase defining expertise and authority |
| /test | 47/F | 60/D | Restructure command following PRIME sequence: Purpose → Role → Inputs → Method → Expectations; Add PURPOSE phase with clear objectives and success criteria |
| /git/status | 49/F | 60/D | Restructure command following PRIME sequence: Purpose → Role → Inputs → Method → Expectations; Add PURPOSE phase with clear objectives and success criteria |
| /agents-md/migration | 50/F | 60/D | Restructure command following PRIME sequence: Purpose → Role → Inputs → Method → Expectations; Add PURPOSE phase with clear objectives and success criteria |
| /promote-to-production | 50/F | 60/D | Restructure command following PRIME sequence: Purpose → Role → Inputs → Method → Expectations; Add PURPOSE phase with clear objectives and success criteria |
| /update/update-makerkit | 51/F | 60/D | Restructure command following PRIME sequence: Purpose → Role → Inputs → Method → Expectations; Add PURPOSE phase with clear objectives and success criteria |
| /git/push | 51/F | 60/D | Restructure command following PRIME sequence: Purpose → Role → Inputs → Method → Expectations; Add PURPOSE phase with clear objectives and success criteria |
| /checkpoint/list | 52/F | 60/D | Restructure command following PRIME sequence: Purpose → Role → Inputs → Method → Expectations; Add PURPOSE phase with clear objectives and success criteria |
| /dev/remove-worktree | 52/F | 60/D | Restructure command following PRIME sequence: Purpose → Role → Inputs → Method → Expectations; Add PURPOSE phase with clear objectives and success criteria |
| /codecheck | 53/F | 60/D | Restructure command following PRIME sequence: Purpose → Role → Inputs → Method → Expectations; Add PURPOSE phase with clear objectives and success criteria |
| /feature/status | 53/F | 60/D | Restructure command following PRIME sequence: Purpose → Role → Inputs → Method → Expectations; Add PURPOSE phase with clear objectives and success criteria |
| /testwriters/test-discovery | 53/F | 60/D | Restructure command following PRIME sequence: Purpose → Role → Inputs → Method → Expectations; Add PURPOSE phase with clear objectives and success criteria |
| /feature/analyze | 55/F | 60/D | Add argument-hint to frontmatter; Restructure command following PRIME sequence: Purpose → Role → Inputs → Method → Expectations |
| /git/commit | 55/F | 60/D | Restructure command following PRIME sequence: Purpose → Role → Inputs → Method → Expectations; Add PURPOSE phase with clear objectives and success criteria |
| /research | 55/F | 60/D | Restructure command following PRIME sequence: Purpose → Role → Inputs → Method → Expectations; Add PURPOSE phase with clear objectives and success criteria |
| /context/sync-context-inventory | 56/F | 60/D | Restructure command following PRIME sequence: Purpose → Role → Inputs → Method → Expectations; Add PURPOSE phase with clear objectives and success criteria |
| /db-healthcheck | 56/F | 60/D | Restructure command following PRIME sequence: Purpose → Role → Inputs → Method → Expectations; Add PURPOSE phase with clear objectives and success criteria |
| /write-tests | 56/F | 60/D | Restructure command following PRIME sequence: Purpose → Role → Inputs → Method → Expectations; Add PURPOSE phase with clear objectives and success criteria |
| /promote-to-staging | 57/F | 60/D | Restructure command following PRIME sequence: Purpose → Role → Inputs → Method → Expectations; Add PURPOSE phase with clear objectives and success criteria |
| /testwriters/unit-test-writer | 58/F | 60/D | Add allowed-tools to frontmatter; Restructure command following PRIME sequence: Purpose → Role → Inputs → Method → Expectations |
| /pr | 59/F | 60/D | Restructure command following PRIME sequence: Purpose → Role → Inputs → Method → Expectations; Add PURPOSE phase with clear objectives and success criteria |

### 🟠 Phase 2: High Priority (Week 2)
**Goal**: Upgrade D-grade commands to C-grade

| Command | Current | Target | Required Actions |
|---------|---------|--------|-----------------|
| /feature/sync | 60/D | 70/C | Restructure command following PRIME sequence: Purpose → Role → Inputs → Method → Expectations; Add ROLE phase defining expertise and authority |
| /agents-md/cli | 61/D | 70/C | Restructure command following PRIME sequence: Purpose → Role → Inputs → Method → Expectations; Add ROLE phase defining expertise and authority |
| /feature/spec | 61/D | 70/C | Add argument-hint to frontmatter; Consider delegating to: typescript-expert, react-expert, code-search-expert |
| /testwriters/integration-test-writer | 61/D | 70/C | Restructure command following PRIME sequence: Purpose → Role → Inputs → Method → Expectations; Add PURPOSE phase with clear objectives and success criteria |
| /code-review | 62/D | 70/C | Implement dynamic context loading pattern for adaptability; Add comprehensive error handling for each phase |
| /dev/new-worktree | 63/D | 70/C | Restructure command following PRIME sequence: Purpose → Role → Inputs → Method → Expectations; Add PURPOSE phase with clear objectives and success criteria |
| /feature/discover | 63/D | 70/C | Add argument-hint to frontmatter; Restructure command following PRIME sequence: Purpose → Role → Inputs → Method → Expectations |
| /feature/decompose | 63/D | 70/C | Add argument-hint to frontmatter; Implement dynamic context loading pattern for adaptability |
| /feature/update | 63/D | 70/C | Restructure command following PRIME sequence: Purpose → Role → Inputs → Method → Expectations; Add PURPOSE phase with clear objectives and success criteria |
| /feature/plan | 64/D | 70/C | Add argument-hint to frontmatter; Consider delegating to: refactoring-expert, react-expert, database-expert |

### 🟡 Phase 3: Optimization (Week 3-4)
**Goal**: Bring C-grade commands to B-grade

Focus Areas:
1. **PRIME Compliance** - Add missing phases to 36 commands
2. **Action-First Design** - Convert advisory language in 0 commands
3. **Integration** - Add agent delegation to 30 commands
4. **Documentation** - Add examples to 6 commands

### 🟢 Phase 4: Excellence (Month 2)
**Goal**: Achieve 85+ average score

Strategic Improvements:
- **Implement dynamic context loading** (52 commands) - Est. +5 points average
- **Add MCP server integration** (38 commands) - Est. +5 points average
- **Add validation patterns** (45 commands) - Est. +5 points average

## Improvement Tracking Metrics

| Metric | Current | Week 1 Target | Week 2 Target | Month End Target |
|--------|---------|---------------|---------------|------------------|
| Average Score | 60.8 | 65.8 | 70.8 | 85.0 |
| A-Grade Commands | 1 | 3 | 6 | 22 |
| F-Grade Commands | 26 | 0 | 0 | 0 |
| PRIME Compliant | 3 | 8 | 18 | 45 |

## Resource Requirements

### Time Investment
- **Phase 1**: ~52 hours (26 commands × 2 hours)
- **Phase 2**: ~15 hours
- **Phase 3**: ~5 hours
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