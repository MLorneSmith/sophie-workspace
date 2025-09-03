# GitHub Codespaces Setup Guide

Complete guide for setting up and using GitHub Codespaces with the 2025slideheroes multi-container development environment.

## 🚀 Quick Start

### Launch Codespace

1. Navigate to [github.com/MLorneSmith/2025slideheroes](https://github.com/MLorneSmith/2025slideheroes)
2. Click the green "Code" button
3. Select "Codespaces" tab
4. Click "Create codespace on main"

The Codespace will automatically:

- Build all three containers (app, e2e, mcp-servers)
- Install dependencies
- Configure networking
- Start all services
- Forward necessary ports

### First Time Setup

Once the Codespace is running:

```bash
# Verify all containers are running
docker compose ps

# Install dependencies (if not auto-installed)
pnpm install

# Start the development server
pnpm dev

# Access the app at the forwarded port (usually port 3000)
```

## 🏗️ Architecture Overview

Our Codespaces environment uses a multi-container architecture:

```text
┌─────────────────────────────────────────────────┐
│                GitHub Codespaces                 │
├─────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌────────┐│
│  │     App      │  │     E2E      │  │  MCP   ││
│  │  Container   │  │  Container   │  │Servers ││
│  │              │  │              │  │        ││
│  │ - Next.js    │  │ - Playwright │  │ - APIs ││
│  │ - Node.js    │  │ - Testing    │  │ - Tools││
│  │ - Dev Tools  │  │ - Browsers   │  │        ││
│  └──────────────┘  └──────────────┘  └────────┘│
│                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌────────┐│
│  │  PostgreSQL  │  │    Redis     │  │Mailhog ││
│  │   Database   │  │    Cache     │  │ Email  ││
│  └──────────────┘  └──────────────┘  └────────┘│
│                                                  │
│            Docker Network: slideheroes           │
└─────────────────────────────────────────────────┘
```

## 🔧 Configuration

### Container Details

#### Main App Container (`app`)

- **Purpose**: Primary development environment
- **Base Image**: Node.js 20
- **Ports**: 3000-3001, 6006, 9229
- **Features**:
  - pnpm package manager
  - Supabase CLI
  - GitHub CLI
  - Biome formatter
  - ESLint/Prettier

#### E2E Test Container (`e2e`)

- **Purpose**: End-to-end testing with Playwright
- **Base Image**: Playwright official image
- **Environment**: Headless browsers pre-installed
- **Usage**: Run E2E tests without affecting main app

#### MCP Servers Container (`mcp-servers`)

- **Purpose**: Model Context Protocol servers
- **Services**: Various MCP implementations
- **Ports**: 3010-3020
- **Features**: Memory, filesystem, database servers

### Port Forwarding

| Port | Service | Auto-Forward | Description |
|------|---------|--------------|-------------|
| 3000 | Next.js | Yes | Main application |
| 3001 | HMR | Yes | Hot Module Replacement |
| 54321 | Supabase Studio | Yes | Database management UI |
| 54322 | PostgreSQL | No | Database connection |
| 6379 | Redis | No | Cache service |
| 8025 | Mailhog | Yes | Email testing UI |
| 9229 | Debugger | No | Node.js debugging |

## 🔐 Secrets Management

### Required Secrets

Configure these in GitHub Settings → Codespaces → Secrets:

```bash
# Core Application
SUPABASE_URL
SUPABASE_ANON_KEY
SUPABASE_SERVICE_KEY
DATABASE_URL

# Authentication
NEXTAUTH_SECRET
NEXTAUTH_URL

# Optional Services
OPENAI_API_KEY
STRIPE_SECRET_KEY
SENDGRID_API_KEY
```

See [.github/codespaces/secrets.md](../.github/codespaces/secrets.md) for detailed setup.

## 💻 Development Workflow

### Starting Services

```bash
# Start all services
docker compose up -d

# Start specific service
docker compose up -d app

# View logs
docker compose logs -f app

# Stop services
docker compose down
```

### Running Tests

```bash
# Unit tests (in app container)
pnpm test

# E2E tests (uses e2e container)
docker compose exec e2e pnpm test:e2e

# E2E with UI (if display configured)
docker compose exec e2e pnpm test:e2e:ui
```

### Database Management

```bash
# Access PostgreSQL
docker compose exec postgres psql -U postgres

# Run migrations
pnpm db:migrate

# Access Supabase Studio
# Open forwarded port 54321 in browser
```

### Debugging

```bash
# Attach to container
docker compose exec app bash

# View container logs
docker compose logs app

# Debug Node.js app
# Set breakpoints in VS Code
# Use port 9229 for debugger attachment
```

## 🔄 Switching Between Environments

### Local Development

For local development with Docker:

```bash
# Use local override file
docker compose -f docker-compose.yml -f docker-compose.local.yml up
```

### Codespaces

Codespaces automatically uses the appropriate configuration:

```bash
# Automatic in Codespaces
docker compose -f docker-compose.yml -f docker-compose.override.yml up
```

## 🐛 Troubleshooting

### Container Issues

#### Container won't start

```bash
# Check logs
docker compose logs app

# Rebuild container
docker compose build app
docker compose up -d app
```

#### Port already in use

```bash
# Find process using port
lsof -i :3000

# Kill process
kill -9 <PID>

# Or change port in docker-compose.yml
```

### Network Issues

#### Containers can't communicate

```bash
# Verify network
docker network ls
docker network inspect slideheroes

# Restart network
docker compose down
docker network prune
docker compose up -d
```

#### Can't access forwarded ports

1. Check port forwarding in Codespaces settings
2. Ensure service is running: `docker compose ps`
3. Check firewall rules in container

### Performance Issues

#### Slow performance

```bash
# Check resource usage
docker stats

# Increase Codespace size (Settings → Change machine type)
# Recommended: 8-core, 16GB RAM
```

#### Out of disk space

```bash
# Clean up Docker
docker system prune -a

# Remove unused volumes
docker volume prune

# Clear caches
rm -rf node_modules/.cache
rm -rf .next/cache
```

### Database Issues

#### Can't connect to database

```bash
# Check PostgreSQL is running
docker compose ps postgres

# Test connection
docker compose exec postgres pg_isready

# View PostgreSQL logs
docker compose logs postgres
```

## 📊 Resource Requirements

### Minimum Requirements

- **Machine Type**: 4-core
- **RAM**: 8GB
- **Storage**: 32GB

### Recommended Requirements

- **Machine Type**: 8-core
- **RAM**: 16GB
- **Storage**: 64GB

### Resource Allocation

| Container | CPU Limit | Memory Limit | Purpose |
|-----------|-----------|--------------|---------|
| app | 2 cores | 4GB | Main development |
| e2e | 1 core | 2GB | Testing |
| mcp-servers | 0.5 cores | 1GB | API servers |
| postgres | 1 core | 1GB | Database |
| redis | 0.25 cores | 256MB | Cache |
| mailhog | 0.25 cores | 256MB | Email |

## 🚢 Deployment from Codespaces

### Build for Production

```bash
# Build production image
docker build -t slideheroes-prod -f Dockerfile.prod .

# Test production build
docker run -p 3000:3000 slideheroes-prod
```

### Deploy to Cloud

```bash
# Deploy to Vercel
pnpm deploy:vercel

# Deploy to AWS
pnpm deploy:aws

# Deploy to Docker Registry
docker push your-registry/slideheroes:latest
```

## 🔗 Useful Commands

### Docker Compose

```bash
# View running containers
docker compose ps

# Execute command in container
docker compose exec app bash

# View real-time logs
docker compose logs -f

# Rebuild specific service
docker compose build app

# Remove all containers and volumes
docker compose down -v
```

### Development

```bash
# Install dependencies
pnpm install

# Start dev server
pnpm dev

# Run tests
pnpm test

# Lint code
pnpm lint

# Format code
pnpm format
```

### Database

```bash
# Run migrations
pnpm db:migrate

# Seed database
pnpm db:seed

# Reset database
pnpm db:reset
```

## 📚 Additional Resources

- [GitHub Codespaces Documentation](https://docs.github.com/en/codespaces)
- [Dev Containers Specification](https://containers.dev/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Project README](../README.md)
- [Development Guide](./DEVELOPMENT.md)

## 🤝 Support

If you encounter issues:

1. Check this troubleshooting guide
2. Search [existing issues](https://github.com/MLorneSmith/2025slideheroes/issues)
3. Create a new issue with:
   - Codespace machine type
   - Error messages
   - Steps to reproduce
   - Container logs (`docker compose logs`)

## 📝 Notes

- Codespaces automatically saves your work
- Idle Codespaces stop after 30 minutes (configurable)
- Stopped Codespaces retain data for 30 days
- Prebuilds can be configured for faster startup
- Use `.devcontainer/devcontainer.json` to customize
