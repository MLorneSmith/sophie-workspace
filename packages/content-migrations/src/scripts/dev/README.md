# Development and Testing Scripts

This directory contains scripts that are used for development, testing, and debugging purposes. These scripts are not part of the main migration workflow but are kept here for reference and development support.

## Scripts in this Directory

- `analyze-lesson-content.ts` - Script for analyzing lesson content structure
- `test-yaml-lesson-generation.ts` - Script for testing the YAML lesson generation process

## Usage

These scripts can be run directly with:

```
pnpm exec tsx src/scripts/dev/[script-name].ts
```

## Purpose

These scripts serve various development and testing purposes:

1. **Analyzing content structure** - Scripts to examine how content is structured in raw form
2. **Testing generation processes** - Scripts to test the generation of various output formats
3. **Debugging migration issues** - Scripts to help debug specific migration issues

## Note

Scripts in this directory are not part of the primary migration flow and are generally not called from the main `reset-and-migrate.ps1` script. They are maintained here for development purposes and should not be relied upon for production migration processes.
