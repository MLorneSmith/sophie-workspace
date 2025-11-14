# Context7 API Integration Tools

Direct access to Context7 API endpoints for fetching library documentation and searching libraries without consuming context window tokens through the MCP server.

## Overview

Context7 provides access to comprehensive library documentation with intelligent filtering and search capabilities. This package enables programmatic access to Context7's API endpoints, allowing you to:

- Fetch documentation for specific libraries and versions
- Filter documentation by topic and token limits
- Search for libraries by name or topic
- Cache results to minimize API calls
- Integrate documentation retrieval into automated workflows

## Installation

The Context7 tools use standard Python dependencies that are already available in the project:

```bash
# Dependencies (already installed)
- requests>=2.31.0
- pydantic>=2.0
- python-dotenv
```

## Configuration

### API Key Setup

Set your Context7 API key as an environment variable:

```bash
export CONTEXT7_API_KEY="your-api-key-here"
```

Or add it to your `.env` file:

```bash
CONTEXT7_API_KEY=your-api-key-here
```

### Cache Configuration

By default, responses are cached for 24 hours in `.ai/tools/context7/.cache/`. The cache directory is automatically created and excluded from git.

## Usage

### As Python Module

```python
from context7 import get_documentation, search_libraries

# Fetch documentation for a library
docs = get_documentation(
    owner="vercel",
    repo="next.js",
    topic="routing",
    tokens=2000
)
print(docs.content)

# Search for libraries
results = search_libraries("next.js")
for lib in results.results:
    print(f"{lib.title}: {lib.stars} stars, {lib.benchmark_score} score")
```

### Command Line Interface

#### Get Documentation

```bash
# Fetch latest Next.js documentation
uv run .ai/tools/context7/cli_get_context.py vercel next.js

# Fetch specific version with topic filter
uv run .ai/tools/context7/cli_get_context.py vercel next.js \
  --version v15.1.8 \
  --topic routing \
  --tokens 2000

# Get JSON format response
uv run .ai/tools/context7/cli_get_context.py vercel next.js --format json

# Bypass cache
uv run .ai/tools/context7/cli_get_context.py vercel next.js --no-cache
```

#### Search Libraries

```bash
# Search for Next.js libraries
uv run .ai/tools/context7/cli_search_libraries.py "next.js"

# Search with JSON output
uv run .ai/tools/context7/cli_search_libraries.py "react" --json

# Limit results
uv run .ai/tools/context7/cli_search_libraries.py "vue" --limit 5
```

## API Reference

### `get_documentation()`

Retrieve library documentation from Context7 API.

**Parameters:**

- `owner` (str, required): Repository owner (e.g., 'vercel')
- `repo` (str, required): Repository name (e.g., 'next.js')
- `version` (str, optional): Specific version (e.g., 'v15.1.8') or None for latest
- `topic` (str, optional): Filter by topic (e.g., 'routing', 'authentication')
- `tokens` (int, optional): Maximum token count (100-100,000), default 10,000
- `response_format` (ResponseFormat, optional): TXT or JSON, default TXT
- `use_cache` (bool, optional): Use cached results, default True
- `api_key` (str, optional): Context7 API key (reads from CONTEXT7_API_KEY env if not provided)

**Returns:** `GetContextResponse`

**Raises:**

- `Context7AuthenticationError`: Invalid or missing API key
- `Context7NotFoundError`: Library or version not found
- `Context7ValidationError`: Invalid parameters
- `Context7APIError`: Other API errors

### `search_libraries()`

Search for libraries on Context7.

**Parameters:**

- `query` (str, required): Library name to search for
- `use_cache` (bool, optional): Use cached results, default True
- `api_key` (str, optional): Context7 API key (reads from CONTEXT7_API_KEY env if not provided)

**Returns:** `SearchLibrariesResponse`

**Raises:**

- `Context7AuthenticationError`: Invalid or missing API key
- `Context7ValidationError`: Invalid query
- `Context7APIError`: Other API errors

## Data Models

### GetContextResponse

```python
class GetContextResponse(BaseModel):
    library: str                    # Library identifier (/owner/repo)
    version: str                    # Documentation version
    topic: Optional[str]            # Topic filter applied
    tokens: int                     # Token count of response
    content: str                    # Documentation content (if format=txt)
    chunks: Optional[list[DocumentationChunk]]  # Documentation chunks (if format=json)
    metadata: dict[str, Any]        # Additional metadata
```

