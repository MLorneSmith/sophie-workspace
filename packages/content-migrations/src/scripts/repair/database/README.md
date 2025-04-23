# Database Repair Scripts

This directory contains scripts that address foundational database structure issues. These scripts ensure that the database schema, tables, columns, and relationships are properly configured.

## Script Purposes

| Script                                | Purpose                                                       |
| ------------------------------------- | ------------------------------------------------------------- |
| `fix-uuid-tables.ts`                  | Ensures UUID tables have all required columns and constraints |
| `fix-relationship-columns.ts`         | Adds and configures relationship ID columns in tables         |
| `fix-relationships-direct.ts`         | Direct SQL repairs for relationship tables                    |
| `fix-payload-relationships-strict.ts` | Applies strict type checking to Payload CMS relationships     |

## Key Database Structures

### UUID Tables

UUID tables are critical to the system as they store items with unique identifiers. The scripts ensure these tables have:

- Primary key columns
- Foreign key constraints
- Required relationship columns
- Proper indexes

### Relationship Tables

The relationship tables (`*_rels`) maintain the connections between different entities. These scripts ensure:

- Correct relationship structure
- Proper foreign key constraints
- Bidirectional references where needed
- Consistent naming conventions

## Running Order

The database repair scripts should be run first in the migration process, as they establish the foundation for all other repairs:

1. `fix-uuid-tables.ts` - First ensure the base tables are correct
2. `fix-relationship-columns.ts` - Add and fix relationship columns
3. `fix-relationships-direct.ts` - Direct SQL fixes for relationship issues
4. `fix-payload-relationships-strict.ts` - Apply strict type checking

## Safety Considerations

These scripts modify core database structures, so they include:

- Transaction support to ensure atomicity
- Verification before and after changes
- Error handling and reporting
- Backup checks where appropriate
