# Command Quality Detailed Analysis

Generated: 2025-09-16

## Analysis by Command Category

### Command

**Average Score**: 88.5/100 | **Commands**: 2

| Command | Score | Grade | Issues | Recommendations |
|---------|-------|-------|--------|-----------------|
| enhance | 90.0 | A | 4 | None |
| new | 87.0 | B | 5 | Add allowed-tools to frontmatter |

### Git

**Average Score**: 81.6/100 | **Commands**: 4

| Command | Score | Grade | Issues | Recommendations |
|---------|-------|-------|--------|-----------------|
| checkout | 88.0 | B | 5 | None |
| status | 83.5 | B | 7 | Consider delegating to: refactoring-expert, testing-expert, nodejs-expert |
| commit | 82.0 | B | 8 | Add allowed-tools to frontmatter |
| push | 73.0 | C | 9 | Consider delegating to: typescript-expert, testing-expert, nodejs-expert |

### Agent Mgmt

**Average Score**: 77.5/100 | **Commands**: 2

| Command | Score | Grade | Issues | Recommendations |
|---------|-------|-------|--------|-----------------|
| modify-subagent | 81.0 | B | 7 | Consider delegating to: typescript-expert, refactoring-expert, testing-expert |
| create-subagent | 74.0 | C | 9 | Consider delegating to: typescript-expert, refactoring-expert, testing-expert |

### Feature

**Average Score**: 76.1/100 | **Commands**: 9

| Command | Score | Grade | Issues | Recommendations |
|---------|-------|-------|--------|-----------------|
| spec | 88.0 | B | 4 | None |
| sync | 88.0 | B | 4 | None |
| analyze | 83.5 | B | 6 | Consider delegating to: typescript-expert, refactoring-expert, testing-expert |
| start | 80.5 | B | 7 | Consider delegating to: typescript-expert, refactoring-expert, testing-expert |
| status | 79.5 | C | 6 | Add validation checks in expectations phase |
| decompose | 76.5 | C | 8 | None |
| plan | 63.5 | D | 13 | Add argument-hint to frontmatter |
| update | 63.0 | D | 9 | Restructure command following PRIME sequence: Purpose → Role → Inputs → Method → Expectations |
| discover | 62.5 | D | 13 | Add argument-hint to frontmatter |

### Update

**Average Score**: 75.5/100 | **Commands**: 2

| Command | Score | Grade | Issues | Recommendations |
|---------|-------|-------|--------|-----------------|
| payload | 76.0 | C | 8 | Consider delegating to: typescript-expert, refactoring-expert, testing-expert |
| update-makerkit | 75.0 | C | 9 | None |

### Agents Md

**Average Score**: 74.3/100 | **Commands**: 3

| Command | Score | Grade | Issues | Recommendations |
|---------|-------|-------|--------|-----------------|
| cli | 84.0 | B | 5 | None |
| init | 74.5 | C | 9 | Implement dynamic context loading pattern for adaptability |
| migration | 64.5 | D | 12 | Restructure command following PRIME sequence: Purpose → Role → Inputs → Method → Expectations |

### Root Commands

**Average Score**: 73.6/100 | **Commands**: 18

| Command | Score | Grade | Issues | Recommendations |
|---------|-------|-------|--------|-----------------|
| do-task | 89.0 | B | 4 | None |
| research | 89.0 | B | 3 | None |
| debug-issue | 86.0 | B | 4 | None |
| create-context | 81.0 | B | 5 | Implement dynamic context loading pattern for adaptability |
| test | 81.0 | B | 7 | Consider delegating to: refactoring-expert, testing-expert, nodejs-expert |
| log-task | 79.0 | C | 8 | Consider delegating to: typescript-expert, refactoring-expert, testing-expert |
| codecheck | 78.5 | C | 9 | Consider delegating to: typescript-expert, refactoring-expert, testing-expert |
| pr | 74.0 | C | 9 | Consider delegating to: typescript-expert, refactoring-expert, testing-expert |
| db-healthcheck | 71.0 | C | 10 | Consider delegating to: typescript-expert, refactoring-expert, testing-expert |
| write-tests | 71.0 | C | 10 | Consider delegating to: typescript-expert, refactoring-expert, testing-expert |
| cicd-debug | 69.5 | D | 9 | Consider delegating to: refactoring-expert, testing-expert, react-expert |
| claude-md-optimizer | 69.5 | D | 10 | Consider delegating to: typescript-expert, refactoring-expert, testing-expert |
| workflow | 69.5 | D | 9 | Implement dynamic context loading pattern for adaptability |
| log-issue | 65.5 | D | 12 | Consider delegating to: typescript-expert, testing-expert, nodejs-expert |
| promote-to-production | 63.5 | D | 13 | Consider delegating to: refactoring-expert, testing-expert, react-expert |
| validate-and-fix | 63.5 | D | 11 | Implement dynamic context loading pattern for adaptability |
| promote-to-staging | 62.5 | D | 13 | Consider delegating to: typescript-expert, refactoring-expert, testing-expert |
| code-review | 62.0 | D | 11 | Implement dynamic context loading pattern for adaptability |

### Context

**Average Score**: 72.0/100 | **Commands**: 1

| Command | Score | Grade | Issues | Recommendations |
|---------|-------|-------|--------|-----------------|
| sync-context-inventory | 72.0 | C | 11 | Consider delegating to: typescript-expert, refactoring-expert, testing-expert |

### Config

**Average Score**: 71.0/100 | **Commands**: 1

