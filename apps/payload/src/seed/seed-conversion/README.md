# Payload CMS Seed Data Conversion System

This directory contains a comprehensive conversion system that transforms raw seed data files (mdoc, yaml, html, ts)
into JSON format compatible with Payload CMS's Local API seeding system.

## Overview

The conversion system processes various file formats from `apps/payload/src/seed/seed-data-raw/` and generates
structured JSON files in `apps/payload/src/seed/seed-data/` that respect collection dependencies and relationships.

## Features

- **Multi-format Support**: Converts mdoc (Markdown with frontmatter), YAML, HTML, and TypeScript files
- **Lexical Integration**: Converts markdown content to Payload's Lexical editor format
- **Cross-collection References**: Uses `{ref:collection:identifier}` format for relationships
- **Media Management**: Extracts and maps media references to Cloudflare R2 storage
- **Smart Course Generation**: Infers course structure from lesson organization
- **CLI Interface**: Command-line tool with dry-run mode and selective conversion

## Quick Start

```bash
# Convert all collections
pnpm seed:convert

# Dry run (no file writes)
pnpm seed:convert --dry-run

# Convert specific collections
pnpm seed:convert --collections posts courses

# Verbose output
pnpm seed:convert --verbose
```

## Architecture

### Directory Structure

```text
src/seed/
├── seed-conversion/            # Conversion system
│   ├── index.ts               # Main CLI entry point
│   ├── validate.ts            # JSON validation utility
│   ├── types.ts               # TypeScript type definitions
│   ├── tsconfig.json         # TypeScript configuration
│   ├── converters/           # Collection-specific converters
│   │   ├── posts-converter.ts
│   │   ├── courses-converter.ts
│   │   ├── course-lessons-converter.ts
│   │   ├── course-quizzes-converter.ts
│   │   ├── quiz-questions-converter.ts
│   │   ├── surveys-converter.ts
│   │   ├── survey-questions-converter.ts
│   │   └── documentation-converter.ts
│   ├── extractors/           # Reference extraction utilities
│   │   ├── media-extractor.ts
│   │   └── download-extractor.ts
│   ├── parsers/              # File format parsers
│   │   ├── mdoc-parser.ts    # Full Payload integration
│   │   ├── mdoc-parser-simple.ts  # Simplified parser
│   │   ├── yaml-parser.ts
│   │   ├── html-parser.ts
│   │   └── ts-parser.ts
│   └── utils/                # Shared utilities
│       ├── reference-manager.ts
│       └── markdown-to-lexical.ts
├── seed-data/                # Generated JSON output
└── seed-data-raw/            # Source data files
```

### Conversion Process

1. **Media & Download Extraction**: Scans all source files for media and download references
2. **Reference Management**: Builds cross-collection reference mappings
3. **Collection Conversion**: Processes collections in dependency order:
   - Users (no dependencies)
   - Media/Downloads (references extracted)
   - Posts (depends on users, media)
   - Courses (depends on downloads)
   - Quiz Questions (no dependencies)
   - Survey Questions (no dependencies)
   - Course Quizzes (depends on courses, quiz questions)
   - Surveys (depends on downloads, survey questions)
   - Course Lessons (depends on courses, quizzes, surveys)
   - Documentation (depends on media)

## Collection Details

### Posts

- **Source**: `seed-data-raw/posts/*.mdoc`
- **Output**: `seed-data/posts.json`
- **Features**: Markdown to Lexical conversion, author references, featured images

### Courses

- **Source**: Inferred from lesson structure in `seed-data-raw/lessons/`
- **Output**: `seed-data/courses.json`
- **Features**: Auto-generated from lesson numbering (100s digit = course ID)

### Course Lessons

- **Source**: `seed-data-raw/lessons/*.mdoc`
- **Output**: `seed-data/course-lessons.json`
- **Features**: Video ID extraction, quiz/survey references, course mapping

### Course Quizzes

- **Source**: `seed-data-raw/quizzes/*.mdoc`
- **Output**: `seed-data/course-quizzes.json`
- **Features**: Question mappings, course/lesson relationships

### Quiz Questions

- **Source**: `seed-data-raw/quiz-questions/*.ts`
- **Output**: `seed-data/quiz-questions.json`
- **Features**: TypeScript parsing, Lexical explanations, UUID generation

