# Command Quality Detailed Analysis

Generated: 2025-09-17

## Analysis by Command Category

### Command

**Average Score**: 88.5/100 | **Commands**: 2

| Command | Score | Grade | Issues | Recommendations |
|---------|-------|-------|--------|-----------------|
| enhance | 90.0 | A | 5 | None |
| new | 87.0 | B | 5 | Add allowed-tools to frontmatter |

### Git

**Average Score**: 81.6/100 | **Commands**: 4

| Command | Score | Grade | Issues | Recommendations |
|---------|-------|-------|--------|-----------------|
| checkout | 88.0 | B | 5 | None |
| status | 83.5 | B | 7 | Consider delegating to: refactoring-expert, testing-expert, nodejs-expert |
| commit | 82.0 | B | 8 | Add allowed-tools to frontmatter |
| push | 73.0 | C | 9 | Consider delegating to: typescript-expert, testing-expert, nodejs-expert |

### Spec

**Average Score**: 79.4/100 | **Commands**: 4

| Command | Score | Grade | Issues | Recommendations |
|---------|-------|-------|--------|-----------------|
| validate | 81.0 | B | 6 | Consider delegating to: typescript-expert, refactoring-expert, testing-expert |
| create | 80.0 | B | 5 | Implement dynamic context loading pattern for adaptability |
| decompose | 78.5 | C | 7 | Consider delegating to: typescript-expert, refactoring-expert, testing-expert |
| execute | 78.0 | C | 7 | Consider delegating to: refactoring-expert, testing-expert, nodejs-expert |

### Feature

**Average Score**: 78.4/100 | **Commands**: 9

| Command | Score | Grade | Issues | Recommendations |
|---------|-------|-------|--------|-----------------|
| spec | 88.0 | B | 4 | None |
| sync | 88.0 | B | 4 | None |
| analyze | 83.5 | B | 6 | Consider delegating to: typescript-expert, refactoring-expert, testing-expert |
| discover | 83.0 | B | 5 | None |
| start | 80.5 | B | 7 | Consider delegating to: typescript-expert, refactoring-expert, testing-expert |
| status | 79.5 | C | 6 | Add validation checks in expectations phase |
| decompose | 76.5 | C | 8 | None |
| plan | 63.5 | D | 13 | Add argument-hint to frontmatter |
| update | 63.0 | D | 9 | Restructure command following PRIME sequence: Purpose → Role → Inputs → Method → Expectations |

### Agent Mgmt

**Average Score**: 77.5/100 | **Commands**: 2

| Command | Score | Grade | Issues | Recommendations |
|---------|-------|-------|--------|-----------------|
| modify-subagent | 81.0 | B | 7 | Consider delegating to: typescript-expert, refactoring-expert, testing-expert |
| create-subagent | 74.0 | C | 9 | Consider delegating to: typescript-expert, refactoring-expert, testing-expert |

### Root Commands

**Average Score**: 76.4/100 | **Commands**: 18

| Command | Score | Grade | Issues | Recommendations |
|---------|-------|-------|--------|-----------------|
| do-task | 89.0 | B | 4 | None |
| research | 89.0 | B | 3 | None |
| debug-issue | 86.0 | B | 4 | None |
| cicd-debug | 85.0 | B | 5 | None |
| code-review | 82.0 | B | 6 | None |
| create-context | 81.0 | B | 5 | Implement dynamic context loading pattern for adaptability |
| test | 81.0 | B | 7 | Consider delegating to: refactoring-expert, testing-expert, nodejs-expert |
| workflow | 81.0 | B | 6 | Consider delegating to: refactoring-expert, testing-expert, react-expert |
| log-task | 79.0 | C | 8 | Consider delegating to: typescript-expert, refactoring-expert, testing-expert |
| codecheck | 78.5 | C | 9 | Consider delegating to: typescript-expert, refactoring-expert, testing-expert |
| pr | 74.0 | C | 9 | Consider delegating to: typescript-expert, refactoring-expert, testing-expert |
| claude-md-optimizer | 73.5 | C | 9 | Consider delegating to: typescript-expert, refactoring-expert, testing-expert |
| db-healthcheck | 71.0 | C | 10 | Consider delegating to: typescript-expert, refactoring-expert, testing-expert |
| write-tests | 71.0 | C | 10 | Consider delegating to: typescript-expert, refactoring-expert, testing-expert |
| log-issue | 65.5 | D | 12 | Consider delegating to: typescript-expert, testing-expert, nodejs-expert |
| promote-to-production | 63.5 | D | 13 | Consider delegating to: refactoring-expert, testing-expert, react-expert |
| validate-and-fix | 63.5 | D | 11 | Implement dynamic context loading pattern for adaptability |
| promote-to-staging | 62.5 | D | 13 | Consider delegating to: typescript-expert, refactoring-expert, testing-expert |

### Update

**Average Score**: 75.5/100 | **Commands**: 2

| Command | Score | Grade | Issues | Recommendations |
|---------|-------|-------|--------|-----------------|
| payload | 76.0 | C | 8 | Consider delegating to: typescript-expert, refactoring-expert, testing-expert |
| update-makerkit | 75.0 | C | 9 | None |

