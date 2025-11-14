# Perplexity API Integration

Production-grade Python client for the Perplexity API, providing AI agents with powerful web research capabilities through Search and Chat Completions endpoints.

## Features

- **Search API**: Ranked web search with advanced filtering (domains, languages, recency, date ranges)
- **Chat Completions API**: Grounded AI responses with citations using Sonar models
- **Robust Client**: Authentication, retry logic with exponential backoff, connection pooling
- **Type Safety**: Pydantic models for runtime validation of all requests/responses
- **CLI Tools**: User-friendly command-line interfaces for both APIs
- **Comprehensive Tests**: Unit and integration tests with high coverage
- **Production Ready**: Error handling, logging, rate limit tracking, secure API key management

## Architecture

```
perplexity/
├── __init__.py          # Package exports
├── client.py            # Base PerplexityClient with HTTP session management
├── models.py            # Pydantic models for type-safe validation
├── exceptions.py        # Custom exception hierarchy
├── utils.py             # Helper functions (API key, date formatting, validation)
├── search.py            # Search API implementation
├── chat.py              # Chat Completions API implementation
├── cli_search.py        # CLI for Search API
├── cli_chat.py          # CLI for Chat Completions API
├── tests/               # Comprehensive test suite
│   ├── test_models.py
│   ├── test_utils.py
│   └── ...
└── examples/            # Example usage patterns
```

## Quick Start

### Installation

Dependencies are already installed in the project. Verify setup:

```bash
python -c "from perplexity import PerplexityClient; print('✓ Setup complete')"
```

### Configuration

Set your API key in `.ai/.env`:

```bash
PERPLEXITY_API_KEY=your-api-key-here
```

Get your API key from: https://www.perplexity.ai/settings/api

### CLI Usage

**Search API**:
```bash
# Basic search
uv run .ai/tools/perplexity/cli_search.py "AI breakthroughs 2025"

# Advanced search with filters
uv run .ai/tools/perplexity/cli_search.py "quantum computing" \
  --domains arxiv.org,github.com \
  --languages en \
  --recency week \
  --num-results 10 \
  --json
```

**Chat Completions API**:
```bash
# Basic chat
uv run .ai/tools/perplexity/cli_chat.py "Explain transformer architecture"

# Advanced chat with citations
uv run .ai/tools/perplexity/cli_chat.py "Latest AI research" \
  --model sonar-pro \
  --show-citations \
  --stream
```

### Python API

```python
from perplexity import search, chat

# Search
results = search(
    query="latest AI research",
    num_results=5,
    domain_filter=["arxiv.org"],
    recency_filter="month"
)

for result in results.results:
    print(f"{result.title}: {result.url}")

# Chat
response = chat(
    query="Explain quantum entanglement",
    model="sonar-pro",
    return_citations=True
)

print(response.choices[0].message.content)

# Display citations
for citation in response.citations:
    print(f"- {citation.title}: {citation.url}")
```

## API Reference

### Search API

**Endpoint**: `POST https://api.perplexity.ai/search`

**Parameters**:
- `query` (required): Search query string
- `num_results`: Number of results (1-100, default: 10)
- `recency_filter`: Time filter (day, week, month, year)
- `domain_filter`: Domain list (max 20)
- `language_filter`: ISO 639-1 codes (max 10)
- `search_after_date`: Date in MM/DD/YYYY format
- `search_before_date`: Date in MM/DD/YYYY format

**Response**:
```python
SearchResponse(
    results=[
        SearchResult(
            url="https://example.com",
            title="Title",
            snippet="Text snippet...",
            published_date="2025-03-15"
        )
    ],
    request_id="abc123"
)
```

### Chat Completions API

**Endpoint**: `POST https://api.perplexity.ai/chat/completions`

**Parameters**:
- `query` (required): User question
- `model`: sonar, sonar-pro, or sonar-reasoning (default: sonar)
- `stream`: Enable streaming (default: false)
- `max_tokens`: Response length limit
- `temperature`: Creativity (0-2)
- `system_message`: Context setting message
- `return_citations`: Include citations (default: true)

