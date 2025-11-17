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
.ai/bin/exa-search "AI agents"

# Search with content extraction
.ai/bin/exa-search "Next.js routing" \
  --type neural \
  --text \
  --summary \
  --num-results 10

# Filter by domains
.ai/bin/exa-search "React hooks" \
  --include-domains github.com,react.dev \
  --num-results 5
```

### Get Content from URLs

```bash
# Get full text content
.ai/bin/exa-get-contents "https://example.com" --text

# Get summary and highlights
.ai/bin/exa-get-contents "https://example.com" \
  --summary \
  --highlights
```

### Find Similar Pages

```bash
# Find similar pages
.ai/bin/exa-find-similar "https://example.com" \
  --num-results 10

# With content extraction
.ai/bin/exa-find-similar "https://example.com" \
  --text \
  --summary \
  --num-results 5
```

### Get AI Answers

```bash
# Get answer with citations
.ai/bin/exa-answer "What is the latest in AI research?"

# Include full citation text
.ai/bin/exa-answer "How does semantic search work?" --text
```

## Command Syntax

### Search

```bash
.ai/bin/exa-search QUERY \
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
.ai/bin/exa-get-contents URL [URL2 ...] \
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
.ai/bin/exa-find-similar URL \
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
.ai/bin/exa-answer QUERY \
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
.ai/bin/exa-search "Next.js 15 app router" \
  --type neural \
  --summary \
  --num-results 5

# Get detailed answer with sources
.ai/bin/exa-answer "What are the new features in Next.js 15?"
```

### Analyze a Page

```bash
# Get summary of a webpage
.ai/bin/exa-get-contents "https://nextjs.org/docs" \
  --summary \
  --highlights

# Find similar documentation
.ai/bin/exa-find-similar "https://nextjs.org/docs" \
  --num-results 10
```

### Domain-Specific Search

```bash
# Search only GitHub
.ai/bin/exa-search "react component library" \
  --include-domains github.com \
  --text \
  --num-results 10

# Exclude marketing sites
.ai/bin/exa-search "AI tools" \
  --exclude-domains medium.com,dev.to \
  --num-results 15
```

### Extract Content

```bash
# Get full text from multiple URLs
.ai/bin/exa-get-contents \
  "https://example.com/page1" \
  "https://example.com/page2" \
  --text

# Get summaries for research
.ai/bin/exa-get-contents \
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
.ai/bin/exa-search "Next.js server actions tutorial" \
  --type neural \
  --summary \
  --num-results 5

# Get answer about authentication
.ai/bin/exa-answer "How to implement JWT authentication in Node.js?"

# Find similar GitHub repos
.ai/bin/exa-find-similar "https://github.com/vercel/next.js" \
  --include-domains github.com \
  --num-results 10

# Extract docs from multiple pages
.ai/bin/exa-get-contents \
  "https://nextjs.org/docs/app/building-your-application/routing" \
  "https://nextjs.org/docs/app/building-your-application/data-fetching" \
  --summary

# Research with domain filtering
.ai/bin/exa-search "React testing best practices" \
  --include-domains testing-library.com,jestjs.io,react.dev \
  --summary \
  --num-results 8
```
