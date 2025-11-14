# Feature: Context7 API Integration Scripts

## Feature Description

Create reusable Python scripts providing direct access to Context7 API endpoints for fetching library documentation and searching libraries. These scripts enable efficient documentation retrieval and library discovery without consuming tokens in the context window through the MCP server. Each script is standalone, callable from other parts of the codebase, and designed to integrate with Claude Code workflows and automation tools.

The implementation provides a clean, type-safe interface to Context7 API endpoints (get-context, search-libraries) with proper error handling, validation, and authentication management.

## User Story

As an AI agent working on SlideHeroes
I want to call Context7 API endpoints directly from Python scripts
So that I can retrieve library documentation and search for libraries without consuming valuable context window tokens through the MCP server

## Problem Statement

Currently, Context7 functionality is only accessible through an MCP (Model Context Protocol) server, which consumes significant tokens in the context window for every documentation lookup. This creates several challenges:

- **Token budget exhaustion**: MCP servers add overhead to the context window, reducing available space for actual work
- **Performance overhead**: MCP protocol adds latency and complexity for simple API calls
- **Limited automation**: MCP servers are designed for interactive conversations, not programmatic access
- **Cost inefficiency**: Every documentation lookup consumes tokens that could be used for actual code generation

AI agents and automated workflows need a lightweight, scriptable way to:

- Fetch documentation for specific libraries and versions
- Search for libraries by name or topic
- Filter documentation by topic and token limits
- Integrate documentation retrieval into automated workflows without context window overhead

## Solution Statement

Create a collection of standalone Python scripts in `.ai/tools/context7/` as reusable tools that can be called from workflows, automation scripts, and other parts of the codebase. Each script will:

1. **Authenticate** using environment variables (CONTEXT7_API_KEY)
2. **Validate** inputs using Pydantic models for type safety
3. **Execute** HTTP requests to Context7 API endpoints
4. **Parse** responses into structured, typed data models
5. **Handle** errors gracefully with retry logic and informative messages
6. **Export** callable functions that can be imported by other scripts
7. **Cache** results appropriately (documentation updates are infrequent)

This follows the existing Exa integration pattern where scripts are both executable (`uv run script.py`) and importable (`from tools.context7.get_context import get_documentation`). Placing these in `.ai/tools/` rather than `.ai/adws/` separates reusable tools from workflow-specific scripts.

## Relevant Files

### Existing Files for Reference

- `.ai/tools/exa/client.py` - Example of API client with authentication, retry logic, and error handling
- `.ai/tools/exa/models.py` - Example of Pydantic model definitions for type safety
- `.ai/tools/exa/utils.py` - Example of utility functions (API key validation, redaction)
- `.ai/tools/exa/exceptions.py` - Example of custom exception classes
- `.ai/tools/exa/README.md` - Documentation pattern to follow
- `.ai/specs/exa-search-api-integration.md` - Reference implementation spec

### New Files

#### Core Implementation Files

- `.ai/tools/context7/__init__.py` - Package initialization, exports public API
- `.ai/tools/context7/client.py` - Base Context7 API client with authentication and request handling
- `.ai/tools/context7/models.py` - Pydantic models for all request/response types
- `.ai/tools/context7/get_context.py` - Get documentation context endpoint implementation
- `.ai/tools/context7/search_libraries.py` - Search libraries endpoint implementation
- `.ai/tools/context7/exceptions.py` - Custom exception classes for error handling
- `.ai/tools/context7/utils.py` - Utility functions for API key management, caching, etc.
- `.ai/tools/context7/cache.py` - Simple file-based caching layer for documentation

#### CLI Scripts

- `.ai/tools/context7/cli_get_context.py` - Executable script for fetching documentation
- `.ai/tools/context7/cli_search_libraries.py` - Executable script for searching libraries

#### Testing & Documentation

- `.ai/tools/context7/test_client.py` - Unit tests for client and authentication
- `.ai/tools/context7/test_models.py` - Unit tests for Pydantic models
- `.ai/tools/context7/test_get_context.py` - Unit tests for get_context endpoint
- `.ai/tools/context7/test_search_libraries.py` - Unit tests for search_libraries endpoint
- `.ai/tools/context7/test_integration.py` - Integration tests with real API calls
- `.ai/tools/context7/README.md` - Comprehensive documentation and usage examples
- `.ai/tools/context7/examples/` - Example usage scripts and integration patterns

## Impact Analysis

### Dependencies Affected

**New Dependencies Required:**
- `requests>=2.31.0` - HTTP client for API calls (already available)
- `pydantic>=2.0` - Data validation and serialization (already available)
- `python-dotenv` - Environment variable management (already available)
- `pytest` - Testing framework (already available)
- `pytest-cov` - Coverage reporting (already available)

**Packages That Will Consume This Feature:**
- `.ai/adws/*` - ADW workflow scripts can use for documentation lookup
- `.ai/tools/*` - Other tools can reference documentation
- Future AI agent implementations
- Automated code generation workflows

