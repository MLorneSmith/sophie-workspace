# Context7 CLI Reference

Complete reference for Context7 CLI commands.

---

## context7-search

Search for libraries in the Context7 index.

### Synopsis

```bash
.ai/bin/context7-search QUERY [OPTIONS]
```text

### Arguments

| Argument | Required | Description |
|----------|----------|-------------|
| `QUERY` | Yes | Library name or search term |

### Options

| Option | Description |
|--------|-------------|
| `--no-cache` | Bypass cached results |
| `--json` | Output as JSON |
| `--debug` | Enable debug logging |
| `--limit N` | Limit number of results |

### Output Fields

| Field | Description |
|-------|-------------|
| Library | Repository path (owner/repo) |
| Stars | GitHub stars |
| Trust | Trust score (0-10) |
| Score | Benchmark score (0-10) |
| State | ready, processing, etc. |

### Examples

```bash
# Basic search
.ai/bin/context7-search "react"

# JSON output for parsing
.ai/bin/context7-search "vue" --json

# Limit results
.ai/bin/context7-search "state management" --limit 5

# Fresh search (bypass cache)
.ai/bin/context7-search "next.js" --no-cache
```text

---

## context7-get-context

Fetch documentation for a specific library.

### Synopsis

```bash
.ai/bin/context7-get-context OWNER REPO [OPTIONS]
```text

### Arguments

| Argument | Required | Description |
|----------|----------|-------------|
| `OWNER` | Yes | Repository owner (e.g., `vercel`) |
| `REPO` | Yes | Repository name (e.g., `next.js`) |

### Options

| Option | Default | Description |
|--------|---------|-------------|
| `--topic TOPIC` | - | Filter by topic |
| `--tokens N` | 10000 | Max tokens (100-100,000) |
| `--version VER` | latest | Specific version |
| `--format FMT` | txt | Response format: txt, json |
| `--no-cache` | - | Bypass cached results |
| `--json-output` | - | Output full response as JSON |
| `--debug` | - | Enable debug logging |

### Topic Selection

Topics filter documentation to relevant sections. Use keywords matching the library's documentation structure.

#### General Topics:
- `api` - API reference
- `usage` - Usage examples
- `configuration` - Setup and config
- `migration` - Migration guides
- `best practices` - Recommended patterns
- `troubleshooting` - Common issues
- `security` - Security guidelines
- `performance` - Optimization tips

#### Library-Specific Topics:
| Library | Common Topics |
|---------|---------------|
| Next.js | routing, data fetching, server actions, middleware, authentication, caching, api routes |
| React | hooks, state management, components, context, performance, refs, effects |
| Supabase | authentication, database, storage, rls, policies, migrations |
| Tailwind | utilities, responsive, customization, dark mode, plugins |
| Vue | components, composition api, reactivity, routing |
| TypeScript | types, interfaces, generics, decorators |

### Token Guidelines

| Use Case | Recommended Tokens |
|----------|-------------------|
| Single function/hook | 1,500-2,000 |
| Single topic | 2,000-2,500 |
| Multiple related topics | 3,000-5,000 |
| Full API overview | 8,000-10,000 |

### Examples

```bash
# Minimal (single topic)
.ai/bin/context7-get-context vercel next.js --topic routing --tokens 2000

# With version
.ai/bin/context7-get-context vercel next.js \
  --version v15.1.8 \
  --topic "server actions" \
  --tokens 3000

# Comprehensive
.ai/bin/context7-get-context facebook react --tokens 8000

# JSON format for structured parsing
.ai/bin/context7-get-context supabase supabase \
  --topic rls \
  --tokens 2500 \
  --format json

# Full JSON output (includes metadata)
.ai/bin/context7-get-context tailwindlabs tailwindcss \
  --topic utilities \
  --json-output
```text

---

## Output Formats

### Text Format (Default)

```text
================================================================================
Library: vercel/next.js
Version: latest
Topic: routing
Tokens: 2500
================================================================================

[Documentation content here...]
```text

### JSON Format (`--format json`)

Displays structured chunks:

```text
────────────────────────────────────────────────────────────────────────────────
[1] App Router Overview
Source: docs/app/building-your-application/routing
URL: https://nextjs.org/docs/app/building-your-application/routing
────────────────────────────────────────────────────────────────────────────────
[Content...]
```text

### Full JSON (`--json-output`)

```json
{
  "library": "vercel/next.js",
  "version": "latest",
  "topic": "routing",
  "tokens": 2500,
  "content": "...",
  "chunks": [...]
}
```text

---

## Caching

**Location:** `.ai/tools/context7/.cache/`

**TTL:** 24 hours

**Cache Key:** Combination of owner, repo, version, topic, tokens

#### Bypass Cache:
```bash
.ai/bin/context7-get-context vercel next.js --topic routing --no-cache
```text

#### When to Bypass:
- Library just released a new version
- Documentation was recently updated
- Getting stale or incorrect information

---

## Error Handling

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `CONTEXT7_API_KEY not set` | Missing environment variable | Add to `.env` |
| `Library not found` | Invalid owner/repo | Run search first |
| `No content for topic` | Topic doesn't match docs | Try broader topic |
| `Rate limit exceeded` | Too many requests | Wait or use cache |
| `Version not found` | Invalid version string | Check available versions |

### Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Success |
| 1 | General failure |

---

## Environment

### Required

```bash
# .env or shell
CONTEXT7_API_KEY=your-api-key-here
```text

### Optional

```bash
# Debug mode
DEBUG=context7:*
```text

---

## Python Module (Advanced)

The CLI scripts wrap Python modules that can be imported directly:

```python
from tools.context7.get_context import get_documentation
from tools.context7.search_libraries import search_libraries

# Search
results = search_libraries(query="react")
for lib in results.results:
    print(f"{lib.id}: {lib.stars} stars")

# Fetch
response = get_documentation(
    owner="vercel",
    repo="next.js",
    topic="routing",
    tokens=2500,
)
print(response.content)
```text

### Module Location

```text
.ai/tools/context7/
├── __init__.py
├── client.py           # HTTP client
├── cache.py            # Caching layer
├── models.py           # Pydantic models
├── get_context.py      # Fetch documentation
├── search_libraries.py # Search libraries
├── cli_get_context.py  # CLI entry point
├── cli_search_libraries.py
└── exceptions.py       # Custom exceptions
```text
