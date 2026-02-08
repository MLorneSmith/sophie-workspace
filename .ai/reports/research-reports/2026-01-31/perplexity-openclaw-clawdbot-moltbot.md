# Perplexity Research: OpenClaw (formerly Clawdbot/Moltbot)

**Date**: 2026-01-31
**Agent**: perplexity-expert
**Search Type**: Chat API + Search API (multiple queries)

## Query Summary

Comprehensive research on OpenClaw, an open-source AI assistant tool formerly known as Clawdbot and Moltbot. Research covered:
- Project identity and history
- Features and capabilities
- Deployment options (especially AWS EC2)
- Source code location
- Configuration requirements

## Executive Summary

**OpenClaw** is an open-source, self-hosted personal AI assistant that runs on user-controlled hardware (Mac, Linux, Windows/WSL2, Raspberry Pi, or cloud VPS). It connects to messaging apps (WhatsApp, Telegram, Discord, Slack, Signal, iMessage) and uses AI models (Claude, GPT, or local models) to autonomously execute tasks on behalf of users.

### Name History
| Phase | Name | Period |
|-------|------|--------|
| Original | **Clawdbot** | Nov 2025 - Jan 27, 2026 |
| Interim | **Moltbot** | Jan 27-29, 2026 |
| Final | **OpenClaw** | Jan 30, 2026 - Present |

The renames occurred due to Anthropic's trademark request (Clawd sounded too similar to Claude). The "molt" metaphor references how lobsters shed their shells to grow.

## Findings

### 1. What is OpenClaw?

OpenClaw is an **autonomous AI agent framework** that:
- Runs entirely on your own infrastructure (not cloud-dependent)
- Connects to messaging platforms as the interface
- Uses LLMs (Claude, GPT, local models) as the AI "brain"
- Can execute real tasks: terminal commands, file operations, web browsing, email management
- Maintains persistent memory across sessions
- Operates proactively via "heartbeat" mechanism (cron-like background tasks)

**Key differentiator from ChatGPT/Claude**: OpenClaw is an *agent* that takes action, not just a chatbot that responds. It can work autonomously in the background.

### 2. Main Features and Capabilities

| Feature | Description |
|---------|-------------|
| **Multi-Channel Messaging** | WhatsApp, Telegram, Slack, Discord, Signal, iMessage, Teams, Google Chat, Twitch |
| **Voice Interaction** | Always-on speech support, "Talk Mode" on macOS/iOS |
| **Browser Control** | Dedicated Chrome/Chromium instances for web automation |
| **System Access** | Shell commands, file operations, read/write filesystem |
| **Persistent Memory** | Markdown files store long-term context across sessions |
| **Heartbeat System** | Proactive background tasks (cron jobs, monitoring, reminders) |
| **Skills System** | Plugin architecture via ClawHub registry for custom automations |
| **Model Agnostic** | Works with Claude, GPT, KIMI, MiMo, local models |

### 3. Technical Architecture

**Two-Core Architecture**:

1. **Gateway** (WebSocket Server)
   - Manages sessions, channels, authentication
   - Runs on port 18789 by default
   - Serves the Dashboard UI
   - Acts as the "control plane"

2. **Agent** (Node.js Application)
   - Executes AI model interactions
   - Handles tool execution (browser, terminal, filesystem)
   - Maintains persistent memory (stored as local Markdown files)
   - Runs continuously via daemon process

**Configuration Files Location**:
- State directory: `~/.openclaw/`
- Workspace: `~/.openclaw/workspace/`
- Config file: `~/.openclaw/openclaw.json`
- Memory files: `~/.openclaw/agents/<agentId>/sessions/`

### 4. AWS EC2 Deployment

**Quick Installation**:
```bash
# One-liner install
curl -fsSL https://openclaw.bot/install.sh | bash

# Run onboarding wizard
openclaw onboard --install-daemon
```

**AWS EC2/VPS Deployment Pattern**:

1. **Minimum Requirements**:
   - 1 vCPU, 1GB RAM (absolute minimum)
   - 2 vCPU, 4GB RAM recommended
   - Ubuntu 22.04/24.04 LTS preferred
   - 40GB SSD storage

2. **Recommended Setup**:
   ```bash
   # Provision EC2 instance (t3.small or larger)
   # SSH into instance
   
   # Install dependencies
   sudo apt update && sudo apt upgrade -y
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
   source ~/.bashrc
   nvm install 22
   nvm use 22
   
   # Install OpenClaw
   npm install -g openclaw@latest
   
   # Run onboarding
   openclaw onboard --non-interactive --accept-risk \
     --mode local \
     --gateway-port 18789 \
     --gateway-bind loopback \
     --install-daemon
   ```

3. **Security Best Practices**:
   - Keep Gateway on loopback (127.0.0.1), access via SSH tunnel or Tailscale
   - Use `gateway.auth.token` or `gateway.auth.password` if binding to LAN
   - Run in Docker container for isolation
   - Never expose port 18789 to public internet without authentication

