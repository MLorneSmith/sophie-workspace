# DevContainer Configuration

## Multi-Container Setup

This devcontainer configuration provides a complete development environment with:

- Main app container (Node.js development)
- E2E testing container (Playwright)
- MCP servers container
- PostgreSQL database
- Redis cache
- Mailhog email testing
- Supabase Studio

## File Structure

- `devcontainer.json` - Main configuration file
- `docker-compose.yml` - Base multi-container setup
- `docker-compose.local-override.yml` - Local development overrides (git, ssh mounts)
- `docker-compose.codespaces.yml` - GitHub Codespaces specific configuration
- `docker-compose.local.yml` - Additional local development options
- `Dockerfile` - Main app container definition
- `Dockerfile.e2e` - E2E testing container with Playwright
- `Dockerfile.mcp` - MCP servers container

## Local Development

For local development with git config and SSH key mounting, use:

```bash
# Add this to your local .devcontainer/devcontainer.json
"dockerComposeFile": ["docker-compose.yml", "docker-compose.local-override.yml"],
```

## GitHub Codespaces

Codespaces automatically uses only `docker-compose.yml` to avoid mounting issues with host files.

The `docker-compose.override.yml` file has been renamed to `docker-compose.local-override.yml`
to prevent automatic loading in Codespaces, which was causing volume mount errors.

## Known Issues Resolved

1. **pnpm installation conflicts** - Removed duplicate feature installation from devcontainer.json
2. **HOME environment variable** - Added `HOME=/home/node` to all containers
3. **Volume mount errors** - Separated local overrides from Codespaces config by renaming override file
4. **Supabase Studio image** - Updated to use `:latest` tag instead of specific version
5. **Docker Compose warnings** - Removed obsolete `version` attribute from compose files

## Customization

To add local-specific configurations, modify `docker-compose.local-override.yml`.
For Codespaces-specific settings, GitHub automatically applies appropriate configurations.

## Validation Warning

The warning "Some properties of devcontainer.json could not be validated" is expected and can be
safely ignored. This occurs because the file contains JSON comments (which VS Code supports but
standard JSON validation does not).
