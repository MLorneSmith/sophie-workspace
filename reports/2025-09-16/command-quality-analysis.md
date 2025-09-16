# Command Quality Detailed Analysis
Generated: 2025-09-16

## Analysis by Command Category

### Command
**Average Score**: 88.5/100 | **Commands**: 2

| Command | Score | Grade | Issues | Recommendations |
|---------|-------|-------|--------|-----------------|
| enhance | 90.0 | A | 4 | None |
| new | 87.0 | B | 5 | Add allowed-tools to frontmatter |

### Agent Mgmt
**Average Score**: 77.5/100 | **Commands**: 2

| Command | Score | Grade | Issues | Recommendations |
|---------|-------|-------|--------|-----------------|
| modify-subagent | 81.0 | B | 7 | Consider delegating to: typescript-expert, refactoring-expert, nodejs-expert |
| create-subagent | 74.0 | C | 9 | Consider delegating to: typescript-expert, refactoring-expert, nodejs-expert |

### Spec
**Average Score**: 69.3/100 | **Commands**: 4

| Command | Score | Grade | Issues | Recommendations |
|---------|-------|-------|--------|-----------------|
| decompose | 72.0 | C | 9 | Consider delegating to: typescript-expert, nodejs-expert, react-expert |
| create | 71.0 | C | 8 | Implement dynamic context loading pattern for adaptability |
| execute | 67.5 | D | 9 | Restructure command following PRIME sequence: Purpose → Role → Inputs → Method → Expectations |
| validate | 66.5 | D | 12 | Consider delegating to: typescript-expert, refactoring-expert, react-expert |

### Root Commands
**Average Score**: 62.4/100 | **Commands**: 18

| Command | Score | Grade | Issues | Recommendations |
|---------|-------|-------|--------|-----------------|
| create-context | 81.0 | B | 5 | Implement dynamic context loading pattern for adaptability |
| log-task | 79.0 | C | 8 | Consider delegating to: typescript-expert, refactoring-expert, nodejs-expert |
| cicd-debug | 69.5 | D | 9 | Consider delegating to: refactoring-expert, react-expert, code-search-expert |
| claude-md-optimizer | 69.5 | D | 10 | Consider delegating to: typescript-expert, refactoring-expert, react-expert |
| workflow | 69.5 | D | 9 | Implement dynamic context loading pattern for adaptability |
| debug-issue | 67.0 | D | 11 | Restructure command following PRIME sequence: Purpose → Role → Inputs → Method → Expectations |
| log-issue | 65.5 | D | 12 | Consider delegating to: typescript-expert, nodejs-expert, react-expert |
| do-task | 64.0 | D | 11 | Restructure command following PRIME sequence: Purpose → Role → Inputs → Method → Expectations |
| validate-and-fix | 63.5 | D | 11 | Implement dynamic context loading pattern for adaptability |
| code-review | 62.0 | D | 11 | Implement dynamic context loading pattern for adaptability |
| pr | 59.0 | F | 12 | Restructure command following PRIME sequence: Purpose → Role → Inputs → Method → Expectations |
| promote-to-staging | 57.0 | F | 13 | Restructure command following PRIME sequence: Purpose → Role → Inputs → Method → Expectations |
| db-healthcheck | 56.0 | F | 13 | Restructure command following PRIME sequence: Purpose → Role → Inputs → Method → Expectations |
| write-tests | 56.0 | F | 13 | Restructure command following PRIME sequence: Purpose → Role → Inputs → Method → Expectations |
| research | 55.0 | F | 13 | Restructure command following PRIME sequence: Purpose → Role → Inputs → Method → Expectations |
| codecheck | 52.5 | F | 12 | Restructure command following PRIME sequence: Purpose → Role → Inputs → Method → Expectations |
| promote-to-production | 50.0 | F | 15 | Restructure command following PRIME sequence: Purpose → Role → Inputs → Method → Expectations |
| test | 47.0 | F | 13 | Restructure command following PRIME sequence: Purpose → Role → Inputs → Method → Expectations |

