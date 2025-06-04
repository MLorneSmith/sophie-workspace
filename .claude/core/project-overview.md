# Project Overview

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes, Server Actions, Supabase
- **Database**: PostgreSQL (via Supabase)
- **Authentication**: Supabase Auth
- **CMS**: Payload CMS
- **AI Integration**: Portkey AI Gateway, OpenAI, Anthropic
- **Deployment**: Vercel

## Project Structure

- **apps/web**: Main Next.js application
- **apps/payload**: Payload CMS application
- **packages/features**: Shared feature modules
- **packages/ui**: Shared UI components
- **packages/ai-gateway**: AI service integration

## Key Architectural Patterns

1. **Monorepo Structure**: Using pnpm workspaces
2. **Feature-based Organization**: Features are grouped by domain
3. **Server-first Approach**: Prefer Server Components when possible
4. **Type Safety**: Strong TypeScript typing throughout
5. **Database Access**: Row-level security with Supabase
6. **Authentication**: Supabase Auth with custom flows
7. **AI Integration**: Abstracted through Portkey AI Gateway