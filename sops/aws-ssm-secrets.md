# SOP: Secrets Management — AWS SSM + OpenClaw External Secrets

## Overview

Secrets are stored in AWS Systems Manager (SSM) Parameter Store and resolved at runtime by OpenClaw's External Secrets Management feature (v2026.2.26+). No plaintext secrets are stored in config files — all credential fields use SecretRef objects that resolve from environment variables.

## Architecture

```
┌──────────────────────────────────────────────────────┐
│               AWS SSM Parameter Store                 │
│                                                       │
│  /openclaw/*            54 params   Env var secrets   │
│  /openclaw/config/*      9 params   Config tokens     │
│                                                       │
│  Total: 63 params (SecureString, default KMS key)     │
└───────────────────┬──────────────────────────────────┘
                    │ fetched on startup
                    ▼
┌──────────────────────────────────────────────────────┐
│       fetch-secrets-env.sh (ExecStartPre)             │
│                                                       │
│  1. Fetch /openclaw/* → write as KEY=VALUE             │
│  2. Fetch /openclaw/config/* → write as OC_CONFIG_*   │
│  3. Output: ~/.openclaw/.secrets.env (mode 0600)      │
└───────────────────┬──────────────────────────────────┘
                    │ loaded via EnvironmentFile=
                    ▼
┌──────────────────────────────────────────────────────┐
│            openclaw-gateway (systemd)                  │
│                                                       │
│  Env vars available in process environment             │
│  openclaw.json SecretRefs resolve from env vars        │
│  auth-profiles.json tokenRef/keyRef resolve from env   │
│  In-memory snapshot: atomic swap, fail-fast on start   │
└──────────────────────────────────────────────────────┘
```

## How It Works

### 1. SSM → Environment File

On every gateway start, `ExecStartPre` runs `~/.openclaw/fetch-secrets-env.sh`:
- Fetches all `/openclaw/*` params → writes as `KEY=VALUE` lines
- Fetches all `/openclaw/config/*` params → writes as `OC_CONFIG_KEY=VALUE` lines
- Output file: `~/.openclaw/.secrets.env` (permissions `0600`)

### 2. Systemd Loads Environment

The gateway systemd unit has:
```ini
ExecStartPre=/home/ubuntu/.openclaw/fetch-secrets-env.sh
EnvironmentFile=/home/ubuntu/.openclaw/.secrets.env
```

All env vars are available to the gateway process before it starts.

### 3. OpenClaw Resolves SecretRefs

In `openclaw.json`, credential fields use SecretRef objects instead of plaintext:
```json
{
  "secrets": {
    "providers": {
      "default": { "source": "env" }
    }
  },
  "models": {
    "providers": {
      "zai": {
        "apiKey": { "source": "env", "provider": "default", "id": "ZAI_API_KEY" }
      }
    }
  }
}
```

In `auth-profiles.json`, API key and token profiles use `keyRef`/`tokenRef`:
```json
{
  "anthropic:manual": {
    "type": "token",
    "provider": "anthropic",
    "tokenRef": { "source": "env", "provider": "default", "id": "OC_CONFIG_ANTHROPIC_SETUP_TOKEN" }
  }
}
```

OpenClaw resolves all refs eagerly at startup into an in-memory snapshot. If any required ref fails to resolve, the gateway refuses to start (fail-fast).

## Two SSM Namespaces

### `/openclaw/*` — Environment Variables (54 params)

Exported as env vars. The key name = env var name (minus the `/openclaw/` prefix).

**Examples:**
| SSM Path | Env Var | Purpose |
|----------|---------|---------|
| `/openclaw/BRAVE_API_KEY` | `BRAVE_API_KEY` | Web search |
| `/openclaw/DISCORD_BOT_TOKEN` | `DISCORD_BOT_TOKEN` | Discord channel |
| `/openclaw/ZAI_API_KEY` | `ZAI_API_KEY` | ZAI/GLM model provider |
| `/openclaw/OPENROUTER_API_KEY` | `OPENROUTER_API_KEY` | OpenRouter model provider |
| `/openclaw/CCPROXY_API_KEY` | `CCPROXY_API_KEY` | ccproxy model provider |
| `/openclaw/OPENAI_API_KEY` | `OPENAI_API_KEY` | OpenAI API |
| `/openclaw/NOTION_TOKEN` | `NOTION_TOKEN` | Notion API |

### `/openclaw/config/*` — Config Tokens (9 params)

Prefixed with `OC_CONFIG_` in the env file and referenced by SecretRefs or used by the `start-gateway.sh` legacy script.