| Command | Score | Grade | Issues | Recommendations |
|---------|-------|-------|--------|-----------------|
| bash-timeout | 71.0 | C | 9 | Implement dynamic context loading pattern for adaptability |

### Spec

**Average Score**: 69.3/100 | **Commands**: 4

| Command | Score | Grade | Issues | Recommendations |
|---------|-------|-------|--------|-----------------|
| decompose | 72.0 | C | 9 | Consider delegating to: typescript-expert, testing-expert, nodejs-expert |
| create | 71.0 | C | 8 | Implement dynamic context loading pattern for adaptability |
| execute | 67.5 | D | 9 | Restructure command following PRIME sequence: Purpose → Role → Inputs → Method → Expectations |
| validate | 66.5 | D | 12 | Consider delegating to: typescript-expert, refactoring-expert, testing-expert |

### Checkpoint

**Average Score**: 68.3/100 | **Commands**: 3

| Command | Score | Grade | Issues | Recommendations |
|---------|-------|-------|--------|-----------------|
| list | 69.5 | D | 11 | Consider delegating to: typescript-expert, refactoring-expert, testing-expert |
| create | 68.5 | D | 11 | Restructure command following PRIME sequence: Purpose → Role → Inputs → Method → Expectations |
| restore | 67.0 | D | 11 | Restructure command following PRIME sequence: Purpose → Role → Inputs → Method → Expectations |

### Dev

**Average Score**: 67.9/100 | **Commands**: 4

| Command | Score | Grade | Issues | Recommendations |
|---------|-------|-------|--------|-----------------|
| remove-worktree | 75.5 | C | 8 | Consider delegating to: typescript-expert, refactoring-expert, testing-expert |
| change-worktree | 69.0 | D | 9 | Restructure command following PRIME sequence: Purpose → Role → Inputs → Method → Expectations |
| cleanup | 64.5 | D | 12 | Consider delegating to: refactoring-expert, testing-expert, nodejs-expert |
| new-worktree | 62.5 | D | 11 | Restructure command following PRIME sequence: Purpose → Role → Inputs → Method → Expectations |

### Testwriters

**Average Score**: 66.1/100 | **Commands**: 4

| Command | Score | Grade | Issues | Recommendations |
|---------|-------|-------|--------|-----------------|
| unit-test-writer | 73.0 | C | 9 | Consider delegating to: typescript-expert, refactoring-expert, testing-expert |
| e2e-test-writer | 67.0 | D | 10 | Consider delegating to: typescript-expert, testing-expert, nodejs-expert |
| test-discovery | 63.5 | D | 12 | Add allowed-tools to frontmatter |
| integration-test-writer | 61.0 | D | 11 | Restructure command following PRIME sequence: Purpose → Role → Inputs → Method → Expectations |

## Score Distribution Analysis

```text
Score Range | Count | Visual
------------|-------|--------------------------------------------------
90-100 (A)  |   1 | ██
80-89 (B)   |  15 | ██████████████████████████████
70-79 (C)   |  18 | ████████████████████████████████████
60-69 (D)   |  23 | ██████████████████████████████████████████████
0-59 (F)    |   0 | 
```

## Category Score Breakdown

### Frontmatter & Metadata

- **Maximum Points**: 15
- **Average Score**: 12.6 (84%)
- **Excellent (90%+)**: 12 commands
- **Good (70-89%)**: 40 commands
- **Poor (<50%)**: 0 commands

Top Issues in this category:

- Should include MCP tools for this domain (34 commands)
- Missing description in frontmatter (13 commands)
- Description should be action-oriented (11 commands)

### PRIME Framework Compliance

- **Maximum Points**: 30
- **Average Score**: 24.8 (83%)
- **Excellent (90%+)**: 29 commands
- **Good (70-89%)**: 19 commands
- **Poor (<50%)**: 1 commands

Top Issues in this category:

- Weak EXPECTATIONS phase implementation (29 commands)
- Weak ROLE phase implementation (24 commands)
- Weak INPUTS phase implementation (20 commands)

### Action-First Design

- **Maximum Points**: 15
- **Average Score**: 10.1 (67%)
- **Excellent (90%+)**: 0 commands
- **Good (70-89%)**: 1 commands
- **Poor (<50%)**: 0 commands

Top Issues in this category:

- Most instructions don't start with action verbs (56 commands)
- Some instructions don't start with action verbs (1 commands)

### Agent & MCP Integration

- **Maximum Points**: 15
- **Average Score**: 9.6 (64%)
- **Excellent (90%+)**: 5 commands
- **Good (70-89%)**: 8 commands
- **Poor (<50%)**: 2 commands

Top Issues in this category:

- Missing MCP tool permissions in frontmatter (43 commands)
- Should delegate to specialized agents (35 commands)
- Consider using: typescript-expert, refactoring-expert, testing-expert (18 commands)

### Pattern Implementation

- **Maximum Points**: 15
- **Average Score**: 7.1 (47%)
- **Excellent (90%+)**: 8 commands
- **Good (70-89%)**: 4 commands
- **Poor (<50%)**: 32 commands

Top Issues in this category:

- Missing Dynamic context loading pattern (41 commands)
- Missing Validation checks pattern (34 commands)
- Weak Error handling implementation (24 commands)

### Documentation Quality

- **Maximum Points**: 10
- **Average Score**: 9.6 (96%)
- **Excellent (90%+)**: 51 commands
- **Good (70-89%)**: 4 commands
- **Poor (<50%)**: 1 commands

Top Issues in this category:

- Missing usage instructions (4 commands)
- Success criteria should be measurable (1 commands)
- Examples should include code blocks (1 commands)
