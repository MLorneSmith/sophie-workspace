# Context7 Research: OpenClaw, Moltbot, and Clawdbot

**Date**: 2026-01-31
**Agent**: context7-expert
**Libraries Researched**: openclaw/openclaw (108k stars), moltbot/moltbot (71k stars), clawdbot/clawdbot (1.7k stars)

## Query Summary

Searched Context7 for AI agent runner tools known as "OpenClaw", "Clawdbot", and "Moltbot". Found three related libraries that provide personal AI assistant platforms with multi-channel messaging support.

## Findings

### Relationship Between Libraries

These appear to be three variations/forks of the same core technology:
- **OpenClaw** (108k stars) - The most popular variant
- **Moltbot** (71k stars) - Second most popular, uses config path ~/.clawdbot/moltbot.json
- **Clawdbot** (1.7k stars) - Original/base project, config at ~/.clawdbot/clawdbot.json

All three share nearly identical architecture, CLI commands, and configuration formats.

---

## 1. What the Tool Does

OpenClaw/Moltbot/Clawdbot is a **personal AI assistant platform** that:

- Runs locally on your devices with a Gateway server as the control plane
- Connects to multiple messaging channels: WhatsApp, Telegram, Discord, Slack, Signal, iMessage, Google Chat, Microsoft Teams, Matrix
- Uses WebSocket-based architecture for real-time communication
- Supports multiple AI providers (Anthropic Claude, OpenAI, AWS Bedrock)
- Provides browser automation, cron job scheduling, and multi-agent routing
- Offers companion apps for macOS, iOS, and Android with voice wake and live canvas features

**Core Architecture:**

Gateway Server (WebSocket Control Plane)
- Channel Connections (WhatsApp, Telegram, Discord, etc.)
- Agent Runtime (Claude, GPT, Bedrock models)
- Session Management (persistent conversations)
- Browser Automation (CDP-based)
- Cron Scheduler (automated tasks)
- Node Integration (iOS/Android/macOS devices)

---

## 2. Installation and Setup

### Quick Install

```bash
# Via install script
curl -fsSL https://openclaw.bot/install.sh | bash

# Via npm/pnpm
npm install -g openclaw@latest
pnpm add -g openclaw@latest

# Windows (PowerShell)
iwr -useb https://openclaw.bot/install.ps1 | iex
```

### Interactive Onboarding

```bash
# Full onboarding with daemon installation
openclaw onboard --install-daemon

# Non-interactive with API key
openclaw onboard --non-interactive --accept-risk \
  --auth-choice api-key \
  --anthropic-api-key "sk-ant-..." \
  --model "anthropic/claude-sonnet-4-20250514"
```

The wizard configures:
- Model/auth (OAuth or API keys)
- Gateway settings
- Channel providers (WhatsApp QR, Telegram/Discord tokens)
- Pairing defaults for secure DMs
- Workspace bootstrap + skills

---

## 3. Configuration Options

### Main Configuration File

Located at ~/.openclaw/openclaw.json (or ~/.clawdbot/moltbot.json for Moltbot):

```json
{
  "agent": {
    "model": "anthropic/claude-opus-4-5",
    "timeoutSeconds": 300
  },
  "agents": {
    "defaults": {
      "workspace": "~/clawd",
      "model": "anthropic/claude-opus-4-5",
      "thinking": "medium",
      "timeout": 300,
      "sandbox": { "mode": "non-main" }
    },
    "list": [
      { "id": "main", "default": true },
      { "id": "work-agent", "workspace": "~/work-clawd", "model": "anthropic/claude-sonnet-4-20250514" }
    ]
  },
  "gateway": {
    "mode": "local",
    "port": 18789,
    "bind": "loopback",
    "auth": {
      "mode": "token",
      "token": "your-secure-token"
    },
    "tailscale": {
      "mode": "off"
    }
  },
  "channels": {
    "whatsapp": {
      "dmPolicy": "pairing",
      "allowFrom": ["+15551234567"],
      "groupPolicy": "allowlist",
      "groups": { "*": { "requireMention": true } }
    },
    "telegram": {
      "enabled": true,
      "botToken": "${TELEGRAM_BOT_TOKEN}"
    },
    "discord": {
      "enabled": true,
      "token": "${DISCORD_BOT_TOKEN}"
    }
  },
  "providers": {
    "anthropic": { "apiKey": "${ANTHROPIC_API_KEY}" },
    "openai": { "apiKey": "${OPENAI_API_KEY}" }
  },
  "tools": {
    "profile": "full",
    "browser": { "enabled": true },
    "web": {
      "search": { "enabled": true, "provider": "brave" },
      "fetch": { "enabled": true }
    }
  },
  "session": {
    "dmScope": "main",
    "idleMinutes": 120,
    "resetTriggers": ["/new", "/reset"]
  }
}
```