| SSM Path | Env Var | Used By |
|----------|---------|---------|
| `/openclaw/config/ANTHROPIC_SETUP_TOKEN` | `OC_CONFIG_ANTHROPIC_SETUP_TOKEN` | `auth-profiles.json` tokenRef |
| `/openclaw/config/ZAI_API_KEY` | `OC_CONFIG_ZAI_API_KEY` | Legacy (config namespace copy) |
| `/openclaw/config/DISCORD_TOKEN` | `OC_CONFIG_DISCORD_TOKEN` | `start-gateway.sh` → `openclaw.json` |
| `/openclaw/config/GATEWAY_AUTH_TOKEN` | `OC_CONFIG_GATEWAY_AUTH_TOKEN` | `start-gateway.sh` → `openclaw.json` |
| `/openclaw/config/HOOKS_TOKEN` | `OC_CONFIG_HOOKS_TOKEN` | `start-gateway.sh` → `openclaw.json` |
| `/openclaw/config/GMAIL_PUSH_TOKEN` | `OC_CONFIG_GMAIL_PUSH_TOKEN` | `start-gateway.sh` → `openclaw.json` |
| `/openclaw/config/TELEGRAM_BOT_TOKEN` | `OC_CONFIG_TELEGRAM_BOT_TOKEN` | `start-gateway.sh` → `openclaw.json` |
| `/openclaw/config/OPENAI_CODEX_ACCESS_TOKEN` | `OC_CONFIG_OPENAI_CODEX_ACCESS_TOKEN` | `start-gateway.sh` → `auth-profiles.json` |
| `/openclaw/config/OPENAI_CODEX_REFRESH_TOKEN` | `OC_CONFIG_OPENAI_CODEX_REFRESH_TOKEN` | `start-gateway.sh` → `auth-profiles.json` |

## SecretRef Mappings

### openclaw.json — Model Provider API Keys

| Provider | SecretRef `id` | SSM Source |
|----------|---------------|------------|
| `ccproxy` | `CCPROXY_API_KEY` | `/openclaw/CCPROXY_API_KEY` |
| `zai` | `ZAI_API_KEY` | `/openclaw/ZAI_API_KEY` |
| `openrouter` | `OPENROUTER_API_KEY` | `/openclaw/OPENROUTER_API_KEY` |

### auth-profiles.json — Provider Credentials (per-agent)

| Profile | Ref Type | SecretRef `id` | SSM Source |
|---------|----------|---------------|------------|
| `anthropic:manual` | `tokenRef` | `OC_CONFIG_ANTHROPIC_SETUP_TOKEN` | `/openclaw/config/ANTHROPIC_SETUP_TOKEN` |
| `zai:default` | (scrubbed) | — | Resolved via `models.providers.zai.apiKey` |
| `ccproxy:default` | (scrubbed) | — | Resolved via `models.providers.ccproxy.apiKey` |
| `openrouter:default` | (scrubbed) | — | Resolved via `models.providers.openrouter.apiKey` |
| `openai-ccproxy:default` (devops only) | `keyRef` | `CCPROXY_API_KEY` | `/openclaw/CCPROXY_API_KEY` |
| `openai-codex:default` | — | — | OAuth (out of scope for SecretRef) |

**Note:** The main agent's `auth-profiles.json` gets re-written by the gateway at runtime with resolved plaintext values. This is expected behavior — the gateway persists last-known-good credentials for resilience. The other 4 agents retain their scrubbed/ref-only state.

## Common Operations

### Rotate a Secret

```bash
# 1. Update the value in SSM
aws --profile openclaw ssm put-parameter \
  --name "/openclaw/ZAI_API_KEY" \
  --value "new-key-value" \
  --type SecureString \
  --overwrite

# 2. Restart gateway to pick up the new value
systemctl --user restart openclaw-gateway
```

### Add a New Secret

```bash
# 1. Create the SSM parameter
aws --profile openclaw ssm put-parameter \
  --name "/openclaw/MY_NEW_SECRET" \
  --value "secret-value" \
  --type SecureString

# 2. Restart gateway (env file is regenerated on every start)
systemctl --user restart openclaw-gateway
```

The new env var is automatically available to the gateway process. If you need OpenClaw to resolve it as a SecretRef, add a ref to `openclaw.json` or `auth-profiles.json`.

### Read a Secret (for debugging)

```bash
aws --profile openclaw ssm get-parameter \
  --name "/openclaw/MY_SECRET" \
  --with-decryption \
  --query 'Parameter.Value' \
  --output text
```

### List All Secrets

