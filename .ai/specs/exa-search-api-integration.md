# Feature: Exa Search API Integration Scripts

## Feature Description

Create reusable Python scripts providing direct access to Exa Search API endpoints. These
scripts enable semantic web search, content retrieval, similar link discovery, and AI-powered
answers from web sources. Each script is standalone, callable from other parts of the codebase,
and designed to integrate with Claude Code workflows and automation tools.

The implementation provides a clean, type-safe interface to all major Exa API endpoints
(search, get-contents, find-similar-links, answer) with proper error handling, validation,
and authentication management.

## User Story

As a developer working on SlideHeroes I want to call Exa Search API endpoints
directly from Python scripts So that I can integrate semantic web search
capabilities into automated workflows, research tools, and AI-powered features
without managing a separate MCP server.

## Problem Statement

Currently, the Exa Search functionality is only accessible through an MCP
(Model Context Protocol) server, which adds complexity and overhead for simple,
on-demand API calls. Developers need a lightweight, scriptable way to:

- Search the web with neural/keyword search capabilities
- Retrieve full content from specific URLs
- Find pages similar to a given URL
- Generate AI-powered answers with citations
- Integrate these capabilities into automation scripts, CLI tools, and background jobs

The MCP server approach requires additional infrastructure, session management, and
is better suited for interactive Claude conversations rather than programmatic access.

## Solution Statement

Create a collection of standalone Python scripts in `.ai/tools/exa/` as reusable
tools that can be called from workflows, automation scripts, and other parts of
the codebase. Each script will:

1. **Authenticate** using environment variables (EXA_API_KEY)
2. **Validate** inputs using Pydantic models for type safety
3. **Execute** HTTP requests to Exa API endpoints
4. **Parse** responses into structured, typed data models
5. **Handle** errors gracefully with retry logic and informative messages
6. **Export** callable functions that can be imported by other scripts

This follows the existing pattern where scripts are both executable
(`uv run script.py`) and importable (`from tools.exa.search import search_web`).
Placing these in `.ai/tools/` rather than `.ai/adws/` separates reusable tools
from workflow-specific scripts.

## Relevant Files

### Existing Files for Reference

- `.ai/adws/agent.py` - Example of CLI integration pattern, subprocess execution, and JSONL output parsing
- `.ai/adws/data_types.py` - Example of Pydantic model definitions for type safety
- `.ai/adws/utils.py` - Example of utility functions and helpers
- `.ai/adws/github.py` - Example of external API integration with error handling
- `.ai/adws/README.md` - Documentation pattern to follow
- `scripts/package.json` - Existing scripts structure that could reference Python scripts
- `packages/ai-gateway/package.json` - Existing AI integration patterns

### New Files

#### Core Implementation Files

- `.ai/tools/exa/__init__.py` - Package initialization, exports public API
- `.ai/tools/exa/client.py` - Base Exa API client with authentication and request handling
- `.ai/tools/exa/models.py` - Pydantic models for all request/response types
- `.ai/tools/exa/search.py` - Search endpoint implementation
- `.ai/tools/exa/get_contents.py` - Get contents endpoint implementation
- `.ai/tools/exa/find_similar.py` - Find similar links endpoint implementation
- `.ai/tools/exa/answer.py` - Answer endpoint implementation
- `.ai/tools/exa/exceptions.py` - Custom exception classes for error handling

#### CLI Scripts

- `.ai/tools/exa/cli_search.py` - Executable script for search operations
- `.ai/tools/exa/cli_get_contents.py` - Executable script for content retrieval
- `.ai/tools/exa/cli_find_similar.py` - Executable script for finding similar links
- `.ai/tools/exa/cli_answer.py` - Executable script for generating answers

#### Testing & Documentation

- `.ai/tools/exa/test_client.py` - Unit tests for client and authentication
- `.ai/tools/exa/README.md` - Comprehensive documentation and usage examples
- `.ai/tools/exa/examples/` - Example usage scripts and integration patterns

## Implementation Plan

### Phase 1: Foundation

Establish the core infrastructure for Exa API integration:

1. **Create package structure** with `__init__.py` and subdirectories
2. **Define Pydantic models** for all API request/response types
3. **Implement base client** with authentication, error handling, and retry logic
4. **Add exception classes** for different error scenarios
5. **Configure environment variables** and validation

### Phase 2: Core Implementation

