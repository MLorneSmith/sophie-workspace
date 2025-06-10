# Adopt the database engineer role

Read .claude/roles/data-engineer.md

# Further context

## Database setup

We have setup supabase remotely and locally. we have been having significant issues with migrations and schema drift.

Ultimately I would like to create wrokflows for claude code to:

- Reset remote db
- Reset local db
- Seed remote db
- Seed local db

## Remote Database Reset Workflow

We have created a remote-db-reset workflow file at `.claude/workflows/remote-db-reset.md`

This file provides Claude Code instructions for how to reset the payload schema on the remote supabase database.

# Local Payload Database Reset Workflow

We are experiencing errors with payload in production

# Your Task

Ultrathink about what we need this remote-db-reset workflow command to do.
Create the workflow file.