```bash
# Env vars
aws --profile openclaw ssm get-parameters-by-path \
  --path "/openclaw/" --no-recursive \
  --query 'Parameters[].Name' \
  --output text | tr '\t' '\n' | sort

# Config tokens
aws --profile openclaw ssm get-parameters-by-path \
  --path "/openclaw/config/" \
  --query 'Parameters[].Name' \
  --output text | tr '\t' '\n' | sort
```

### Delete a Secret

```bash
aws --profile openclaw ssm delete-parameter \
  --name "/openclaw/OLD_SECRET"
```

### Run a Secrets Audit

```bash
# Load env vars first (audit resolves refs in the current shell)
set -a && source ~/.openclaw/.secrets.env && set +a

# Human-readable report
openclaw secrets audit

# CI-friendly (exit code 1 on plaintext findings, 2 on unresolved refs)
openclaw secrets audit --check

# Machine-readable
openclaw secrets audit --json
```

### Hot-Reload Secrets (Without Full Restart)

```bash
# 1. Regenerate the env file
~/.openclaw/fetch-secrets-env.sh

# 2. Tell the running gateway to re-resolve refs
openclaw secrets reload
```

**Note:** Hot-reload re-resolves refs from the gateway's current process environment. Since the env file was loaded at startup, you need a full `systemctl --user restart openclaw-gateway` to pick up new SSM values. Hot-reload is useful when env vars are updated via other means (e.g., `export` into the process).

## Files

| File | Purpose |
|------|---------|
| `~/.openclaw/fetch-secrets-env.sh` | SSM fetch script — runs as ExecStartPre |
| `~/.openclaw/.secrets.env` | Auto-generated env file (mode 0600, regenerated every restart) |
| `~/.openclaw/openclaw.json` | Gateway config — contains `secrets.providers` and SecretRef `apiKey` fields |
| `~/.openclaw/agents/*/agent/auth-profiles.json` | Per-agent auth — `tokenRef`/`keyRef` fields |
| `~/.config/systemd/user/openclaw-gateway.service` | Systemd unit — ExecStartPre + EnvironmentFile |
| `~/.openclaw/start-gateway.sh` | Legacy startup wrapper (still patches inline tokens via jq) |

## IAM Permissions

The EC2 instance role (`openclaw-ec2-role`) needs:
- `ssm:GetParametersByPath` on `/openclaw/*`
- `ssm:GetParameter` on `/openclaw/*`
- `ssm:PutParameter` on `/openclaw/*` (for adding/rotating secrets)
- `ssm:DeleteParameter` on `/openclaw/*` (optional)

`ssm:DescribeParameters` is NOT granted (by design — prevents listing param names without values).

## Security Notes

- All SSM params are `SecureString` (encrypted at rest with default `aws/ssm` KMS key)
- `.secrets.env` is mode `0600` and regenerated on every restart
- The legacy `.env` file (`~/.openclaw/.env`) still exists but has had secret values scrubbed; it should not be the source of truth
- Resolved secrets live only in the gateway's process memory (in-memory snapshot)
- Never log secret values; use `--with-decryption` only when needed
- Gateway fails fast on startup if any required SecretRef cannot be resolved
- On reload failure, the gateway keeps the last-known-good snapshot (no downtime)

## Troubleshooting

**Gateway fails to start with "Environment variable X is missing or empty":**
- The SSM fetch likely failed. Check: `systemctl --user status openclaw-gateway` for ExecStartPre output
- Verify the SSM param exists: `aws --profile openclaw ssm get-parameter --name "/openclaw/X" --with-decryption`
- Check IAM permissions: `aws --profile openclaw sts get-caller-identity`

**Audit shows "unresolved refs" but gateway is running fine:**
- The audit CLI runs in your shell, not the gateway. Load env vars first: `set -a && source ~/.openclaw/.secrets.env && set +a`

**Main agent auth-profiles.json has plaintext after restart:**
- Expected. The gateway re-persists resolved values to the main agent's auth-profiles for resilience. The other 4 agents retain ref-only state.

**Secrets changed in SSM but gateway still uses old values:**
- Restart the gateway: `systemctl --user restart openclaw-gateway`
- The env file is regenerated on every restart via ExecStartPre

## History

- **2025:** Initial SSM Parameter Store setup with `start-gateway.sh` jq-patching workflow.
- **2026-02-27:** Migrated to OpenClaw External Secrets Management (v2026.2.26). Added `fetch-secrets-env.sh`, systemd `EnvironmentFile`, and SecretRef mappings. Plaintext scrubbed from all config and auth-profile files. Created 2 new SSM params (`CCPROXY_API_KEY`, `OPENROUTER_API_KEY`).