Implement each Exa API endpoint as a separate module:

1. **Search endpoint** (`search.py`) with support for neural/keyword/auto search types
2. **Get contents endpoint** (`get_contents.py`) for retrieving page content with highlights and summaries
3. **Find similar endpoint** (`find_similar.py`) for discovering related pages
4. **Answer endpoint** (`answer.py`) for generating AI-powered responses with citations
5. **CLI wrappers** for each endpoint to enable command-line usage

### Phase 3: Integration

Complete the implementation with testing, documentation, and integration examples:

1. **Write comprehensive tests** for all endpoints and edge cases
2. **Create detailed documentation** with usage examples
3. **Build example integrations** showing how to use with existing ADW workflows
4. **Add error recovery patterns** and logging
5. **Validate end-to-end** functionality with real API calls

## Step by Step Tasks

### 1. Create Package Structure and Base Models

- Create `.ai/tools/exa/` directory
- Add `__init__.py` with package initialization and exports
- Create `models.py` with Pydantic models for:
  - SearchRequest, SearchResponse, SearchResult
  - GetContentsRequest, GetContentsResponse, ContentResult
  - FindSimilarRequest, FindSimilarResponse
  - AnswerRequest, AnswerResponse, Citation
  - ContentOptions (text, highlights, summary configuration)
  - ErrorResponse
- Add type aliases and enums (SearchType, LivecrawlOption, etc.)
- Write unit tests for model validation in `test_models.py`

### 2. Implement Base Client and Authentication

- Create `client.py` with ExaClient class:
  - Initialize with API key from environment (EXA_API_KEY)
  - Implement `_make_request()` method with:
    - HTTP request execution using `requests` library
    - Retry logic with exponential backoff
    - Error handling and exception mapping
    - Request/response logging
  - Add helper methods for common operations
- Create `exceptions.py` with custom exception classes:
  - ExaAPIError (base exception)
  - ExaAuthenticationError
  - ExaRateLimitError
  - ExaNotFoundError
  - ExaTimeoutError
- Add `utils.py` for shared utility functions
- Write unit tests for client in `test_client.py`

### 3. Implement Search Endpoint

- Create `search.py` with search functionality:
  - `search_web()` function with all search parameters:
    - query, type, numResults, category
    - includeDomains, excludeDomains
    - date filtering (startCrawlDate, endCrawlDate, etc.)
    - content options (text, highlights, summary)
  - Response parsing into SearchResponse model
  - Validation of parameters and constraints
- Create `cli_search.py` for command-line usage:
  - Accept arguments via argparse
  - Display results in human-readable format
  - Support JSON output mode
  - Example: `uv run tools/exa/cli_search.py "AI agents" --type neural --num-results 5`
- Write integration tests for search endpoint

### 4. Implement Get Contents Endpoint

- Create `get_contents.py` with content retrieval:
  - `get_contents()` function with parameters:
    - urls (array of URLs to fetch)
    - text, highlights, summary options
    - livecrawl configuration
    - subpages crawling
  - Response parsing with status handling per URL
  - Support for both cached and live crawling
- Create `cli_get_contents.py` for CLI usage:
  - Accept URLs as arguments or from stdin
  - Display content with formatting
  - Support saving to files
  - Example: `uv run tools/exa/cli_get_contents.py https://example.com --text --highlights`
- Write integration tests for get_contents endpoint

### 5. Implement Find Similar Links Endpoint

- Create `find_similar.py` with similar link discovery:
  - `find_similar()` function with parameters:
    - url (source URL for similarity search)
    - numResults, filtering options
    - content retrieval options
  - Response parsing into FindSimilarResponse
  - Similarity score handling
- Create `cli_find_similar.py` for CLI usage:
  - Accept source URL as argument
  - Display similar links with scores
  - Support content retrieval options
  - Example: `uv run tools/exa/cli_find_similar.py https://example.com --num-results 10`
- Write integration tests for find_similar endpoint

### 6. Implement Answer Endpoint

- Create `answer.py` with AI-powered answer generation:
  - `get_answer()` function with parameters:
    - query (question to answer)
    - text (include full text content)
    - stream (support for streaming responses)
  - Response parsing with answer and citations
  - Streaming response handling (if stream=true)
- Create `cli_answer.py` for CLI usage:
  - Accept query as argument or interactive mode
  - Display answer with formatted citations
  - Support streaming output
  - Example: `uv run tools/exa/cli_answer.py "What is the latest SpaceX valuation?"`
