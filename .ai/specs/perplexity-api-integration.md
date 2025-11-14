# Feature: Perplexity API Integration Scripts

## Feature Description

Create a comprehensive set of Python CLI scripts to interact with the Perplexity API, mirroring the successful Exa search integration pattern. This integration will provide AI agents with powerful web research capabilities through Perplexity's Search API and Grounded LLM (Sonar) services. The implementation includes:

- Robust client architecture with authentication, retry logic, and error handling
- Pydantic models for type-safe request/response validation
- CLI scripts for both Search and Chat Completions endpoints
- Comprehensive test coverage and documentation
- Advanced filtering capabilities (domain, language, date/time)
- Production-ready configuration and monitoring

## User Story

As an AI agent developer
I want to use Perplexity API via CLI scripts
So that Claude agents can perform real-time web research, get grounded AI responses with citations, and access current information without relying on MCP servers

## Problem Statement

Currently, the project uses the Perplexity MCP server for web search capabilities. However, direct API integration via Python scripts provides several advantages:

1. **Better Control**: Direct API access allows fine-grained control over requests, retries, timeouts, and error handling
2. **Consistency**: Mirrors the proven Exa search integration pattern already established in the codebase
3. **Flexibility**: Easier to customize, extend, and integrate into different workflows
4. **Debugging**: Simpler to debug and monitor compared to MCP server abstractions
5. **Performance**: Direct API calls eliminate MCP server overhead
6. **Offline Development**: Scripts can be tested and developed independently of MCP infrastructure

## Solution Statement

Implement a production-grade Perplexity API integration following the established Exa pattern:

1. **Core Client Module**: Base `PerplexityClient` class handling authentication, HTTP session management, retry logic with exponential backoff, comprehensive error handling, and connection pooling
2. **Type-Safe Models**: Pydantic models for all request/response structures ensuring runtime validation
3. **Search API**: Full support for ranked web search with domain filtering, date/time filtering, language filtering, and multi-query support
4. **Chat Completions API**: Grounded LLM responses with streaming support, conversation context, and citation extraction
5. **CLI Tools**: User-friendly command-line interfaces for both APIs with JSON output options and interactive modes
6. **Error Handling**: Custom exception hierarchy for different error types with detailed logging and debugging support
7. **Testing**: Comprehensive unit, integration, and E2E tests
8. **Documentation**: Quick reference guide similar to Exa integration docs

## Relevant Files

### Existing Reference Implementation (Exa)
- `.ai/tools/exa/client.py` - Base client architecture, retry logic, session management
- `.ai/tools/exa/models.py` - Pydantic models for type-safe validation
- `.ai/tools/exa/exceptions.py` - Custom exception hierarchy
- `.ai/tools/exa/utils.py` - Utility functions for API key management, validation
- `.ai/tools/exa/search.py` - Search functionality implementation
- `.ai/tools/exa/cli_search.py` - CLI interface for search
- `.ai/tools/exa/answer.py` - Answer functionality (similar to Chat Completions)
- `.ai/tools/exa/cli_answer.py` - CLI interface for answers
- `.ai/ai_docs/context-docs/tools/exa-search-integration.md` - User-facing documentation

### New Files

#### Core Implementation
- `.ai/tools/perplexity/__init__.py` - Package initialization with version and exports
- `.ai/tools/perplexity/client.py` - Base PerplexityClient class
- `.ai/tools/perplexity/models.py` - Pydantic models for requests/responses
- `.ai/tools/perplexity/exceptions.py` - Custom exception classes
- `.ai/tools/perplexity/utils.py` - Utility functions
- `.ai/tools/perplexity/search.py` - Search API implementation
- `.ai/tools/perplexity/chat.py` - Chat Completions API implementation

#### CLI Scripts
- `.ai/tools/perplexity/cli_search.py` - CLI for Search API
- `.ai/tools/perplexity/cli_chat.py` - CLI for Chat Completions API

#### Tests
- `.ai/tools/perplexity/test_client.py` - Client unit tests
- `.ai/tools/perplexity/test_models.py` - Model validation tests
- `.ai/tools/perplexity/test_search.py` - Search functionality tests
- `.ai/tools/perplexity/test_chat.py` - Chat functionality tests
- `.ai/tools/perplexity/test_e2e.py` - End-to-end integration tests

#### Documentation
- `.ai/ai_docs/context-docs/tools/perplexity-api-integration.md` - Quick reference guide
- `.ai/tools/perplexity/examples/research_workflow.py` - Example usage patterns

#### Configuration
- `.ai/.env.sample` - Update with PERPLEXITY_API_KEY placeholder

## Impact Analysis

This feature adds a new API integration tool to the `.ai/tools/` directory, expanding research capabilities for AI agents.

### Dependencies Affected

