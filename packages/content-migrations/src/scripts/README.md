# Content Migration Scripts

This directory contains scripts for the content migration system, organized by their role in the migration process.

## Directory Structure

```
scripts/
├─ setup/            # Scripts run in the setup phase
├─ processing/       # Scripts run in the processing phase
│  ├─ raw-data/      # Process raw data from src/data/raw
│  └─ sql/           # Generate SQL files for database seeding
├─ loading/          # Scripts run in the loading phase
│  ├─ migration/     # Core migration scripts that import content into Payload
│  ├─ import/        # Import scripts for external data sources (like R2)
│  └─ repair/        # Relationship and data fix scripts run after migration
├─ verification/     # Scripts that verify data integrity and correctness
└─ core/             # Main migration execution scripts
```

## Script Types

- `fix-*`: Scripts that repair or correct data issues
- `verify-*`: Scripts that verify data integrity
- `migrate-*`: Scripts that perform actual migrations
- `generate-*`: Scripts that generate output files
- `process-*`: Scripts that transform raw data

## Migration Process Flow

1. **Setup Phase**: Scripts that prepare the database and schema
2. **Processing Phase**: Scripts that process raw data and generate SQL
3. **Loading Phase**: Scripts that load content into the database
4. **Verification Phase**: Scripts that verify the migration was successful

## Usage

Most scripts are intended to be run through the main `reset-and-migrate.ps1` script at the project root, which orchestrates the content migration process.

Individual scripts can be run directly using:

```
pnpm exec tsx src/scripts/<script-path>
```

Or through the npm scripts defined in package.json:

```
pnpm run <script-name>
```
