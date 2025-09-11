# Station MCP Server Integration - Implementation Plan

**Project**: SlideHeroes  
**Date**: 2025-01-11  
**Objective**: Integrate Cloudshipai Station to manage MCP servers and reduce Claude Code context overhead  

## Executive Summary

This document outlines the comprehensive plan to integrate Cloudshipai Station as an MCP server aggregator for the SlideHeroes project. The integration will reduce context token usage by 60-80% while maintaining full functionality through a hybrid architecture approach.

**Key Benefits**:
- Reduce context tokens from ~10,000-20,000 to ~2,000-4,000 per session
- Enable agent-based task specialization
- Maintain production deployment capabilities
- Centralize MCP server management

## 1. Current State Analysis

### 1.1 Station Installation Status
- **Installed**: ✅ Version v0.10.7 at `/home/msmith/.local/bin/stn`
- **Configuration Directory**: `~/.config/station/`
- **Environments Configured**: 
  - `default` (empty)
  - `slideheroes` (outdated HTTP transport configuration)
- **Database**: SQLite at `~/.config/station/station.db`
- **Agents**: None currently configured

### 1.2 Current MCP Server Configuration
**Total MCP Servers**: 12 configured in `.mcp.json`

**To be removed** (3 servers):
- `cloudflare-bindings` - Not needed
- `browser-tools` - Not needed
- `github` - Not needed

**To migrate to Station** (5 servers):
- `perplexity-ask` - AI Q&A and research
- `exa` - Web search capabilities
- `supabase` - Database management
- `context7` - Documentation retrieval
- `code-reasoning` - Sequential thinking

**To keep in Claude Code** (4 servers):
- `postgres` - Direct database connection (latency-sensitive)
- `cloudflare-playwright` - Remote Worker browser automation
- `newrelic` - Python-based monitoring
- *(Station itself will be added as a new MCP server)*

### 1.3 Current Context Usage
- **Before**: 10,000-20,000 tokens with all 12 MCP servers
- **After**: 2,000-4,000 tokens with 4 direct servers + Station
- **Reduction**: 60-80% context savings

## 2. Target Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Claude Code                           │
├─────────────────────────────────────────────────────────────┤
│                     MCP Client Layer                         │
├─────────────┬──────────┬──────────┬──────────┬─────────────┤
│   Station   │ Postgres │ CF Play  │ NewRelic │             │
│  (5 servers)│  (Direct)│ (Remote) │ (Python) │             │
└─────────────┴──────────┴──────────┴──────────┴─────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────┐
│                    Station Runtime                           │
├─────────────────────────────────────────────────────────────┤
│  Perplexity │   Exa    │ Supabase │ Context7 │ Code-Reason │
└─────────────────────────────────────────────────────────────┘
```

### 2.1 Station Integration Points
- **MCP Protocol**: Station acts as a single MCP server to Claude Code
- **Tool Aggregation**: Station provides tools from all managed servers
- **Agent Runtime**: Station executes AI agents with scoped tool access
- **Environment Management**: Development/staging/production configurations

### 2.2 Security Model
- **Secret Management**: Environment variables in Station configuration
- **Process Isolation**: Each MCP server runs in separate process
- **Access Control**: Agent-scoped tool permissions
- **Audit Logging**: All operations logged to stderr

## 3. Implementation Steps

### Phase 1: Preparation (Day 1)

#### Step 1.1: Backup Current Configuration
```bash
# Backup existing MCP configuration
cp .mcp.json .mcp.json.backup.$(date +%Y%m%d)
cp -r .claude .claude.backup.$(date +%Y%m%d)

# Backup Station configuration if exists
cp -r ~/.config/station ~/.config/station.backup.$(date +%Y%m%d)
```

#### Step 1.2: Setup Environment Variables

**IMPORTANT SECURITY FINDING**: The file `.env.mcp` contains what appear to be actual API keys. These should NEVER be committed to version control. Please rotate these keys immediately if they are real.

**Environment Variable Management**:
Station can load environment variables from multiple sources:
1. **Shell environment** (highest priority) - via `os.Getenv()`
2. **variables.yml** with `${VAR}` expansion
3. **Interactive prompts** if missing

**Setup Process**:
1. Create `.env` file from template:
```bash
cp .env.example.station .env
# Edit .env with your actual API keys
```

2. Load environment variables:
```bash
# Option A: Manual loading
source .env

# Option B: Use direnv for automatic loading
sudo apt install direnv
echo "dotenv" > .envrc
direnv allow
```

3. Required environment variables:
- `OPENAI_API_KEY` - For Station agent execution
- `PERPLEXITY_API_KEY` - For Perplexity MCP server
- `EXA_API_KEY` - For Exa search
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_SERVICE_KEY` - Supabase service role key

