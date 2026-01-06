# Feature Overview: {{INITIATIVE_NAME}}

**Parent Initiative**: #{{INITIATIVE_NUM}}
**Parent Spec**: #{{SPEC_NUM}}
**Created**: {{DATE}}
**Total Features**: {{FEATURE_COUNT}}
**Estimated Duration**: {{SEQUENTIAL_DAYS}} days sequential / {{PARALLEL_DAYS}} days parallel

## Directory Structure

```
{{INITIATIVE_NUM}}-Initiative-{{INITIATIVE_SLUG}}/
├── initiative.md                         # Initiative document
├── README.md                             # This file - features overview
{{DIRECTORY_TREE}}
```

## Feature Summary

| ID | Issue | Directory | Priority | Days | Dependencies | Status |
|----|-------|-----------|----------|------|--------------|--------|
{{FEATURE_TABLE}}

## Dependency Graph

```
{{DEPENDENCY_ASCII}}
```

## Parallel Execution Groups

{{PARALLEL_GROUPS}}

## Execution Summary

| Metric | Value |
|--------|-------|
| Sequential Duration | {{SEQUENTIAL_DAYS}} days |
| Parallel Duration | {{PARALLEL_DAYS}} days |
| Time Saved | {{TIME_SAVED}} days ({{TIME_SAVED_PCT}}%) |
| Max Parallelism | {{MAX_PARALLEL}} features |

## INVEST-V Validation Summary

| Feature | I | N | V | E | S | T | V |
|---------|---|---|---|---|---|---|---|
{{INVESTV_TABLE}}

## Architecture Decisions Summary

| Feature | Approach | Rationale |
|---------|----------|-----------|
{{ARCHITECTURE_TABLE}}

## Risk Summary

| Feature | Primary Risk | Mitigation |
|---------|--------------|------------|
{{RISK_TABLE}}

## Next Steps

1. Run `/alpha:task-decompose {{FIRST_FEATURE_NUM}}` to decompose the first feature
2. Begin implementation with Priority 1 / Group 0 features