### Environment Variables

```bash
# API Keys
export ANTHROPIC_API_KEY="sk-ant-..."
export OPENAI_API_KEY="sk-..."
export TELEGRAM_BOT_TOKEN="123456:ABC..."
export DISCORD_BOT_TOKEN="..."
export SLACK_BOT_TOKEN="xoxb-..."

# Gateway configuration
export CLAWDBOT_GATEWAY_PORT="18789"
export CLAWDBOT_CONFIG_PATH="~/.clawdbot/moltbot.json"
export OPENCLAW_STATE_DIR="/data"
```

---

## 4. AWS EC2 Deployment

### IAM Role Setup for Bedrock Access

```bash
# 1. Create IAM role and instance profile
aws iam create-role --role-name EC2-Bedrock-Access \
  --assume-role-policy-document '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Principal": {"Service": "ec2.amazonaws.com"},
      "Action": "sts:AssumeRole"
    }]
  }'

aws iam attach-role-policy --role-name EC2-Bedrock-Access \
  --policy-arn arn:aws:iam::aws:policy/AmazonBedrockFullAccess

aws iam create-instance-profile --instance-profile-name EC2-Bedrock-Access
aws iam add-role-to-instance-profile \
  --instance-profile-name EC2-Bedrock-Access \
  --role-name EC2-Bedrock-Access

# 2. Attach to your EC2 instance
aws ec2 associate-iam-instance-profile \
  --instance-id i-xxxxx \
  --iam-instance-profile Name=EC2-Bedrock-Access
```

### EC2 Instance Configuration

```bash
# On the EC2 instance
# 1. Install OpenClaw
curl -fsSL https://openclaw.bot/install.sh | bash

# 2. Enable Bedrock discovery
openclaw config set models.bedrockDiscovery.enabled true
openclaw config set models.bedrockDiscovery.region us-east-1

# 3. Set AWS environment variables (workaround for credential detection)
echo 'export AWS_PROFILE=default' >> ~/.bashrc
echo 'export AWS_REGION=us-east-1' >> ~/.bashrc
source ~/.bashrc

# 4. Verify models are discovered
openclaw models list
```

### Bedrock Model Discovery Configuration

```json
{
  "models": {
    "bedrockDiscovery": {
      "enabled": true,
      "region": "us-east-1",
      "providerFilter": ["anthropic", "amazon"],
      "refreshInterval": 3600,
      "defaultContextWindow": 32000,
      "defaultMaxTokens": 4096
    }
  }
}
```

### Alternative: Fly.io Deployment

```bash
# Clone and create app
git clone https://github.com/openclaw/openclaw.git
cd openclaw
fly apps create my-openclaw

# Create persistent volume
fly volumes create openclaw_data --size 1 --region iad

# Deploy
fly deploy

# Access SSH console
fly ssh console
```

### Remote Access via Tailscale

```bash
# Install Tailscale on VPS
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up
```

### SSH Tunnel Access

```bash
# SSH config (~/.ssh/config)
Host remote-gateway
    HostName <REMOTE_IP>
    User <REMOTE_USER>
    LocalForward 18789 127.0.0.1:18789
    IdentityFile ~/.ssh/id_rsa

# Start tunnel
ssh -N remote-gateway &
```

---

## 5. API and CLI Usage

### CLI Commands