### Dev

**Average Score**: 75.1/100 | **Commands**: 4

| Command | Score | Grade | Issues | Recommendations |
|---------|-------|-------|--------|-----------------|
| new-worktree | 82.0 | B | 5 | None |
| remove-worktree | 75.5 | C | 8 | Consider delegating to: typescript-expert, refactoring-expert, testing-expert |
| change-worktree | 72.5 | C | 9 | Implement dynamic context loading pattern for adaptability |
| cleanup | 70.5 | C | 10 | Consider delegating to: refactoring-expert, testing-expert, nodejs-expert |

### Agents Md

**Average Score**: 74.3/100 | **Commands**: 3

| Command | Score | Grade | Issues | Recommendations |
|---------|-------|-------|--------|-----------------|
| cli | 84.0 | B | 5 | None |
| init | 74.5 | C | 9 | Implement dynamic context loading pattern for adaptability |
| migration | 64.5 | D | 12 | Restructure command following PRIME sequence: Purpose → Role → Inputs → Method → Expectations |

### Checkpoint

**Average Score**: 72.5/100 | **Commands**: 3

| Command | Score | Grade | Issues | Recommendations |
|---------|-------|-------|--------|-----------------|
| create | 81.0 | B | 7 | Consider delegating to: refactoring-expert, testing-expert, react-expert |
| list | 69.5 | D | 11 | Consider delegating to: typescript-expert, refactoring-expert, testing-expert |
| restore | 67.0 | D | 11 | Restructure command following PRIME sequence: Purpose → Role → Inputs → Method → Expectations |

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

### Testwriters

**Average Score**: 70.9/100 | **Commands**: 4

| Command | Score | Grade | Issues | Recommendations |
|---------|-------|-------|--------|-----------------|
| integration-test-writer | 80.0 | B | 6 | Consider delegating to: typescript-expert, refactoring-expert, testing-expert |
| unit-test-writer | 73.0 | C | 9 | Consider delegating to: typescript-expert, refactoring-expert, testing-expert |
| e2e-test-writer | 67.0 | D | 10 | Consider delegating to: typescript-expert, testing-expert, nodejs-expert |
| test-discovery | 63.5 | D | 12 | Add allowed-tools to frontmatter |

## Score Distribution Analysis

```
Score Range | Count | Visual
------------|-------|--------------------------------------------------
90-100 (A)  |   1 | ██
80-89 (B)   |  24 | ████████████████████████████████████████████████
70-79 (C)   |  21 | ██████████████████████████████████████████
60-69 (D)   |  11 | ██████████████████████
0-59 (F)    |   0 | 
```

## Category Score Breakdown

### Frontmatter & Metadata

- **Maximum Points**: 15
- **Average Score**: 12.6 (84%)
- **Excellent (90%+)**: 11 commands
- **Good (70-89%)**: 42 commands
- **Poor (<50%)**: 0 commands

Top Issues in this category:

- Should include MCP tools for this domain (37 commands)
- Description should be action-oriented (12 commands)
- Missing description in frontmatter (10 commands)

### PRIME Framework Compliance

- **Maximum Points**: 30
- **Average Score**: 26.9 (90%)
- **Excellent (90%+)**: 42 commands
- **Good (70-89%)**: 12 commands
- **Poor (<50%)**: 1 commands

Top Issues in this category:

- Weak EXPECTATIONS phase implementation (21 commands)
- Weak ROLE phase implementation (14 commands)
- Weak INPUTS phase implementation (9 commands)

### Action-First Design

- **Maximum Points**: 15
- **Average Score**: 10.0 (67%)
- **Excellent (90%+)**: 0 commands
- **Good (70-89%)**: 0 commands
- **Poor (<50%)**: 0 commands

Top Issues in this category:

- Most instructions don't start with action verbs (57 commands)

### Agent & MCP Integration

- **Maximum Points**: 15
- **Average Score**: 9.4 (62%)
- **Excellent (90%+)**: 2 commands
- **Good (70-89%)**: 9 commands
- **Poor (<50%)**: 2 commands

Top Issues in this category:

- Missing MCP tool permissions in frontmatter (46 commands)
- Should delegate to specialized agents (36 commands)
- Consider using: typescript-expert, refactoring-expert, testing-expert (20 commands)

### Pattern Implementation

- **Maximum Points**: 15
- **Average Score**: 8.2 (54%)
- **Excellent (90%+)**: 8 commands
- **Good (70-89%)**: 4 commands
- **Poor (<50%)**: 23 commands

Top Issues in this category:

- Missing Dynamic context loading pattern (41 commands)
- Missing Validation checks pattern (26 commands)
- Consider adding optional patterns for complex commands (21 commands)

### Documentation Quality

- **Maximum Points**: 10
- **Average Score**: 9.7 (97%)
- **Excellent (90%+)**: 53 commands
- **Good (70-89%)**: 3 commands
- **Poor (<50%)**: 1 commands

Top Issues in this category:

- Missing usage instructions (4 commands)
- Missing examples (1 commands)
