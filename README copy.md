# SlideHeroes

SlideHeroes is a SaaS platform for learning how to write board-level business presentations and
accelerating presentation creation with AI-powered tools.

## Build Status

[![PR Validation](https://github.com/MLorneSmith/2025slideheroes/actions/workflows/pr-validation.yml/badge.svg)](https://github.com/MLorneSmith/2025slideheroes/actions/workflows/pr-validation.yml)
[![Deploy to Dev](https://github.com/MLorneSmith/2025slideheroes/actions/workflows/dev-deploy.yml/badge.svg?branch=dev)](https://github.com/MLorneSmith/2025slideheroes/actions/workflows/dev-deploy.yml)
[![Deploy to Staging](https://github.com/MLorneSmith/2025slideheroes/actions/workflows/staging-deploy.yml/badge.svg?branch=staging)](https://github.com/MLorneSmith/2025slideheroes/actions/workflows/staging-deploy.yml)
[![Deploy to Production](https://github.com/MLorneSmith/2025slideheroes/actions/workflows/production-deploy.yml/badge.svg?branch=main)](https://github.com/MLorneSmith/2025slideheroes/actions/workflows/production-deploy.yml)

## Target Customers

SlideHeroes targets small and medium sized consultancies, advisory firms, and technology companies.
SlideHeroes also targets individual professionals and subject matter experts who are responsible for
creating high-stakes presentations.

## Current Status

The SlideHeroes app and website are currently under active development. The app is not yet feature
complete, and the website is not yet fully launched. The app is currently in a private beta, and the
website is currently in a private preview.

## Development Workflow & Branch Strategy

This repository follows a multi-branch development strategy with automated CI/CD pipelines:

### Branch Structure

- **`main`** → Production environment (slideheroes.com)

  - Requires 2 code reviews before merge
  - All CI/CD checks must pass
  - Linear history enforced
  - Protected from force pushes

- **`staging`** → Staging environment (staging.slideheroes.com)

  - Requires 1 code review before merge
  - All CI/CD checks must pass
  - Used for final testing before production

- **`dev`** → Development environment (dev.slideheroes.com)

  - Status checks required (no manual reviews)
  - Frequent deployments for ongoing development
  - Integration testing environment

- **`feature/*`** → Feature branches
  - Create from `dev` branch
  - Merge back to `dev` via pull request
  - Preview deployments available

### Deployment Flow

1. **Development**: Feature branches → `dev` → preview/development deployment
2. **Staging**: `dev` → `staging` → staging deployment for QA
3. **Production**: `staging` → `main` → production deployment

All branches are protected and require passing CI/CD checks including:

- Code linting and formatting (Biome)
- TypeScript compilation
- Unit and integration tests
- Security scanning (when enabled)
- Bundle size analysis (when enabled)

## Technical Overview

### Technical Stack

This repository is built using the MakerKit Next.js Supabase SaaS Starter Kit.
The following are the key technologies used:

- Next.js 15 with React 19
- TypeScript
- Supabase for authentication and database
- Payload CMS for content management
- Turborepo for monorepo management
- Portkey AI Gateway for AI features
- Vercel for deployment

### Repository Structure

This repository contains the source code for the SlideHeroes app and website.
It is built using the MakerKit Next.js Supabase SaaS Starter Kit.

The repo contains the following apps in a turborepo monorepo:

- `apps/web` - The Next.js SaaS application
- `apps/payload` - Payload CMS for content management
- `apps/e2e` - Playwright E2E tests
- `apps/dev-tool` - Development utilities and interface

Nearly all of our development is focused on the web and payload apps.

## Frontend

### Website

The website is located at: apps\web\app\(marketing)\[...slug]\page.tsx

### The Course

A key portion of our web app is a course. It is located at: apps\web\app\home\(user)\course

apps/web/app/home/(user)/course/page.tsx is the home page for our main course 'Decks for Decision Makers'.

- Each course has multiple lessons
- Each lesson may, or may not, have a quiz (optional)
- Each quiz has multiple quiz questions

The content for these courses, lessons and quizzes comes from Payload CMS.
As does the content for our surveys, blog posts and documentation.

### AI Tools

The page apps\web\app\home\(user)\ai\page.tsx has three sections:

1. Build new presentation: A multi-step form for inputing the building block content for a business presentation
2. Edit existing presentation: A document editor for editing the outline of a presentation
3. Generate a powerpoint file: A tool for generating a powerpoint file from the outline of a presentation

### Kanban

The page apps\web\app\home\(user)\kanban\page.tsx is a kanban board for managing presentation tasks.

### Coaching

The page apps\web\app\home\(user)\coaching\page.tsx is a page for scheduling and managing coaching sessions.

### Assessment

The page apps\web\app\home\(user)\assessment\page.tsx is a page for taking our 'Self-Assessment Survey'.

## Backend

### Payload CMS

Payload CMS is a headless CMS that we use for managing all of our content. It is located in the
apps/payload directory. It is built on top of Next.js and uses a PostgreSQL database hosted by Supabase.
We use Payload for storing the following content:

- Courses
- Lessons
- Quizzes
- Quiz Questions
- Surveys
- Survey Questions
- Blog Posts
- Documentation
- Private Posts
- Media
- Downloads

### Supabase

Supabase is our primary database. It is used for storing user data, as well as for managing relationships
between our Payload content. For example, we use Supabase to store the relationship between a user and the
courses they have enrolled in. We also use Supabase to store the relationship between a user and the
survey responses they have submitted.

### Portkey AI Gateway

Portkey AI Gateway is used for managing all of our AI integrations. It is located in the packages/ai-gateway
directory. It is built on top of the OpenAI SDK and uses the Portkey AI Gateway API.
We use Portkey for the following:

- Managing API keys for all of our AI providers
- Managing AI requests and responses
- Managing AI usage and billing

### Billing

Billing is handled by Stripe.

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm
- Docker
- GitHub CLI (`gh`) - for automation and repository management
- Stripe account
- Supabase account
- Portkey account
- OpenAI account

### Installation

```bash
# Install dependencies
pnpm install

# Start local Supabase
pnpm supabase:web:start

# Generate database types
pnpm supabase:web:typegen

# Start all development servers
pnpm dev
```

#### Installing GitHub CLI (if not available)

For WSL2/Ubuntu environments:

```bash
# Download and install to ~/.local/bin (no sudo required)
cd /tmp
curl -fLO https://github.com/cli/cli/releases/latest/download/gh_$(curl -s https://api.github.com/repos/cli/cli/releases/latest | grep tag_name | cut -d'"' -f4 | sed 's/v//')_linux_amd64.tar.gz
tar -xzf gh_*_linux_amd64.tar.gz
cp gh_*/bin/gh ~/.local/bin/
chmod +x ~/.local/bin/gh

# Verify installation
gh --version
```

Configure authentication:

```bash
gh auth login
```

## Documentation

- [MakerKit Documentation](https://makerkit.dev/docs/next-supabase-turbo/introduction)
- [Portkey Documentation](https://portkey.ai/docs)
- [Stripe Documentation](https://stripe.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [OpenAI Documentation](https://platform.openai.com/docs)

## Role-Based Context Priming

This project uses Claude's context priming capabilities to provide specialized assistance based on
different engineering roles. This helps Claude understand your codebase better and provide more
relevant assistance.

### Available Roles

- **Full Stack Engineer** (`/read .claude/roles/full-stack-engineer.md`): End-to-end implementation across frontend and backend
- **UI Engineer** (`/read .claude/roles/ui-engineer.md`): Frontend implementation, component design, user experience
- **Data Engineer** (`/read .claude/roles/data-engineer.md`): Database design, data access patterns, authentication
- **AI Engineer** (`/read .claude/roles/ai-engineer.md`): AI integration, prompt engineering, model optimization
- **Architecture Engineer** (`/read .claude/roles/architecture-engineer.md`): System design, service integration
- **Security Engineer** (`/read .claude/roles/security-engineer.md`): Authentication, authorization, data protection
- **CMS Engineer** (`/read .claude/roles/cms-engineer.md`): Content management, editorial workflows
- **Unit Test Writer** (`/read .claude/roles/unit-test-writer.md`): Test implementation, mocking, test-driven development

### How to Use Roles

1. **Switch to a role** at the beginning of your session:

   ```bash
   /read .claude/roles/ui-engineer.md
   ```

2. **Ask role-specific questions** after loading a role:

   ```text
   Now that you're in UI Engineer role, help me implement a responsive navigation component.
   ```

3. **Combine roles** for complex tasks:

   ```bash
   /read .claude/roles/ui-engineer.md
   /read .claude/roles/data-engineer.md

   I need to create a data table component that fetches and displays user data from Supabase.
   ```

4. **Use task-specific commands** for common workflows:

   ```bash
   /read .claude/tasks/ui/new-component.md

   I need a Button component with primary, secondary, and danger variants.
   ```

### Best Practices

- Load the most relevant role for your current task
- Use the **Full Stack Engineer** role for broad tasks that span frontend and backend
- Be specific about what you're trying to accomplish
- For complex tasks spanning multiple domains, load the most relevant roles in order of importance
- If Claude seems to be missing context, try loading additional relevant documentation
