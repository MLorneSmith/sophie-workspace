# Perplexity Research: Payload CMS 3.x Empty Migration Issues

**Date**: 2025-12-05
**Agent**: perplexity-expert
**Search Type**: Combined (Chat API + Search API)

## Query Summary

Researched why `payload migrate:create` generates empty migration files in Payload CMS 3.x with PostgreSQL/Drizzle adapter.

## Root Cause: Push Mode Auto-Sync

The most common reason for empty migrations is **push mode** being enabled by default.

**How it works**:
- Payload uses Drizzle's `push: true` mode by default
- This automatically syncs schema changes to database at startup
- When you run `migrate:create`, database already matches collection config
- Result: "No schema changes detected" → empty migration file