**New Dependencies Required:**
- `perplexityai` (Python SDK) - Official Perplexity Python client library
- `pydantic` (already in project) - Runtime type validation
- `requests` (already in project) - HTTP client with retry support
- `python-dotenv` (already in project) - Environment variable management

**Packages That Will Consume This Feature:**
- Claude agents (via CLI scripts in `.claude/agents/research/`)
- AI Developer Workflow scripts in `.ai/adws/`
- Custom slash commands that require web research
- Feature implementation workflows requiring real-time information

### Risk Assessment

**Medium Risk** - Well-understood patterns with some complexity

**Rationale:**
- **Positive**: Nearly identical to proven Exa integration pattern, reducing implementation risk
- **Positive**: Comprehensive API documentation from Perplexity provides clear guidance
- **Positive**: Type safety via Pydantic reduces runtime errors
- **Moderate**: External API dependency introduces failure points (rate limits, network issues)
- **Moderate**: Requires secure API key management
- **Low**: Isolated to `.ai/tools/` directory with no impact on production application code

**Mitigation Strategies:**
- Implement exponential backoff retry logic for rate limits and transient failures
- Comprehensive error handling with graceful degradation
- Thorough testing including mock API responses
- Clear documentation of API limits and best practices

### Backward Compatibility

**No Breaking Changes** - This is an additive feature

- Existing Exa search integration remains untouched
- MCP server integration can coexist with direct API scripts
- No changes to production application code
- AI agents can choose between MCP server or direct API scripts
- Environment variable namespace is separate (`PERPLEXITY_API_KEY` vs `EXA_API_KEY`)

### Performance Impact

**Minimal Performance Impact**

**Positive Impacts:**
- Direct API calls may be faster than MCP server abstraction layer
- Connection pooling (10-20 concurrent connections) optimizes throughput
- Async support enables parallel research queries

**Considerations:**
- API rate limits (varies by plan) - implement backoff and monitoring
- Network latency for external API calls (typical 500ms-2s per request)
- Memory efficient - processes responses immediately, no large data accumulation
- Bundle size: N/A (development tooling only, not bundled with web app)

**Monitoring:**
- Track average response times via structured logging
- Monitor rate limit headers (`X-RateLimit-Remaining`, `X-RateLimit-Reset`)
- Log success/failure rates for reliability metrics

### Security Considerations

**API Key Management:**
- Store `PERPLEXITY_API_KEY` in `.env` file (never committed to git)
- Validate `.env` is in `.gitignore`
- Use `python-dotenv` to load environment variables securely
- Redact API keys in logs (show only first/last 4 characters)
- Validate API key format at client initialization

**Data Validation:**
- Use Pydantic schemas to validate all inputs/outputs at runtime boundaries
- Sanitize user-provided queries to prevent injection attacks
- Validate domain filters to prevent SSRF-like issues
- Limit query length to prevent abuse

**Authentication/Authorization:**
- Client authenticates using Bearer token in Authorization header
- No user authentication required (server-side tool only)
- API key rotation supported (primary + fallback pattern)

**Potential Vulnerabilities:**
- **API Key Exposure**: Mitigated by environment variables and redaction in logs
- **Injection Attacks**: Mitigated by Pydantic validation and schema enforcement
- **Rate Limit Abuse**: Mitigated by exponential backoff and circuit breaker pattern
- **Network Security**: Uses HTTPS for all API communication (TLS 1.2+)

**Privacy/Compliance:**
- API queries may contain sensitive information - log only metadata, not full query content
- Perplexity's privacy policy applies to all API usage
- No PII storage in local scripts
- Responses cached only in memory (no persistent storage)

## Pre-Feature Checklist

Before starting implementation:
- [x] Create feature branch: `feature/perplexity-api-integration`
- [x] Review existing Exa implementation for patterns
- [x] Identify all integration points (CLI, agents, workflows)
- [x] Define success metrics (tests pass, CLI works, agents can use)
- [x] Confirm feature doesn't duplicate existing functionality (complements MCP, doesn't replace)
- [x] Verify all required dependencies are available (perplexityai SDK exists)
- [ ] Plan feature flag strategy (not needed - optional tooling)
- [x] Fetch and review all Perplexity API documentation

## Documentation Updates Required

**New Documentation:**
- `.ai/ai_docs/context-docs/tools/perplexity-api-integration.md` - Quick reference guide
  - When to use Search vs Chat Completions
  - Basic command syntax and examples
  - Common use cases and patterns
  - Filter options (domain, language, date/time)
  - Error handling and troubleshooting

**Technical Documentation:**
- Inline docstrings for all modules, classes, and functions (Google style)
- README in `.ai/tools/perplexity/` explaining architecture
- Example scripts in `.ai/tools/perplexity/examples/`
- Test documentation explaining mock patterns