### Surveys

- **Source**: `seed-data-raw/surveys/*.yaml`
- **Output**: `seed-data/surveys.json`
- **Features**: YAML parsing, question mappings, course/lesson relationships

### Survey Questions

- **Source**: `seed-data-raw/surveys/*.yaml`
- **Output**: `seed-data/survey-questions.json`
- **Features**: Question extraction, type mapping, validation rules

### Documentation

- **Source**: `seed-data-raw/documentation/**/*.mdoc`
- **Output**: `seed-data/documentation.json`
- **Features**: Hierarchical structure, breadcrumbs, parent-child relationships

## Reference System

The conversion system uses a standardized reference format for cross-collection relationships:

```typescript
{
  "course": "{ref:courses:course-1}",           // Single reference
  "questions": [                                // Array of references
    "{ref:quiz-questions:uuid-1}",
    "{ref:quiz-questions:uuid-2}"
  ]
}
```

### Reference Types

- `{ref:courses:course-id}`
- `{ref:course-lessons:lesson-id}`
- `{ref:course-quizzes:quiz-id}`
- `{ref:quiz-questions:uuid}`
- `{ref:surveys:survey-id}`
- `{ref:survey-questions:uuid}`
- `{ref:documentation:doc-id}`
- `{ref:media:file-path}`
- `{ref:downloads:file-path}`

## Media and Downloads

### Media References

All image references in content are extracted and mapped to Cloudflare R2 storage:

```json
{
  "originalPath": "/cms/images/example/image.png",
  "r2Key": "cms/images/example/image.png",
  "r2Url": "https://storage.slideheroes.com/cms/images/example/image.png",
  "contentType": "image/png",
  "fileSize": null
}
```

### Download References

Download links are extracted and mapped similarly:

```json
{
  "originalPath": "/downloads/example.pdf",
  "r2Key": "downloads/example.pdf",
  "r2Url": "https://storage.slideheroes.com/downloads/example.pdf",
  "contentType": "application/pdf",
  "fileSize": null
}
```

## Lexical Format

Content is converted to Payload's Lexical editor format:

```json
{
  "root": {
    "type": "root",
    "format": "",
    "indent": 0,
    "version": 1,
    "children": [
      {
        "type": "heading",
        "tag": "h2",
        "children": [
          {
            "type": "text",
            "text": "Example Heading"
          }
        ]
      },
      {
        "type": "paragraph",
        "children": [
          {
            "type": "text",
            "text": "Example paragraph content."
          }
        ]
      }
    ]
  }
}
```

### Special Content Types

#### Bunny Video Components

```markdown
{% bunny bunnyvideoid="video-id-here" /%}
```

Converted to:

```json
{
  "type": "bunny-video",
  "videoId": "video-id-here",
  "children": [{"type": "text", "text": ""}]
}
```

#### Highlight Components

```markdown
{% highlight "Important note here" /%}
```

Converted to:

```json
{
  "type": "highlight",
  "content": "Important note here",
  "children": [{"type": "text", "text": "Important note here"}]
}
```

## Validation

The system includes comprehensive JSON validation:

```bash
# Run validation on generated files
npx tsx src/seed/seed-conversion/validate.ts
```

Validation checks:

- Required field presence
- Field type correctness
- Reference format validation
- Cross-collection reference integrity
- Date format validation

## CLI Options

```bash
npx tsx src/seed/seed-conversion/index.ts [options]

Options:
  -d, --dry-run                    Run without writing files
  -v, --verbose                    Verbose output
  -c, --collections <collections>  Specific collections to convert
  -h, --help                       Display help
```

### Examples

```bash
# Convert everything with verbose output
npx tsx src/seed/seed-conversion/index.ts --verbose

# Dry run for posts and courses only
npx tsx src/seed/seed-conversion/index.ts --dry-run --collections posts courses

# Convert just lessons and quizzes
npx tsx src/seed/seed-conversion/index.ts --collections course-lessons course-quizzes
```

## Output Files

The conversion process generates the following files in `src/seed/seed-data/`:

### Primary Collections

