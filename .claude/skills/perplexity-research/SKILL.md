---
name: perplexity-research
description: Execute advanced web searches using Perplexity API for real-time information gathering, research synthesis, fact verification, and AI-powered answers with citations. Use for current events, technical research, comparative analysis, documentation lookup, or any task requiring grounded web information.
license: MIT
metadata:
  version: 1.0.0
  model: claude-opus-4-5-20251101
  category: research
---

# Perplexity Research

Execute advanced web searches and AI-powered research using the Perplexity API.

---

## Quick Start

```bash
# AI-powered answer with citations
.ai/bin/perplexity-chat "What are the latest React 19 features?" --show-citations

# Filtered web search
.ai/bin/perplexity-search "transformer architectures" --domains arxiv.org --recency month

# Validate setup
python .claude/skills/perplexity-research/scripts/validate.py
```

---

## Triggers

Use this skill when you need to:

- "search the web for..." or "find information about..."
- "what are the latest developments in..."
- "research [topic] with citations"
- "perplexity search" or "perplexity chat"
- Get real-time information beyond training data
- Verify facts with cited sources
- Compare technologies or approaches

---

## Quick Reference

| Operation | Command | Best For |
|-----------|---------|----------|
| **Chat API** | `perplexity-chat` | AI answers with citations |
| **Search API** | `perplexity-search` | Filtered, ranked results |

| Model | Speed | Quality | Use Case |
|-------|-------|---------|----------|
| `sonar` | Fast | Good | Simple queries |
| `sonar-pro` | Medium | High | Complex questions |
| `sonar-reasoning` | Slow | Highest | Multi-step reasoning |

---

## Two Primary Operations

### Chat API - AI-Powered Answers

Get grounded AI responses with automatic citations from current web data.

```bash
# Basic question
.ai/bin/perplexity-chat "Explain quantum computing" --show-citations

# With specific model
.ai/bin/perplexity-chat "Best practices for Next.js App Router" \
  --model sonar-pro \
  --show-citations

# With system context
.ai/bin/perplexity-chat "Compare React and Vue" \
  --system "You are a senior frontend architect. Be technical and concise." \
  --show-citations

# Streaming response
.ai/bin/perplexity-chat "Explain neural networks" --stream

# JSON output
.ai/bin/perplexity-chat "Latest Python features" --json
```

**Chat Options:**

| Option | Description | Default |
|--------|-------------|---------|
| `--model` | sonar, sonar-pro, sonar-reasoning | sonar |
| `--system` | System message for context | None |
| `--show-citations` | Display source URLs | Off |
| `--stream` | Stream response in real-time | Off |
| `--max-tokens` | Limit response length | None |
| `--temperature` | Creativity (0-2) | None |
| `--json` | Output as JSON | Off |

### Search API - Filtered Web Search

Get ranked search results with advanced filtering.

```bash
# Basic search
.ai/bin/perplexity-search "AI breakthroughs 2025" --num-results 10

# Domain-filtered (max 20 domains)
.ai/bin/perplexity-search "deep learning papers" \
  --domains arxiv.org,paperswithcode.com,nature.com

# Time-filtered
.ai/bin/perplexity-search "breaking AI news" --recency day
.ai/bin/perplexity-search "2024 tech trends" --recency year

# Date range (MM/DD/YYYY format)
.ai/bin/perplexity-search "AI regulation updates" \
  --after-date 01/01/2025 \
  --before-date 03/31/2025

# Language-filtered (ISO 639-1 codes)
.ai/bin/perplexity-search "machine learning tutorials" \
  --languages en,de

# Combined filters
.ai/bin/perplexity-search "React 19 features" \
  --domains react.dev,github.com \
  --recency month \
  --num-results 20 \
  --json
```

**Search Options:**

| Option | Description | Default |
|--------|-------------|---------|
| `--num-results` | Number of results (1-100) | 10 |
| `--domains` | Comma-separated domain list | None |
| `--languages` | ISO 639-1 codes | None |
| `--recency` | day, week, month, year | None |
| `--after-date` | Results after date (MM/DD/YYYY) | None |
| `--before-date` | Results before date (MM/DD/YYYY) | None |
| `--json` | Output as JSON | Off |

**Note:** `--recency` and date filters are mutually exclusive.

---

## Research Workflows

### Pattern 1: Quick Answer with Sources

```bash
# Get AI summary with citations
.ai/bin/perplexity-chat "What's new in TypeScript 5.4?" \
  --model sonar-pro \
  --show-citations
```

### Pattern 2: Deep Research

```bash
# Step 1: Get overview
.ai/bin/perplexity-chat "Latest developments in transformer models" \
  --model sonar-pro

# Step 2: Find primary sources
.ai/bin/perplexity-search "transformer attention mechanisms 2025" \
  --domains arxiv.org,paperswithcode.com \
  --recency month \
  --num-results 15

# Step 3: Synthesize findings
.ai/bin/perplexity-chat "Based on recent papers, what are the key innovations in attention mechanisms?" \
  --model sonar-reasoning \
  --show-citations
```

### Pattern 3: Technical Documentation

```bash
# Search official docs
.ai/bin/perplexity-search "Next.js 15 server actions" \
  --domains nextjs.org,vercel.com,github.com \
  --recency month

# Get implementation guidance
.ai/bin/perplexity-chat "How do I implement server actions in Next.js 15?" \
  --system "You are a Next.js expert. Provide working code examples." \
  --show-citations
```

### Pattern 4: Competitive Analysis

```bash
# Search for comparisons
.ai/bin/perplexity-search "React vs Vue vs Svelte 2025 comparison" \
  --recency month \
  --num-results 20

# Get synthesized analysis
.ai/bin/perplexity-chat "Compare React, Vue, and Svelte for enterprise applications in 2025" \
  --model sonar-pro \
  --show-citations
```