4. Optional (for remaining direct servers):
- `NEW_RELIC_API_KEY` - If using NewRelic
- `NEW_RELIC_ACCOUNT_ID` - NewRelic account
- `CLOUDFLARE_ACCOUNT_ID` - For Cloudflare Playwright

**Security Best Practices**:
- Add `.env` to `.gitignore`
- Never commit real API keys
- Use `.env.example` files with dummy values
- Rotate keys regularly
- Use different keys for dev/staging/production

### Phase 2: Station Configuration (Day 1)

#### Step 2.1: Initialize Station
```bash
# Initialize with OpenAI provider
stn init --provider openai --model gpt-4o --ship
```

#### Step 2.2: Configure SlideHeroes Environment
Replace `~/.config/station/environments/slideheroes/template.json`:
```json
{
  "description": "SlideHeroes MCP Servers via Station - Streamlined Configuration",
  "mcpServers": {
    "perplexity-ask": {
      "command": "npx",
      "args": ["-y", "server-perplexity-ask"],
      "env": {
        "PERPLEXITY_API_KEY": "{{ .PERPLEXITY_API_KEY }}"
      }
    },
    "exa": {
      "command": "npx",
      "args": ["-y", "exa-mcp"],
      "env": {
        "EXA_API_KEY": "{{ .EXA_API_KEY }}"
      }
    },
    "supabase": {
      "command": "npx",
      "args": ["-y", "@supabase/mcp-server-supabase@latest"],
      "env": {
        "SUPABASE_URL": "{{ .SUPABASE_URL }}",
        "SUPABASE_SERVICE_KEY": "{{ .SUPABASE_SERVICE_KEY }}"
      }
    },
    "context7": {
      "command": "npx",
      "args": ["-y", "@upstash/context7-mcp"]
    },
    "code-reasoning": {
      "command": "npx",
      "args": ["-y", "@mettamatt/code-reasoning"]
    }
  },
  "name": "slideheroes-streamlined"
}
```

#### Step 2.3: Update Variables Configuration
Update `~/.config/station/environments/slideheroes/variables.yml`:
```yaml
# API Keys
PERPLEXITY_API_KEY: "${PERPLEXITY_API_KEY}"
EXA_API_KEY: "${EXA_API_KEY}"
OPENAI_API_KEY: "${OPENAI_API_KEY}"

# Supabase Configuration
SUPABASE_URL: "http://localhost:54321"
SUPABASE_SERVICE_KEY: "${SUPABASE_SERVICE_KEY}"

# Project Paths
PROJECT_ROOT: "/home/msmith/projects/worktrees/feature-station"

# Node Environment
NODE_ENV: "development"
```

#### Step 2.4: Sync Station Configuration
```bash
stn sync
```

### Phase 3: Claude Code Integration (Day 1)

#### Step 3.1: Update .mcp.json
Create new `.mcp.json`:
```json
{
  "mcpServers": {
    "station": {
      "command": "stn",
      "args": ["stdio"]
    },
    "postgres": {
      "command": "npx",
      "args": [
        "-y",
        "@henkey/postgres-mcp-server",
        "--connection-string",
        "postgresql://postgres:postgres@127.0.0.1:54322/postgres"
      ]
    },
    "cloudflare-playwright": {
      "command": "npx",
      "args": [
        "-y",
        "mcp-remote",
        "https://slideheroes-playwright-mcp.slideheroes.workers.dev/sse"
      ],
      "env": {
        "CLOUDFLARE_ACCOUNT_ID": "${CLOUDFLARE_ACCOUNT_ID}"
      }
    },
    "newrelic": {
      "command": "/home/msmith/.local/bin/uv",
      "args": [
        "--directory",
        "/home/msmith/projects/2025slideheroes/.mcp-servers/newrelic-mcp",
        "run",
        "newrelic_mcp_server.py"
      ],
      "env": {
        "NEW_RELIC_API_KEY": "${NEW_RELIC_API_KEY}",
        "NEW_RELIC_ACCOUNT_ID": "${NEW_RELIC_ACCOUNT_ID}"
      }
    }
  }
}
```

#### Step 3.2: Update Claude Settings
Update `.claude/settings.local.json`:
```json
{
  "enableAllProjectMcpServers": true,
  "enabledMcpjsonServers": [
    "station",
    "postgres",
    "cloudflare-playwright",
    "newrelic"
  ]
}
```

#### Step 3.3: Restart Claude Code
```bash
# Close Claude Code completely
# Reopen Claude Code to load new configuration
```

### Phase 4: Agent Creation (Day 2)

