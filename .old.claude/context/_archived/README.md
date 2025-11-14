# Archived Context Files

This directory contains context files that have been archived during the consolidation process. Files are archived (not deleted) to preserve historical context while cleaning up active documentation.

## Archive Reasons

### Duplicate Files

- `feature-implementation-workflow.md` - Duplicates CCPM system documentation
- `project-overview.md` - Superseded by project-architecture.md

### Incomplete/Trivial Files

- `schema.md` - Only 1 line, incomplete placeholder
- `bash-working-directory.md` - Trivial content not requiring AI guidance

### Deprecated Technology

Payload CMS files (project migrated away from Payload):

- `update-payload-version.md`
- `create-payload-custom-component.md`
- `seeding-guide.md`
- `seeding-architecture.md`
- `seeding-troubleshooting.md`

### Project-Specific UI Details

- `typography-system.md` - Project-specific design details, not AI architectural guidance

### Legacy Agent Roles

All 17 files from `team/roles/*.md` - Legacy agent role definitions no longer in use. The project now uses a streamlined agent system defined in active documentation.

## Finding Replacement Content

For archived files, consult the Migration Guide:

- `.old.claude/context/MIGRATION_GUIDE.md`

Or search the new consolidated documentation:

```bash
grep -r "keyword" .claude/docs/
```

## Restoration

If you need to restore any archived file:

```bash
cp .old.claude/context/_archived/[filename] [new-location]
```