---

## Python API

For programmatic access, use the Python client directly:

```python
import sys
sys.path.insert(0, '/home/msmith/projects/2025slideheroes/.ai/tools')

from perplexity import PerplexityClient, SearchRequest, ChatRequest, ChatMessage

# Initialize client
client = PerplexityClient()

# Search API
from perplexity.search import search

response = search(
    query="AI breakthroughs 2025",
    num_results=10,
    domain_filter=["arxiv.org", "nature.com"],
    recency_filter="month",
)

for result in response.results:
    print(f"{result.title}: {result.url}")

# Chat API
from perplexity.chat import chat

response = chat(
    query="Explain quantum entanglement",
    model="sonar-pro",
    return_citations=True,
)

print(response.choices[0].message.content)
for citation in response.citations:
    print(f"- {citation}")
```

---

## Configuration

### API Key Setup

```bash
# Add to .ai/.env
PERPLEXITY_API_KEY=pplx-***

# Verify setup
python .claude/skills/perplexity-research/scripts/validate.py
```

### File Locations

| Component | Path |
|-----------|------|
| CLI Chat | `.ai/bin/perplexity-chat` |
| CLI Search | `.ai/bin/perplexity-search` |
| Python Client | `.ai/tools/perplexity/` |
| Documentation | `.ai/ai_docs/tool-docs/perplexity-api-integration.md` |
| Agent Definition | `.claude/agents/research/perplexity-expert.md` |

---

## Scripts

### Validation Script

Verify your Perplexity setup is working:

```bash
python .claude/skills/perplexity-research/scripts/validate.py
```

**Checks performed:**
- API key is set and valid format
- CLI scripts are executable
- Python modules can be imported
- Test search executes successfully

**Exit codes:**

| Code | Meaning |
|------|---------|
| 0 | All checks passed |
| 1 | General failure |
| 10 | API key not configured |
| 11 | CLI scripts not found |
| 12 | Python import failure |
| 13 | API connection failure |

---

## When to Use Chat vs Search

### Use Chat API When:

- Need direct answers to questions
- Want AI synthesis of multiple sources
- Require comprehensive explanations
- Need citations for grounded answers
- Asking "how to" or "what is" questions

### Use Search API When:

- Need filtered, ranked search results
- Require specific domain sources (academic, official docs)
- Want time-filtered results
- Need specific language results
- Prefer raw results over AI synthesis
- Building a list of resources

---

## Error Handling

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| Authentication (401) | Invalid API key | Check `PERPLEXITY_API_KEY` in `.ai/.env` |
| Rate Limit (429) | Too many requests | Wait and retry; consider upgrading plan |
| Validation (400) | Bad parameters | Check date format (MM/DD/YYYY), domain format |
| Timeout (408/504) | Slow response | Increase timeout or simplify query |

### Python Error Handling

```python
from perplexity import (
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

---

## Anti-Patterns

| Avoid | Why | Instead |
|-------|-----|---------|
| Mixing recency + date filters | Mutually exclusive | Use one or the other |
| Too many domains (>20) | API limit | Focus on most relevant |
| Missing `--show-citations` | No source verification | Always include for research |
| Using sonar for complex queries | Lower quality | Use sonar-pro or sonar-reasoning |
| Ignoring rate limits | Request failures | Implement backoff, monitor headers |

---

## Comparison with Other Research Tools

| Feature | Perplexity | Exa | Context7 |
|---------|-----------|-----|----------|
| **Primary Use** | AI answers + Search | Semantic search | Library docs |
| **Best For** | Grounded AI with citations | Finding similar pages | API reference |
| **Time Filters** | Recency + date ranges | Crawl/publish dates | Version-based |
| **Domain Filtering** | Yes (max 20) | Include/exclude | N/A |
| **AI Chat** | Yes (Sonar models) | Yes (Answer API) | No |
| **Streaming** | Yes | Yes | N/A |

**When to use Perplexity:**
- Need grounded AI responses with automatic citations
- Want time-based filtering
- Building conversational research tools

**When to use Exa:**
- Need semantic/neural search
- Finding similar/related pages
- Extracting structured content

**When to use Context7:**
- Need library/framework documentation
- Looking up API references
- Version-specific documentation

---

## Report Saving

When using the perplexity-expert agent, research findings are saved to:

```
.ai/reports/research-reports/YYYY-MM-DD/perplexity-<description>.md
```

**Report Format:**

```markdown
# Perplexity Research: [Topic]

**Date**: YYYY-MM-DD
**Agent**: perplexity-expert
**Search Type**: [Chat API / Search API]

## Query Summary
[What was searched and why]

## Findings
[Main research findings]

## Sources & Citations
- [Source 1](URL)
- [Source 2](URL)

## Key Takeaways
- [Summary points]
```

---

## References

- [Full API Documentation](../../../.ai/ai_docs/tool-docs/perplexity-api-integration.md) - Complete API reference
- [Agent Definition](../../agents/research/perplexity-expert.md) - Perplexity expert agent
- [Perplexity API Docs](https://docs.perplexity.ai) - Official documentation

---

## Verification Checklist

After setup, verify:

- [ ] API key set in `.ai/.env`
- [ ] Validation script passes: `python .claude/skills/perplexity-research/scripts/validate.py`
- [ ] Chat works: `.ai/bin/perplexity-chat "test" --show-citations`
- [ ] Search works: `.ai/bin/perplexity-search "test" --num-results 3`

---

## Changelog

### v1.0.0 (Current)

- Initial skill creation from existing components
- Consolidated documentation and agent definition
- Added validation script
- Created comprehensive usage examples