### Agents Md
**Average Score**: 61.7/100 | **Commands**: 3

| Command | Score | Grade | Issues | Recommendations |
|---------|-------|-------|--------|-----------------|
| init | 74.5 | C | 9 | Implement dynamic context loading pattern for adaptability |
| cli | 60.5 | D | 11 | Restructure command following PRIME sequence: Purpose → Role → Inputs → Method → Expectations |
| migration | 50.0 | F | 12 | Restructure command following PRIME sequence: Purpose → Role → Inputs → Method → Expectations |

### Testwriters
**Average Score**: 59.6/100 | **Commands**: 4

| Command | Score | Grade | Issues | Recommendations |
|---------|-------|-------|--------|-----------------|
| e2e-test-writer | 67.0 | D | 10 | Consider delegating to: typescript-expert, nodejs-expert, react-expert |
| integration-test-writer | 61.0 | D | 11 | Restructure command following PRIME sequence: Purpose → Role → Inputs → Method → Expectations |
| unit-test-writer | 57.5 | F | 13 | Add allowed-tools to frontmatter |
| test-discovery | 53.0 | F | 12 | Restructure command following PRIME sequence: Purpose → Role → Inputs → Method → Expectations |

### Feature
**Average Score**: 58.4/100 | **Commands**: 9

| Command | Score | Grade | Issues | Recommendations |
|---------|-------|-------|--------|-----------------|
| plan | 63.5 | D | 13 | Add argument-hint to frontmatter |
| decompose | 63.0 | D | 12 | Add argument-hint to frontmatter |
| update | 63.0 | D | 9 | Restructure command following PRIME sequence: Purpose → Role → Inputs → Method → Expectations |
| discover | 62.5 | D | 13 | Add argument-hint to frontmatter |
| spec | 61.0 | D | 14 | Add argument-hint to frontmatter |
| sync | 60.0 | D | 12 | Restructure command following PRIME sequence: Purpose → Role → Inputs → Method → Expectations |
| analyze | 55.0 | F | 13 | Add argument-hint to frontmatter |
| status | 52.5 | F | 12 | Restructure command following PRIME sequence: Purpose → Role → Inputs → Method → Expectations |
| start | 45.5 | F | 16 | Add argument-hint to frontmatter |

### Dev
**Average Score**: 57.6/100 | **Commands**: 4

| Command | Score | Grade | Issues | Recommendations |
|---------|-------|-------|--------|-----------------|
| change-worktree | 69.0 | D | 9 | Restructure command following PRIME sequence: Purpose → Role → Inputs → Method → Expectations |
| new-worktree | 62.5 | D | 11 | Restructure command following PRIME sequence: Purpose → Role → Inputs → Method → Expectations |
| remove-worktree | 52.0 | F | 13 | Restructure command following PRIME sequence: Purpose → Role → Inputs → Method → Expectations |
| cleanup | 47.0 | F | 14 | Restructure command following PRIME sequence: Purpose → Role → Inputs → Method → Expectations |

### Context
**Average Score**: 56.0/100 | **Commands**: 1

| Command | Score | Grade | Issues | Recommendations |
|---------|-------|-------|--------|-----------------|
| sync-context-inventory | 56.0 | F | 13 | Restructure command following PRIME sequence: Purpose → Role → Inputs → Method → Expectations |

### Update
**Average Score**: 50.5/100 | **Commands**: 1

| Command | Score | Grade | Issues | Recommendations |
|---------|-------|-------|--------|-----------------|
| update-makerkit | 50.5 | F | 17 | Restructure command following PRIME sequence: Purpose → Role → Inputs → Method → Expectations |

### Checkpoint
**Average Score**: 48.7/100 | **Commands**: 3

| Command | Score | Grade | Issues | Recommendations |
|---------|-------|-------|--------|-----------------|
| list | 52.0 | F | 12 | Restructure command following PRIME sequence: Purpose → Role → Inputs → Method → Expectations |
| create | 47.0 | F | 12 | Restructure command following PRIME sequence: Purpose → Role → Inputs → Method → Expectations |
| restore | 47.0 | F | 14 | Restructure command following PRIME sequence: Purpose → Role → Inputs → Method → Expectations |