- `posts.json` - Blog posts with Lexical content
- `courses.json` - Course definitions and metadata
- `course-lessons.json` - Individual lessons with videos/quizzes
- `course-quizzes.json` - Quiz definitions with question references
- `quiz-questions.json` - Question bank with Lexical explanations
- `surveys.json` - Survey definitions with question references
- `survey-questions.json` - Survey question bank
- `documentation.json` - Help/support documentation with hierarchy

### Reference Files

- `media-references.json` - Media file mappings to R2 storage
- `download-references.json` - Download file mappings to R2 storage
- `quiz-questions-mapping.json` - Quiz to questions relationships
- `survey-questions-mapping.json` - Survey to questions relationships
- `reference-mappings.json` - All cross-collection reference mappings

## Integration with Payload

The generated JSON files are designed to work with Payload's Local API seeding:

```typescript
import { payload } from 'payload'

// Seed a collection
const posts = JSON.parse(fs.readFileSync('src/seed/seed-data/posts.json', 'utf-8'))
for (const post of posts) {
  await payload.create({
    collection: 'posts',
    data: post
  })
}
```

### Reference Resolution

References in the format `{ref:collection:identifier}` need to be resolved during seeding:

```typescript
function resolveReferences(data, referenceMap) {
  // Replace {ref:collection:id} with actual Payload document IDs
  return JSON.parse(
    JSON.stringify(data).replace(
      /\{ref:([^:]+):([^}]+)\}/g,
      (match, collection, identifier) => {
        return referenceMap[collection]?.[identifier] || match
      }
    )
  )
}
```

## Troubleshooting

### Common Issues

1. **Missing Frontmatter**: Ensure mdoc files have valid YAML frontmatter
2. **Invalid References**: Check that referenced collections exist
3. **Media Not Found**: Verify media files exist in R2 storage
4. **Lexical Errors**: Check markdown syntax for unsupported formats

### Debug Mode

Enable verbose logging to troubleshoot conversion issues:

```bash
npx tsx src/seed/seed-conversion/index.ts --verbose --dry-run
```

### Validation Errors

Run validation to check generated JSON:

```bash
npx tsx src/seed/seed-conversion/validate.ts
```

Common validation fixes:

- Ensure all required fields are present
- Check reference format: `{ref:collection:identifier}`
- Verify date formats are ISO 8601
- Confirm boolean fields are not strings

## Development

### Adding New Converters

1. Create converter in `converters/new-collection-converter.ts`
2. Implement conversion logic following existing patterns
3. Add to main conversion order in `index.ts`
4. Update validation schema in `validate.ts`
5. Add tests for the new converter

### Parser Extensions

Extend parsers in `parsers/` directory to support new content formats:

- Add new component types to Lexical conversion
- Support additional frontmatter fields
- Handle new reference patterns

### Testing

Create unit tests for converters:

```typescript
import { convertNewCollection } from '../converters/new-collection-converter'

describe('New Collection Converter', () => {
  test('converts basic structure', async () => {
    const result = await convertNewCollection(mockData)
    expect(result).toMatchSnapshot()
  })
})
```

## Performance

### Optimization Tips

1. **Selective Conversion**: Use `--collections` flag for faster iteration
2. **Dry Run**: Use `--dry-run` to test without file I/O
3. **Batch Processing**: Process files in batches for large datasets
4. **Caching**: Reference mappings are cached between conversions

### Benchmarks

Typical conversion times on a modern machine:

- Posts (8 items): ~100ms
- Lessons (25 items): ~200ms  
- Quiz Questions (94 items): ~500ms
- Full conversion: ~2-3 seconds

## Future Enhancements

- [ ] Incremental conversion (only changed files)
- [ ] Parallel processing for large datasets
- [ ] Advanced Lexical component support
- [ ] Real-time validation during conversion
- [ ] Integration with Payload admin for preview
- [ ] Automated testing with generated fixtures
- [ ] Performance monitoring and optimization
- [ ] Support for additional file formats (docx, etc.)

## Contributing

When contributing to the conversion system:

1. Follow TypeScript strict mode requirements
2. Add comprehensive error handling
3. Include unit tests for new features
4. Update documentation for API changes
5. Test with real seed data before submitting
6. Follow existing code patterns and naming conventions
