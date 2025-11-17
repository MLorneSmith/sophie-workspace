# Database

We use supabase. We have a local instance of supabase and a remote instance.

## Migration file locations

We have migrations for our supabase database in two locations:

web app database: apps/web/supabase/migrations
payload app database (payload scehma): apps/payload/src/migrations

## Four configurations

1. Web app local
2. Web app remote
3. Payload app local
4. Payload app remote

## Reset commands

I want four separate database reset commands, one for each 'configuration'. I then also want a fifth command that resets all four configurations.
I want the four separate commands saved as workflows in this directory: .claude/instructions/workflows. They can then be initialized with this command: .claude/commands/workflow.md

### Previous issues

We have had significant issues in the past properly reseting the databases, so we need to be absolutely sure that things are working correctly as we build out these commands

### Current commands

We currently have one command written

1. Web app local: .claude/instructions/workflows/web-app-local-reset.md

We have an older command that I believe is working well:

1. Payload app remote: .claude/instructions/workflows/remote-db-reset.md

We have another file which seems to contain multiple commands, and I am uncertain of its status:

1. .claude/instructions/workflows/local-db-reset.md

### Next steps

1. Create the web app remote reset command
2. Test the payload app remote command; fix if necessary
3. Create the Payload app local command
4. Create the consolidated db reset command, thinking very hard about what the best order is to run each configuration
