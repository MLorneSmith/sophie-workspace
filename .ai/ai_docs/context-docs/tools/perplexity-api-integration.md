# Perplexity API Integration - Quick Reference

## Overview

The Perplexity API integration provides AI agents with powerful web research capabilities through two primary endpoints:

1. **Search API** - Ranked web search with advanced filtering (domains, languages, dates)
2. **Chat Completions API** - Grounded AI responses with citations using Sonar models

## When to Use

**Search API**: When you need to find specific web content with ranking and filtering
- Finding recent research papers on a topic
- Searching specific domains for information
- Getting time-filtered results (last day/week/month/year)

**Chat Completions API**: When you need AI-generated answers grounded in current web data
- Answering complex questions with citations
- Getting comprehensive explanations with sources
- Streaming responses for real-time interactions

## Installation & Setup

1. **Install dependencies** (if not already installed):
   ```bash
   pip install requests pydantic python-dotenv
   ```

2. **Set API key** in `.ai/.env`:
   ```bash
   PERPLEXITY_API_KEY=your-api-key-here
   ```

3. **Verify setup**:
   ```bash
   python -c "from perplexity import PerplexityClient; print('✓ Setup complete')"
   ```

## Search API Usage

### Basic Search

```bash
# Simple search
uv run .ai/tools/perplexity/cli_search.py "AI breakthroughs 2025"

# With result limit
uv run .ai/tools/perplexity/cli_search.py "quantum computing" --num-results 5

# JSON output
uv run .ai/tools/perplexity/cli_search.py "machine learning" --json
```

### Domain Filtering

```bash
# Single domain
uv run .ai/tools/perplexity/cli_search.py "Python tutorials" --domains python.org

# Multiple domains (max 20)
uv run .ai/tools/perplexity/cli_search.py "AI research" --domains arxiv.org,github.com,paperswithcode.com
```

### Language Filtering

```bash
# Single language
uv run .ai/tools/perplexity/cli_search.py "climate change" --languages en

# Multiple languages (max 10, ISO 639-1 codes)
uv run .ai/tools/perplexity/cli_search.py "actualités" --languages fr,en,es
```

### Time-Based Filtering

**Recency filters** (mutually exclusive with date filters):
```bash
# Last day
uv run .ai/tools/perplexity/cli_search.py "breaking news AI" --recency day

# Last week
uv run .ai/tools/perplexity/cli_search.py "tech updates" --recency week

# Last month
uv run .ai/tools/perplexity/cli_search.py "research papers" --recency month

# Last year
uv run .ai/tools/perplexity/cli_search.py "2024 AI trends" --recency year
```

**Date range filtering** (MM/DD/YYYY format):
```bash
# After specific date
uv run .ai/tools/perplexity/cli_search.py "AI news" --after-date 01/01/2025

# Before specific date
uv run .ai/tools/perplexity/cli_search.py "historical data" --before-date 12/31/2024

# Date range
uv run .ai/tools/perplexity/cli_search.py "Q1 2025 analysis" \
  --after-date 01/01/2025 \
  --before-date 03/31/2025
```

### Python API

```python
from perplexity import search

# Basic search
response = search(
    query="AI breakthroughs 2025",
    num_results=10
)

for result in response.results:
    print(f"{result.title}: {result.url}")
    if result.snippet:
        print(f"  {result.snippet}")

# Advanced search with filters
response = search(
    query="quantum computing research",
    num_results=5,
    domain_filter=["arxiv.org", "nature.com"],
    language_filter=["en"],
    search_after_date="01/01/2025",
)

# Using recency filter
response = search(
    query="breaking AI news",
    num_results=20,
    recency_filter="day",  # day, week, month, year
)
```

## Chat Completions API Usage

### Basic Chat

```bash
# Simple question
uv run .ai/tools/perplexity/cli_chat.py "What are the latest AI breakthroughs in 2025?"

# With citations
uv run .ai/tools/perplexity/cli_chat.py "Explain quantum entanglement" --show-citations

# JSON output
uv run .ai/tools/perplexity/cli_chat.py "Latest Python features" --json
```

### Model Selection

```bash
# Sonar (default, fast, cost-effective)
uv run .ai/tools/perplexity/cli_chat.py "Quick question" --model sonar

# Sonar Pro (higher quality, more comprehensive)
uv run .ai/tools/perplexity/cli_chat.py "Complex analysis needed" --model sonar-pro

# Sonar Reasoning (advanced reasoning capabilities)
uv run .ai/tools/perplexity/cli_chat.py "Solve this problem step by step" --model sonar-reasoning
```

### System Messages & Context

```bash
# With system message
uv run .ai/tools/perplexity/cli_chat.py "Explain REST APIs" \
  --system "You are a software engineering expert. Be concise and technical."

# Control creativity with temperature
uv run .ai/tools/perplexity/cli_chat.py "Write a creative story" \
  --temperature 1.5

# Control response length
uv run .ai/tools/perplexity/cli_chat.py "Summarize AI history" \
  --max-tokens 200
```

### Streaming Responses

```bash
# Stream response in real-time
uv run .ai/tools/perplexity/cli_chat.py "Explain neural networks" --stream
```

### Python API

```python
from perplexity import chat

# Basic chat
response = chat(
    query="What are the latest developments in quantum computing?",
    model="sonar-pro",
    return_citations=True,
)

print(response.choices[0].message.content)

# Display citations
if response.citations:
    print("\nSources:")
    for citation in response.citations:
        print(f"- {citation.title}: {citation.url}")

# With system message and parameters
response = chat(
    query="Explain transformer architecture",
    model="sonar-pro",
    system_message="You are a machine learning expert. Use technical language.",
    temperature=0.7,
    max_tokens=500,
)

# Streaming chat
for chunk in chat(query="Tell me about Python 3.13", stream=True):
    if "choices" in chunk and chunk["choices"]:
        delta = chunk["choices"][0].get("delta", {})
        if "content" in delta:
            print(delta["content"], end="", flush=True)
```

