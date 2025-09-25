# Payload CMS Seed Protocol Design

## Overview

This document outlines the seed protocol design for the SlideHeroes Payload CMS application. After analyzing the project requirements and existing infrastructure, we've opted for a simplified approach that leverages Payload's Local API while working with our existing cloud storage setup.

## Key Constraints & Context

1. **Existing Infrastructure**
   - Database reset commands already exist and are maintained separately
   - Media and download files are already stored in Cloudflare R2
   - Payload is configured with S3 adapter for R2 integration
   - PostgreSQL database with UUID-based IDs

2. **Payload-Specific Considerations**
   - Payload automatically manages complex table structures (main tables, relationships, locales, versions)
   - Direct database manipulation would bypass Payload's internal logic
   - Payload's Local API ensures data integrity and proper handling of all features

3. **Collection Dependencies**
   ```
   Users (independent)
   Media (independent - references R2 files)
   Downloads (independent - references R2 files)
   Posts (depends on Media)
   Documentation (depends on Media)
   Courses (depends on Media, Downloads)
   CourseLessons (depends on Courses, Downloads)
   CourseQuizzes (depends on CourseLessons)
   QuizQuestions (depends on CourseQuizzes)
   Surveys (depends on CourseLessons)
   SurveyQuestions (depends on Surveys)
   ```

## Design Decision: Simple Sequential Seeding

### Why Not Complex Multi-Stage Architecture?

Initially considered a complex multi-stage seeding system with:
- Transaction management per stage
- Parallel processing within stages
- Environment-specific configurations
- Elaborate error recovery

**Rejected because:**
- Over-engineered for the actual requirements
- Added unnecessary complexity
- Payload already handles transactions internally
- Collection count is manageable (< 15 collections)
- Dependencies are straightforward and linear

### Selected Approach: Hybrid Data Format Sequential Seeding

**Core Principles:**
1. **Simplicity First** - Single script that processes collections in dependency order
2. **Data-Driven** - Seed data stored in appropriate formats (JSON for structure, Markdown for content)
3. **Reference Mapping** - Simple ID mapping for handling relationships
4. **No File Uploads** - Just create records pointing to existing R2 files

**Benefits:**
- Easy to understand and maintain
- Minimal code footprint
- Leverages Payload's validation
- Can be run multiple times (with proper duplicate handling)
- Easy to extend with new collections
- Content-friendly formats for non-developers

## Implementation Strategy

### 1. Seed Data Structure
```
apps/payload/
├── src/
│   ├── seed/
│   │   ├── index.ts              # Main seed script
│   │   ├── types.ts              # TypeScript interfaces for seed data
│   │   └── utils.ts              # Helper functions (markdown parsing, etc.)
│   └── seed-data/                # Raw data files
│       ├── users.json
│       ├── media-references.json  # References to R2 files
│       ├── courses/
│       │   ├── web-development.json
│       │   ├── intro-to-react.json
│       │   └── _index.json       # Course listing/metadata
│       ├── lessons/
│       │   ├── web-dev/
│       │   │   ├── 01-getting-started.json
│       │   │   ├── 02-html-basics.json
│       │   │   └── _index.json
│       │   └── react/
│       │       └── ...
│       ├── content/
│       │   ├── posts/
│       │   │   ├── 2024-01-welcome.md
│       │   │   └── 2024-02-update.md
│       │   └── documentation/
│       │       ├── getting-started.md
│       │       └── api-reference.md
│       └── relationships.json    # Defines how entities connect
└── payload.config.ts      # Register seed as bin script
```

### 2. Execution Flow
1. Initialize Payload with config
2. Load all seed data files (JSON and Markdown)
3. Process Markdown files to extract frontmatter and convert content to Lexical format
4. Process collections in dependency order
5. For each collection:
   - Load appropriate seed data (JSON or processed Markdown)
   - Replace reference placeholders with actual IDs
   - Create records via Payload Local API
   - Store created IDs for future references

### 3. Reference System
Using a simple reference notation in JSON:
- `{ref:course:web-dev}` - Gets replaced with actual ID after creation
- Allows defining relationships before records exist
- Simple string replacement implementation

### 4. Media/Downloads Handling
Since files already exist in R2:
- Seed data only contains metadata (filename, URL, mimeType)
- No actual file upload operations
- URLs point to existing R2 resources
- Media references stored in `media-references.json`
- Downloads tracked similarly with appropriate metadata

## Data Format Examples

### JSON Format (Structured Data)
```json
// seed-data/courses/web-development.json
{
  "_ref": "course:web-dev",
  "title": "Introduction to Web Development",
  "slug": "intro-web-dev",
  "description": "Learn the fundamentals of modern web development",
  "status": "published",
  "publishedAt": "2024-01-15T10:00:00Z"
}
```