**Version Requirements:**
- Python 3.11+ (already used in project)
- No breaking changes to existing dependencies

### Risk Assessment

**Low Risk**

Reasoning:
- Isolated new functionality with no modifications to existing code
- Well-understood HTTP API integration pattern
- Following proven Exa integration architecture
- No database or authentication system changes
- Simple caching layer with minimal complexity
- Read-only API operations (no data mutations)
- Standalone scripts that can be tested independently

### Backward Compatibility

**No Backward Compatibility Concerns**

- This is net new functionality with no existing code to break
- Existing MCP server integration remains unchanged
- Scripts are opt-in and don't affect existing workflows
- No breaking changes to any existing APIs or interfaces
- Can coexist with MCP server if needed

### Performance Impact

**Positive Performance Impact:**

- **Reduced context window usage**: Documentation fetched via API doesn't consume context tokens
- **Faster lookups**: Direct API calls are faster than MCP protocol overhead
- **Caching benefits**: File-based cache reduces API calls for frequently accessed documentation
- **No database impact**: Read-only API operations, no database writes
- **Minimal memory footprint**: Small Python scripts with minimal dependencies

**Network Considerations:**
- HTTP requests to Context7 API (typically <1s response time)
- Rate limiting handled with exponential backoff (no negative impact on system)
- Caching reduces API calls for repeated lookups

### Security Considerations

**Authentication/Authorization:**
- API key stored in environment variable (CONTEXT7_API_KEY)
- API key validation before making requests
- API key redaction in all logging output
- No API keys committed to repository

**Data Validation:**
- All inputs validated with Pydantic schemas
- URL validation for owner/repo parameters
- Token limit validation (100-100,000 range)
- Query string sanitization

**Potential Vulnerabilities:**
- No code execution or injection risks (read-only API)
- No user input directly passed to system commands
- API responses parsed safely with Pydantic validation
- No secrets exposed in error messages or logs

**Privacy/Compliance:**
- No PII or sensitive data transmitted (only library names/documentation)
- API usage logged for debugging (with redacted keys)
- Cached data stored locally in `.ai/tools/context7/.cache/` directory

## Pre-Feature Checklist

Before starting implementation:
- [x] Create feature branch: `feature/context7-api-integration`
- [x] Review existing Exa integration for patterns
- [x] Identify all integration points (ADW scripts, future AI agents)
- [x] Define success metrics (token reduction, response speed)
- [x] Confirm feature doesn't duplicate existing functionality (MCP server has different use case)
- [x] Verify all required dependencies are available (all dependencies already in project)
- [ ] Plan feature flag strategy (not needed - standalone scripts)

## Documentation Updates Required

**Technical Documentation:**
- `.ai/tools/context7/README.md` - Comprehensive usage guide with examples
- `.ai/tools/README.md` - Update to include Context7 tools overview
- `CLAUDE.md` - Add Context7 API integration to available tools section

**Code Documentation:**
- Docstrings on all public functions and classes
- Type hints on all function signatures
- Inline comments for complex logic (caching, retry logic)

**API Documentation:**
- Document all endpoint functions (get_documentation, search_libraries)
- Document all Pydantic models and their fields
- Document exception hierarchy and error handling

**Examples:**
- Example scripts in `.ai/tools/context7/examples/`
- Integration examples with ADW workflows
- Caching configuration examples

## Rollback Plan

**How to Disable:**
- Remove or rename `.ai/tools/context7/` directory
- Scripts are standalone and self-contained
- No database migrations or schema changes to rollback

**Graceful Degradation:**
- Fall back to MCP server if Context7 scripts fail
- Error messages provide clear guidance on failures
- API key validation prevents silent failures

**Monitoring:**
- Log all API requests and responses (with redacted keys)
- Track API errors and retry attempts
- Monitor cache hit rates for performance tuning

## Implementation Plan

### Phase 1: Foundation

Establish the core infrastructure for Context7 API integration:

1. **Create package structure** with `__init__.py` and subdirectories
2. **Define Pydantic models** for all API request/response types
3. **Implement base client** with authentication, error handling, and retry logic
4. **Add exception classes** for different error scenarios (401, 404, 429, 500)
5. **Configure environment variables** and validation (CONTEXT7_API_KEY)
6. **Implement caching layer** for documentation results

### Phase 2: Core Implementation

Implement each Context7 API endpoint as a separate module:

1. **Get Context endpoint** (`get_context.py`) with support for:
   - Library documentation retrieval by owner/repo
   - Version specification (specific version or latest)
   - Topic filtering (routing, authentication, etc.)
   - Token limits (100-100,000)
   - Response format (txt vs json)

2. **Search Libraries endpoint** (`search_libraries.py`) for:
   - Library name search
   - Result metadata (stars, trust score, benchmark score)
   - Available versions listing