**Response**:
```python
ChatResponse(
    id="chatcmpl-123",
    model="sonar-pro",
    choices=[
        ChatChoice(
            message=ChatMessage(
                role="assistant",
                content="Answer text..."
            ),
            finish_reason="stop"
        )
    ],
    usage=Usage(
        prompt_tokens=50,
        completion_tokens=200,
        total_tokens=250
    ),
    citations=[
        Citation(
            url="https://example.com",
            title="Source Title",
            snippet="Cited text..."
        )
    ]
)
```

## Testing

Run the test suite:

```bash
# All tests
pytest .ai/tools/perplexity/tests/ -v

# Specific test file
pytest .ai/tools/perplexity/tests/test_models.py -v

# With coverage
pytest .ai/tools/perplexity/tests/ --cov=perplexity --cov-report=term-missing
```

## Error Handling

The client implements a comprehensive exception hierarchy:

```python
from perplexity.exceptions import (
    PerplexityAPIError,              # Base exception
    PerplexityAuthenticationError,   # 401: Invalid API key
    PerplexityRateLimitError,        # 429: Rate limit exceeded
    PerplexityValidationError,       # 400/422: Invalid request
    PerplexityTimeoutError,          # 408/504: Request timeout
    PerplexityConnectionError,       # Network errors
)

try:
    response = search(query="test")
except PerplexityAuthenticationError:
    print("Check your API key")
except PerplexityRateLimitError as e:
    print(f"Rate limited. Retry after {e.retry_after}s")
except PerplexityAPIError as e:
    print(f"API error: {e.message}")
```

## Best Practices

1. **Use context managers** to ensure sessions are closed:
   ```python
   with PerplexityClient() as client:
       response = client.search(data)
   ```

2. **Validate inputs** using Pydantic models:
   ```python
   from perplexity.models import SearchRequest

   request = SearchRequest(
       query="test",
       num_results=5
   )  # Raises ValidationError if invalid
   ```

3. **Handle rate limits gracefully**:
   - Client automatically retries with exponential backoff
   - Monitor `client.rate_limit_remaining` for proactive throttling

4. **Secure API keys**:
   - Always use environment variables
   - Never commit `.env` files
   - Redact keys in logs using `redact_api_key()`

5. **Optimize performance**:
   - Use appropriate models (sonar for speed, sonar-pro for quality)
   - Cache responses when appropriate
   - Use domain filters to narrow search space

## Advanced Usage

### Multi-turn Conversations

```python
from perplexity import chat

conversation_history = [
    {"role": "user", "content": "What is machine learning?"},
    {"role": "assistant", "content": "Machine learning is..."},
]

response = chat(
    query="Can you give me an example?",
    model="sonar-pro",
    conversation_history=conversation_history
)
```

### Streaming Responses

```python
from perplexity import chat

for chunk in chat(query="Explain AI", stream=True):
    if "choices" in chunk and chunk["choices"]:
        delta = chunk["choices"][0].get("delta", {})
        if "content" in delta:
            print(delta["content"], end="", flush=True)
```

### Custom Timeout and Retry

```python
from perplexity import PerplexityClient

client = PerplexityClient(timeout=120)  # 2 minute timeout
# Client uses MAX_RETRIES=3 with exponential backoff
```

## Comparison with Exa Search

| Feature | Perplexity | Exa |
|---------|-----------|-----|
| **Search Type** | Ranked search | Semantic/neural |
| **AI Chat** | Sonar models | Answer API |
| **Citations** | Built-in | Extracted |
| **Time Filters** | Recency + dates | Crawl/publish |
| **Language** | Yes (10 codes) | No |
| **Streaming** | Yes | Yes |

**Use Perplexity for**:
- Grounded AI responses with automatic citations
- Time-based filtering (recency/dates)
- Language-specific searches
- Conversational research

**Use Exa for**:
- Semantic/neural search
- Finding similar pages
- Structured content extraction

## Documentation

- **Quick Reference**: `.ai/ai_docs/context-docs/tools/perplexity-api-integration.md`
- **API Docs**: https://docs.perplexity.ai
- **Examples**: `.ai/tools/perplexity/examples/`

## License

Part of the SlideHeroes project. For internal use only.

## Support

For issues or questions:
1. Check the quick reference guide
2. Review test files for usage examples
3. Consult Perplexity API documentation
4. Open an issue in the project repository
