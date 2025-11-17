# SlideHeroes

SlideHeroes is a SaaS platform for learning how to write board-level business presentations and
accelerating presentation creation with AI-powered tools.

## Build Status

[![PR Validation](https://github.com/MLorneSmith/2025slideheroes/actions/workflows/pr-validation.yml/badge.svg)](https://github.com/MLorneSmith/2025slideheroes/actions/workflows/pr-validation.yml)
[![Deploy to Dev](https://github.com/MLorneSmith/2025slideheroes/actions/workflows/dev-deploy.yml/badge.svg?branch=dev)](https://github.com/MLorneSmith/2025slideheroes/actions/workflows/dev-deploy.yml)
[![Deploy to Staging](https://github.com/MLorneSmith/2025slideheroes/actions/workflows/staging-deploy.yml/badge.svg?branch=staging)](https://github.com/MLorneSmith/2025slideheroes/actions/workflows/staging-deploy.yml)
[![Deploy to Production](https://github.com/MLorneSmith/2025slideheroes/actions/workflows/production-deploy.yml/badge.svg?branch=main)](https://github.com/MLorneSmith/2025slideheroes/actions/workflows/production-deploy.yml)

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

- Next.js 16 with React 19.2
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
- `apps/load-tests` - Performance and load testing suite using [k6]

Nearly all of our development is focused on the web and payload apps.

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
