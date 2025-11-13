# supabase database health check

I want to create a claude code slash command that conducts a database health check.

## Current database setup

We are using supabase. We have a local instance and a remote instance.

We have been developing a structured approach to resetting the database. Read .claude/scratch/db-reset-commands.md

## Payload reset issues

We have been running into issues when we reset the payload database. These issues manifest themselves as nextjs errors on collection pages within payload or payload collections not displaying the data that has been seeded.

## Requirements

1. We want to test the health of both the local and remote instances of supabase
2. We need to figuere out a way to test that the payload schema is setup correctly and there are no errors when using payload.

## Your task

1. Make a recommendation on what a db healthcheck slash command should include
2. Make a recommendation on how to monitor for payload reset issues
