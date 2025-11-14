# Exa Search Integration - Quick Reference

Use Exa for semantic web search, content retrieval, finding similar pages, and AI-powered answers with citations.

## When to Use

- **Search**: Research topics, find recent articles, discover resources
- **Get Contents**: Extract full text, summaries, or highlights from URLs
- **Find Similar**: Discover related pages based on a URL
- **Answer**: Get AI-generated answers with source citations

## Basic Commands

### Search the Web

```bash
# Basic search (neural semantic search)
uv run .ai/tools/exa/cli_search.py "AI agents"

# Search with content extraction
uv run .ai/tools/exa/cli_search.py "Next.js routing" \
  --type neural \
  --text \
  --summary \
  --num-results 10

# Filter by domains
uv run .ai/tools/exa/cli_search.py "React hooks" \
  --include-domains github.com,react.dev \
  --num-results 5
```

### Get Content from URLs

```bash
# Get full text content
uv run .ai/tools/exa/cli_get_contents.py "https://example.com" --text

# Get summary and highlights
uv run .ai/tools/exa/cli_get_contents.py "https://example.com" \
  --summary \
  --highlights
```

### Find Similar Pages

```bash
# Find similar pages
uv run .ai/tools/exa/cli_find_similar.py "https://example.com" \
  --num-results 10

# With content extraction
uv run .ai/tools/exa/cli_find_similar.py "https://example.com" \
  --text \
  --summary \
  --num-results 5
```

### Get AI Answers

```bash
# Get answer with citations
uv run .ai/tools/exa/cli_answer.py "What is the latest in AI research?"

# Include full citation text
uv run .ai/tools/exa/cli_answer.py "How does semantic search work?" --text
```

## Command Syntax

### Search

```bash
uv run .ai/tools/exa/cli_search.py QUERY \
  [--type {neural,keyword,auto}] \
  [--num-results N] \
  [--category CATEGORY] \
  [--include-domains domain1,domain2] \
  [--exclude-domains domain1,domain2] \
  [--text] \
  [--summary] \
  [--highlights] \
  [--json]
```

**Parameters:**
- `QUERY` - Search query
- `--type` - Search mode: `neural` (semantic), `keyword` (exact), `auto` (default)
- `--num-results` - Number of results (default: 10)
- `--category` - Filter by category (e.g., `research`, `news`, `company`)
- `--include-domains` - Only search these domains (comma-separated)
- `--exclude-domains` - Exclude these domains (comma-separated)
- `--text` - Include full text content
- `--summary` - Include AI-generated summary
- `--highlights` - Include key highlights
- `--json` - Output as JSON

### Get Contents

```bash
uv run .ai/tools/exa/cli_get_contents.py URL [URL2 ...] \
  [--text] \
  [--summary] \
  [--highlights] \
  [--livecrawl {always,fallback,never}] \
  [--subpages N]
```

**Parameters:**
- `URL` - One or more URLs to fetch
- `--text` - Extract full text content
- `--summary` - Generate AI summary
- `--highlights` - Extract key highlights
- `--livecrawl` - Live crawl option (default: `fallback`)
- `--subpages` - Include N subpages

### Find Similar

```bash
uv run .ai/tools/exa/cli_find_similar.py URL \
  [--num-results N] \
  [--category CATEGORY] \
  [--exclude-source-domain] \
  [--text] \
  [--summary] \
  [--highlights]
```

**Parameters:**
- `URL` - Reference URL to find similar pages
- `--num-results` - Number of similar pages (default: 10)
- `--category` - Filter by category
- `--exclude-source-domain` - Exclude the source domain
- `--text`, `--summary`, `--highlights` - Content extraction options

### Answer

```bash
uv run .ai/tools/exa/cli_answer.py QUERY \
  [--text] \
  [--interactive]
```

**Parameters:**
- `QUERY` - Question to answer
- `--text` - Include full text in citations
- `--interactive` - Enter interactive Q&A mode

## Common Use Cases

### Research a Topic

```bash
# Find recent articles about a technology
uv run .ai/tools/exa/cli_search.py "Next.js 15 app router" \
  --type neural \
  --summary \
  --num-results 5

# Get detailed answer with sources
uv run .ai/tools/exa/cli_answer.py "What are the new features in Next.js 15?"
```

### Analyze a Page

```bash
# Get summary of a webpage
uv run .ai/tools/exa/cli_get_contents.py "https://nextjs.org/docs" \
  --summary \
  --highlights

# Find similar documentation
uv run .ai/tools/exa/cli_find_similar.py "https://nextjs.org/docs" \
  --num-results 10
```

### Domain-Specific Search

```bash
# Search only GitHub
uv run .ai/tools/exa/cli_search.py "react component library" \
  --include-domains github.com \
  --text \
  --num-results 10

# Exclude marketing sites
uv run .ai/tools/exa/cli_search.py "AI tools" \
  --exclude-domains medium.com,dev.to \
  --num-results 15
```

### Extract Content

```bash
# Get full text from multiple URLs
uv run .ai/tools/exa/cli_get_contents.py \
  "https://example.com/page1" \
  "https://example.com/page2" \
  --text

# Get summaries for research
uv run .ai/tools/exa/cli_get_contents.py \
  "https://arxiv.org/paper1" \
  "https://arxiv.org/paper2" \
  --summary
```

## Search Types

- **Neural** (semantic): Best for concept-based queries, finds meaning not just keywords
- **Keyword**: Traditional search, finds exact matches
- **Auto**: Automatically chooses best search type (default)

## Categories

Filter searches by category:
- `research` - Academic papers, technical docs
- `news` - News articles
- `company` - Company websites
- `github` - GitHub repositories
- `tweet` - Twitter/X posts
- `pdf` - PDF documents

## Tips

1. **Use neural search** for conceptual queries ("best practices for state management")
2. **Use keyword search** for specific terms ("TypeError: undefined is not a function")
3. **Add --summary** to get quick overviews without full text
4. **Filter domains** to focus on quality sources (github.com, official docs)
5. **Use Answer** for direct questions with citations
6. **Extract highlights** for quick scanning of relevant sections


## Examples

```bash
# Research Next.js server actions
uv run .ai/tools/exa/cli_search.py "Next.js server actions tutorial" \
  --type neural \
  --summary \
  --num-results 5

# Get answer about authentication
uv run .ai/tools/exa/cli_answer.py "How to implement JWT authentication in Node.js?"

# Find similar GitHub repos
uv run .ai/tools/exa/cli_find_similar.py "https://github.com/vercel/next.js" \
  --include-domains github.com \
  --num-results 10

# Extract docs from multiple pages
uv run .ai/tools/exa/cli_get_contents.py \
  "https://nextjs.org/docs/app/building-your-application/routing" \
  "https://nextjs.org/docs/app/building-your-application/data-fetching" \
  --summary

# Research with domain filtering
uv run .ai/tools/exa/cli_search.py "React testing best practices" \
  --include-domains testing-library.com,jestjs.io,react.dev \
  --summary \
  --num-results 8
```