**Environment Setup:**
- Update `.ai/.env.sample` with `PERPLEXITY_API_KEY=your-api-key-here`
- Add setup instructions to quick reference guide

**Integration Documentation:**
- Document how Claude agents can invoke Perplexity scripts
- Add examples to `.claude/agents/research/` agent documentation
- Update CLAUDE.md if this becomes a primary research tool

## Rollback Plan

**Disabling the Feature:**

Since this is an optional development tool with no production dependencies, rollback is straightforward:

1. **Remove from Git:**
   ```bash
   git revert <commit-sha>
   # or
   git rm -rf .ai/tools/perplexity/
   ```

2. **Uninstall Dependencies:**
   ```bash
   pip uninstall perplexityai
   ```

3. **Environment Cleanup:**
   - Remove `PERPLEXITY_API_KEY` from `.env`
   - Remove from `.env.sample`

**No Database Migrations Required** - This feature doesn't touch the database

**No Feature Flags Needed** - Optional CLI tool, agents choose whether to use it

**Monitoring for Issues:**
- Watch for authentication errors (invalid API key)
- Monitor rate limit errors (quota exceeded)
- Check for timeout errors (network/API issues)
- Track test failures in CI/CD pipeline

**Graceful Degradation:**
- If Perplexity API is unavailable, agents can fall back to:
  - Exa search for web research
  - MCP server (if configured)
  - WebSearch tool
  - Manual research

## Implementation Plan

### Phase 1: Foundation (Infrastructure & Core Client)

Establish the foundational architecture, authentication, and error handling before implementing specific APIs.

**Goals:**
- Set up project structure mirroring Exa pattern
- Implement base client with authentication and retry logic
- Define comprehensive error handling
- Create type-safe Pydantic models
- Add utility functions for common operations

**Dependencies:**
- Install `perplexityai` SDK
- Verify `pydantic`, `requests`, `python-dotenv` are available

**Validation:**
- Unit tests for client initialization and authentication
- Error handling tests for all exception types
- Utility function tests

### Phase 2: Core Implementation (API Endpoints)

Implement the two primary Perplexity APIs: Search and Chat Completions.

**Goals:**
- Implement Search API with all filter options
- Implement Chat Completions API with streaming support
- Add advanced filtering (domain, language, date/time)
- Create CLI scripts for both APIs
- Ensure type-safe request/response handling

**Dependencies:**
- Phase 1 must be complete (client, models, error handling)
- Pydantic models must be validated

**Validation:**
- Unit tests for each API method
- Integration tests with mock responses
- CLI tests with various argument combinations

### Phase 3: Integration (Testing, Documentation & Polish)

Complete testing, documentation, and integrate with existing AI agent workflows.

**Goals:**
- Write comprehensive test suite
- Create quick reference documentation
- Add example workflows
- Integrate with Claude agents
- Final validation and polish

**Dependencies:**
- Phase 2 must be complete (both APIs working)
- All CLI scripts functional

**Validation:**
- E2E tests using real API calls (with test API key)
- Documentation reviewed and validated
- Example scripts execute successfully
- Claude agents can successfully use the scripts

## Step by Step Tasks

### Setup Project Structure

Create the directory structure and initialize the Python package:

- Create `.ai/tools/perplexity/` directory
- Create `__init__.py` with package exports and version
- Create empty module files (client, models, exceptions, utils, search, chat)
- Create CLI script files (cli_search, cli_chat)
- Create test directory structure
- Create examples directory
- Update `.ai/.env.sample` with `PERPLEXITY_API_KEY` placeholder

### Install Dependencies

Verify and install required dependencies:

- Check if `perplexityai` SDK is available via pip
- Install `perplexityai` using `pip install perplexityai`
- Verify `pydantic`, `requests`, `python-dotenv` are already installed
- Document all dependencies in implementation notes

### Implement Exceptions Module

Create custom exception hierarchy for Perplexity API errors:

- Define `PerplexityAPIError` base exception with status_code and request_id
- Define `PerplexityAuthenticationError` for 401 errors
- Define `PerplexityRateLimitError` for 429 errors with retry_after
- Define `PerplexityValidationError` for 400/422 errors
- Define `PerplexityTimeoutError` for timeout errors
- Define `PerplexityConnectionError` for network errors
- Add unit tests for exception instantiation and string representation
- Model after Exa exceptions.py with Perplexity-specific enhancements

### Implement Utils Module

Create utility functions for common operations:

- Implement `get_api_key()` to read `PERPLEXITY_API_KEY` from environment
- Implement `validate_api_key_format()` to validate API key structure
- Implement `redact_api_key()` for secure logging (show first/last 4 chars)
- Implement `format_date_for_api()` to convert dates to MM/DD/YYYY format
- Implement `parse_list_argument()` for comma-separated domain/language lists
- Add validation helpers for recency filters, language codes, domain patterns
- Add unit tests for all utility functions
- Model after Exa utils.py with Perplexity-specific date formatting

