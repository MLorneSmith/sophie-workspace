# Zeta Commands (Deprecated)

This directory contains deprecated slash commands that have been superseded by the **Alpha workflow**.

## Why Deprecated?

The `/initiative` orchestrator and related commands were replaced by the Alpha Implementation System which offers:

- **Finer granularity**: Atomic tasks (S#.I#.F#.T#) vs feature-level decomposition
- **Better parallelism**: Work queue pattern with 3 sandboxes vs simple sequential/parallel
- **Full autonomy**: No approval gates during execution
- **Spec-level scope**: Covers entire specs (multiple initiatives) in one run
- **Better observability**: Progress polling, heartbeat, stall detection
- **Database integration**: Sandbox database seeding built-in
- **Automatic resume**: Reads progress from manifest, no manual flags needed

## Replacement Commands

| Deprecated (Zeta) | Replacement (Alpha) |
|-------------------|---------------------|
| `/zeta:initiative` | `/alpha:spec` + `/alpha:initiative-decompose` + `/alpha:feature-decompose` + `/alpha:task-decompose` + `tsx spec-orchestrator.ts` |
| `/zeta:feature-set` | `/alpha:initiative-decompose` + `/alpha:feature-decompose` |
| `/zeta:initiative-feature` | `/alpha:feature-decompose` |
| `/zeta:initiative-planning-coordinator` | Built into spec-orchestrator |
| `/zeta:sandbox:initiative-implement` | `/alpha:implement` |

## Contents

### Commands
- `initiative.md` - Main initiative orchestrator (replaced by Alpha workflow)
- `feature-set.md` - Feature decomposition (replaced by `/alpha:initiative-decompose`)
- `initiative-feature.md` - Single feature planning (replaced by `/alpha:feature-decompose`)
- `initiative-planning-coordinator.md` - Planning coordinator (replaced by spec-orchestrator)

### Sandbox Commands
- `sandbox/initiative-feature.md` - Sandbox feature planning
- `sandbox/initiative-implement.md` - Sandbox implementation (replaced by `/alpha:implement`)

### Agents (in `.claude/agents/zeta/initiative/`)
- `initiative-research.md` - Research agent (replaced by Alpha research phase)
- `initiative-planning.md` - Planning agent (replaced by Alpha planning)
- `initiative-decomposition.md` - Decomposition agent (replaced by Alpha decomposition commands)

## Usage

These commands are still functional but not recommended for new work. They can be invoked with the `zeta:` prefix:

```bash
/zeta:initiative "My initiative"
/zeta:feature-set "My feature set"
```

## Migration Guide

To migrate from `/initiative` to Alpha:

1. **Create spec**: `/alpha:spec "My Project"`
2. **Decompose to initiatives**: `/alpha:initiative-decompose S<spec-id>`
3. **Decompose to features**: `/alpha:feature-decompose S<spec-id>.I<n>`
4. **Decompose to tasks**: `/alpha:task-decompose S<spec-id>.I<n>.F<n>`
5. **Run implementation**: `tsx .ai/alpha/scripts/spec-orchestrator.ts <spec-id>`

See `.ai/alpha/docs/alpha-implementation-system.md` for full documentation.

## Removal Timeline

These commands will be removed in a future release after confirming Alpha workflow covers all use cases. No immediate removal is planned.
