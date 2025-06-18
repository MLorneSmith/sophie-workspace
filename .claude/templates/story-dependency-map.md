# Story Dependency Map: {Epic Name}

## Dependency Graph

```
Story #123 (Foundation)
├── Story #124 (builds on auth)
├── Story #125 (builds on auth)
│   └── Story #127 (needs #125 API)
└── Story #126 (integrates #124 + #125)
```

## Dependency Details

### Story #{id}: {Title}

- **Type**: {Foundation/Feature/Integration}
- **Provides**: {What other stories can use}
- **Requires**: {What must be done first}
- **Blocks**: Stories #{list}
- **Safe Parallel**: Stories #{list}

## Critical Path

**Longest dependency chain**: #{id} → #{id} → #{id}
**Estimated Duration**: {X days/weeks}
**Bottleneck**: Story #{id} - {reason}

## Parallel Work Opportunities

### Group A (Can work simultaneously)

- Story #{id}
- Story #{id}
- **Shared Risk**: {What could conflict}

### Group B (Sequential dependencies)

- Story #{id} → Story #{id} → Story #{id}
- **Reason**: {Why this order is required}

## File-Level Dependencies

### High Conflict Risk

- `{file-path}`: Stories #{list}
- **Mitigation**: {How to coordinate}

### Component Dependencies

- **{ComponentName}**:
  - Created by: Story #{id}
  - Used by: Stories #{list}
  - **Interface Stability**: {When it's safe to use}

## Implementation Strategy

### Phase 1: Foundation (Week 1)

- Stories: #{list}
- **Goal**: Establish core services and components

### Phase 2: Features (Week 2)

- Stories: #{list}
- **Goal**: Build user-facing functionality

### Phase 3: Integration (Week 3)

- Stories: #{list}
- **Goal**: Connect features and polish

## Coordination Checkpoints

### Daily Standup Focus

- **Monday**: Review dependency status
- **Wednesday**: Check for emerging conflicts
- **Friday**: Validate integration readiness

### Story Handoff Protocol

1. Complete story creates handoff document
2. Update sprint coordination file
3. Notify dependent stories
4. Validate integration points