### Implement Pydantic Models

Create type-safe models for all API requests and responses:

**Enums and Options:**
- Define `RecencyFilter` enum (day, week, month, year)
- Define `SearchDomainFilter` model with validation
- Define `LanguageCode` pattern validator (ISO 639-1 lowercase)

**Search API Models:**
- Define `SearchRequest` with query, num_results (1-100), recency_filter, domain_filter (max 20), language_filter (max 10), search_after_date, search_before_date
- Define `SearchResult` with url, title, snippet, published_date
- Define `SearchResponse` with results array and request_id
- Add field validators for date format (MM/DD/YYYY), language codes (ISO 639-1), domain limits

**Chat Completions API Models:**
- Define `ChatMessage` with role (system, user, assistant) and content
- Define `ChatRequest` with model (sonar, sonar-pro), messages array, stream boolean, max_tokens, temperature
- Define `ChatChoice` with message and finish_reason
- Define `ChatResponse` with id, model, choices, usage, citations
- Define `Citation` with url, title, snippet for grounded responses
- Add validators for message structure and model selection

**Error Models:**
- Define `ErrorResponse` with error message, status, request_id

**Testing:**
- Write unit tests for all model validations
- Test edge cases (empty strings, invalid dates, too many domains)
- Test serialization/deserialization round-trips
- Model after Exa models.py with Perplexity-specific fields

### Implement Base Client

Create the core `PerplexityClient` class:

- Define class constants (BASE_URL, DEFAULT_TIMEOUT, MAX_RETRIES)
- Implement `__init__()` with API key validation and session creation
- Implement `_create_session()` with retry strategy (exponential backoff)
- Configure retry for status codes 429, 500, 502, 503, 504
- Implement connection pooling (50-100 keepalive connections)
- Implement `_get_headers()` returning Authorization Bearer token
- Implement `_make_request()` with timeout handling and error mapping
- Implement `_handle_error_response()` mapping status codes to exceptions
- Track rate limit headers (X-RateLimit-Remaining, X-RateLimit-Reset)
- Add structured logging for requests (method, endpoint, duration, status)
- Implement context manager protocol (`__enter__`, `__exit__`)
- Add `close()` method to clean up HTTP session
- Write comprehensive unit tests for client initialization, retries, error handling
- Model after Exa client.py with Perplexity-specific authentication

### Implement Search API Module

Create the search functionality implementation:

- Define `search()` function accepting SearchRequest model
- Build request payload with query and filters
- Handle domain filtering (convert list to API format)
- Handle language filtering (validate ISO 639-1 codes)
- Handle date filtering (validate MM/DD/YYYY format, check date logic)
- Handle recency filtering (mutually exclusive with date filters)
- Call client._make_request() with POST to /search endpoint
- Parse response into SearchResponse model
- Handle empty results gracefully
- Add error handling for validation errors
- Add structured logging (query, num_results, filters, duration)
- Write unit tests for all filter combinations
- Write integration tests with mock API responses
- Model after Exa search.py with Perplexity-specific filtering

### Implement Chat Completions API Module

Create the chat completions functionality implementation:

- Define `chat()` function accepting ChatRequest model
- Build messages array with proper role structure
- Support conversation context (multiple messages)
- Handle model selection (sonar vs sonar-pro)
- Handle streaming responses (yield chunks)
- Call client._make_request() with POST to /chat/completions endpoint
- Parse response into ChatResponse model
- Extract citations from grounded responses
- Handle streaming mode with generator pattern
- Add error handling for context length errors
- Add structured logging (model, message_count, tokens, duration)
- Write unit tests for single-message and multi-message chats
- Write tests for streaming vs non-streaming modes
- Write integration tests with mock API responses

### Implement Search CLI Script

Create user-friendly command-line interface for Search API:

- Use `argparse` for argument parsing
- Add `--query` (required) for search query
- Add `--num-results` (default 10) for result count
- Add `--recency` for recency filter (day, week, month, year)
- Add `--domains` for domain filter (comma-separated, max 20)
- Add `--languages` for language filter (comma-separated, max 10)
- Add `--after-date` for search_after_date (MM/DD/YYYY format)
- Add `--before-date` for search_before_date (MM/DD/YYYY format)
- Add `--json` flag for JSON output
- Add `--verbose` flag for detailed logging
- Implement formatted text output (URL, title, snippet)
- Implement JSON output mode
- Add input validation with helpful error messages
- Handle API errors with user-friendly messages
- Add usage examples in help text
- Write CLI tests using subprocess or mock
- Model after Exa cli_search.py