3. **CLI wrappers** for each endpoint to enable command-line usage

### Phase 3: Integration

Complete the implementation with testing, documentation, and integration examples:

1. **Write comprehensive tests** for all endpoints and edge cases
2. **Create detailed documentation** with usage examples
3. **Build example integrations** showing how to use with existing ADW workflows
4. **Add error recovery patterns** and logging
5. **Validate end-to-end** functionality with real API calls

## Step by Step Tasks

### 1. Create Package Structure and Base Models

- Create `.ai/tools/context7/` directory
- Add `__init__.py` with package initialization and exports
- Create `models.py` with Pydantic models for:
  - GetContextRequest (owner, repo, type, topic, tokens)
  - GetContextResponse (library, version, topic, tokens, chunks, metadata)
  - DocumentationChunk (title, content, source, url)
  - SearchLibrariesRequest (query)
  - SearchLibrariesResponse (results, metadata)
  - Library (id, title, description, branch, stars, trustScore, benchmarkScore, versions, etc.)
  - ErrorResponse (error message, retryAfterSeconds for 429 errors)
  - ResponseFormat enum (TXT, JSON)
  - LibraryState enum (finalized, initial, processing, error, delete)
- Add type aliases and enums
- Write unit tests for model validation in `test_models.py`

### 2. Implement Base Client and Authentication

- Create `client.py` with Context7Client class:
  - Initialize with API key from environment (CONTEXT7_API_KEY)
  - Base URL: `https://context7.com/api/v1`
  - Implement `_make_request()` method with:
    - HTTP request execution using `requests` library
    - Bearer token authentication header
    - Retry logic with exponential backoff
    - Error handling for 400, 401, 404, 429, 500 responses
    - Request/response logging with redacted API keys
    - Timeout handling (30s default)
  - Add helper methods for common operations
- Create `exceptions.py` with custom exception classes:
  - Context7APIError (base exception)
  - Context7AuthenticationError (401)
  - Context7NotFoundError (404)
  - Context7RateLimitError (429, includes retryAfterSeconds)
  - Context7ValidationError (400)
  - Context7TimeoutError
  - Context7ServerError (500)
- Create `utils.py` for shared utility functions:
  - `get_api_key()` - Read from environment with validation
  - `validate_api_key_format()` - Validate key format
  - `redact_api_key()` - Redact key for logging (show first/last 4 chars)
  - `format_library_id()` - Format owner/repo into `/owner/repo`
  - `parse_library_id()` - Parse library ID into owner/repo tuple
- Write unit tests for client in `test_client.py`

### 3. Implement Caching Layer

- Create `cache.py` with caching functionality:
  - File-based cache in `.ai/tools/context7/.cache/`
  - Cache key generation from request parameters (library, version, topic, tokens)
  - Cache expiration (default: 24 hours, configurable)
  - Cache invalidation methods
  - Cache statistics (hits, misses, size)
  - Helper functions:
    - `get_cached()` - Retrieve from cache if valid
    - `set_cached()` - Store response in cache
    - `clear_cache()` - Clear all cached data
    - `get_cache_stats()` - Get cache statistics
- Add cache directory to `.gitignore`
- Write unit tests for caching in `test_cache.py`

### 4. Implement Get Context Endpoint

- Create `get_context.py` with documentation retrieval:
  - `get_documentation()` function with parameters:
    - owner (string, required): Repository owner (e.g., 'vercel')
    - repo (string, required): Repository name (e.g., 'next.js')
    - version (string, optional): Specific version (e.g., 'v15.1.8') or None for latest
    - topic (string, optional): Filter by topic (e.g., 'routing')
    - tokens (int, optional): Max token count (100-100,000), default 10,000
    - response_format (ResponseFormat, optional): TXT or JSON, default TXT
    - use_cache (bool, optional): Use cached results, default True
  - Response parsing into GetContextResponse model
  - Validation of parameters (token range, format enum)
  - Caching integration (check cache first, store results)
  - URL construction: `https://context7.com/api/v1/{owner}/{repo}` with query params
- Create `cli_get_context.py` for command-line usage:
  - Accept arguments via argparse:
    - Required: owner, repo
    - Optional: --version, --topic, --tokens, --format, --no-cache
  - Display results in human-readable format
  - Support JSON output mode (--json flag)
  - Show cache status (hit/miss)
  - Example: `uv run tools/context7/cli_get_context.py vercel next.js --topic routing --tokens 2000`
- Write unit tests for get_context endpoint in `test_get_context.py`
- Write integration tests with real API calls

### 5. Implement Search Libraries Endpoint

- Create `search_libraries.py` with library search:
  - `search_libraries()` function with parameters:
    - query (string, required): Library name to search for
    - use_cache (bool, optional): Use cached results, default True
  - Response parsing into SearchLibrariesResponse
  - Result sorting by benchmark score (highest first)
  - Caching integration
  - URL construction: `https://context7.com/api/v1/search?query={query}`
