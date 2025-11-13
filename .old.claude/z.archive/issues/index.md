# Issues Index

This directory contains systematically documented issues and their resolutions.

## Structure

```
.claude/issues/
├── index.md                    # This file
├── patterns/                   # Common issue patterns
│   ├── slow-query-pattern.md
│   ├── memory-leak-pattern.md
│   └── cors-error-pattern.md
└── YYYY-MM-DD-ISSUE-ID.md     # Individual issues
```

## Issue Status Legend

- 🆕 `new` - Just created, needs investigation
- 🔍 `investigating` - Currently being debugged
- 🔧 `in-progress` - Fix is being implemented
- ✅ `resolved` - Issue has been fixed
- 🚫 `closed` - Issue closed without fix (duplicate, wont-fix, etc.)
- 🔄 `reopened` - Previously resolved but issue returned

## Issues Log

| ID        | Title                                                                     | Type        | Severity | Status | Created    | Resolved |
| --------- | ------------------------------------------------------------------------- | ----------- | -------- | ------ | ---------- | -------- |
| ISSUE-172 | E2E tests failing due to missing database tables in test environment      | integration | high     | 🆕 new | 2025-07-09 | -        |
| ISSUE-66  | Refactor MultiStepForm to eliminate TypeScript memory exhaustion issues   | performance | high     | 🆕 new | 2025-06-18 | -        |
| ISSUE-27  | MCP Docker Infrastructure - Multiple Servers Not Achieving Healthy Status | integration | high     | 🆕 new | 2025-06-12 | -        |
| ISSUE-24  | Vitest Module Not Found in Web App Workspace                              | error       | high     | 🆕 new | 2025-01-06 | -        |

## Commands

- **Log new issue**: `/log-issue [file|github|both]`
- **Debug existing issue**: `/debug-issue ISSUE-ID`

## Patterns Library

Common patterns discovered through issue resolution:

- [Add patterns as they are identified]
| ISSUE-351 (GitHub #351) | E2E Test Execution Inconsistency | medium | new | 2025-09-19 | 2025-09-19-ISSUE-351 (GitHub #351).md |
| ISSUE-352 (GitHub #352) | Test Command Background Execution | medium | new | 2025-09-19 | 2025-09-19-ISSUE-352 (GitHub #352).md |