## Common Use Cases

### Research Workflow

```python
from perplexity import search, chat

# 1. Search for sources
search_results = search(
    query="transformer attention mechanisms",
    num_results=10,
    domain_filter=["arxiv.org", "paperswithcode.com"],
    recency_filter="month",
)

# 2. Get AI summary with citations
response = chat(
    query="Summarize the latest research on transformer attention mechanisms",
    model="sonar-pro",
    return_citations=True,
)

print(response.choices[0].message.content)
print("\nBased on sources:")
for citation in response.citations:
    print(f"- {citation.url}")
```

### Domain-Specific Research

```bash
# Academic research
uv run .ai/tools/perplexity/cli_search.py "deep learning architectures" \
  --domains arxiv.org,scholar.google.com \
  --after-date 01/01/2025 \
  --num-results 20

# Technical documentation
uv run .ai/tools/perplexity/cli_search.py "Next.js 16 features" \
  --domains nextjs.org,github.com,vercel.com \
  --languages en

# News aggregation
uv run .ai/tools/perplexity/cli_search.py "AI regulation updates" \
  --recency week \
  --num-results 30
```

## Error Handling

### Common Errors

1. **Authentication Error (401)**
   ```
   Error: Authentication failed. Check your PERPLEXITY_API_KEY.
   ```
   Solution: Verify `PERPLEXITY_API_KEY` is set in `.ai/.env`

2. **Rate Limit Error (429)**
   ```
   Error: Rate limit exceeded. Please retry after 60s
   ```
   Solution: Wait and retry. Consider upgrading API plan for higher limits.

3. **Validation Error (400)**
   ```
   Error: Request validation failed.
   ```
   Solution: Check parameter formats (dates as MM/DD/YYYY, language codes as lowercase ISO 639-1)

4. **Timeout Error (408/504)**
   ```
   Error: Request timed out after 60 seconds
   ```
   Solution: Increase timeout or simplify query

### Python Error Handling

```python
from perplexity import search, chat
from perplexity.exceptions import (
    PerplexityAPIError,
    PerplexityAuthenticationError,
    PerplexityRateLimitError,
)

try:
    response = search(query="test query")
except PerplexityAuthenticationError:
    print("Check your API key configuration")
except PerplexityRateLimitError as e:
    print(f"Rate limited. Retry after {e.retry_after}s")
except PerplexityAPIError as e:
    print(f"API error: {e.message} (status: {e.status_code})")
```

## Comparison with Exa Search

| Feature | Perplexity | Exa |
|---------|-----------|-----|
| **Primary Use** | Grounded AI + Search | Semantic web search |
| **Best For** | AI answers with citations | Finding similar/relevant pages |
| **Time Filters** | Recency + date ranges | Crawl/publish dates |
| **Domain Filtering** | Yes (max 20) | Include/exclude domains |
| **Language Support** | Yes (max 10 codes) | No built-in filter |
| **AI Chat** | Yes (Sonar models) | Yes (Answer API) |
| **Streaming** | Yes | Yes |
| **Citations** | Built-in with responses | Extracted from results |

**When to use Perplexity**:
- Need grounded AI responses with automatic citations
- Want time-based filtering (recency: day/week/month/year)
- Require language-specific results
- Building conversational research tools

**When to use Exa**:
- Need semantic/neural search
- Finding similar/related pages
- Want neural understanding of complex queries
- Extracting structured content from results

## Performance Tips

1. **Use appropriate models**:
   - `sonar`: Fast, cost-effective for simple queries
   - `sonar-pro`: Higher quality for complex questions
   - `sonar-reasoning`: Advanced reasoning tasks

2. **Optimize result counts**:
   - Search API: Start with 10 results, increase if needed (max 100)
   - More results = higher latency and cost

3. **Cache responses**:
   - Implement caching for repeated queries
   - Responses rarely change within minutes

4. **Use filters strategically**:
   - Domain filters reduce search space and improve relevance
   - Language filters speed up multilingual searches
   - Recency filters are faster than date ranges

5. **Handle rate limits gracefully**:
   - Implement exponential backoff (built into client)
   - Monitor `X-RateLimit-Remaining` header
   - Distribute requests across time

## Troubleshooting

**Import errors**:
```bash
# Ensure you're in the project root
cd /home/msmith/projects/2025slideheroes

# Run with uv
uv run .ai/tools/perplexity/cli_search.py "test"
```

**Module not found**:
```python
# Add parent directory to Python path
import sys
sys.path.insert(0, '/home/msmith/projects/2025slideheroes/.ai/tools')
from perplexity import search, chat
```

**API key not found**:
```bash
# Check environment variable
echo $PERPLEXITY_API_KEY

# Or load from .env
export $(cat .ai/.env | grep PERPLEXITY_API_KEY)
```

## Best Practices

1. **Always validate inputs**: Use Pydantic models to catch errors early
2. **Log API usage**: Track requests for monitoring and debugging
3. **Handle errors gracefully**: Implement retry logic and fallbacks
4. **Use context managers**: Ensure HTTP sessions are properly closed
5. **Respect rate limits**: Monitor headers and implement backoff
6. **Secure API keys**: Never commit keys to git, use environment variables
7. **Test with mocks**: Use integration tests with mocked responses

## Additional Resources

- **Perplexity API Docs**: https://docs.perplexity.ai
- **Code Location**: `.ai/tools/perplexity/`
- **Example Scripts**: `.ai/tools/perplexity/examples/`
- **Tests**: `.ai/tools/perplexity/tests/`
