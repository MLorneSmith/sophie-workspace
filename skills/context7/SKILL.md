---
name: context7
description: Fetch library documentation from GitHub repositories using Context7 API. Use when you need up-to-date docs for React, Next.js, Supabase, Tailwind, or any library on GitHub. Triggers on "get docs for", "look up X documentation", "how does X work", "context7", or "library docs".
license: MIT
metadata:
  version: 1.0.0
  model: claude-opus-4-5-20251101
---

# Context7 - Library Documentation Lookup

Fetch up-to-date documentation from GitHub repositories without consuming excessive context tokens.

---

## Quick Start

```bash
# Fetch Next.js routing docs (recommended pattern)
.ai/bin/context7-get-context vercel next.js --topic routing --tokens 2500

# Search for a library first (if owner/repo unknown)
.ai/bin/context7-search "shadcn ui"
```

---

## Triggers

- `context7 <library>` - Fetch documentation
- `get docs for <library>` - Documentation lookup
- `look up <library> documentation` - Documentation lookup
- `how does <library> work` - Feature explanation
- `library docs <topic>` - Topic-specific docs

---

## Quick Reference

| Operation | Command |
|-----------|---------|
| **Search** | `.ai/bin/context7-search "query"` |
| **Fetch** | `.ai/bin/context7-get-context OWNER REPO [options]` |
| **Targeted** | `--topic "routing" --tokens 2500` |
| **Version** | `--version "v15.1.8"` |
| **Fresh** | `--no-cache` |

---

## Common Libraries (No Search Needed)

| Library | Owner | Repo |
|---------|-------|------|
| Next.js | vercel | next.js |
| React | facebook | react |
| Supabase | supabase | supabase |
| Tailwind CSS | tailwindlabs | tailwindcss |
| shadcn/ui | shadcn | ui |
| Vue | vuejs | core |
| TypeScript | microsoft | TypeScript |
| Prisma | prisma | prisma |
| tRPC | trpc | trpc |
| Zod | colinhacks | zod |

---

## How It Works

```
User Request → Parse Library → Fetch Docs → Present Results
     │              │              │              │
     │              │              │              └─ Formatted with examples
     │              │              └─ --topic filters, --tokens limits
     │              └─ Known library or search first
     └─ "Get Next.js routing docs"
```

### Token Guidelines

| Scope | Tokens | Use Case |
|-------|--------|----------|
| **Focused** | 2,000-2,500 | Single topic with `--topic` |
| **Moderate** | 3,000-5,000 | Broader topic coverage |
| **Comprehensive** | 8,000-10,000 | Full API reference |

**Always use `--topic` when possible** - it reduces tokens and improves relevance.

---

## Commands

### Search for Libraries

```bash
.ai/bin/context7-search "library name"
```

**Output:**
```
Library               Stars    Trust    Score    State
vercel/next.js        128000   9.2      8.5      ready
```

### Fetch Documentation

```bash
.ai/bin/context7-get-context OWNER REPO [options]

Options:
  --topic TOPIC      Filter by topic (routing, hooks, etc.)
  --tokens N         Max tokens (100-100,000, default: 10,000)
  --version VERSION  Specific version (e.g., v15.1.8)
  --no-cache         Bypass 24hr cache
  --format txt|json  Response format (default: txt)
```

---

## Examples

### Single Topic (Most Common)

```bash
# Next.js routing
.ai/bin/context7-get-context vercel next.js --topic routing --tokens 2500

# React hooks
.ai/bin/context7-get-context facebook react --topic hooks --tokens 2500

# Supabase RLS
.ai/bin/context7-get-context supabase supabase --topic rls --tokens 2500
```

### Version-Specific

```bash
# Next.js 15 server actions
.ai/bin/context7-get-context vercel next.js \
  --version v15.1.8 \
  --topic "server actions" \
  --tokens 3000
```

### Version Comparison

```bash
# Fetch both versions, then compare
.ai/bin/context7-get-context vercel next.js --version v14.0.0 --topic migration --tokens 3000
.ai/bin/context7-get-context vercel next.js --version v15.0.0 --topic migration --tokens 3000
```

### Unknown Library

```bash
# Step 1: Search
.ai/bin/context7-search "tanstack query"
# Output: tanstack/query

# Step 2: Fetch
.ai/bin/context7-get-context tanstack query --topic "queries" --tokens 2500
```

### Multiple Topics (Sequential)

```bash
# Fetch auth then middleware
.ai/bin/context7-get-context vercel next.js --topic authentication --tokens 2500
.ai/bin/context7-get-context vercel next.js --topic middleware --tokens 2000
```

---

## Common Topics by Library

### Next.js
`routing`, `data fetching`, `server actions`, `middleware`, `authentication`, `caching`, `api routes`, `app router`

### React
`hooks`, `state management`, `components`, `context`, `performance`, `refs`, `effects`, `suspense`

### Supabase
`authentication`, `database`, `storage`, `rls`, `policies`, `migrations`, `client`, `edge functions`

### Tailwind CSS
`utilities`, `responsive design`, `customization`, `dark mode`, `plugins`, `variants`, `configuration`

---

## Error Recovery

| Error | Cause | Solution |
|-------|-------|----------|
| "Library not found" | Wrong owner/repo | Run search first |
| "No content" | Topic too narrow | Broaden topic or remove `--topic` |
| "API error" | Key missing | Set `CONTEXT7_API_KEY` in `.env` |
| "Stale content" | Cached data | Use `--no-cache` |

---

## Configuration

**Required:** Set `CONTEXT7_API_KEY` in `.env`:

```bash
CONTEXT7_API_KEY=your-api-key-here
```

**Cache:** Results cached for 24 hours at `.ai/tools/context7/.cache/`

---

## Anti-Patterns

| Avoid | Why | Instead |
|-------|-----|---------|
| Fetching 10000 tokens | Wastes context | Use `--topic` + 2500 tokens |
| Guessing owner/repo | Wrong docs | Search first if unsure |
| Skipping topic filter | Irrelevant content | Always use `--topic` for specific questions |
| Always using `--no-cache` | Slow, rate limits | Only when freshness is critical |

---

## When to Use Context7 vs Alternatives

| Tool | Use For |
|------|---------|
| **Context7** | GitHub repo documentation (source of truth) |
| docs-mcp | Hosted documentation sites |
| perplexity | Web search, blog posts, tutorials |
| WebSearch | Current events, recent discussions |

---

## Integration with Workflow

Context7 is typically used during:

1. **Research phase** - Understanding library APIs before implementation
2. **Debugging** - Looking up specific function signatures or behaviors
3. **Migration** - Comparing versions for upgrade planning
4. **Best practices** - Finding recommended patterns

---

## Related

- **Agent**: `alpha-context7` (for orchestrator/sub-agent use)
- **CLI Scripts**: `.ai/bin/context7-*`
- **Python Module**: `.ai/tools/context7/`
- **Integration Guide**: `.ai/ai_docs/tool-docs/context7-integration.md`
