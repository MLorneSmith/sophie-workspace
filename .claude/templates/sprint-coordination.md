# Sprint {Number} Implementation Coordination

## Stories Overview

| Story | Status   | Developer | Blocks  | Blocked By | ETA    |
| ----- | -------- | --------- | ------- | ---------- | ------ |
| #{id} | {status} | {session} | #{list} | #{list}    | {date} |

## Shared Component Status

### Component: {ComponentName}

- **Owner Story**: #{id}
- **Status**: {In Progress/Stable/Breaking Change}
- **Interface**: {Current API}
- **Stories Using**: #{list}
- **Coordination**: {Required/Not Required}

## File Conflict Tracking

### High-Risk Files (Multiple Stories)

- `{file-path}`:
  - Story #{id}: {What they're changing}
  - Story #{id}: {What they're changing}
  - **Coordination Plan**: {How to manage}

### Safe to Modify

- `{file-path}`: Only used by story #{id}

## Implementation Sequence

### Current Phase

- **Active**: Stories #{list}
- **Next Up**: Stories #{list}
- **Blocked**: Stories #{list}

### Recommended Order

1. **Story #{id}** - {reasoning}
2. **Story #{id}** - {reasoning}
3. **Story #{id}** - {reasoning}

## Database Coordination

### Schema Changes

- **Story #{id}**: {Migration description}
- **Dependent Stories**: #{list}
- **Migration Order**: {Required sequence}

### Seed Data

- **Story #{id}**: {Test data needed}
- **Conflicts**: {Overlapping data needs}

## Integration Testing

### Cross-Story Tests

- **Feature Flow**: {User journey across stories}
- **Test Owner**: Story #{id}
- **Dependencies**: Stories #{list} must be complete

## Sprint Progress

- **Completed**: {X} story points
- **In Progress**: {Y} story points
- **Remaining**: {Z} story points
- **Velocity**: {Current pace}
- **Projected Completion**: {Date}
