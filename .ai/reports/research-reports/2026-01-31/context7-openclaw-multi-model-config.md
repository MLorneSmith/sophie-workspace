# Context7 Research: OpenClaw Multi-Model Configuration

**Date**: 2026-01-31
**Agent**: context7-expert
**Libraries Researched**: openclaw/openclaw (108,156 stars)

## Query Summary

Researched OpenClaw's multi-model configuration capabilities including:
- Model routing and configuration
- Multi-agent setup with different model backends
- Model fallback for rate limiting
- Task-based routing (planning vs execution)
- AWS Bedrock integration
- Configuration examples

## Findings

### 1. Model Routing Configuration

OpenClaw supports sophisticated model routing through the `agents.defaults.model` configuration:

**Basic Model Configuration:**
```json5
{
  agents: {
    defaults: {
      model: { primary: "anthropic/claude-opus-4-5" },
      models: {
        "anthropic/claude-opus-4-5": { alias: "opus" },
        "anthropic/claude-sonnet-4-5": { alias: "sonnet" },
        "anthropic/claude-haiku-4-5": { alias: "haiku" }
      }
    }
  }
}
```

**Key Features:**
- `model.primary` - Sets the default model for all agents
- `models` - Defines available models with aliases for quick switching
- Aliases enable `/model sonnet` slash commands for runtime switching
- Per-model parameters (temperature, maxTokens) can be configured

### 2. Multi-Agent Setup

OpenClaw supports running multiple isolated agents with different model backends:

**Multi-Agent with Different Models:**
```json5
{
  "agents": {
    "list": [
      {
        "id": "chat",
        "name": "Everyday",
        "workspace": "~/.openclaw/workspace-chat",
        "model": "anthropic/claude-sonnet-4-5"
      },
      {
        "id": "opus",
        "name": "Deep Work",
        "workspace": "~/.openclaw/workspace-opus",
        "model": "anthropic/claude-opus-4-5"
      }
    ]
  },
  "bindings": [
    { "agentId": "chat", "match": { "channel": "whatsapp" } },
    { "agentId": "opus", "match": { "channel": "telegram" } }
  ]
}
```

**Per-Agent Overrides:**
- `id` (string) - Required stable agent ID
- `model` (string | object) - Per-agent model override
  - String form: `"provider/model"` for primary only
  - Object form: `{ primary, fallbacks }` for full control
- `workspace` - Separate workspace per agent
- `sandbox` - Per-agent sandbox configuration
- `tools` - Per-agent tool restrictions

### 3. Model Fallback Configuration

Fallbacks are triggered sequentially when the primary model fails or is rate-limited:

**Fallback Configuration:**
```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-5": { alias: "opus" },
        "minimax/MiniMax-M2.1": { alias: "minimax" }
      },
      model: {
        primary: "anthropic/claude-opus-4-5",
        fallbacks: ["minimax/MiniMax-M2.1"]
      }
    }
  }
}
```

**Hybrid Local/Cloud Fallback:**
```json5
{
  "agents": {
    "defaults": {
      "model": {
        "primary": "anthropic/claude-sonnet-4-5",
        "fallbacks": ["lmstudio/minimax-m2.1-gs32", "anthropic/claude-opus-4-5"]
      }
    }
  },
  "models": {
    "mode": "merge",  // Keeps hosted models available when local unavailable
    "providers": {
      "lmstudio": {
        "baseUrl": "http://127.0.0.1:1234/v1",
        "apiKey": "lmstudio",
        "api": "openai-responses",
        "models": [...]
      }
    }
  }
}
```

**CLI Fallback Management:**
```bash
openclaw models fallbacks list
openclaw models fallbacks add <model_identifier>
openclaw models fallbacks remove <model_identifier>
```

### 4. Task-Based Routing (Planning vs Execution)

OpenClaw supports model tiering based on task complexity through OpenProse:

**Model Tiering Pattern:**
```prose
agent captain:
  model: sonnet  # Orchestration and coordination
  persist: true
  prompt: "You coordinate the team and review work"

agent researcher:
  model: opus  # Hard analytical work (reasoning)
  prompt: "You perform deep research and analysis"

agent formatter:
  model: haiku  # Simple transformation (cheap/fast)
  prompt: "You format text into consistent structure"

# Captain orchestrates, specialists do the hard work
session: captain
  prompt: "Plan the research approach"

let findings = session: researcher
  prompt: "Investigate the technical architecture"

resume: captain
  prompt: "Review findings and determine next steps"
  context: findings
```

**Model Override Per Session:**
```prose
agent analyst:
  model: haiku
  prompt: "You analyze data quickly"

# Quick initial analysis
session: analyst
  prompt: "Scan the data for obvious patterns"

# Override for detailed analysis
session: analyst
  model: opus  # Override haiku with opus for this task
  prompt: "Perform deep analysis on the patterns found"
```

**Subagent Model Configuration:**
```json5
{
  agents: {
    defaults: {
      model: {
        primary: "anthropic/claude-opus-4-5"  // Main agent
      },
      subagents: {
        model: "minimax/MiniMax-M2.1",  // Cheaper model for subagents
        maxConcurrent: 1,
        archiveAfterMinutes: 60
      }
    }
  }
}
```

### 5. AWS Bedrock Integration

**Automatic Model Discovery:**
```json5
{
  models: {
    bedrockDiscovery: {
      enabled: true,
      region: "us-east-1",
      providerFilter: ["anthropic", "amazon"],
      refreshInterval: 3600,
      defaultContextWindow: 32000,
      defaultMaxTokens: 4096
    }
  }
}
```