4. **Cloud Provider Support**:
   - AWS EC2/Lightsail: Works well, use t3.small+ instances
   - DigitalOcean: One-click marketplace app available
   - Hetzner: Popular for EU data residency, cheaper than AWS
   - Railway/Northflank: One-click browser setup
   - Oracle Cloud: Always Free tier (ARM instances)
   - Fly.io, GCP, Azure: All supported

### 5. GitHub Repository

**Official Repository**: `https://github.com/openclaw/openclaw`

**Project Stats** (as of Jan 31, 2026):
- GitHub Stars: ~100,000+
- Forks: ~9,700
- Contributors: 200+
- Discord Members: 8,900+

**Additional Resources**:
- Official Website: `https://openclaw.ai`
- Documentation: `https://docs.openclaw.ai`
- Skills Registry: ClawHub (`clawhub.ai`)
- Creator: Peter Steinberger (@steipete)

### 6. Configuration Requirements

**Essential Configuration**:

```json
// ~/.openclaw/openclaw.json
{
  "gateway": {
    "port": 18789,
    "bind": "loopback",
    "auth": {
      "mode": "token",
      "token": "your-secure-token"
    },
    "trustedProxies": ["127.0.0.1"],
    "controlUi": {
      "enabled": true
    }
  },
  "agents": {
    "defaults": {
      "heartbeat": {
        "every": "30m",
        "target": "last"
      }
    }
  }
}
```

**Environment Variables**:
- `ANTHROPIC_API_KEY` - For Claude models
- `OPENAI_API_KEY` - For GPT models
- `GATEWAY_PORT` - Custom gateway port (default: 18789)

**Key Files in Workspace**:
- `SOUL.md` - Agent identity/personality document
- `USER.md` - Context about the user
- `AGENTS.md` - Operating instructions
- `HEARTBEAT.md` - Background task checklist
- `memory/*.md` - Long-term memory files
- `skills/` - Installed skills directory

### 7. Security Considerations

**Known Risks**:
- Prompt injection (industry-wide unsolved problem)
- Broad system access (shell, files, browser)
- Misconfiguration can expose sensitive data
- January 2026 Shodan incident: hundreds of exposed instances found

**Mitigations**:
- Run in Docker container for isolation
- Use Tailscale/SSH tunnel for remote access
- Never bind to public IP without authentication
- Regularly run `openclaw doctor` and security audits
- Keep updated (`openclaw update`)

## Sources & Citations

1. TechCrunch - "OpenClaw's AI assistants are now building their own social network" (Jan 30, 2026)
   - https://techcrunch.com/2026/01/30/openclaws-ai-assistants-are-now-building-their-own-social-network/

2. MacStories - "OpenClaw (Formerly Clawdbot) Showed Me What the Future of Personal AI Assistants Looks Like"
   - https://www.macstories.net/stories/clawdbot-showed-me-what-the-future-of-personal-ai-assistants-looks-like/

3. Wikipedia - OpenClaw
   - https://en.wikipedia.org/wiki/OpenClaw

4. EveryDev.AI - "The Rise, Fall, and Rebirth of Clawdbot in 72 Hours"
   - https://www.everydev.ai/p/the-rise-fall-and-rebirth-of-clawdbot-in-72-hours

5. OpenClaw Wiki - "What Is Openclaw? The Complete Guide"
   - https://openclawwiki.org/blog/what-is-openclaw

6. Official Documentation - VPS Hosting Guide
   - https://docs.openclaw.ai/vps

7. Pulumi Blog - "Deploy Clawdbot on AWS or Hetzner Securely"
   - https://www.pulumi.com/blog/deploy-openclaw-aws-hetzner/

8. DigitalOcean - "How to Run MoltBot with DigitalOcean's One-Click Deploy"
   - https://www.digitalocean.com/community/tutorials/how-to-run-openclaw

9. Fireship YouTube - "The wild rise of OpenClaw..." (Jan 30, 2026)
   - https://www.youtube.com/watch?v=ssYt09bCgUY

10. Official Lore Documentation
    - https://docs.openclaw.ai/start/lore

## Key Takeaways

- **OpenClaw is production-ready but requires technical expertise** - Not recommended for non-technical users due to security complexity
- **Model agnostic** - Works with Claude, GPT, and local models; not tied to any single AI provider
- **Self-hosted by design** - Your data stays on your infrastructure; no cloud dependency for the agent itself
- **Active community** - 100K+ GitHub stars, 200+ contributors, active Discord community
- **AWS deployment is straightforward** - Use EC2 t3.small+, Ubuntu 24.04, install via npm, configure Tailscale for secure access
- **Security is critical** - Always use authentication, never expose directly to internet, run in Docker when possible

## Related Searches

For follow-up research, consider:
- OpenClaw skills development and ClawHub ecosystem
- Tailscale integration for secure remote access
- Docker containerization best practices for OpenClaw
- OpenClaw vs other AI agent frameworks (AutoGPT, AgentGPT, etc.)
- Moltbook - the AI-only social network built on OpenClaw