- Write integration tests for answer endpoint

### 7. Create Integration Examples and Documentation

- Create `examples/` directory with integration examples:
  - `research_workflow.py` - Example of using search + get_contents for research
  - `content_discovery.py` - Example of finding similar content and analyzing
  - `qa_with_citations.py` - Example of generating answers with source tracking
  - `adw_integration.py` - Example of integrating with existing ADW workflows
- Create comprehensive `README.md` with:
  - Installation and setup instructions
  - API key configuration
  - Usage examples for each endpoint
  - Integration patterns
  - Error handling guidelines
  - Cost estimation guidance
- Add docstrings to all public functions and classes
- Create quick reference guide for common use cases

### 8. Add Error Handling and Logging

- Implement comprehensive error handling:
  - Network errors with retry logic
  - API errors with specific exception types
  - Validation errors with clear messages
  - Rate limiting with automatic backoff
- Add logging configuration:
  - Use Python's logging module
  - Support DEBUG, INFO, WARNING, ERROR levels
  - Log API requests and responses (with redacted keys)
  - Track timing and performance metrics
- Create `config.py` for configuration management:
  - Environment variable validation
  - Default values and overrides
  - API endpoint URLs and timeouts

### 9. Write Comprehensive Test Suite

- Create test fixtures and mocks:
  - Mock API responses for all endpoints
  - Test data generators
  - Reusable test utilities
- Write unit tests for all modules:
  - `test_models.py` - Model validation and serialization
  - `test_client.py` - Client initialization, authentication, error handling
  - `test_search.py` - Search endpoint logic
  - `test_get_contents.py` - Content retrieval logic
  - `test_find_similar.py` - Similar link discovery logic
  - `test_answer.py` - Answer generation logic
- Write integration tests with real API calls:
  - Mark as integration tests (pytest markers)
  - Require EXA_API_KEY to be set
  - Test all endpoints end-to-end
  - Validate response structures
- Add edge case tests:
  - Empty results
  - Malformed URLs
  - Rate limiting scenarios
  - Timeout handling

### 10. Final Integration and Validation

- Create `.ai/tools/README.md` documenting the tools directory structure
- Update `.ai/adws/README.md` to reference new Exa tools for workflow integration
- Add usage examples showing how to import from `.ai/tools/exa/`
- Create convenience wrapper functions in `__init__.py` for common patterns
- Verify all CLI scripts are executable with proper shebangs
- Test importing modules from ADW scripts using: `sys.path.append()` or relative imports
- Run all validation commands to ensure zero regressions

## Testing Strategy

### Unit Tests

**Models Testing** (`test_models.py`):

- Validate all Pydantic models accept correct data
- Ensure validation fails appropriately for invalid data
- Test serialization to/from JSON
- Verify optional vs required fields
- Test enum validation for SearchType, LivecrawlOption, etc.

**Client Testing** (`test_client.py`):

- Mock HTTP requests to test client logic
- Verify authentication header is set correctly
- Test retry logic with failed requests
- Validate error handling for different HTTP status codes
- Test timeout behavior

**Endpoint Testing** (`test_search.py`, `test_get_contents.py`, etc.):

- Mock API responses for each endpoint
- Test parameter validation and constraints
- Verify response parsing into models
- Test error scenarios (404, 429, 500, etc.)
- Validate filtering and content options

### Integration Tests

**Live API Tests** (`test_integration.py`):

- Require EXA_API_KEY environment variable
- Test search with neural, keyword, and auto types
- Test content retrieval with various options
- Test find similar with real URLs
- Test answer generation with real queries
- Validate cost tracking in responses
- Test streaming responses for answer endpoint

**CLI Tests** (`test_cli.py`):

- Test each CLI script with subprocess
- Verify output formatting
- Test argument parsing
- Validate JSON output mode
- Test error messages for invalid inputs

### Edge Cases

- **Empty Results**: Search queries that return no results
- **Malformed URLs**: Invalid URLs in get_contents and find_similar
- **Rate Limiting**: Handling 429 responses with backoff
- **Timeouts**: Long-running requests that exceed limits
- **Large Responses**: Handling responses with many results
- **Invalid API Keys**: Authentication failures
- **Network Errors**: Connection failures and retries
- **Partial Failures**: get_contents with some URLs failing
- **Invalid Parameters**: Out-of-range values, invalid enums
- **Special Characters**: Queries with unicode, special chars

