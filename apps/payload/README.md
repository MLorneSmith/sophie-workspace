# Payload CMS

Payload CMS application for SlideHeroes - manages courses, lessons, quizzes, and documentation.

## Quick Start

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Access admin UI
open http://localhost:3020/admin
```

## Database Seeding

Payload uses an automated seeding system to populate the database with test and development data.

### Quick Commands

```bash
# Seed all collections (most common)
pnpm seed:run

# Validate data without creating records
pnpm seed:dry

# Verbose validation with detailed output
pnpm seed:validate

# Seed specific collections only
pnpm seed:courses
```

### Integration with Supabase Reset

```bash
# Reset database and seed in one command
tsx .claude/scripts/database/supabase-reset.ts local --seed
```

### Documentation

For complete documentation on the seeding system, see:

- [Seeding Guide](../../.claude/context/tools/payload/seeding-guide.md) - Complete usage guide
- [Troubleshooting](../../.claude/context/tools/payload/seeding-troubleshooting.md) - Common issues and solutions
- [Architecture](../../.claude/context/tools/payload/seeding-architecture.md) - Technical deep dive

### Quick Reference

**When to use each command**:

| Command | Use Case |
|---------|----------|
| `pnpm seed:run` | Fresh database setup, E2E test prep |
| `pnpm seed:dry` | Pre-commit validation, debugging |
| `pnpm seed:validate` | Detailed debugging with verbose output |
| `pnpm seed:courses` | Quick iteration on course-related collections |

**Performance**: ~82 seconds for full seed (316+ records across 10 collections)

**Safety**: Seeding is blocked in production (`NODE_ENV=production`)

## Development

### Environment Variables

Required environment variables (`.env` file):

```bash
DATABASE_URI=postgresql://postgres:postgres@localhost:54322/postgres
PAYLOAD_SECRET=your-secret-key
NODE_ENV=development
```

### Available Scripts

```bash
# Development
pnpm dev                # Start dev server (port 3020)
pnpm build              # Build for production

# Database
pnpm generate:types     # Generate TypeScript types from database

# Data Management
pnpm seed:run           # Seed all collections
pnpm seed:dry           # Dry-run validation
pnpm seed:validate      # Verbose validation
pnpm seed:courses       # Seed course collections only

# Code Quality
pnpm lint               # Run linter
pnpm format             # Format code
pnpm check              # Run all checks

# Testing
pnpm test               # Run tests
pnpm test:run           # Run tests once
pnpm test:coverage      # Test coverage report
```

## Collections

Payload manages the following collections:

- **Courses**: Course definitions and metadata
- **Course Lessons**: Individual lessons with Lexical content
- **Course Quizzes**: Quiz definitions per course
- **Quiz Questions**: Individual quiz questions with options
- **Surveys**: Survey definitions
- **Survey Questions**: Individual survey questions
- **Posts**: Blog posts and articles
- **Documentation**: Help documentation
- **Media**: Uploaded media files (images, videos)
- **Downloads**: Downloadable resources (PDFs, templates)
- **Users**: User accounts and authentication

## Architecture

Payload CMS is integrated with:

- **Database**: PostgreSQL via Supabase
- **Storage**: S3-compatible storage for media
- **Auth**: Payload's built-in authentication
- **API**: REST and GraphQL APIs
- **Admin UI**: React-based admin interface

## Additional Documentation

- [Payload CMS Documentation](https://payloadcms.com/docs)
- [Project CLAUDE.md](../../CLAUDE.md) - Project-wide conventions
- [Seeding Implementation Plan](../../.claude/tracking/implementations/payload-seed/plan.md)

## Support

For issues or questions:

- Check [seeding troubleshooting guide](../../.claude/context/tools/payload/seeding-troubleshooting.md)
- Review implementation plan
- Open GitHub issue with `[payload]` tag
