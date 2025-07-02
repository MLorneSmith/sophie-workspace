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

## Seed protocol

We are designing a protocol to seed the payload schema with data.

Read .claude/scratch/payload-seed-protocol-design.md

### Conversion of raw data to data .json files

We have a set of raw data files in this directory: \\wsl.localhost\Ubuntu\home\msmith\projects\2025slideheroes\apps\payload\src\seed-data-raw

We have designed a system that has converted this data into the necessary json files. Read .claude/scratch/data-conversion-plan.md

### Current status

Review the current json files in apps/payload/src/seed/seed-data and evaluate the quality of the json

1. Is it structed in the way we need given our collections?
2. Do we have all the necessary json files?
3. Are there any issues with the json files?