## Acceptance Criteria

1. **All five Exa API endpoints are fully functional**:
   - Search (neural, keyword, auto modes)
   - Get contents (with text, highlights, summaries)
   - Find similar links
   - Answer (with streaming support)
   - All optional parameters are supported

2. **Type safety is enforced throughout**:
   - All functions use Pydantic models for validation
   - No `any` types in public APIs
   - Type hints on all functions and methods

3. **Scripts are both executable and importable**:
   - Each endpoint has a CLI script that can be run with `uv run`
   - All functions can be imported: `from exa.search import search_web`
   - CLI scripts provide useful output formatting

4. **Error handling is comprehensive**:
   - Custom exceptions for all error types
   - Retry logic with exponential backoff
   - Clear error messages with actionable guidance
   - Rate limiting is handled automatically

5. **Documentation is complete and clear**:
   - README with installation and usage examples
   - Docstrings on all public functions
   - Example scripts demonstrating integration patterns
   - Quick reference guide for common use cases

6. **Tests achieve high coverage**:
   - Unit tests for all modules (>90% coverage)
   - Integration tests for all endpoints
   - Edge case tests for error scenarios
   - All tests pass with zero failures

7. **Integration with existing tools works**:
   - Scripts can be called from other ADW scripts
   - Environment variable management follows ADW patterns
   - Logging integrates with existing logging infrastructure
   - Cost tracking is visible in responses

## Validation Commands

Execute every command to validate the feature works correctly with zero regressions.

### Setup and Installation

```bash
# Verify environment is configured
cd /home/msmith/projects/2025slideheroes/.ai
echo $EXA_API_KEY  # Should show API key

# Install any additional dependencies
uv pip install requests pydantic python-dotenv pytest pytest-cov
```

### Unit Tests Execution

```bash
# Run all unit tests with coverage
cd /home/msmith/projects/2025slideheroes/.ai
uv run pytest tools/exa/test_models.py -v
uv run pytest tools/exa/test_client.py -v
uv run pytest tools/exa/test_search.py -v
uv run pytest tools/exa/test_get_contents.py -v
uv run pytest tools/exa/test_find_similar.py -v
uv run pytest tools/exa/test_answer.py -v

# Run all unit tests with coverage report
uv run pytest tools/exa/ --cov=tools.exa --cov-report=term-missing --ignore=tools/exa/examples/
```

### Integration Tests (Requires EXA_API_KEY)

```bash
# Run integration tests with real API
cd /home/msmith/projects/2025slideheroes/.ai
uv run pytest tools/exa/test_integration.py -v -m integration

# Run CLI tests
uv run pytest tools/exa/test_cli.py -v
```

### CLI Script Validation

```bash
cd /home/msmith/projects/2025slideheroes/.ai

# Test search endpoint
uv run tools/exa/cli_search.py "AI agents and automation" --type neural --num-results 5

# Test get contents endpoint
uv run tools/exa/cli_get_contents.py "https://docs.exa.ai/reference/quickstart" --text

# Test find similar endpoint
uv run tools/exa/cli_find_similar.py "https://docs.exa.ai/reference/quickstart" --num-results 5

# Test answer endpoint
uv run tools/exa/cli_answer.py "What is Exa Search and how does it work?"

# Test JSON output mode
uv run tools/exa/cli_search.py "Python testing frameworks" --json
```

### Import and Integration Tests

```bash
cd /home/msmith/projects/2025slideheroes/.ai

# Test importing modules
python3 -c "import sys; sys.path.insert(0, 'tools'); from exa import search_web, get_contents, find_similar, get_answer; print('✅ All imports successful')"

# Test using functions programmatically
python3 -c "
import sys
sys.path.insert(0, 'tools')
from exa import search_web
results = search_web('AI development tools', num_results=3)
print(f'✅ Found {len(results.results)} results')
"
```

### Example Scripts Validation

```bash
cd /home/msmith/projects/2025slideheroes/.ai

# Run example integration scripts
uv run tools/exa/examples/research_workflow.py
uv run tools/exa/examples/content_discovery.py
uv run tools/exa/examples/qa_with_citations.py
```

### Type Checking