### Implement Chat CLI Script

Create user-friendly command-line interface for Chat Completions API:

- Use `argparse` for argument parsing
- Add `--query` (required) for user message
- Add `--model` for model selection (sonar, sonar-pro, default sonar)
- Add `--system` for system message (optional)
- Add `--stream` flag for streaming responses
- Add `--max-tokens` for response length limit
- Add `--temperature` for creativity control (0-2)
- Add `--show-citations` flag to display grounded sources
- Add `--json` flag for JSON output
- Add `--interactive` flag for multi-turn conversation mode
- Implement formatted text output (answer + citations)
- Implement streaming output (real-time token display)
- Implement interactive mode (conversation loop)
- Add input validation with helpful error messages
- Handle API errors with user-friendly messages
- Add usage examples in help text
- Write CLI tests using subprocess or mock
- Model after Exa cli_answer.py with chat-specific features

### Write Unit Tests

Create comprehensive unit tests for all modules:

**Test Client Module:**
- Test client initialization with valid/invalid API keys
- Test session creation and retry configuration
- Test header generation
- Test request execution with mocked responses
- Test error handling for all status codes
- Test timeout handling
- Test retry logic with exponential backoff
- Test context manager protocol

**Test Models Module:**
- Test all model instantiations with valid data
- Test field validators (date format, language codes, domain limits)
- Test serialization to API format
- Test deserialization from API responses
- Test edge cases (empty arrays, null optionals)
- Test validation errors with invalid inputs

**Test Search Module:**
- Test search with basic query
- Test domain filtering (single, multiple, max 20)
- Test language filtering (single, multiple, max 10)
- Test date filtering (before, after, range)
- Test recency filtering (day, week, month, year)
- Test error handling for conflicting filters
- Test response parsing

**Test Chat Module:**
- Test single-message chat
- Test multi-message conversation
- Test model selection
- Test streaming mode
- Test citation extraction
- Test error handling

**Test Utils Module:**
- Test API key retrieval from environment
- Test API key validation
- Test API key redaction
- Test date formatting
- Test list argument parsing

Run all tests: `pytest .ai/tools/perplexity/ -v --cov`

### Write Integration Tests

Create integration tests with mocked API responses:

- Mock successful search request/response
- Mock successful chat request/response
- Mock rate limit error (429) with retry
- Mock authentication error (401)
- Mock validation error (400)
- Mock timeout error (504)
- Mock network connection error
- Test CLI scripts with various argument combinations
- Verify error messages are user-friendly
- Verify logging output is structured correctly

### Write E2E Tests

Create end-to-end tests using real API calls (requires test API key):

- Test search with simple query
- Test search with all filter types
- Test search with domain filtering
- Test search with date/time filtering
- Test chat with single message
- Test chat with conversation context
- Test chat with citations
- Test streaming chat
- Verify response structure matches Pydantic models
- Document E2E test setup (API key requirement)
- Add E2E tests to separate test command (not run in CI)

### Create Documentation

Write comprehensive documentation for end users:

**Quick Reference Guide (`.ai/ai_docs/context-docs/tools/perplexity-api-integration.md`):**
- Overview of Perplexity integration
- When to use Search vs Chat Completions
- Installation and setup instructions
- Basic command syntax with examples
- Search API usage (basic, domain filtering, date filtering, language filtering)
- Chat API usage (single message, conversation, streaming, citations)
- Common use cases and patterns
- Error handling and troubleshooting
- Performance tips and best practices
- Comparison with Exa search integration

**Code Documentation:**
- Add comprehensive docstrings to all modules (Google style)
- Document all classes, methods, and functions
- Include parameter types, return types, and exceptions
- Add inline comments for complex logic

**Example Scripts:**
- Create `.ai/tools/perplexity/examples/research_workflow.py`
- Show how to chain search and chat for research
- Demonstrate error handling patterns
- Show how to extract and process citations

### Integration with Claude Agents

Integrate Perplexity scripts with AI agent workflows:

- Create `.claude/agents/research/perplexity-expert.md` agent definition
- Document how agents should invoke CLI scripts
- Add examples of when to use Perplexity vs Exa
- Update research agent documentation
- Add slash command integration (optional)
- Test agent invocation in real scenarios

### Final Validation

Run all validation commands to ensure feature works correctly:

