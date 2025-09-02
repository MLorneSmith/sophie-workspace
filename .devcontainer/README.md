# SlideHeroes Claude Code Development Container

This directory contains the official Claude Code development container configuration for SlideHeroes, providing a secure, isolated development environment with built-in AI assistance capabilities. Based on [Anthropic's Claude Code devcontainer](https://github.com/anthropics/claude-code), this setup includes enhanced security features and project-specific customizations.

## 🚀 Quick Start

### GitHub Codespaces (Recommended)

1. Click the "Code" button on the repository
2. Select "Codespaces" tab
3. Click "Create codespace on main"
4. Wait for the container to build (first time: ~3-5 minutes)
5. The environment will automatically set up and open VS Code in your browser

### VS Code with Dev Containers

1. Install prerequisites:
   - [Docker Desktop](https://www.docker.com/products/docker-desktop)
   - [VS Code](https://code.visualstudio.com/)
   - [Dev Containers extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers)

2. Clone the repository:
   ```bash
   git clone https://github.com/MLorneSmith/2025slideheroes.git
   cd 2025slideheroes
   ```

3. Open in VS Code:
   ```bash
   code .
   ```

4. When prompted, click "Reopen in Container" or press `F1` and select "Dev Containers: Reopen in Container"

## 🔒 Security Features

This devcontainer implements Claude Code's security model:

### Network Security
- **Firewall Protection**: Restricts network access using iptables
- **Whitelist-Only Access**: Only approved domains can be accessed
- **Isolated Environment**: Default DROP policy for all traffic
- **Secure DNS**: Controlled DNS resolution to prevent data exfiltration

### Allowed Connections
The firewall permits connections only to:
- GitHub (for version control)
- NPM/Yarn registries (for packages)
- Anthropic APIs (for Claude Code)
- SlideHeroes services (Supabase, Stripe, etc.)
- Local development servers

### User Security
- Runs as non-root user (`node`)
- Limited sudo permissions (firewall only)
- Isolated file system access
- Secure secret management

## 📦 What's Included

### Core Technologies
- **Node.js 20**: Latest LTS version for optimal performance
- **pnpm**: Fast, disk space efficient package manager
- **TypeScript**: Full TypeScript support with proper configurations
- **Docker-in-Docker**: Run Supabase and other containerized services

### Development Tools
- **Supabase CLI**: Local Supabase development environment
- **GitHub CLI**: Integrated GitHub operations
- **PostgreSQL Client**: Direct database access tools
- **Git**: Pre-configured with your credentials (mounted from host)

### VS Code Extensions (Auto-installed)
- **Claude Code**: AI-powered coding assistant
- **Biome**: Fast formatter and linter
- **ESLint & Prettier**: Code quality tools
- **Tailwind CSS IntelliSense**: CSS framework support
- **Prisma**: Database ORM tools
- **GitLens**: Advanced Git features
- **Thunder Client**: REST API testing
- **Playwright**: E2E testing support

### Services
- **Next.js Dev Server**: Port 3000
- **Supabase Studio**: Port 54321
- **PostgreSQL Database**: Port 54322
- **MCP Servers**: Various AI and integration services

## 🔧 Configuration

### Environment Variables

#### For GitHub Codespaces

Add these secrets to your repository or Codespaces settings:

1. Go to Settings → Secrets and variables → Codespaces
2. Add the following secrets:

```bash
# Required
DATABASE_URL                      # PostgreSQL connection string
NEXT_PUBLIC_SUPABASE_URL          # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY     # Supabase anonymous key
SUPABASE_SERVICE_ROLE_KEY         # Supabase service role key

# Optional (for full functionality)
STRIPE_SECRET_KEY                 # Stripe API key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY # Stripe publishable key
OPENAI_API_KEY                    # OpenAI API key
ANTHROPIC_API_KEY                 # Anthropic API key
```

#### For Local Development

1. Copy the environment template:
   ```bash
   cp .devcontainer/.env.template .env.devcontainer
   ```

2. Fill in your values in `.env.devcontainer`

3. The container will automatically load these on startup

### Customization

#### Modify Container Resources

Edit `.devcontainer/devcontainer.json`:

```json
"hostRequirements": {
  "cpus": 8,        // Increase for better performance
  "memory": "16gb", // Increase for larger projects
  "storage": "64gb" // Increase for more space
}
```

#### Add VS Code Extensions

Add extension IDs to `.devcontainer/devcontainer.json`:

```json
"customizations": {
  "vscode": {
    "extensions": [
      "your.extension-id"
    ]
  }
}
```

#### Configure Git

Git configuration is automatically mounted from your host machine. To use different credentials in the container:

```bash
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

## 🛠️ Common Tasks

### Start Development Server
```bash
pnpm dev
# or use the alias
dev
```

### Database Operations
```bash
# Connect to database
db

# Start Supabase
supabase-start

# Stop Supabase
supabase-stop

# Reset database
supabase-reset

# Run migrations
pnpm --filter web supabase:db:push
```

### Testing
```bash
# Run all tests
pnpm test

# Run unit tests only
pnpm test:unit

# Run E2E tests
pnpm test:e2e

# Run with coverage
pnpm test:coverage
```

### Code Quality
```bash
# Run linter
pnpm lint

# Fix lint issues
pnpm lint:fix

# Type checking
pnpm typecheck

# Format code
pnpm format:fix
```

### Git Operations
```bash
# Using aliases
gs  # git status
gd  # git diff
gc  # git commit
gp  # git push
gl  # git log --oneline -10
```

## 🐛 Troubleshooting

### Network Access Issues

If you can't access a required service:

1. **Check firewall logs**:
   ```bash
   sudo dmesg | grep iptables-dropped
   ```

2. **Add domain to firewall whitelist**:
   Edit `.devcontainer/init-firewall.sh` and add:
   ```bash
   add_domain_ips "your-domain.com" "Service Name"
   ```

3. **Restart firewall**:
   ```bash
   sudo /workspace/.devcontainer/init-firewall.sh
   ```

### Container Won't Start

1. **Check Docker is running**:
   ```bash
   docker info
   ```

2. **Clear Docker cache**:
   ```bash
   docker system prune -a
   ```

3. **Rebuild container**:
   - VS Code: `F1` → "Dev Containers: Rebuild Container"
   - Codespaces: Delete and recreate the codespace

### Supabase Won't Start

1. **Check Docker-in-Docker**:
   ```bash
   docker ps
   ```

2. **Reset Supabase**:
   ```bash
   supabase-stop
   supabase-start
   ```

3. **Check logs**:
   ```bash
   npx supabase status
   ```

### Port Already in Use

1. **Find process using port**:
   ```bash
   lsof -i :3000
   ```

2. **Kill process**:
   ```bash
   kill -9 <PID>
   ```

### Performance Issues

1. **Increase container resources** (see Customization section)

2. **Use volume mounts for better I/O**:
   - Already configured for node_modules, .next, etc.

3. **Enable prebuild for Codespaces**:
   - Add `.github/workflows/devcontainer-prebuild.yml`

### Permission Issues

1. **Fix file permissions**:
   ```bash
   sudo chown -R vscode:vscode /workspace
   ```

2. **Fix Git permissions**:
   ```bash
   git config --global safe.directory /workspace
   ```

## 📊 Performance Optimization

### Prebuild Configuration

For GitHub Codespaces, enable prebuilds to reduce startup time:

1. Go to repository Settings → Codespaces
2. Click "Set up prebuild"
3. Configure triggers (e.g., on push to main)
4. Select machine type (minimum 4-core)

### Volume Mounts

The following are mounted as volumes for performance:
- `node_modules` - Package dependencies
- `.pnpm-store` - pnpm cache
- `.next` - Next.js build cache
- `.turbo` - Turborepo cache
- `.supabase` - Supabase data

### Resource Recommendations

| Use Case | CPU | Memory | Storage |
|----------|-----|--------|---------|
| Minimal | 2 cores | 4 GB | 16 GB |
| **Recommended** | **4 cores** | **8 GB** | **32 GB** |
| Performance | 8 cores | 16 GB | 64 GB |

## 🔐 Security

### Secrets Management

- **Never commit secrets** to the repository
- Use GitHub Codespaces secrets for cloud development
- Use `.env.devcontainer` for local development (gitignored)
- Rotate tokens and keys regularly

### Network Security

- Container runs with limited privileges
- Ports are only exposed as needed
- Use HTTPS in production environments

### Best Practices

1. **Don't store production data** in development containers
2. **Use separate API keys** for development
3. **Enable 2FA** on GitHub and other services
4. **Review container logs** regularly

## 📚 Additional Resources

### Documentation
- [VS Code Dev Containers](https://code.visualstudio.com/docs/devcontainers/containers)
- [GitHub Codespaces](https://docs.github.com/en/codespaces)
- [Docker Documentation](https://docs.docker.com/)
- [Supabase Local Development](https://supabase.com/docs/guides/cli/local-development)

### Project Specific
- [SlideHeroes Architecture](../docs/architecture/README.md)
- [Development Guide](../docs/development/README.md)
- [API Documentation](../docs/api/README.md)

## 🤝 Contributing

When updating the devcontainer configuration:

1. Test changes locally first
2. Verify in GitHub Codespaces
3. Update this documentation
4. Submit PR with clear description

## 📝 License

This devcontainer configuration is part of the SlideHeroes project and follows the same license terms.

---

**Need help?** Open an issue at [GitHub Issues](https://github.com/MLorneSmith/2025slideheroes/issues)