### Markdown Format (Content-Heavy Collections)
```markdown
// seed-data/content/posts/2024-01-welcome.md
---
title: Welcome to SlideHeroes
slug: welcome-to-slideheroes
author: "{ref:user:admin}"
status: published
publishedAt: 2024-01-15T10:00:00Z
featuredImage: "{ref:media:welcome-banner}"
---

# Welcome to SlideHeroes

We're excited to launch our new learning platform...
```

### Media References
```json
// seed-data/media-references.json
[
  {
    "_ref": "media:welcome-banner",
    "filename": "welcome-banner.jpg",
    "alt": "Welcome to SlideHeroes",
    "url": "https://r2.slideheroes.com/media/welcome-banner.jpg",
    "mimeType": "image/jpeg",
    "filesize": 245760,
    "width": 1920,
    "height": 1080
  }
]
```

## Example Implementation

```typescript
// src/seed/index.ts
import { getPayload } from 'payload'
import { glob } from 'glob'
import matter from 'gray-matter'
import { readFile } from 'fs/promises'
import config from '../payload.config'

export const seed = async () => {
  const payload = await getPayload({ config })
  const idMap = new Map<string, string>()
  
  // Load all seed data
  const seedData = await loadSeedData('./src/seed-data')
  
  // Order matters - dependencies first
  const collections = [
    'users', 'media', 'downloads', 'courses', 
    'course_lessons', 'course_quizzes', 'quiz_questions'
  ]
  
  for (const collection of collections) {
    const items = seedData[collection] || []
    for (const item of items) {
      const data = replaceReferences(item, idMap)
      const created = await payload.create({ collection, data })
      if (item._ref) idMap.set(item._ref, created.id)
    }
  }
}

async function loadSeedData(directory: string) {
  const data: Record<string, any[]> = {}
  
  // Load JSON files
  const jsonFiles = await glob('**/*.json', { cwd: directory })
  for (const file of jsonFiles) {
    const content = JSON.parse(await readFile(`${directory}/${file}`, 'utf-8'))
    // Process based on file location...
  }
  
  // Load and process Markdown files
  const mdFiles = await glob('**/*.md', { cwd: directory })
  for (const file of mdFiles) {
    const { data: frontmatter, content } = matter(await readFile(`${directory}/${file}`, 'utf-8'))
    // Convert markdown to Lexical format
    const lexicalContent = await markdownToLexical(content)
    // Add to appropriate collection based on file path
  }
  
  return data
}
```

## Rationale Summary

1. **Complexity vs. Requirements**
   - Our requirements are straightforward
   - Complex architecture would add maintenance burden
   - Simple approach meets all needs

2. **Leverage Existing Infrastructure**
   - Database reset handled separately
   - Files already in R2
   - Focus only on creating database records

3. **Payload Best Practices**
   - Use Local API (never direct DB access)
   - Let Payload handle internal complexity
   - Trust Payload's validation and transformation

4. **Developer Experience**
   - Easy to understand and modify
   - Quick to run and debug
   - Minimal learning curve for team

5. **Data Format Flexibility**
   - JSON for structured data (courses, users, media references)
   - Markdown for content-heavy collections (posts, documentation)
   - Separation allows non-developers to contribute content
   - TypeScript interfaces ensure type safety

## Future Considerations

If requirements grow, we can enhance with:
- Duplicate detection (check existing records)
- Progress logging for large datasets
- Environment-specific seed directories (development/, staging/, production/)
- Faker.js integration for test data
- YAML support for more human-readable structured data
- CSV import for bulk user/student data
- Validation of R2 file existence before seeding

But for now, **simplicity wins**.

## Usage

```bash
# Reset database (existing command)
pnpm db:reset

# Run seed
pnpm payload seed
# or
pnpm seed
```

## Best Practices for Seed Data Management

1. **File Organization**
   - One file per major entity (course, post, etc.)
   - Use meaningful filenames that indicate content
   - Keep files under 1000 lines for maintainability
   - Use `_index.json` files for collection metadata

2. **Content Guidelines**
   - Use JSON for data with many fields or complex structure
   - Use Markdown for content-focused collections
   - Maintain consistent frontmatter structure across Markdown files
   - Document the `_ref` naming convention for your team

3. **Version Control**
   - Commit seed data changes with descriptive messages
   - Review seed data changes as carefully as code
   - Consider using Git LFS for large seed datasets

4. **TypeScript Safety**
   ```typescript
   // src/seed/types.ts
   interface CourseSeedData {
     _ref?: string
     title: string
     slug: string
     description?: string
     status: 'draft' | 'published'
   }
   ```

## Conclusion

By choosing a hybrid approach (JSON + Markdown) with sequential processing, we achieve a maintainable seed system that respects Payload's architecture while avoiding unnecessary complexity. This design focuses on what we actually need: creating database records that reference existing cloud storage files, with proper relationship handling, while allowing both developers and content creators to contribute seed data in appropriate formats.