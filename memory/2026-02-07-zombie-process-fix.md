# 2026-02-07 — Zombie Process Fix

*Truncated 2026-03-01 — full history in git*

## Issue
Council feature not working despite code fixes and restarts.

## Root Cause
Zombie process holding port 3001, serving stale code.

## Fix
Force-killed zombie process with `fuser -k 3001/tcp`. PM2 restarts weren't killing the orphaned process.

## Lesson
When service won't update despite restarts, check for zombie processes holding the port.