- Create `cli_search_libraries.py` for CLI usage:
  - Accept query as positional argument
  - Display results in table format with:
    - Library ID
    - Title and description
    - Stars, trust score, benchmark score
    - Available versions
  - Support JSON output mode
  - Show cache status
  - Example: `uv run tools/context7/cli_search_libraries.py "next.js"`
- Write unit tests for search_libraries endpoint in `test_search_libraries.py`
- Write integration tests with real API calls

### 6. Create Integration Examples and Documentation

- Create `examples/` directory with integration examples:
  - `fetch_docs.py` - Simple example of fetching documentation for a library
  - `search_and_fetch.py` - Search for libraries, then fetch documentation
  - `compare_versions.py` - Compare documentation across different versions
  - `topic_explorer.py` - Explore documentation filtered by different topics
  - `adw_integration.py` - Example of integrating with ADW workflows
  - `cache_management.py` - Example of cache statistics and management
- Create comprehensive `README.md` with:
  - Installation and setup instructions
  - API key configuration (environment variable setup)
  - Usage examples for each endpoint
  - Integration patterns with ADW scripts
  - Error handling guidelines
  - Caching configuration and best practices
  - Performance tips (when to use caching, token limits)
  - API rate limiting information
- Add docstrings to all public functions and classes
- Create quick reference guide for common use cases
- Update `.ai/tools/README.md` to include Context7 tools

### 7. Add Error Handling and Logging

- Implement comprehensive error handling:
  - Network errors with retry logic (3 retries, exponential backoff)
  - API errors with specific exception types (401, 404, 429, 500)
  - Validation errors with clear messages (invalid token range, etc.)
  - Rate limiting with automatic backoff using `retryAfterSeconds` from 429 response
  - Timeout handling (30s default, configurable)
- Add logging configuration:
  - Use Python's logging module
  - Support DEBUG, INFO, WARNING, ERROR levels
  - Log API requests and responses (with redacted keys)
  - Track timing and performance metrics
  - Log cache hits/misses
- Create `config.py` for configuration management:
  - Environment variable validation
  - Default values and overrides
  - API endpoint base URL
  - Request timeouts
  - Cache settings (TTL, directory)
  - Retry settings (max retries, backoff factor)

### 8. Write Comprehensive Test Suite

- Create test fixtures and mocks:
  - Mock API responses for all endpoints (200, 400, 401, 404, 429, 500)
  - Test data generators for Library objects
  - Reusable test utilities (create client, mock responses)
- Write unit tests for all modules:
  - `test_models.py` - Model validation, serialization, enum validation
  - `test_client.py` - Client initialization, authentication, retry logic, error mapping
  - `test_utils.py` - API key validation, redaction, library ID formatting
  - `test_cache.py` - Cache operations, expiration, invalidation
  - `test_get_context.py` - Get context logic, parameter validation
  - `test_search_libraries.py` - Search logic, result parsing
- Write integration tests with real API calls:
  - `test_integration.py` - Mark as integration tests (pytest markers)
  - Require CONTEXT7_API_KEY to be set
  - Test all endpoints end-to-end
  - Validate response structures
  - Test caching behavior
  - Test rate limiting handling (if safe to trigger)
- Add edge case tests:
  - Empty search results
  - Invalid library owner/repo
  - Invalid version specifications
  - Out-of-range token limits
  - Rate limiting scenarios
  - Timeout handling
  - Cache expiration edge cases
  - Malformed API responses
  - Network errors and retries
  - Authentication failures

### 9. Final Integration and Validation

- Update `.ai/tools/README.md` documenting the tools directory structure
- Add Context7 section to `CLAUDE.md` for AI agent usage guidance
- Create convenience wrapper functions in `__init__.py`:
  - Export `get_documentation` from get_context
  - Export `search_libraries` from search_libraries
  - Export exception classes
  - Export models for type hints
- Verify all CLI scripts are executable with proper shebangs (`#!/usr/bin/env python3`)
- Test importing modules from ADW scripts:
  - Add `.ai/tools` to `sys.path`
  - Import and use functions
  - Verify type hints work in IDEs
- Create example ADW integration showing documentation lookup during planning
- Run all validation commands to ensure zero regressions
- Update project documentation with Context7 integration information

### 10. Run All Validation Commands

Execute all validation commands in sequence to ensure feature works correctly with zero regressions:

- Verify environment setup
- Run all unit tests with coverage
- Run integration tests (requires API key)
- Test CLI scripts with real API calls
- Verify imports work from other scripts
- Run example scripts
- Check type safety with mypy
- Run project-level quality checks (lint, format, typecheck)
- Execute end-to-end integration test

## Testing Strategy

### Unit Tests