**Manual Bedrock Provider Configuration:**
```json5
{
  models: {
    providers: {
      "amazon-bedrock": {
        baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com",
        api: "bedrock-converse-stream",
        auth: "aws-sdk",
        models: [
          {
            id: "anthropic.claude-opus-4-5-20251101-v1:0",
            name: "Claude Opus 4.5 (Bedrock)",
            reasoning: true,
            input: ["text", "image"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 200000,
            maxTokens: 8192
          }
        ]
      }
    }
  },
  agents: {
    defaults: {
      model: { primary: "amazon-bedrock/anthropic.claude-opus-4-5-20251101-v1:0" }
    }
  }
}
```

**EC2 Instance Role Setup:**
```bash
# Create IAM role
aws iam create-role --role-name EC2-Bedrock-Access \
  --assume-role-policy-document '{...}'

aws iam attach-role-policy --role-name EC2-Bedrock-Access \
  --policy-arn arn:aws:iam::aws:policy/AmazonBedrockFullAccess

# Attach to EC2 instance
aws ec2 associate-iam-instance-profile \
  --instance-id i-xxxxx \
  --iam-instance-profile Name=EC2-Bedrock-Access

# Enable discovery on EC2
openclaw config set models.bedrockDiscovery.enabled true
openclaw config set models.bedrockDiscovery.region us-east-1

# Workaround for IMDS credential detection
export AWS_PROFILE=default
export AWS_REGION=us-east-1
```

### 6. Configuration Examples

**Complete Multi-Model Setup with Fallbacks and Aliases:**
```json5
{
  env: { 
    ANTHROPIC_API_KEY: "sk-...",
    MINIMAX_API_KEY: "sk-...",
    OPENROUTER_API_KEY: "sk-or-..." 
  },
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-5": { alias: "Opus" },
        "anthropic/claude-sonnet-4-1": { alias: "Sonnet" },
        "openrouter/deepseek/deepseek-r1:free": {},
        "zai/glm-4.7": {
          alias: "GLM",
          params: {
            thinking: {
              type: "enabled",
              clear_thinking: false
            }
          }
        }
      },
      model: {
        primary: "anthropic/claude-opus-4-5",
        fallbacks: [
          "openrouter/deepseek/deepseek-r1:free",
          "openrouter/meta-llama/llama-3.3-70b-instruct:free"
        ]
      },
      imageModel: {
        primary: "openrouter/qwen/qwen-2.5-vl-72b-instruct:free",
        fallbacks: [
          "openrouter/google/gemini-2.0-flash-vision:free"
        ]
      },
      thinkingDefault: "low",
      timeoutSeconds: 600,
      maxConcurrent: 3,
      subagents: {
        model: "minimax/MiniMax-M2.1",
        maxConcurrent: 1,
        archiveAfterMinutes: 60
      },
      contextTokens: 200000
    }
  }
}
```

**Custom/Local Model Provider:**
```json5
{
  "models": {
    "mode": "merge",
    "providers": {
      "custom-proxy": {
        "baseUrl": "http://localhost:4000/v1",
        "apiKey": "LITELLM_KEY",
        "api": "openai-responses",
        "authHeader": true,
        "headers": { "X-Proxy-Region": "us-west" },
        "models": [
          {
            "id": "llama-3.1-8b",
            "name": "Llama 3.1 8B",
            "api": "openai-responses",
            "reasoning": false,
            "input": ["text"],
            "cost": { "input": 0, "output": 0, "cacheRead": 0, "cacheWrite": 0 },
            "contextWindow": 128000,
            "maxTokens": 32000
          }
        ]
      }
    }
  }
}
```

**OAuth with API Key Failover:**
```json5
{
  "auth": {
    "profiles": {
      "anthropic:subscription": {
        "provider": "anthropic",
        "mode": "oauth",
        "email": "me@example.com"
      },
      "anthropic:api": {
        "provider": "anthropic",
        "mode": "api_key"
      }
    },
    "order": {
      "anthropic": ["anthropic:subscription", "anthropic:api"]
    }
  },
  "agent": {
    "workspace": "~/.openclaw/workspace",
    "model": {
      "primary": "anthropic/claude-sonnet-4-5",
      "fallbacks": ["anthropic/claude-opus-4-5"]
    }
  }
}
```

## Key Takeaways

1. **Model Routing**: Use `agents.defaults.model.primary` for default model, `models` map for aliases
2. **Multi-Agent**: Define agents in `agents.list[]` with per-agent model overrides
3. **Fallbacks**: Configure `model.fallbacks` array for automatic failover on rate limits/errors
4. **Task-Based Routing**: Use OpenProse for model tiering (Opus for reasoning, Sonnet for orchestration, Haiku for simple tasks)
5. **Subagents**: Configure separate model for subagents via `subagents.model` to reduce costs
6. **Bedrock**: Use `bedrockDiscovery` for auto-discovery or manually configure provider
7. **Custom Providers**: Support for local models (LM Studio, Ollama) and proxies (LiteLLM)

## Best Practices

1. **Use aliases** for quick model switching via `/model <alias>`
2. **Configure fallbacks** to handle rate limiting gracefully
3. **Use cheaper models for subagents** (e.g., Haiku or MiniMax)
4. **Tier models by task complexity**: Opus for reasoning, Sonnet for general, Haiku for simple
5. **Use `models.mode: "merge"`** when combining local and hosted providers
6. **Set per-model parameters** (temperature, maxTokens) for fine-tuned behavior
7. **Check model status**: `openclaw models status --probe` verifies auth and availability

## Sources

- OpenClaw via Context7 (openclaw/openclaw)
- Documentation sections: models.md, multi-agent.md, configuration.md, bedrock.md, local-models.md, configuration-examples.md
