# E2B Sandbox Template

E2B sandbox template (`slideheroes-claude-agent`) for running Claude Code agents in isolated cloud environments.

## Building the Template

From the monorepo root:

```bash
# Development build
pnpm e2b:build:dev

# Production build
pnpm e2b:build:prod
```

Requires `E2B_API_KEY` environment variable.

## Using the Template

```typescript
import { Sandbox } from 'e2b'

const sandbox = await Sandbox.create('slideheroes-claude-agent')
```

Or use the `/sandbox` command in Claude Code.

## Files

- `template.ts` - Template configuration (Node.js 20, pnpm, Claude Code CLI, etc.)
- `build.dev.ts` - Development build script
- `build.prod.ts` - Production build script

## Documentation

See `.ai/ai_docs/context-docs/infrastructure/e2b-sandbox.md` for full documentation.
