# Station Environment Variables Guide

## How Station Handles Environment Variables

Based on comprehensive research of the Station codebase, here's how environment variables work:

### 1. Variable Sources (Priority Order)

Station resolves variables in this priority order:
1. **Shell environment variables** (highest priority) - via `os.Getenv()`
2. **Environment-specific variables.yml** - per-environment configuration
3. **Default values** in templates
4. **Interactive prompts** (if enabled and variable missing)

### 2. Native .env File Support

**YES**, Station has native .env file support through the `EnvVariableStore` class in `internal/variables/store.go`. However, this is primarily used internally. The recommended approach is:

#### Option A: Shell Environment (Recommended)
```bash
# Load .env file in shell before running Station
source .env
# or
export $(cat .env | xargs)

# Then run Station - it inherits all environment variables
stn agent run "my-agent" "do something"
```

#### Option B: variables.yml with Environment Expansion
```yaml
# ~/.config/station/environments/slideheroes/variables.yml
# Use ${VAR} syntax to reference shell environment variables
OPENAI_API_KEY: "${OPENAI_API_KEY}"
PERPLEXITY_API_KEY: "${PERPLEXITY_API_KEY}"
EXA_API_KEY: "${EXA_API_KEY}"
SUPABASE_URL: "${SUPABASE_URL}"
SUPABASE_SERVICE_KEY: "${SUPABASE_SERVICE_KEY}"
```

### 3. Variable Resolution Flow

```mermaid
graph TD
    A[Template with {{.VAR}}] --> B{Is VAR in shell env?}
    B -->|Yes| C[Use shell value]
    B -->|No| D{Is VAR in variables.yml?}
    D -->|Yes| E[Use variables.yml value]
    D -->|No| F{Interactive mode?}
    F -->|Yes| G[Prompt for value]
    F -->|No| H[Template error]
    G --> I[Save to variables.yml]
```

### 4. Configuration Files

#### template.json (uses {{ .VAR }} syntax)
```json
{
  "mcpServers": {
    "perplexity-ask": {
      "command": "npx",
      "args": ["-y", "server-perplexity-ask"],
      "env": {
        "PERPLEXITY_API_KEY": "{{ .PERPLEXITY_API_KEY }}"
      }
    }
  }
}
```

#### variables.yml (uses ${VAR} for shell expansion)
```yaml
# Direct values
PROJECT_ROOT: "/home/msmith/projects/worktrees/feature-station"

# Shell environment expansion
OPENAI_API_KEY: "${OPENAI_API_KEY}"
PERPLEXITY_API_KEY: "${PERPLEXITY_API_KEY}"

# Nested expansion
DATABASE_URL: "postgresql://postgres:${DB_PASSWORD}@localhost:5432/mydb"
```

## Best Practices for SlideHeroes Project

### 1. Development Setup with .env File

Create a `.env` file in your project root:
```bash
# /home/msmith/projects/worktrees/feature-station/.env
OPENAI_API_KEY=sk-xxx
PERPLEXITY_API_KEY=pplx-xxx
EXA_API_KEY=exa-xxx
SUPABASE_URL=http://localhost:54321
SUPABASE_SERVICE_KEY=xxx
NEW_RELIC_API_KEY=xxx
NEW_RELIC_ACCOUNT_ID=xxx
CLOUDFLARE_ACCOUNT_ID=xxx
```

Add to `.gitignore`:
```
.env
.env.local
.env.*.local
```

### 2. Loading Environment Variables

#### Option 1: Manual Loading (Simple)
```bash
# Load .env file
source .env

# Run Station
stn agent run "code-analyzer" "analyze auth module"
```

#### Option 2: Automated Loading Script
Create `run-station.sh`:
```bash
#!/bin/bash
# Load .env file if it exists
if [ -f .env ]; then
    export $(cat .env | sed 's/#.*//g' | xargs)
fi

# Run Station command
stn "$@"
```

#### Option 3: direnv Integration (Automatic)
```bash
# Install direnv
sudo apt install direnv

# Create .envrc file
echo "dotenv" > .envrc

# Allow direnv for this directory
direnv allow

# Now environment loads automatically when entering directory
cd /home/msmith/projects/worktrees/feature-station
# .env loaded automatically
```

### 3. Station Configuration