**Models Testing** (`test_models.py`):
- Validate all Pydantic models accept correct data
- Ensure validation fails appropriately for invalid data
- Test serialization to/from JSON
- Verify optional vs required fields
- Test enum validation for ResponseFormat, LibraryState
- Validate token range constraints (100-100,000)
- Test nested models (DocumentationChunk within GetContextResponse)

**Client Testing** (`test_client.py`):
- Mock HTTP requests to test client logic
- Verify Bearer token authentication header is set correctly
- Test retry logic with failed requests (network errors)
- Validate error handling for different HTTP status codes (400, 401, 404, 429, 500)
- Test timeout behavior (30s default)
- Verify API key redaction in logs
- Test session creation with retry configuration

**Utils Testing** (`test_utils.py`):
- Test API key retrieval from environment
- Validate API key format checking
- Test API key redaction (show first/last 4 chars)
- Validate library ID formatting (`/owner/repo`)
- Test library ID parsing (extract owner, repo)

**Cache Testing** (`test_cache.py`):
- Test cache key generation from parameters
- Verify cache hit/miss behavior
- Test cache expiration (TTL)
- Validate cache invalidation
- Test cache statistics tracking
- Test concurrent cache access (if applicable)
- Verify cache directory creation

**Endpoint Testing** (`test_get_context.py`, `test_search_libraries.py`):
- Mock API responses for each endpoint
- Test parameter validation and constraints
- Verify response parsing into models
- Test error scenarios (404, 429, 500)
- Validate filtering options (topic, tokens)
- Test caching integration (cache enabled/disabled)
- Verify URL construction with parameters

### Integration Tests

**Live API Tests** (`test_integration.py`):
- Require CONTEXT7_API_KEY environment variable
- Test get_documentation with various parameters:
  - Different libraries (vercel/next.js, upstash/docs)
  - With and without version specification
  - With topic filtering
  - Different token limits
  - Both TXT and JSON response formats
- Test search_libraries with real queries:
  - Popular libraries (next.js, react)
  - Less common libraries
  - Non-existent libraries (empty results)
- Validate caching behavior:
  - First call misses cache
  - Second call hits cache
  - Cache expiration works
- Test rate limiting handling (if safe to trigger)
- Verify response structure matches Pydantic models

**CLI Tests** (`test_cli.py`):
- Test each CLI script with subprocess
- Verify output formatting (human-readable)
- Test argument parsing (required vs optional)
- Validate JSON output mode
- Test error messages for invalid inputs
- Verify cache status display
- Test help text (`--help` flag)

### Edge Cases

- **Empty Results**: Search queries that return no results
- **Invalid Library**: Non-existent owner/repo combinations
- **Invalid Version**: Version that doesn't exist for library
- **Rate Limiting**: Handling 429 responses with `retryAfterSeconds` backoff
- **Timeouts**: Long-running requests that exceed 30s limit
- **Large Responses**: Handling maximum token limits (100,000)
- **Invalid API Keys**: Authentication failures (401)
- **Network Errors**: Connection failures and retries
- **Malformed Responses**: API returns unexpected JSON structure
- **Invalid Parameters**: Out-of-range token values (0, 200,000), invalid enum values
- **Special Characters**: Queries with unicode, special chars in library names
- **Cache Corruption**: Handle corrupted cache files gracefully
- **Concurrent Requests**: Multiple requests to same endpoint simultaneously

## Acceptance Criteria

1. **Both Context7 API endpoints are fully functional**:
   - Get Context (documentation retrieval with all parameters)
   - Search Libraries (with result metadata)
   - All optional parameters are supported (version, topic, tokens, format)
   - Caching works correctly for both endpoints

2. **Type safety is enforced throughout**:
   - All functions use Pydantic models for validation
   - No `any` types in public APIs
   - Type hints on all functions and methods
   - Enums for ResponseFormat and LibraryState

3. **Scripts are both executable and importable**:
   - Each endpoint has a CLI script that can be run with `uv run`
   - All functions can be imported: `from context7.get_context import get_documentation`
   - CLI scripts provide useful output formatting (human-readable and JSON modes)
   - Proper shebangs for direct execution

4. **Error handling is comprehensive**:
   - Custom exceptions for all error types (401, 404, 429, 500)
   - Retry logic with exponential backoff for network errors
   - Clear error messages with actionable guidance
   - Rate limiting handled automatically with `retryAfterSeconds`
   - API key redaction in all error messages and logs

5. **Caching is implemented and effective**:
   - File-based cache with configurable TTL (default 24 hours)
   - Cache hit/miss tracking and statistics
   - Cache can be disabled per-request
   - Cache invalidation methods available
   - Cache directory excluded from git

6. **Documentation is complete and clear**:
   - README with installation and usage examples
   - Docstrings on all public functions
   - Example scripts demonstrating integration patterns
   - Quick reference guide for common use cases
   - ADW integration examples

7. **Tests achieve high coverage**:
   - Unit tests for all modules (>90% coverage)
   - Integration tests for all endpoints
   - Edge case tests for error scenarios
   - All tests pass with zero failures
   - Mock tests don't require API key

