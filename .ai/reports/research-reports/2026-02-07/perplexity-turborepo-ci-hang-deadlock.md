# Perplexity Research: Turborepo v2 Hanging in CI

**Date**: 2026-02-07
**Agent**: perplexity-expert

## Summary

Root cause: Turbo v2 strict env mode blocks the CI variable from reaching Vitest.

## Fix

Add passThroughEnv to the test task in turbo.json.

See full findings delivered in conversation.