- Run full test suite: `pytest .ai/tools/perplexity/ -v --cov --cov-report=term-missing`
- Verify 90%+ code coverage
- Run type checking: `mypy .ai/tools/perplexity/`
- Run linter: `ruff check .ai/tools/perplexity/`
- Run formatter: `ruff format .ai/tools/perplexity/`
- Test CLI search: `uv run .ai/tools/perplexity/cli_search.py "test query" --num-results 5`
- Test CLI chat: `uv run .ai/tools/perplexity/cli_chat.py "test question" --show-citations`
- Test streaming: `uv run .ai/tools/perplexity/cli_chat.py "test question" --stream`
- Test domain filtering: `uv run .ai/tools/perplexity/cli_search.py "AI" --domains github.com,arxiv.org`
- Test date filtering: `uv run .ai/tools/perplexity/cli_search.py "AI" --after-date 01/01/2025`
- Test language filtering: `uv run .ai/tools/perplexity/cli_search.py "AI" --languages en,fr`
- Verify documentation renders correctly
- Verify example scripts execute successfully
- Run E2E tests with real API key (manually)
- Verify no regressions in existing Exa integration

## Testing Strategy

### Unit Tests

**Client Tests (`test_client.py`):**
- Client initialization with valid/invalid API keys
- Session creation and configuration
- Header generation with Bearer token
- Request execution with various HTTP methods
- Error response handling for all status codes (401, 429, 400, 422, 408, 504, 500)
- Retry logic with exponential backoff
- Timeout handling
- Connection pooling configuration
- Context manager protocol
- Rate limit header tracking

**Model Tests (`test_models.py`):**
- SearchRequest validation (query, num_results, filters)
- SearchResponse deserialization from API JSON
- ChatRequest validation (model, messages, parameters)
- ChatResponse deserialization with citations
- Field validators (date format MM/DD/YYYY, language codes ISO 639-1, domain limits)
- Enum validation (RecencyFilter, model names)
- Edge cases (empty arrays, null optionals, max limits)
- Serialization round-trips (model → dict → model)

**Search Tests (`test_search.py`):**
- Basic search with query only
- Search with num_results parameter
- Domain filtering (single, multiple, max 20 limit)
- Language filtering (single, multiple, max 10 limit)
- Date filtering (before, after, range)
- Recency filtering (day, week, month, year)
- Filter conflict detection (recency + date)
- Response parsing and model validation
- Empty results handling
- Error handling for invalid filters

**Chat Tests (`test_chat.py`):**
- Single-message chat
- Multi-message conversation context
- Model selection (sonar, sonar-pro)
- Streaming mode (generator pattern)
- Non-streaming mode
- Citation extraction from grounded responses
- Temperature and max_tokens parameters
- System message configuration
- Error handling for context length
- Response parsing and model validation

**Utils Tests (`test_utils.py`):**
- API key retrieval from environment
- API key validation (format, length)
- API key redaction for logging
- Date formatting to MM/DD/YYYY
- List argument parsing (comma-separated strings)
- Language code validation (ISO 639-1)
- Domain pattern validation
- Recency filter validation

**Coverage Target:** 90%+ code coverage with `pytest-cov`

### Integration Tests

**Mocked API Tests:**
- Complete search workflow with mocked successful response
- Complete chat workflow with mocked successful response
- Rate limit error (429) with retry behavior
- Authentication error (401) with clear message
- Validation error (400) with field-specific feedback
- Timeout error (504) with retry logic
- Network connection error with graceful handling
- CLI script execution with various argument combinations
- Error message formatting for end users
- Logging output structure and content

**Mock Patterns:**
- Use `responses` library to mock HTTP responses
- Mock `requests.Session.request()` for client tests
- Mock `os.getenv()` for environment variable tests
- Create fixture factories for common API responses
- Use `pytest.parametrize` for testing multiple scenarios

### E2E Tests

**Real API Tests (requires PERPLEXITY_API_KEY):**
- Search with simple query (e.g., "artificial intelligence")
- Search with domain filter (e.g., arxiv.org, github.com)
- Search with language filter (e.g., en, fr)
- Search with recency filter (e.g., month)
- Search with date range filter
- Chat with single message (e.g., "Explain quantum computing")
- Chat with multi-message conversation
- Chat with streaming enabled
- Chat with citation display
- Verify response structure matches Pydantic models
- Verify citations contain valid URLs
- Verify streaming yields chunks correctly

**E2E Test Configuration:**
- Separate test file: `test_e2e.py`
- Mark with `@pytest.mark.e2e` decorator
- Skip if `PERPLEXITY_API_KEY` not set
- Run manually with: `pytest -m e2e`
- Not included in CI/CD pipeline (requires API key)
- Document setup instructions in test file

**Rate Limit Handling in E2E:**
- Add delays between requests (1-2 seconds)
- Implement retry with exponential backoff
- Respect `Retry-After` header
- Log rate limit metrics

### Edge Cases

**Input Validation Edge Cases:**
- Empty query string → validation error
- Query with only whitespace → validation error
- Negative num_results → validation error
- num_results > 100 → validation error
- More than 20 domains → validation error
- More than 10 languages → validation error
- Invalid date format (not MM/DD/YYYY) → validation error
- search_after_date > search_before_date → validation error
- Recency filter + date filters together → validation error
- Invalid language code (not ISO 639-1) → validation error
- Invalid model name → validation error