8. **Integration with existing tools works**:
   - Scripts can be called from other ADW scripts
   - Environment variable management follows project patterns
   - Logging integrates with existing logging infrastructure
   - No conflicts with existing MCP server integration

## Validation Commands

Execute every command to validate the feature works correctly with zero regressions.

### Setup and Installation

```bash
# Verify environment is configured
cd /home/msmith/projects/2025slideheroes/.ai
echo $CONTEXT7_API_KEY  # Should show API key

# Verify Python dependencies are available
python3 -c "import requests, pydantic; print('✅ Dependencies available')"
```

### Unit Tests Execution

```bash
# Run all unit tests with verbose output
cd /home/msmith/projects/2025slideheroes/.ai

uv run pytest tools/context7/test_models.py -v
uv run pytest tools/context7/test_client.py -v
uv run pytest tools/context7/test_utils.py -v
uv run pytest tools/context7/test_cache.py -v
uv run pytest tools/context7/test_get_context.py -v
uv run pytest tools/context7/test_search_libraries.py -v

# Run all unit tests with coverage report
uv run pytest tools/context7/ --cov=tools.context7 --cov-report=term-missing --ignore=tools/context7/examples/ -v
```

### Integration Tests (Requires CONTEXT7_API_KEY)

```bash
# Run integration tests with real API
cd /home/msmith/projects/2025slideheroes/.ai

# Ensure API key is set
export CONTEXT7_API_KEY="your-key-here"  # Set this first

uv run pytest tools/context7/test_integration.py -v -m integration

# Run CLI tests (also requires API key)
uv run pytest tools/context7/test_cli.py -v
```

### CLI Script Validation

```bash
cd /home/msmith/projects/2025slideheroes/.ai

# Test get_context endpoint with different parameters
uv run tools/context7/cli_get_context.py vercel next.js --topic routing --tokens 2000
uv run tools/context7/cli_get_context.py vercel next.js --version v15.1.8 --format json
uv run tools/context7/cli_get_context.py upstash docs --tokens 5000

# Test search_libraries endpoint
uv run tools/context7/cli_search_libraries.py "next.js"
uv run tools/context7/cli_search_libraries.py "react"
uv run tools/context7/cli_search_libraries.py "upstash"

# Test JSON output mode
uv run tools/context7/cli_get_context.py vercel next.js --json | python3 -m json.tool
uv run tools/context7/cli_search_libraries.py "tailwind" --json | python3 -m json.tool

# Test caching behavior (second call should be faster)
time uv run tools/context7/cli_get_context.py vercel next.js --tokens 1000
time uv run tools/context7/cli_get_context.py vercel next.js --tokens 1000  # Should hit cache

# Test with --no-cache flag
uv run tools/context7/cli_get_context.py vercel next.js --no-cache
```

### Import and Integration Tests

```bash
cd /home/msmith/projects/2025slideheroes/.ai

# Test importing modules
python3 -c "
import sys
sys.path.insert(0, 'tools')
from context7 import get_documentation, search_libraries
from context7.models import ResponseFormat
print('✅ All imports successful')
"

# Test using functions programmatically
python3 -c "
import sys
sys.path.insert(0, 'tools')
from context7 import search_libraries

results = search_libraries('next.js')
print(f'✅ Found {len(results.results)} libraries')
if results.results:
    lib = results.results[0]
    print(f'   Top result: {lib.title} ({lib.stars} stars)')
"

# Test get_documentation function
python3 -c "
import sys
sys.path.insert(0, 'tools')
from context7 import get_documentation

docs = get_documentation('vercel', 'next.js', topic='routing', tokens=1000)
print(f'✅ Retrieved {docs.tokens} tokens of documentation')
print(f'   Library: {docs.library} v{docs.version}')
print(f'   Chunks: {len(docs.chunks)}')
"
```

### Example Scripts Validation

```bash
cd /home/msmith/projects/2025slideheroes/.ai

# Run example integration scripts
uv run tools/context7/examples/fetch_docs.py
uv run tools/context7/examples/search_and_fetch.py
uv run tools/context7/examples/compare_versions.py
uv run tools/context7/examples/topic_explorer.py
uv run tools/context7/examples/cache_management.py
```

### Type Checking

```bash
cd /home/msmith/projects/2025slideheroes/.ai

# Run mypy type checking on all context7 modules
python3 -m mypy tools/context7/ --strict --ignore-missing-imports
```

### Code Quality

```bash
cd /home/msmith/projects/2025slideheroes

# Run linting and formatting (from project root)
pnpm lint:fix
pnpm format:fix
pnpm typecheck
```

### End-to-End Integration Test