Update `~/.config/station/environments/slideheroes/variables.yml`:
```yaml
# API Keys - Reference shell environment
OPENAI_API_KEY: "${OPENAI_API_KEY}"
PERPLEXITY_API_KEY: "${PERPLEXITY_API_KEY}"
EXA_API_KEY: "${EXA_API_KEY}"

# Supabase Configuration
SUPABASE_URL: "${SUPABASE_URL:-http://localhost:54321}"
SUPABASE_SERVICE_KEY: "${SUPABASE_SERVICE_KEY}"

# Project Paths
PROJECT_ROOT: "/home/msmith/projects/worktrees/feature-station"

# Development Settings
NODE_ENV: "development"
```

### 4. Security Best Practices

#### Never Commit Secrets
```gitignore
# .gitignore
.env
.env.*
*.env
!.env.example
~/.config/station/environments/*/variables.yml
```

#### Use .env.example
Create `.env.example` with dummy values:
```bash
# .env.example
OPENAI_API_KEY=sk-your-key-here
PERPLEXITY_API_KEY=pplx-your-key-here
EXA_API_KEY=exa-your-key-here
SUPABASE_URL=http://localhost:54321
SUPABASE_SERVICE_KEY=your-service-key
```

#### Environment-Specific Files
```
.env.development    # Development settings
.env.staging        # Staging settings  
.env.production     # Production settings (never commit)
```

### 5. CI/CD Integration

#### GitHub Actions Example
```yaml
- name: Setup Station with Secrets
  run: |
    # Export secrets from GitHub
    export OPENAI_API_KEY=${{ secrets.OPENAI_API_KEY }}
    export PERPLEXITY_API_KEY=${{ secrets.PERPLEXITY_API_KEY }}
    
    # Initialize Station
    stn init --provider openai --model gpt-4o
    
    # Run agents
    stn agent run "security-scanner" "scan repository"
```

#### Docker Integration
```dockerfile
# Dockerfile
FROM station:latest

# Copy environment template
COPY .env.example /app/.env.example

# Runtime: Load actual secrets via docker run -e
CMD ["sh", "-c", "source /app/.env && stn serve"]
```

```bash
# Run with secrets
docker run \
  -e OPENAI_API_KEY=$OPENAI_API_KEY \
  -e PERPLEXITY_API_KEY=$PERPLEXITY_API_KEY \
  station-image
```

## Implementation Checklist

### Immediate Steps
1. ✅ Create `.env` file with all required API keys
2. ✅ Add `.env` to `.gitignore`
3. ✅ Create `.env.example` with dummy values
4. ✅ Update `variables.yml` to use `${VAR}` syntax

### Before Running Station
1. ✅ Source `.env` file: `source .env`
2. ✅ Verify variables loaded: `echo $OPENAI_API_KEY`
3. ✅ Run Station sync: `stn sync`

### Testing
```bash
# Test variable loading
source .env
env | grep API_KEY

# Test Station with loaded variables
stn agent list
stn agent run "test-agent" "test prompt"
```

## Troubleshooting

### Variables Not Loading
```bash
# Check if variables are in shell
echo $OPENAI_API_KEY

# Check Station's view of variables
stn config get OPENAI_API_KEY

# Debug template rendering
stn sync --debug
```

### Missing Variables Error
If Station reports missing variables:
1. Check shell environment: `env | grep VAR_NAME`
2. Check variables.yml syntax
3. Ensure ${VAR} expansion is working
4. Try interactive mode: `stn sync --interactive`

### Security Warnings
- Never use actual API keys in `template.json`
- Always use variable references: `{{ .API_KEY }}`
- Keep `variables.yml` with secrets out of version control
- Rotate API keys regularly

## Summary

Station provides flexible environment variable management:
- **Shell inheritance**: Station reads from shell environment
- **variables.yml**: Per-environment configuration with `${VAR}` expansion
- **.env support**: Load via shell before running Station
- **Template resolution**: `{{ .VAR }}` in template.json files
- **Security**: Never commit secrets, use environment expansion

The recommended approach for SlideHeroes:
1. Keep secrets in `.env` file (gitignored)
2. Load `.env` in shell before running Station
3. Reference shell variables in `variables.yml` using `${VAR}`
4. Use `{{ .VAR }}` in Station templates