### Library

```python
class Library(BaseModel):
    id: str                         # Library identifier (/owner/repo)
    title: str                      # Library title
    description: Optional[str]      # Library description
    branch: str                     # Default branch
    stars: int                      # GitHub star count
    trust_score: float              # Trust score (0-100)
    benchmark_score: float          # Benchmark score (0-100)
    versions: list[LibraryVersion]  # Available versions
    state: LibraryState             # Current processing state
```

### LibraryState Enum

- `FINALIZED`: Library is fully processed and ready
- `INITIAL`: Library is newly added
- `PROCESSING`: Library is being processed
- `ERROR`: Processing encountered an error
- `DELETE`: Library is marked for deletion

## Error Handling

The package provides specific exception types for different error scenarios:

```python
from context7 import (
    get_documentation,
    Context7AuthenticationError,
    Context7NotFoundError,
    Context7RateLimitError,
)

try:
    docs = get_documentation("vercel", "next.js")
except Context7AuthenticationError:
    print("Invalid API key")
except Context7NotFoundError:
    print("Library not found")
except Context7RateLimitError as e:
    print(f"Rate limited. Retry after {e.retry_after_seconds}s")
```

## Caching

### How Caching Works

- Responses are cached based on request parameters (owner, repo, version, topic, tokens, format)
- Default TTL: 24 hours
- Cache location: `.ai/tools/context7/.cache/`
- Cache is automatically cleaned on expiration

### Cache Management

```python
from context7.cache import get_cache

cache = get_cache()

# Get cache statistics
stats = cache.get_stats()
print(f"Hit rate: {stats['hit_rate']}%")
print(f"Cache size: {stats['size']} entries")

# Clear cache
cache.clear()

# Invalidate specific entry
cache.invalidate(owner="vercel", repo="next.js", version="latest")
```

### Bypassing Cache

```python
# Disable cache for a single request
docs = get_documentation("vercel", "next.js", use_cache=False)
```

## Performance Tips

1. **Use caching**: Documentation updates are infrequent, so caching reduces API calls and improves response time
2. **Optimize token limits**: Request only the tokens you need (2000-5000 for targeted topics)
3. **Filter by topic**: Use topic filters to get relevant documentation sections only
4. **Batch requests**: If fetching multiple libraries, use parallel requests
5. **Monitor cache stats**: Track hit rates to optimize cache TTL

## Rate Limiting

Context7 API enforces rate limits. When rate limited (429 response):

- Exception includes `retry_after_seconds` field
- Client automatically retries after the specified delay
- Consider implementing exponential backoff for high-volume usage

## Integration Examples

See the `examples/` directory for integration patterns:

- `fetch_docs.py`: Simple documentation fetching
- `search_and_fetch.py`: Search then fetch documentation
- `compare_versions.py`: Compare documentation across versions
- `topic_explorer.py`: Explore documentation by topic
- `cache_management.py`: Cache statistics and management

## Logging

Enable debug logging to see API requests and cache operations:

```python
import logging

logging.basicConfig(level=logging.DEBUG)
```

Or via CLI:

```bash
uv run .ai/tools/context7/cli_get_context.py vercel next.js --debug
```

## Troubleshooting

### API Key Issues

```
ValueError: CONTEXT7_API_KEY environment variable not set
```

**Solution**: Set the CONTEXT7_API_KEY environment variable

### Library Not Found

```
Context7NotFoundError: Resource not found
```

**Solution**: Verify owner/repo names are correct. Use `search_libraries()` to find the exact library ID.

### Rate Limiting

```
Context7RateLimitError: Rate limit exceeded. Retry after 60 seconds
```

**Solution**: Wait for the specified time or implement exponential backoff. Enable caching to reduce API calls.

### Cache Corruption

If you encounter cache-related errors, clear the cache:

```bash
rm -rf .ai/tools/context7/.cache/
```

## Development

### Running Tests

```bash
# Unit tests
uv run pytest .ai/tools/context7/test_*.py -v

# Integration tests (requires API key)
CONTEXT7_API_KEY=your-key uv run pytest .ai/tools/context7/test_integration.py -v
```

### Code Quality

```bash
# Type checking
mypy .ai/tools/context7/

# Linting
ruff check .ai/tools/context7/
```

## License

Part of the SlideHeroes project.