```bash
cd /home/msmith/projects/2025slideheroes/.ai

# Create a test script that uses all functionality
cat > tools/context7/test_e2e.py << 'EOF'
#!/usr/bin/env python3
"""End-to-end test of all Context7 API functionality."""
import sys
sys.path.insert(0, '/home/msmith/projects/2025slideheroes/.ai/tools')

from context7 import get_documentation, search_libraries
from context7.models import ResponseFormat
from context7.cache import get_cache_stats, clear_cache

# Test search
print("1. Testing search_libraries...")
search_results = search_libraries("next.js")
print(f"   ✅ Search: Found {len(search_results.results)} libraries")
if search_results.results:
    lib = search_results.results[0]
    print(f"   Top result: {lib.title} ({lib.stars} stars, score: {lib.benchmarkScore})")

    # Test get documentation
    print(f"\n2. Testing get_documentation for {lib.id}...")
    owner, repo = lib.id.strip('/').split('/')
    docs = get_documentation(owner, repo, tokens=2000)
    print(f"   ✅ Retrieved {docs.tokens} tokens of documentation")
    print(f"   Library: {docs.library} v{docs.version}")
    print(f"   Chunks: {len(docs.chunks)}")

    # Test topic filtering
    print(f"\n3. Testing topic filtering...")
    docs_routing = get_documentation(owner, repo, topic='routing', tokens=1000)
    print(f"   ✅ Topic-filtered docs: {docs_routing.tokens} tokens")
    print(f"   Topic: {docs_routing.topic}")

    # Test JSON format
    print(f"\n4. Testing JSON response format...")
    docs_json = get_documentation(owner, repo, tokens=500, response_format=ResponseFormat.JSON)
    print(f"   ✅ JSON format: {len(docs_json.chunks)} chunks")

# Test caching
print(f"\n5. Testing caching...")
stats = get_cache_stats()
print(f"   ✅ Cache stats: {stats.get('hits', 0)} hits, {stats.get('misses', 0)} misses")

print("\n🎉 All endpoints and features working correctly!")
EOF

chmod +x tools/context7/test_e2e.py
uv run tools/context7/test_e2e.py
```

### Performance and Caching Validation

```bash
cd /home/msmith/projects/2025slideheroes/.ai

# Measure cache performance improvement
echo "Testing cache performance (first call - cache miss):"
time uv run tools/context7/cli_get_context.py vercel next.js --tokens 5000 > /dev/null

echo -e "\nTesting cache performance (second call - cache hit):"
time uv run tools/context7/cli_get_context.py vercel next.js --tokens 5000 > /dev/null

echo -e "\nCache should be significantly faster on second call"

# Test cache management
python3 -c "
import sys
sys.path.insert(0, 'tools')
from context7.cache import get_cache_stats, clear_cache

print('Cache stats before clear:', get_cache_stats())
clear_cache()
print('✅ Cache cleared successfully')
print('Cache stats after clear:', get_cache_stats())
"
```

## Notes

### Dependencies

This implementation uses the following Python packages (already available in project):

- `requests>=2.31.0` - HTTP client for API calls
- `pydantic>=2.0` - Data validation and serialization
- `python-dotenv` - Environment variable management
- `pytest` - Testing framework
- `pytest-cov` - Coverage reporting

No new dependencies need to be added to the project.

### API Key Management

**Obtaining API Key:**
1. Visit https://context7.com/dashboard
2. Create account or sign in
3. Generate API key from dashboard
4. Store in environment variable: `export CONTEXT7_API_KEY="your-key-here"`

**Security Best Practices:**
- Never commit API keys to the repository
- Store `CONTEXT7_API_KEY` in `.env` file (already gitignored)
- Validate API key format before making requests (Bearer token)
- Redact API keys in all logging output (show only first/last 4 chars)
- Use separate API keys for development/production if available

### Rate Limiting

Context7 API implements rate limiting:

- **Unauthenticated requests**: Very low limits
- **Authenticated requests**: Higher limits based on subscription plan
- **Rate limit response**: HTTP 429 with `retryAfterSeconds` field

**Implementation Strategy:**
- Automatic retry with exponential backoff
- Respect `retryAfterSeconds` from 429 responses
- Log rate limit hits for monitoring
- Consider implementing client-side rate limiting for high-volume usage

### Caching Strategy

**Why Caching Matters:**
- Context7 API documentation: "Documentation updates are relatively infrequent, so caching for several hours or days is usually appropriate"
- Reduces API calls and associated costs
- Improves response time for repeated lookups
- Reduces risk of hitting rate limits

**Caching Implementation:**
- File-based cache in `.ai/tools/context7/.cache/`
- Default TTL: 24 hours (configurable)
- Cache key: Hash of (library_id, version, topic, tokens, format)
- Cache can be disabled per-request with `use_cache=False`
- Automatic cache cleanup of expired entries

**Cache Management:**
- Use `clear_cache()` to invalidate all cached data
- Use `get_cache_stats()` to monitor cache effectiveness
- Cache directory is gitignored (not committed)
- Consider clearing cache after major library version releases

### Performance Optimization