### Git
**Average Score**: 48.4/100 | **Commands**: 4

| Command | Score | Grade | Issues | Recommendations |
|---------|-------|-------|--------|-----------------|
| commit | 55.0 | F | 13 | Restructure command following PRIME sequence: Purpose → Role → Inputs → Method → Expectations |
| push | 51.0 | F | 15 | Restructure command following PRIME sequence: Purpose → Role → Inputs → Method → Expectations |
| status | 49.0 | F | 15 | Restructure command following PRIME sequence: Purpose → Role → Inputs → Method → Expectations |
| checkout | 38.5 | F | 17 | Restructure command following PRIME sequence: Purpose → Role → Inputs → Method → Expectations |

### Config
**Average Score**: 46.0/100 | **Commands**: 1

| Command | Score | Grade | Issues | Recommendations |
|---------|-------|-------|--------|-----------------|
| bash-timeout | 46.0 | F | 12 | Restructure command following PRIME sequence: Purpose → Role → Inputs → Method → Expectations |


## Score Distribution Analysis

```
Score Range | Count | Visual
------------|-------|--------------------------------------------------
90-100 (A)  |   1 | ██
80-89 (B)   |   3 | ██████
70-79 (C)   |   5 | ██████████
60-69 (D)   |  21 | ██████████████████████████████████████████
0-59 (F)    |  26 | ██████████████████████████████████████████████████
```

## Category Score Breakdown

### Frontmatter & Metadata
- **Maximum Points**: 15
- **Average Score**: 12.3 (82%)
- **Excellent (90%+)**: 11 commands
- **Good (70-89%)**: 37 commands
- **Poor (<50%)**: 0 commands

Top Issues in this category:
- Missing description in frontmatter (27 commands)
- Should include MCP tools for this domain (24 commands)
- Uses arguments but missing argument-hint (13 commands)

### PRIME Framework Compliance
- **Maximum Points**: 30
- **Average Score**: 16.6 (55%)
- **Excellent (90%+)**: 6 commands
- **Good (70-89%)**: 14 commands
- **Poor (<50%)**: 22 commands

Top Issues in this category:
- Weak EXPECTATIONS phase implementation (35 commands)
- Weak INPUTS phase implementation (32 commands)
- Weak ROLE phase implementation (28 commands)

### Action-First Design
- **Maximum Points**: 15
- **Average Score**: 10.0 (67%)
- **Excellent (90%+)**: 1 commands
- **Good (70-89%)**: 2 commands
- **Poor (<50%)**: 3 commands

Top Issues in this category:
- Most instructions don't start with action verbs (53 commands)
- Insufficient action verbs throughout command (5 commands)

### Agent & MCP Integration
- **Maximum Points**: 15
- **Average Score**: 10.2 (68%)
- **Excellent (90%+)**: 10 commands
- **Good (70-89%)**: 10 commands
- **Poor (<50%)**: 4 commands

Top Issues in this category:
- Missing MCP tool permissions in frontmatter (38 commands)
- Should delegate to specialized agents (30 commands)
- Consider using: typescript-expert, refactoring-expert, nodejs-expert (12 commands)

### Pattern Implementation
- **Maximum Points**: 15
- **Average Score**: 3.5 (23%)
- **Excellent (90%+)**: 2 commands
- **Good (70-89%)**: 0 commands
- **Poor (<50%)**: 46 commands

Top Issues in this category:
- Missing Dynamic context loading pattern (52 commands)
- Missing Validation checks pattern (44 commands)
- Missing Error handling pattern (24 commands)

### Documentation Quality
- **Maximum Points**: 10
- **Average Score**: 8.3 (83%)
- **Excellent (90%+)**: 33 commands
- **Good (70-89%)**: 12 commands
- **Poor (<50%)**: 6 commands

Top Issues in this category:
- Missing usage instructions (17 commands)
- Success criteria should be measurable (9 commands)
- Examples should include code blocks (5 commands)

