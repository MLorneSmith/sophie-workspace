# Exa Search API Integration

Direct Python integration with the Exa Search API, providing semantic web search, content retrieval, similar link discovery, and AI-powered answers.

## Features

- **Search**: Neural, keyword, and auto search modes with advanced filtering
- **Get Contents**: Retrieve full content from URLs with text, highlights, and summaries
- **Find Similar**: Discover pages similar to a given URL
- **Answer**: Generate AI-powered answers with citations
- **Type Safe**: Full Pydantic model validation
- **CLI & Library**: Use as command-line tools or import as Python modules
- **Error Handling**: Comprehensive exception handling with retry logic

## Installation

```bash
# Install dependencies
uv pip install requests pydantic python-dotenv

# Set your API key
export EXA_API_KEY="your-api-key-here"
# Or add to .env file
echo "EXA_API_KEY=your-api-key-here" >> .env
```

## Quick Start

### As a Library

```python
import sys
sys.path.insert(0, '/home/msmith/projects/2025slideheroes/.ai/tools')

from exa import search_web, get_contents, find_similar, get_answer

# Search the web
results = search_web("AI agents", num_results=5, text=True)
for result in results.results:
    print(f"{result.title}: {result.url}")

# Get content from URLs
content = get_contents(["https://example.com"], text=True, summary=True)
print(content.results[0].summary)

# Find similar pages
similar = find_similar("https://example.com", num_results=10)
for page in similar.results:
    print(f"{page.title} (score: {page.score})")

# Get AI-powered answer
answer = get_answer("What is the latest in AI research?")
print(answer.answer)
for citation in answer.citations:
    print(f"  - {citation.url}")
```

### As CLI Tools

```bash
cd /home/msmith/projects/2025slideheroes/.ai

# Search
uv run tools/exa/cli_search.py "AI agents" --type neural --num-results 5

# Get contents
uv run tools/exa/cli_get_contents.py "https://example.com" --text --summary

# Find similar
uv run tools/exa/cli_find_similar.py "https://example.com" --num-results 10

# Get answer
uv run tools/exa/cli_answer.py "What is Exa Search?"
```

## API Reference

### search_web()

Search the web with neural, keyword, or auto search modes.

```python
from exa import search_web, SearchType

results = search_web(
    query="AI development tools",
    type=SearchType.NEURAL,  # or KEYWORD, AUTO
    num_results=10,
    category="research",
    include_domains=["github.com", "arxiv.org"],
    exclude_domains=["spam.com"],
    text=True,
    highlights=True,
    summary=True,
)
```

### get_contents()

Retrieve full content from specific URLs.

```python
from exa import get_contents, LivecrawlOption

content = get_contents(
    urls=["https://example.com", "https://example.org"],
    text=True,
    highlights=True,
    summary=True,
    livecrawl=LivecrawlOption.FALLBACK,
    subpages=5,
)
```

### find_similar()

Find pages similar to a given URL.

```python
from exa import find_similar

similar = find_similar(
    url="https://example.com",
    num_results=10,
    text=True,
    summary=True,
)
```

### get_answer()

Generate AI-powered answers with citations.

```python
from exa import get_answer

answer = get_answer(
    query="What is the latest in quantum computing?",
    text=True,  # Include full text in citations
)

print(answer.answer)
for citation in answer.citations:
    print(f"Source: {citation.title} - {citation.url}")
```

## Error Handling

```python
from exa import search_web
from exa.exceptions import (
    ExaAPIError,
    ExaAuthenticationError,
    ExaRateLimitError,
    ExaTimeoutError,
)

try:
    results = search_web("query")
except ExaAuthenticationError:
    print("Invalid API key")
except ExaRateLimitError as e:
    print(f"Rate limited. Retry after {e.retry_after}s")
except ExaTimeoutError:
    print("Request timed out")
except ExaAPIError as e:
    print(f"API error: {e}")
```

## CLI Usage

### Search CLI

```bash
# Basic search
uv run tools/exa/cli_search.py "AI agents"

# Neural search with text content
uv run tools/exa/cli_search.py "machine learning" --type neural --text

# Filter by domains
uv run tools/exa/cli_search.py "Python" \
  --include-domains python.org,pypi.org \
  --num-results 20

# JSON output
uv run tools/exa/cli_search.py "AI" --json > results.json
```

### Get Contents CLI

```bash
# Get text content
uv run tools/exa/cli_get_contents.py "https://example.com" --text

# Get summary and highlights
uv run tools/exa/cli_get_contents.py \
  "https://example.com" \
  --summary --highlights

# Save to file
uv run tools/exa/cli_get_contents.py \
  "https://example.com" \
  --text --save output.txt
```

### Find Similar CLI

```bash
# Find similar pages
uv run tools/exa/cli_find_similar.py "https://example.com"

# With content
uv run tools/exa/cli_find_similar.py \
  "https://example.com" \
  --text --summary --num-results 20
```

### Answer CLI

```bash
# Get answer to a question
uv run tools/exa/cli_answer.py "What is Exa Search?"

# Interactive mode
uv run tools/exa/cli_answer.py --interactive

# With full citation text
uv run tools/exa/cli_answer.py \
  "How does quantum computing work?" \
  --text
```

## Examples

See the `examples/` directory for complete integration examples:

- `research_workflow.py` - Research workflow using search and get_contents
- `content_discovery.py` - Content discovery and analysis
- `qa_with_citations.py` - Q&A system with source tracking

## Testing

```bash
cd /home/msmith/projects/2025slideheroes/.ai

# Run unit tests
uv run pytest tools/exa/test_models.py -v
uv run pytest tools/exa/test_client.py -v

# Run with coverage
uv run pytest tools/exa/ --cov=tools.exa --cov-report=term-missing

# Run integration tests (requires EXA_API_KEY)
uv run pytest tools/exa/test_integration.py -v -m integration
```

## Configuration

### Environment Variables

- `EXA_API_KEY` - Your Exa API key (required)

### Default Values

- Timeout: 30 seconds
- Max retries: 3
- Default num_results: 10
- Search type: auto

## Cost Management

The Exa API has usage-based pricing. All responses include cost tracking:

```python
results = search_web("query")
# Check cost in API response (if available)
```

## Integration with ADW Workflows

```python
# In your ADW scripts
import sys
import os

# Add tools directory to path
tools_path = os.path.join(os.path.dirname(__file__), '..', 'tools')
sys.path.insert(0, tools_path)

from exa import search_web, get_answer

# Use in planning phase
research_query = f"Best practices for {feature_name}"
search_results = search_web(research_query, num_results=5, text=True)

# Get AI summary
answer = get_answer(research_query)
print(answer.answer)
```

## License

Part of the SlideHeroes project.