#### Step 4.1: Create Base Agents
Create example agents in `~/.config/station/environments/slideheroes/agents/`:

**CodeAnalyzer.prompt**:
```yaml
---
model: "gpt-4o"
config:
  temperature: 0.3
  max_tokens: 2000
input:
  schema:
    query: string
    context: string
output:
  schema:
    analysis: string
    recommendations: array
metadata:
  name: "code-analyzer"
  description: "Analyzes code using Perplexity, Exa, and reasoning tools"
station:
  execution_metadata:
    max_steps: 5
    environment: "slideheroes"
---

{{role "system"}}
You are an expert code analyzer with access to research and reasoning tools.
Provide detailed analysis and actionable recommendations.

{{role "user"}}
Query: {{query}}
Context: {{context}}
```

**ResearchAssistant.prompt**:
```yaml
---
model: "gpt-4o"
config:
  temperature: 0.5
  max_tokens: 3000
input:
  schema:
    topic: string
    depth: string
output:
  schema:
    research: string
    sources: array
metadata:
  name: "research-assistant"
  description: "Conducts thorough research using Perplexity and Exa"
station:
  execution_metadata:
    max_steps: 10
    environment: "slideheroes"
---

{{role "system"}}
You are a research assistant with access to Perplexity AI and Exa search.
Conduct thorough research and provide comprehensive, well-sourced information.

{{role "user"}}
Research topic: {{topic}}
Depth level: {{depth}}
```

#### Step 4.2: Test Agents
```bash
# List available agents
stn agent list

# Test code analyzer
stn agent run "code-analyzer" "Analyze the authentication module for security issues"

# Test research assistant
stn agent run "research-assistant" "Research best practices for React Server Components"
```

## 4. Testing & Validation Checklist

### 4.1 Station Functionality
- [ ] Station service starts successfully
- [ ] `stn --version` returns v0.10.7 or higher
- [ ] `stn agent list` shows created agents
- [ ] `stn sync` completes without errors
- [ ] Station database is accessible

### 4.2 Claude Code Integration
- [ ] Claude Code recognizes Station as MCP server
- [ ] `/mcp` command shows Station in list
- [ ] Station tools are available:
  - [ ] `call_agent`
  - [ ] `create_agent`
  - [ ] `list_agents`
  - [ ] `deploy_agent`
- [ ] Direct MCP servers still function:
  - [ ] Postgres connectivity
  - [ ] NewRelic (if configured)
  - [ ] Cloudflare Playwright

### 4.3 Agent Execution
- [ ] Agents can be called from Claude Code
- [ ] Agents have access to configured MCP tools
- [ ] Agent responses are properly formatted
- [ ] Error handling works correctly

### 4.4 Performance Validation
- [ ] Measure context tokens before migration
- [ ] Measure context tokens after migration
- [ ] Verify 60-80% reduction achieved
- [ ] Check response latency is acceptable

## 5. Rollback Plan

If issues occur, follow this rollback procedure:

### Step 5.1: Restore Claude Configuration
```bash
# Restore original MCP configuration
cp .mcp.json.backup.$(date +%Y%m%d) .mcp.json

# Restore Claude settings
cp -r .claude.backup.$(date +%Y%m%d)/* .claude/

# Restart Claude Code
```

### Step 5.2: Disable Station (Optional)
```bash
# Only if Station is causing issues
stn agent delete --all
rm -rf ~/.config/station/environments/slideheroes/agents/*
```

### Step 5.3: Verify Original Functionality
- Test all MCP servers are accessible
- Verify tools are working
- Check context usage returns to previous levels

## 6. Monitoring & Maintenance

### 6.1 Daily Monitoring
- Check Station logs: `~/.config/station/logs/`
- Monitor Claude Code token usage: `/cost`
- Verify agent execution success rate

### 6.2 Weekly Maintenance
- Update Station: `stn update`
- Review and optimize agents
- Clean up old execution logs
- Rotate API keys if necessary

### 6.3 Monthly Review
- Analyze context token savings
- Review agent usage patterns
- Update agent prompts based on usage
- Consider creating new specialized agents

## 7. Success Metrics

### 7.1 Primary Metrics
- **Context Reduction**: Target 60-80% reduction
- **Agent Success Rate**: >95% successful executions
- **Response Latency**: <2s for agent calls
- **System Stability**: Zero downtime due to Station

### 7.2 Secondary Metrics
- **Developer Productivity**: Reduced cognitive load
- **Cost Savings**: Lower token consumption costs
- **Agent Utilization**: Number of agent calls per day
- **Error Rate**: <1% error rate for MCP operations

## 8. Known Limitations & Considerations