**Network Optimization:**
- Connection pooling via requests.Session
- Configurable timeouts (default 30s)
- Retry logic for transient failures
- Parallel requests possible (multiple libraries)

**Response Optimization:**
- Request only needed token count (don't over-request)
- Use topic filtering to reduce response size
- Use TXT format for LLM consumption (smaller than JSON)
- Cache frequently accessed documentation

**Token Management:**
- Start with lower token limits (e.g., 2000) and increase if needed
- Topic filtering can significantly reduce token count
- Monitor actual tokens returned vs requested

### Integration with ADW Workflows

The Context7 scripts can enhance ADW workflows by:

1. **Pre-Planning Research**:
   - Search for libraries before adding dependencies
   - Fetch documentation to understand API capabilities
   - Compare versions to choose appropriate version

2. **Implementation Support**:
   - Fetch specific topic documentation (e.g., "routing" when building routes)
   - Reference official docs without context window overhead
   - Look up API signatures and examples

3. **Code Review**:
   - Verify code follows library best practices
   - Check if newer versions have better approaches
   - Validate deprecated API usage

**Example Integration in ADW Script:**

```python
import sys
import os

# Add tools directory to path
tools_path = os.path.join(os.path.dirname(__file__), '..', 'tools')
sys.path.insert(0, tools_path)

from context7 import get_documentation, search_libraries

# Before implementing feature, check documentation
def research_library(library_name: str, topic: str | None = None):
    """Research a library before using it."""
    # Search for library
    results = search_libraries(library_name)
    if not results.results:
        print(f"Library '{library_name}' not found")
        return None

    # Get top result
    lib = results.results[0]
    print(f"Found: {lib.title} ({lib.stars} stars)")
    print(f"Versions: {', '.join(lib.versions[:5])}")

    # Fetch documentation
    owner, repo = lib.id.strip('/').split('/')
    docs = get_documentation(
        owner,
        repo,
        topic=topic,
        tokens=3000  # Moderate size for overview
    )

    print(f"\nDocumentation ({docs.tokens} tokens):")
    for chunk in docs.chunks[:3]:  # Show first 3 chunks
        print(f"- {chunk.title}")
        print(f"  {chunk.url}")

    return docs

# Use during planning
if __name__ == "__main__":
    # Research Next.js routing before implementing
    research_library("next.js", topic="routing")
```

### Future Enhancements

Potential improvements for future iterations:

1. **Advanced Caching**:
   - Redis cache for shared development environments
   - Cache warming for common libraries
   - Cache preloading based on package.json dependencies

2. **Library Management**:
   - Track library documentation freshness
   - Automatic version updates when new releases detected
   - Dependency graph documentation fetching

3. **Integration Features**:
   - VS Code extension for inline documentation
   - Claude tool-calling compatible wrappers
   - Automatic documentation injection into prompts

4. **Analytics**:
   - Track most-requested libraries
   - Monitor token usage patterns
   - Identify documentation gaps

5. **Performance**:
   - Batch documentation requests
   - Parallel fetching for multiple libraries
   - Compression for cached data

6. **Developer Experience**:
   - Interactive TUI for library exploration
   - Documentation diff tool (version comparison)
   - Smart topic suggestions based on code context

### Comparison with MCP Server

**When to Use Context7 Scripts:**
- Automated workflows and background jobs
- Batch documentation fetching
- Pre-planning research (doesn't consume context)
- Performance-critical applications
- Cost-sensitive operations (token budget)

**When to Use MCP Server:**
- Interactive Claude conversations
- Real-time documentation lookup during chat
- Integrated with Claude Desktop
- When context window space is not a concern
- User-facing applications

**Coexistence:**
Both can coexist in the project:
- Scripts for automation and workflows
- MCP server for interactive development
- Choose based on use case and constraints

### Error Handling Best Practices

**Network Errors:**
- Automatic retry with exponential backoff
- Clear error messages indicating network issues
- Suggest checking internet connection

**Authentication Errors (401):**
- Validate API key format before requests
- Provide instructions for obtaining API key
- Link to Context7 dashboard

**Not Found Errors (404):**
- Suggest similar library names (future enhancement)
- Validate library ID format
- Provide search functionality

**Rate Limit Errors (429):**
- Respect `retryAfterSeconds` from response
- Log rate limit hits
- Suggest enabling caching to reduce API calls

**Server Errors (500):**
- Retry with backoff
- Log error details for debugging
- Suggest trying again later

### Token Budget Savings

**Example Token Savings:**

MCP Server Approach:
- Documentation in context: ~10,000 tokens
- Multiple lookups: ~30,000 tokens
- Context window consumed: 30,000+ tokens

Script Approach:
- Documentation fetched externally: 0 context tokens
- Reference saved locally: 0 context tokens
- Context window consumed: 0 tokens

**Savings: 30,000+ tokens per session**

This allows more tokens for actual code generation, reasoning, and implementation.
