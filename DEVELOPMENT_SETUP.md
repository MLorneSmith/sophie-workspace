# Development Environment Setup

## Terminal Configuration

**Default Environment**: WSL (Ubuntu)
**Location**: `/mnt/d/SlideHeroes/App/repos/2025slideheroes`

## Installed Tools

- **Node.js**: v22.16.0 (via nvm)
- **npm**: v10.9.2
- **nvm**: v0.39.0
- **git**: v2.34.1
- **ripgrep**: v13.0.0

## For AI Assistants (Augment Code)

**Important**: Always use WSL environment for development tasks:

1. Use `launch-process` with `wait=false` to start WSL session
2. Use `write-process` and `read-process` to interact with WSL
3. Never use PowerShell for Node.js/npm commands
4. Working directory should be `/mnt/d/SlideHeroes/App/repos/2025slideheroes`

## VS Code Configuration

- Default terminal profile: Ubuntu (WSL)
- Automation profile: WSL
- All development commands should run in WSL context

## Quick Test Commands

```bash
# Verify environment
pwd  # Should show: /mnt/d/SlideHeroes/App/repos/2025slideheroes
whoami  # Should show: msmith
node --version  # Should show: v22.16.0
npm --version   # Should show: v10.9.2
```

## Package Management

- Use `npm` or `pnpm` for package management
- All Node.js operations should be in WSL
- Git operations should be in WSL