```bash
# Gateway management
openclaw gateway --port 18789 --verbose
openclaw gateway status
openclaw gateway install  # Install as background service

# Agent interactions
openclaw agent --message "Summarize my inbox" --thinking high
openclaw agent --message "Send reminder" --deliver --channel whatsapp --to "+15551234567"

# Message sending
openclaw message send --to "+15551234567" --message "Hello!"
openclaw message send --to "+15551234567" --message "Check this" --media /path/to/image.jpg

# Channel management
openclaw channels login          # WhatsApp QR scan
openclaw channels status
openclaw channels logout

# Pairing (secure DM access)
openclaw pairing list whatsapp
openclaw pairing approve whatsapp ABC123

# Browser automation
openclaw browser start
openclaw browser open https://example.com
openclaw browser snapshot         # AI-readable snapshot with refs
openclaw browser click 12         # Click element by ref
openclaw browser type 23 "text"

# Cron jobs
openclaw cron add --name "Morning status" --cron "0 7 * * *" \
  --message "Summarize inbox + calendar" --deliver

# Diagnostics
openclaw doctor
openclaw health
openclaw status --all
```

### WebSocket API

```javascript
// Connect to Gateway
const ws = new WebSocket("ws://127.0.0.1:18789");

ws.onopen = () => {
  // First frame must be connect request
  ws.send(JSON.stringify({
    type: "req",
    id: crypto.randomUUID(),
    method: "connect",
    params: {
      minProtocol: 3,
      maxProtocol: 3,
      role: "operator",
      scopes: ["operator.read", "operator.write"],
      auth: { token: "your-gateway-token" }
    }
  }));
};

// Send message
ws.send(JSON.stringify({
  type: "req",
  id: crypto.randomUUID(),
  method: "send",
  params: {
    to: "+15551234567",
    message: "Hello!",
    channel: "whatsapp"
  }
}));

// Run agent
ws.send(JSON.stringify({
  type: "req",
  id: crypto.randomUUID(),
  method: "agent",
  params: {
    message: "What is the weather?",
    sessionKey: "main",
    thinking: "medium",
    deliver: true
  }
}));
```

### HTTP API (OpenAI-Compatible)

```bash
# Chat completions endpoint
curl -sS http://127.0.0.1:18789/v1/chat/completions \
  -H 'Authorization: Bearer YOUR_GATEWAY_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "model": "openclaw",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'

# Webhook trigger
curl -X POST http://127.0.0.1:18789/hooks/agent \
  -H 'Authorization: Bearer YOUR_HOOKS_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "message": "Check my calendar",
    "sessionKey": "main",
    "deliver": true
  }'
```

---

## 6. Important Features and Limitations

### Key Features

1. **Multi-Channel Support**: WhatsApp, Telegram, Discord, Slack, Signal, iMessage, Google Chat, Microsoft Teams, Matrix
2. **Multi-Agent Routing**: Route different users/channels to specialized agents with isolated workspaces
3. **Browser Automation**: CDP-based browser control with AI-readable snapshots
4. **Cron Scheduling**: Automated tasks with timezone support
5. **Skills System**: Extensible via SKILL.md files in workspace
6. **Session Management**: Persistent conversations with automatic context compaction
7. **DM Pairing**: Secure access control for unknown senders
8. **Model Failover**: Automatic fallback across multiple providers
9. **Node Integration**: iOS/Android/macOS device integration for camera, location, etc.
10. **Voice Support**: Voice wake and Talk Mode on companion apps

### Security Features

- DM pairing codes for unknown senders (expires after 1 hour)
- Sandboxing for non-main sessions
- Token-based authentication for Gateway access
- Tailscale integration for secure remote access

### Limitations

1. **Single-User Design**: Primarily designed for personal use, not multi-tenant
2. **Local-First**: Gateway runs locally; remote access requires tunnels or Tailscale
3. **WhatsApp Linking**: Uses unofficial Baileys library (web protocol), may break
4. **Resource Usage**: Browser automation requires significant memory
5. **Platform Dependencies**: Some features (iMessage, system audio) require macOS

### In-Chat Commands

- /status - Show session status
- /new or /reset - Start fresh session
- /compact - Summarize older context
- /think high - Set thinking level (off|minimal|low|medium|high|xhigh)
- /tts on/off - Toggle voice responses

---

## Sources

- OpenClaw via Context7 (openclaw/openclaw) - 108k stars
- Moltbot via Context7 (moltbot/moltbot) - 71k stars
- Clawdbot via Context7 (clawdbot/clawdbot) - 1.7k stars