**API Response Edge Cases:**
- Empty results array → return empty SearchResponse
- Missing optional fields (title, snippet, published_date) → None values
- Malformed JSON response → raise parsing error
- Response with unexpected fields → ignore unknown fields
- Rate limit with no Retry-After header → use default backoff
- Timeout during streaming → raise timeout error mid-stream

**Network Edge Cases:**
- Connection timeout → retry with backoff
- Read timeout → retry with backoff
- DNS resolution failure → connection error
- SSL/TLS error → connection error
- HTTP 500 server error → retry with backoff
- HTTP 502/503 gateway error → retry with backoff

**Environment Edge Cases:**
- Missing PERPLEXITY_API_KEY → clear error message
- Empty PERPLEXITY_API_KEY → validation error
- Invalid API key format → validation error
- API key with special characters → handle safely
- Multiple API keys (comma-separated) → use first, warn

## Acceptance Criteria

**Functional Requirements:**
- [ ] Search API successfully executes queries and returns results
- [ ] Chat Completions API successfully generates grounded responses with citations
- [ ] Domain filtering correctly limits results to specified domains (max 20)
- [ ] Language filtering correctly limits results to specified languages (max 10)
- [ ] Date filtering correctly applies before/after date constraints (MM/DD/YYYY format)
- [ ] Recency filtering correctly applies day/week/month/year constraints
- [ ] Date and recency filters are mutually exclusive (enforced)
- [ ] Streaming chat mode yields response chunks in real-time
- [ ] Multi-message conversation context is preserved
- [ ] Citations are extracted and displayed correctly

**CLI Requirements:**
- [ ] `cli_search.py` accepts all documented arguments and flags
- [ ] `cli_chat.py` accepts all documented arguments and flags
- [ ] CLI scripts provide helpful error messages for invalid inputs
- [ ] `--json` flag outputs valid JSON for both CLIs
- [ ] `--verbose` flag enables detailed logging
- [ ] Interactive chat mode supports multi-turn conversations
- [ ] Help text (`--help`) is clear and includes examples

**Error Handling Requirements:**
- [ ] Authentication errors (401) display clear message about API key
- [ ] Rate limit errors (429) retry with exponential backoff
- [ ] Validation errors (400/422) show specific field errors
- [ ] Timeout errors retry appropriately
- [ ] Network errors are handled gracefully with user-friendly messages
- [ ] All errors include request_id when available for debugging

**Testing Requirements:**
- [ ] Unit test coverage ≥ 90% for all modules
- [ ] All integration tests pass with mocked responses
- [ ] E2E tests pass with real API key (manual verification)
- [ ] CLI tests verify argument parsing and output formatting
- [ ] Edge case tests cover all validation scenarios

**Code Quality Requirements:**
- [ ] All code passes type checking with `mypy --strict`
- [ ] All code passes linting with `ruff check`
- [ ] All code is formatted with `ruff format`
- [ ] All functions have comprehensive docstrings (Google style)
- [ ] All modules have module-level docstrings
- [ ] Complex logic has inline comments

**Documentation Requirements:**
- [ ] Quick reference guide is complete and accurate
- [ ] All CLI arguments are documented with examples
- [ ] Common use cases are documented with code samples
- [ ] Error handling and troubleshooting section is comprehensive
- [ ] Example scripts execute successfully
- [ ] Setup instructions are clear and complete

**Integration Requirements:**
- [ ] Claude agents can successfully invoke CLI scripts
- [ ] Scripts work with `uv run` command
- [ ] Environment variable (`PERPLEXITY_API_KEY`) is properly configured
- [ ] No conflicts with existing Exa integration
- [ ] Documentation integrated with existing AI tools docs

**Performance Requirements:**
- [ ] Average search request completes in < 3 seconds
- [ ] Average chat request completes in < 5 seconds
- [ ] Streaming chat starts yielding within 1 second
- [ ] Retry logic uses exponential backoff (1s, 2s, 4s, 8s)
- [ ] Connection pooling supports 50+ concurrent requests
- [ ] Memory usage remains reasonable (< 100MB for typical workloads)

## Validation Commands

Execute every command to validate the feature works correctly with zero regressions:

