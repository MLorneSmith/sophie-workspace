---
description: Prime the context window by listing all files and reading the README to understand the codebase structure. Use at the start of a session for initial context
model: haiku
allowed-tools: [Read, Grep, Glob, Bash, Task, TodoWrite]
---

# Prime
> Execute the following sections to understand the codebase then summarize your understanding.

## Run
git ls-files

## Read
README.md