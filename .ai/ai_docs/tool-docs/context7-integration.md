# Context7 Integration - Quick Reference

Use Context7 to fetch library documentation without consuming context window tokens.

## When to Use

- User asks about specific library features, APIs, or best practices
- Need up-to-date documentation for recent library versions
- Want to compare different versions of a library

## Basic Commands

### Search for Libraries

```bash
uv run .ai/tools/context7/cli_search_libraries.py "next.js"
```

Returns library IDs (e.g., `/vercel/next.js`), stars, and descriptions.

### Fetch Documentation

```bash
# Targeted topic (recommended, ~2000 tokens)
uv run .ai/tools/context7/cli_get_context.py vercel next.js \
  --topic routing \
  --tokens 2000

# Specific version
uv run .ai/tools/context7/cli_get_context.py vercel next.js \
  --version v15.1.8 \
  --topic authentication \
  --tokens 3000

# Full documentation (default 10000 tokens)
uv run .ai/tools/context7/cli_get_context.py vercel next.js
```

## Command Syntax

```bash
uv run .ai/tools/context7/cli_get_context.py OWNER REPO \
  [--version VERSION] \
  [--topic TOPIC] \
  [--tokens TOKENS] \
  [--no-cache]
```

**Parameters:**

- `OWNER` - Repository owner (e.g., `vercel`, `facebook`, `shadcn`)
- `REPO` - Repository name (e.g., `next.js`, `react`, `ui`)
- `--version` - Specific version (e.g., `v15.1.8`) or omit for latest
- `--topic` - Filter by topic (e.g., `routing`, `hooks`, `authentication`)
- `--tokens` - Max tokens (100-100,000, default: 10,000)
- `--no-cache` - Fetch fresh data (bypass 24hr cache)

## Token Guidelines

- **Targeted query**: 1,500-2,500 tokens (use `--topic`)
- **Moderate**: 3,000-5,000 tokens
- **Comprehensive**: 8,000-10,000 tokens

## Common Topics by Library

**Next.js**: `routing`, `data fetching`, `server actions`, `middleware`, `authentication`, `caching`

**React**: `hooks`, `state management`, `components`, `context`, `performance`

**Supabase**: `authentication`, `database`, `storage`, `rls`, `policies`

**Tailwind**: `utilities`, `responsive design`, `customization`, `dark mode`

## Examples

```bash
# Implementing auth in Next.js
uv run .ai/tools/context7/cli_get_context.py vercel next.js \
  --topic authentication --tokens 3000

# Debugging server actions
uv run .ai/tools/context7/cli_get_context.py vercel next.js \
  --topic "server actions" --tokens 2500

# React hooks reference
uv run .ai/tools/context7/cli_get_context.py facebook react \
  --topic hooks --tokens 2000

# Supabase RLS policies
uv run .ai/tools/context7/cli_get_context.py supabase supabase \
  --topic rls --tokens 2500
```

## Tips

1. Always use `--topic` when you know what you're looking for
2. Start with 2000-3000 tokens, increase if needed
3. Cache is enabled by default (24hrs) - use `--no-cache` only for latest updates
4. Search first if unsure of owner/repo names

## Configuration

Ensure `CONTEXT7_API_KEY` is set in `.env`:

```bash
CONTEXT7_API_KEY=your-api-key-here
```

Cache location: `.ai/tools/context7/.cache/`
