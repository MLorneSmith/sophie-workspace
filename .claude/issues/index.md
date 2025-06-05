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
| ID | Title | Type | Severity | Status | Created | Resolved |
|----|-------|------|----------|--------|---------|----------|
| *Issues will be listed here automatically* |

## Commands
- **Log new issue**: `/log-issue [file|github|both]`
- **Debug existing issue**: `/debug-issue ISSUE-ID`

## Patterns Library
Common patterns discovered through issue resolution:
- [Add patterns as they are identified]