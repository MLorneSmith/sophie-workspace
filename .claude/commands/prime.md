# Context Prime
> Follow the instructions precisely. If it wasn't specified, don't do it.

## RUN the following commands:

`eza . --tree --git-ignore`
`git branch -a`
`cat package.json | jq '.scripts'`

## PARALLEL READ the following files:

README.md
CLAUDE.md
.claude/settings.local.json
package.json

## REMEMBER
- .claude/specs - is where we plan new engineering work
- .claude/docs - is where useful reference material exists to guide our work
- apps/web - Main Next.js SaaS application (port 3000)
- apps/payload - Payload CMS for content management (port 3020)
- apps/e2e - Playwright E2E tests
- apps/dev-tool - Development utilities

## Common Commands
- `pnpm dev` - Start all development servers
- `pnpm --filter web dev` - Start web app only
- `pnpm --filter payload dev` - Start Payload CMS only
- `pnpm build` - Build all apps
- `pnpm supabase:web:start` - Start local Supabase
- `pnpm supabase:web:typegen` - Generate database types
