# SOP: AWS SSM Parameter Store — Secrets Management

## Overview

All secrets are centralized in AWS Systems Manager (SSM) Parameter Store. The `.env` file is **not used at runtime** — the gateway startup wrapper (`~/.openclaw/start-gateway.sh`) fetches everything from SSM on boot.

## Architecture

```
┌─────────────────────────────────────────────────┐
│                AWS SSM Parameter Store            │
│                                                   │
│  /openclaw/*           44 params   Env var secrets │
│  /openclaw/config/*     9 params   JSON config     │
│                                                   │
│  Total: 53 params (SecureString, KMS-encrypted)   │
└────────────────────┬────────────────────────────┘
                     │ fetched on startup
                     ▼
┌─────────────────────────────────────────────────┐
│          start-gateway.sh (wrapper)              │
│                                                   │
│  1. Fetch /openclaw/* → export as env vars        │
│  2. Fetch /openclaw/config/* → patch JSON files   │
│  3. Patch openclaw.json (hooks, channels, auth)   │
│  4. Patch auth-profiles.json (provider tokens)    │
│  5. exec openclaw gateway                         │
└─────────────────────────────────────────────────┘
```

## Two SSM Namespaces

### `/openclaw/*` — Environment Variables (44 params)

These are exported as env vars before the gateway starts. The key name = env var name (minus the `/openclaw/` prefix).

**Examples:**
| SSM Path | Env Var | Purpose |
|----------|---------|---------|
| `/openclaw/BRAVE_API_KEY` | `BRAVE_API_KEY` | Web search |
| `/openclaw/DISCORD_BOT_TOKEN` | `DISCORD_BOT_TOKEN` | Discord channel |
| `/openclaw/GCP_PROJECT_ID` | `GCP_PROJECT_ID` | BigQuery |
| `/openclaw/TODOIST_API_TOKEN` | `TODOIST_API_TOKEN` | Task sync |
| `/openclaw/NOTION_TOKEN` | `NOTION_TOKEN` | Notion API |
| `/openclaw/SUPABASE_DB_URL` | `SUPABASE_DB_URL` | Product DB |

### `/openclaw/config/*` — JSON Config Tokens (9 params)

These are patched into `openclaw.json` and `auth-profiles.json` at startup via `jq`.

| SSM Path | Patched Into | Field |
|----------|-------------|-------|
| `/openclaw/config/HOOKS_TOKEN` | `openclaw.json` | `.hooks.token` |
| `/openclaw/config/GMAIL_PUSH_TOKEN` | `openclaw.json` | `.hooks.gmail.pushToken` |
| `/openclaw/config/TELEGRAM_BOT_TOKEN` | `openclaw.json` | `.channels.telegram.botToken` |
| `/openclaw/config/DISCORD_TOKEN` | `openclaw.json` | `.channels.discord.token` |
| `/openclaw/config/GATEWAY_AUTH_TOKEN` | `openclaw.json` | `.gateway.auth.token` |
| `/openclaw/config/ANTHROPIC_SETUP_TOKEN` | `auth-profiles.json` | `.profiles["anthropic:manual"].token` |
| `/openclaw/config/ZAI_API_KEY` | `auth-profiles.json` | `.profiles["zai:default"].key` |
| `/openclaw/config/OPENAI_CODEX_ACCESS_TOKEN` | `auth-profiles.json` | `.profiles["openai-codex:default"].access` |
| `/openclaw/config/OPENAI_CODEX_REFRESH_TOKEN` | `auth-profiles.json` | `.profiles["openai-codex:default"].refresh` |

## Common Operations

### Add a New Secret (Env Var)

```bash
aws --profile openclaw ssm put-parameter \
  --name "/openclaw/MY_NEW_SECRET" \
  --value "secret-value-here" \
  --type SecureString \
  --overwrite
```

Then restart the gateway to pick it up:
```bash
systemctl --user restart openclaw-gateway
```

### Add a New Config Token

```bash
aws --profile openclaw ssm put-parameter \
  --name "/openclaw/config/MY_CONFIG_TOKEN" \
  --value "token-value" \
  --type SecureString \
  --overwrite
```

**Important:** You must also update `start-gateway.sh` to patch this new token into the correct JSON file. Otherwise it's stored but unused.

### Update an Existing Secret

```bash
aws --profile openclaw ssm put-parameter \
  --name "/openclaw/EXISTING_KEY" \
  --value "new-value" \
  --type SecureString \
  --overwrite
```

Restart gateway to apply.

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
  --path "/openclaw/" \
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

## When to Add to Which Namespace

| Scenario | Namespace | Why |
|----------|-----------|-----|
| New API key for a tool/service | `/openclaw/KEY_NAME` | Exported as env var, scripts/tools read it directly |
| New SaaS password (e.g., Google, Bitwarden) | `/openclaw/KEY_NAME` | Same — available as env var |
| Token that goes into `openclaw.json` | `/openclaw/config/TOKEN_NAME` | Must be patched into JSON; also update `start-gateway.sh` |
| Token for a model provider auth profile | `/openclaw/config/TOKEN_NAME` | Patched into `auth-profiles.json` |

**Rule of thumb:** If the gateway reads it from a JSON config file → `/openclaw/config/`. If it's read from the environment → `/openclaw/`.

## Files Involved

| File | Purpose |
|------|---------|
| `~/.openclaw/start-gateway.sh` | Startup wrapper — fetches SSM, patches configs, starts gateway |
| `~/.openclaw/openclaw.json` | Main gateway config (patched at startup) |
| `~/.openclaw/agents/main/agent/auth-profiles.json` | Model provider auth (patched at startup) |
| `~/.config/systemd/user/openclaw-gateway.service` | systemd unit — calls `start-gateway.sh` |

## IAM Permissions

The EC2 instance role (`openclaw-ec2-role`) needs:
- `ssm:GetParametersByPath` on `/openclaw/*`
- `ssm:GetParameter` on `/openclaw/*`
- `ssm:PutParameter` on `/openclaw/*` (for Sophie to add secrets)
- `ssm:DeleteParameter` on `/openclaw/*` (optional)

**Note:** `ssm:DescribeParameters` is NOT granted (by design — prevents listing all param names without values).

## Security Notes

- All params are `SecureString` (KMS-encrypted at rest)
- `.env` file (`~/.clawdbot/.env`) exists as a **local convenience copy** for scripts that source it directly — it is NOT the source of truth
- Never log secret values; use `--with-decryption` only when needed
- The startup wrapper runs as the `ubuntu` user via systemd user service
- JSON config files are patched in-place at startup (not persisted back to SSM)

## Keeping .env in Sync (Optional)

Some scripts (`gog`, `bw`, custom scripts) source `~/.clawdbot/.env` directly instead of relying on env vars from the gateway process. When adding a new secret to SSM, also add it to `.env` if any script reads it outside the gateway process.

Long-term goal: migrate all scripts to read env vars from the gateway process or SSM directly, eliminating `.env` as a dependency.
