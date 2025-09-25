# Supabase dB reset commands

We want to create a claude code slash command that will reset the subabase databases that we have in our project.

## Project overview:

We have multiple apps in a turborepo:
- web (uses supabase and has migrations: apps/web/supabase/migrations )
- payload (uses supabase and has migrations: apps/payload/src/migrations )
- dev-tool
- e2e (uses supabse and has migrations: apps/e2e/supabase/migrations )

Read .claude/context/architecture/project-architecture.md

### Enivironments

We have a local setup, with docker cotnainers
Remotely, the app is hosted on vercel. 
Remotely, the databse is on supabase. 

Read .claude/context/infrastructure/deployment/docker-setup.md

### Supabase CLI is installed

Read .claude/context/tools/cli/supabase-cli.md

## Supabase dB Schemas

We have two main schemas: 
- payload, for the payload tables
- public, for the web tables

## Payload subabase dB build issues

We have had issues when building the payload supabase database.  Payload will build successfully, but we get errors in runtime when
- landing on the login screen and attempting to create our first user - get an error
- when visiting specific collection pages - no content
- variety of other errors

We have attemted to fix this before, but did not finalize our process.

Read: .claude/instructions/workflows/local-db-reset/LOCAL_DATABASE_RESET_GUIDE.md

# Your Task

1. Design a supabase-reset command that can
   1. reset the local databases for all three apps
   2. reset the remote databases for web and payload
   3. Incorporate checks in a similar way to what the .claude/instructions/workflows/local-db-reset/LOCAL_DATABASE_RESET_GUIDE.md does
   4. Potentially run some e2e tests on payload locally to confirm that the local reset has worked properly (I am creating those tests in a separate task)