```bash
cd /home/msmith/projects/2025slideheroes/.ai

# Run mypy type checking on all exa modules
python3 -m mypy tools/exa/ --strict
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

# Create a test script that uses all endpoints
cat > tools/exa/test_e2e.py << 'EOF'
#!/usr/bin/env python3
"""End-to-end test of all Exa API endpoints."""
import sys
sys.path.insert(0, '/home/msmith/projects/2025slideheroes/.ai/tools')

from exa import search_web, get_contents, find_similar, get_answer

# Test search
print("Testing search...")
search_results = search_web("Anthropic Claude AI", num_results=3)
print(f"✅ Search: Found {len(search_results.results)} results")

# Test get contents
if search_results.results:
    url = search_results.results[0].url
    print(f"\nTesting get_contents with {url}...")
    content = get_contents([url], text=True)
    print(f"✅ Get contents: Retrieved {len(content.results)} pages")

# Test find similar
print(f"\nTesting find_similar with {url}...")
similar = find_similar(url, num_results=3)
print(f"✅ Find similar: Found {len(similar.results)} similar pages")

# Test answer
print("\nTesting answer...")
answer = get_answer("What is Claude AI?")
print(f"✅ Answer: Generated answer with {len(answer.citations)} citations")

print("\n🎉 All endpoints working correctly!")
EOF

chmod +x tools/exa/test_e2e.py
uv run tools/exa/test_e2e.py
```

## Notes

### Dependencies

This implementation requires the following Python packages (add to project dependencies if not already present):

- `requests` - HTTP client for API calls
- `pydantic>=2.0` - Data validation and serialization
- `python-dotenv` - Environment variable management
- `pytest` - Testing framework
- `pytest-cov` - Coverage reporting
- `pytest-mock` - Mocking for tests

### Cost Management

The Exa API has usage-based pricing. The implementation should:

- Track costs in all responses (`costDollars` field)
- Log cumulative costs for monitoring
- Provide warnings for expensive operations (>100 results, content retrieval)
- Allow users to set budget limits in configuration

### Authentication Security

- Never commit API keys to the repository
- Store `EXA_API_KEY` in `.env` file (already gitignored)
- Validate API key format before making requests
- Redact API keys in all logging output

### Performance Optimization

- Implement connection pooling for HTTP requests
- Cache search results where appropriate (add optional caching layer)
- Use timeouts to prevent hanging requests
- Support batch operations where possible

### Future Enhancements

Potential improvements for future iterations:

1. **Caching layer**: Redis or file-based caching for repeated queries
2. **Rate limiting**: Client-side rate limiting to stay within quotas
3. **Batch processing**: Queue multiple requests and process efficiently
4. **Result storage**: Save search results to database for later analysis
5. **Claude integration**: Build Anthropic tool-calling compatible wrappers
6. **Web UI**: Simple Flask/FastAPI app for interactive searching
7. **Monitoring**: Prometheus metrics for usage tracking
8. **Cost alerts**: Notifications when spending exceeds thresholds

### Integration with ADW

The Exa scripts can enhance ADW workflows by:

- **Research phase**: Use search and answer endpoints to gather context before planning
- **Documentation**: Find similar implementations and best practices
- **Code examples**: Search for code snippets and patterns
- **Validation**: Use answer endpoint to verify technical decisions
- **Learning**: Build a knowledge base of search results for future reference

Example integration in `adw_plan_build.py`:

```python
import sys
import os

# Add tools directory to path for imports
tools_path = os.path.join(os.path.dirname(__file__), '..', 'tools')
sys.path.insert(0, tools_path)

from exa import search_web, get_answer

# Before creating plan, research similar implementations
research_query = f"Best practices for {issue_title}"
search_results = search_web(research_query, num_results=5, text=True)

# Get AI-powered summary of best practices
answer = get_answer(research_query)

# Include research in planning context
planning_context = f"""
Research findings:
{answer.answer}

Relevant sources:
{[r.url for r in search_results.results]}
"""
```

### Project Structure Alignment

The new Exa scripts follow the established ADW patterns:

- **Type safety**: Pydantic models like `data_types.py`
- **CLI + library**: Executable scripts that can also be imported
- **Error handling**: Custom exceptions and retry logic
- **Environment config**: `.env` file with validation
- **Testing**: Unit and integration tests with pytest
- **Documentation**: Comprehensive README with examples
- **Logging**: Structured logging for debugging

This ensures consistency across the codebase and makes it easy for developers familiar with ADW to use the Exa integration.
