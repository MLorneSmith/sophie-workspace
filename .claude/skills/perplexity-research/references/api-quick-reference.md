# Perplexity API Quick Reference

Quick lookup for common Perplexity API parameters and patterns.

## Chat Completions API

### Models

| Model | Speed | Cost | Best For |
|-------|-------|------|----------|
| `sonar` | ~2s | Low | Simple factual queries |
| `sonar-pro` | ~5s | Medium | Complex questions, research |
| `sonar-reasoning` | ~10s | High | Multi-step reasoning, analysis |

### Parameters

```python
chat(
    query: str,                    # Required: user question
    model: str = "sonar",          # sonar, sonar-pro, sonar-reasoning
    system_message: str = None,    # Context for the conversation
    return_citations: bool = True, # Include source URLs
    stream: bool = False,          # Stream response chunks
    max_tokens: int = None,        # Limit response length
    temperature: float = None,     # Creativity (0-2, default ~0.7)
    top_p: float = None,           # Nucleus sampling (0-1)
)
```

### Response Fields

```python
response.choices[0].message.content  # The answer
response.citations                    # List of source URLs
response.usage.total_tokens          # Token count
response.model                       # Model used
```

---

## Search API

### Parameters

```python
search(
    query: str,                      # Required: search query
    num_results: int = 10,           # 1-100 results
    recency_filter: str = None,      # day, week, month, year
    domain_filter: list[str] = None, # Max 20 domains
    language_filter: list[str] = None, # ISO 639-1 codes (max 10)
    search_after_date: str = None,   # MM/DD/YYYY format
    search_before_date: str = None,  # MM/DD/YYYY format
)
```

### Response Fields

```python
response.results           # List of SearchResult
result.url                 # Page URL
result.title               # Page title
result.snippet             # Text preview
result.published_date      # Publication date (if available)
```

### Filter Constraints

| Filter | Max | Format |
|--------|-----|--------|
| domains | 20 | domain.com (no protocol) |
| languages | 10 | ISO 639-1 lowercase (en, fr, de) |
| dates | - | MM/DD/YYYY |

**Note:** `recency_filter` and date filters are mutually exclusive.

---

## Error Codes

| Code | Class | Meaning |
|------|-------|---------|
| 401 | PerplexityAuthenticationError | Invalid API key |
| 429 | PerplexityRateLimitError | Rate limit exceeded |
| 400/422 | PerplexityValidationError | Invalid parameters |
| 408/504 | PerplexityTimeoutError | Request timeout |
| 503 | PerplexityConnectionError | Network error |

---

## Common Patterns

### Get AI Answer with Citations

```bash
.ai/bin/perplexity-chat "What's new in React 19?" \
  --model sonar-pro \
  --show-citations
```

### Domain-Filtered Search

```bash
.ai/bin/perplexity-search "transformer architectures" \
  --domains arxiv.org,paperswithcode.com \
  --recency month \
  --num-results 15
```

### Time-Filtered Search

```bash
# Recent news
.ai/bin/perplexity-search "AI regulation" --recency day

# Specific date range
.ai/bin/perplexity-search "tech earnings" \
  --after-date 01/01/2025 \
  --before-date 01/31/2025
```

### Python with Error Handling

```python
from perplexity import PerplexityRateLimitError
from perplexity.chat import chat

try:
    response = chat("Explain quantum computing", model="sonar-pro")
    print(response.choices[0].message.content)
except PerplexityRateLimitError as e:
    print(f"Rate limited. Retry after {e.retry_after}s")
```

---

## Full Documentation

For complete API reference, see:
- `.ai/ai_docs/tool-docs/perplexity-api-integration.md`
- https://docs.perplexity.ai