### 8.1 Limitations
- Station requires Node.js for MCP server execution
- SQLite database may have concurrent access limitations
- Agent execution adds 1-3 second cold start latency
- Maximum 5 execution steps per agent by default

### 8.2 Considerations
- Secrets must be properly managed in environment variables
- Station database should be backed up regularly
- Agents should be tested thoroughly before production use
- Monitor npx package downloads for security

## 9. Future Enhancements

### 9.1 Short Term (1-2 weeks)
- Create specialized agents for common tasks
- Implement agent versioning strategy
- Set up automated testing for agents
- Create agent documentation templates

### 9.2 Medium Term (1-2 months)
- Migrate to Station bundles for deployment
- Implement CI/CD integration
- Create production environment configuration
- Develop custom MCP servers if needed

### 9.3 Long Term (3-6 months)
- Evaluate Station enterprise features
- Consider PostgreSQL for Station database
- Implement multi-environment agent deployment
- Create agent marketplace for team sharing

## 10. Implementation Timeline

### Day 1: Setup & Configuration
- **Morning**: Backup, preparation, environment setup
- **Afternoon**: Station configuration, Claude integration
- **Testing**: Basic connectivity and tool availability

### Day 2: Agent Development
- **Morning**: Create initial agents
- **Afternoon**: Test agent execution
- **Testing**: End-to-end validation

### Day 3: Optimization & Documentation
- **Morning**: Performance testing and optimization
- **Afternoon**: Documentation and team training
- **Testing**: Full regression testing

## Appendix A: Configuration Files

All configuration files have been created in the following locations:
- `.mcp.json.station` - New Claude Code MCP configuration
- `.claude/settings.local.json.station` - New Claude settings
- `~/.config/station/environments/slideheroes/template.json.new` - Station MCP servers
- `.env.example.station` - Environment variable template
- `setup-station.sh` - Automated setup script
- `.claude/scratch/station-env-variables-guide.md` - Complete environment variable documentation

## Appendix B: Command Reference

### Station Commands
```bash
stn --version                    # Check version
stn init                         # Initialize Station
stn sync                         # Sync configuration
stn agent list                   # List agents
stn agent run <name> <prompt>   # Run agent
stn agent create                # Create new agent
stn serve                        # Start Station server
stn stdio                        # Start in STDIO mode for Claude
```

### Claude Code Commands
```
/mcp                            # List MCP servers
/cost                           # Check token usage
/permissions                    # View permissions
```

## Appendix C: Troubleshooting Guide

### Common Issues

**Issue**: Station not recognized by Claude Code
- Solution: Ensure `stn` is in PATH and restart Claude Code

**Issue**: Agent execution fails
- Solution: Check environment variables and Station logs

**Issue**: MCP tools not available to agents
- Solution: Run `stn sync` and verify template.json

**Issue**: High latency with Station
- Solution: Check SQLite database size and optimize agents

## Appendix D: Environment Variable Management

### How Station Loads Environment Variables

Station resolves variables in this priority order:
1. **Shell environment variables** (highest priority)
2. **variables.yml** in environment directory
3. **Default values** in templates
4. **Interactive prompts** (if enabled)

### Variable Syntax

**In template.json**: Use `{{ .VARIABLE_NAME }}` syntax
```json
"env": {
  "API_KEY": "{{ .PERPLEXITY_API_KEY }}"
}
```

**In variables.yml**: Use `${VAR}` for shell expansion
```yaml
PERPLEXITY_API_KEY: "${PERPLEXITY_API_KEY}"
PROJECT_ROOT: "/absolute/path/here"
```

### Loading .env Files

Station doesn't directly load .env files, but inherits from shell:

```bash
# Method 1: Source manually
source .env
stn agent run "my-agent" "prompt"

# Method 2: Use direnv for automatic loading
direnv allow
cd project-dir  # .env loaded automatically

# Method 3: Export inline
OPENAI_API_KEY=sk-xxx stn agent run "agent" "prompt"
```

### Security Considerations

1. **Never commit .env files** with real keys
2. **Use .env.example** with dummy values
3. **Add to .gitignore**: `.env`, `.env.*`, `variables.yml`
4. **Rotate keys regularly**
5. **Use different keys** for dev/staging/production

## Document Control

**Version**: 1.1.0  
**Created**: 2025-01-11  
**Updated**: 2025-01-11 (Added environment variable research findings)
**Author**: Station Integration Team  
**Status**: Ready for Implementation  
**Review Date**: 2025-01-18  

---

*This implementation plan provides a comprehensive roadmap for integrating Station with Claude Code. Follow the phases sequentially and use the testing checklist to ensure successful deployment.*