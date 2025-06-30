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

We need to convert this data into the necessary json files that will be stored in "\\wsl.localhost\Ubuntu\home\msmith\projects\2025slideheroes\apps\payload\src\seed-data"

Develop a plan to do so. Include in this plan the following:

1. Determine if we have a compelte data set given the payload collections that we have
2. Determine how the data should be split
3. Determine how to parse the various data types into json
4. Determine what relationships need to be established and how that should be handled in the json
   
Add any additional steps that you feel are necessary