```bash
# Install dependencies
pip install perplexityai pydantic requests python-dotenv pytest pytest-cov mypy ruff

# Run full test suite with coverage
pytest .ai/tools/perplexity/ -v --cov=.ai/tools/perplexity --cov-report=term-missing --cov-report=html

# Verify 90%+ code coverage
# Expected output: Coverage should show ≥90% for all modules

# Run type checking
mypy .ai/tools/perplexity/ --strict

# Run linter
ruff check .ai/tools/perplexity/

# Run formatter (check mode)
ruff format --check .ai/tools/perplexity/

# Test basic search
uv run .ai/tools/perplexity/cli_search.py "artificial intelligence" --num-results 5

# Test search with domain filtering
uv run .ai/tools/perplexity/cli_search.py "machine learning" --domains github.com,arxiv.org --num-results 5

# Test search with language filtering
uv run .ai/tools/perplexity/cli_search.py "intelligence artificielle" --languages fr,en --num-results 5

# Test search with recency filtering
uv run .ai/tools/perplexity/cli_search.py "latest AI news" --recency week --num-results 10

# Test search with date filtering
uv run .ai/tools/perplexity/cli_search.py "AI research 2025" --after-date 01/01/2025 --num-results 5

# Test search JSON output
uv run .ai/tools/perplexity/cli_search.py "quantum computing" --json --num-results 3

# Test basic chat
uv run .ai/tools/perplexity/cli_chat.py "Explain how transformers work in AI"

# Test chat with citations
uv run .ai/tools/perplexity/cli_chat.py "What are the latest developments in LLMs?" --show-citations

# Test chat with streaming
uv run .ai/tools/perplexity/cli_chat.py "Summarize quantum computing" --stream

# Test chat with model selection
uv run .ai/tools/perplexity/cli_chat.py "What is AGI?" --model sonar-pro

# Test chat with system message
uv run .ai/tools/perplexity/cli_chat.py "Explain neural networks" --system "You are a university professor"

# Test chat JSON output
uv run .ai/tools/perplexity/cli_chat.py "What is deep learning?" --json

# Test interactive chat mode
uv run .ai/tools/perplexity/cli_chat.py --interactive
# (Then enter multiple questions to test conversation context)

# Run E2E tests (requires PERPLEXITY_API_KEY)
export PERPLEXITY_API_KEY=your-test-key-here
pytest .ai/tools/perplexity/test_e2e.py -v -m e2e

# Verify documentation
cat .ai/ai_docs/context-docs/tools/perplexity-api-integration.md

# Test example scripts
uv run .ai/tools/perplexity/examples/research_workflow.py

# Verify no regressions in Exa integration
pytest .ai/tools/exa/ -v

# Verify environment setup
cat .ai/.env.sample | grep PERPLEXITY_API_KEY
# Expected output: PERPLEXITY_API_KEY=your-api-key-here
```

## Notes

**API Key Acquisition:**
- Perplexity API keys can be obtained at: https://www.perplexity.ai/account/api
- Free tier available for testing
- Pro tier required for production usage (higher rate limits, sonar-pro model)

**Rate Limits:**
- Free tier: 5 requests/minute, 200 requests/day
- Standard tier: 20 requests/minute, 5000 requests/day
- Pro tier: 50 requests/minute, 10000 requests/day
- Monitor rate limit headers to avoid quota exhaustion

**Model Selection:**
- `sonar`: Standard model, balanced performance and cost
- `sonar-pro`: Advanced model, better quality, higher cost
- Use `sonar` for most queries, `sonar-pro` for complex research

**Citation Quality:**
- Perplexity automatically grounds responses in web sources
- Citations include URL, title, and relevant snippet
- Verify citation URLs before relying on them for critical decisions

**Comparison with Exa:**
- **Exa**: Semantic search, find similar pages, content extraction
- **Perplexity**: AI-grounded answers, real-time web search, conversational context
- **Use Exa for**: Finding specific resources, discovering related content
- **Use Perplexity for**: Answering questions, synthesizing information, recent news

**Security Best Practices:**
- Never commit `.env` files to git
- Rotate API keys periodically (every 90 days recommended)
- Use separate API keys for dev/staging/prod environments
- Monitor API usage for anomalies
- Redact API keys in all logs

**Performance Optimization:**
- Use connection pooling for concurrent requests
- Implement caching for repeated queries (optional)
- Batch similar queries when possible
- Use streaming for long-form responses to reduce perceived latency
- Monitor and respect rate limits to avoid backoff delays

**Future Enhancements:**
- Add response caching with TTL (time-to-live)
- Implement query history and analytics
- Add support for image search (when available)
- Integrate with vector databases for RAG workflows
- Add slash commands for quick agent invocation
- Implement A/B testing between Perplexity and Exa for research tasks

**Dependencies Added:**
- `perplexityai` - Official Python SDK for Perplexity API

**Known Limitations:**
- Date filtering format is MM/DD/YYYY (US format) per API specification
- Maximum 20 domains per search request
- Maximum 10 languages per search request
- Recency and date filters are mutually exclusive
- Streaming mode requires terminal that supports real-time output
- E2E tests require valid API key and internet connection
