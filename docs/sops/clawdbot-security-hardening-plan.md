# Clawdbot Security Hardening Plan

**Generated:** 2026-01-30
**Instance:** AWS EC2 (Ubuntu)
**Application:** Clawdbot (moltbot)

---

## Current Security Assessment

### What's Already Good
- Gateway bound to loopback (127.0.0.1:18789) - not publicly exposed
- Gateway token authentication enabled
- WhatsApp dmPolicy set to "allowlist" with specific numbers
- Main config file has correct permissions (600)
- Clawdbot runs as `ubuntu` user (not root)
- `unattended-upgrades` package installed

### Critical Issues Found
| Issue | Risk | Status |
|-------|------|--------|
| Discord groupPolicy is "open" | Prompt injection | ✅ FIXED |
| Discord token in plaintext config | Credential exposure | ✅ FIXED |
| Credentials directory has 775 perms | Unauthorized access | ✅ FIXED |
| UFW firewall inactive | Network exposure | ✅ FIXED |

### High Priority Issues
| Issue | Risk | Status |
|-------|------|--------|
| fail2ban not installed | Brute force attacks | ✅ FIXED |
| No agent sandboxing | Command execution | ✅ FIXED |
| Tailscale not installed | Network isolation | ✅ FIXED |
| SSH not fully hardened | Unauthorized access | ✅ FIXED |

### Medium Priority (Remaining)
| Issue | Risk | Status |
|-------|------|--------|
| Lynis not installed | No security auditing | ✅ FIXED |
| AWS Security Groups review needed | Network exposure | ✅ FIXED |
| GuardDuty not enabled | No threat detection | ✅ FIXED |
| Gateway token in plaintext | Credential exposure | ✅ FIXED |

---

## Prioritized Remediation Plan

### Phase 1: Immediate (Do Today) - Critical Security Fixes

#### 1.1 Fix Discord Group Policy
**Risk:** Open group policy allows anyone in Discord servers to interact with the bot. Combined with elevated tools, this creates prompt injection risk.

```bash
# Edit clawdbot.json - change discord.groupPolicy from "open" to "allowlist"
# Add specific guild/channel allowlists
```

**Config change:**
```json
"discord": {
  "groupPolicy": "allowlist",
  "guilds": {
    "1466532593754312896": {
      "allow": true,
      ...
    }
  }
}
```

#### 1.2 Fix Credentials Directory Permissions
**Risk:** 775 permissions allow other users to read/modify credentials.

```bash
chmod 700 ~/.clawdbot/credentials
chmod 700 ~/.clawdbot/credentials/whatsapp
chmod 700 ~/.clawdbot/credentials/whatsapp/default
chmod 600 ~/.clawdbot/credentials/whatsapp/default/*
```

#### 1.3 Move Discord Token to Environment Variable
**Risk:** Token in config file can be exposed if config is accidentally shared or leaked.

```bash
# 1. Create secure env file
echo 'DISCORD_BOT_TOKEN="your-token-here"' > ~/.clawdbot/.env
chmod 600 ~/.clawdbot/.env

# 2. Update clawdbot.json to use env reference:
# "token": "${DISCORD_BOT_TOKEN}"

# 3. Ensure clawdbot service loads the env file
```

#### 1.4 Enable UFW Firewall
**Risk:** Without host firewall, relying solely on AWS Security Groups.

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw enable
```

---

### Phase 2: High Priority (This Week)

#### 2.1 Install and Configure fail2ban
**Purpose:** Protect against SSH brute force attacks.

```bash
sudo apt update && sudo apt install fail2ban -y
sudo systemctl enable fail2ban
sudo systemctl start fail2ban

# Create custom config
sudo tee /etc/fail2ban/jail.local << 'EOF'
[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log
maxretry = 3
bantime = 3600
findtime = 600
EOF

sudo systemctl restart fail2ban
```

#### 2.2 Enable Agent Sandboxing
**Purpose:** Limit damage if agent is compromised via prompt injection.

Add to `clawdbot.json`:
```json
"agents": {
  "defaults": {
    "sandbox": {
      "mode": "all",
      "scope": "agent",
      "workspaceAccess": "ro"
    }
  }
}
```

#### 2.3 Harden SSH Configuration
**Purpose:** Reduce SSH attack surface.

```bash
sudo tee -a /etc/ssh/sshd_config.d/hardening.conf << 'EOF'
PasswordAuthentication no
PermitRootLogin no
X11Forwarding no
MaxAuthTries 3
ClientAliveInterval 300
ClientAliveCountMax 2
EOF

sudo systemctl restart sshd
```

#### 2.4 Install Tailscale (Recommended)
**Purpose:** Zero-trust network access, eliminate public SSH exposure.

```bash
# Install Tailscale
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up

# After connected, update UFW to only allow SSH from Tailscale
sudo ufw delete allow ssh
sudo ufw allow in on tailscale0 to any port 22

# Optional: Use Tailscale SSH (eliminates key management)
sudo tailscale up --ssh
```

---

### Phase 3: Medium Priority (This Month)

#### 3.1 Restrict High-Risk Tools
**Purpose:** Limit dangerous capabilities.

Add to `clawdbot.json`:
```json
"tools": {
  "deny": ["exec", "browser", "web_fetch"],
  "elevated": {
    "allowlist": ["specific-trusted-agent-ids"]
  }
}
```

#### 3.2 Fix Remaining Directory Permissions

```bash
chmod 700 ~/.clawdbot/browser
chmod 700 ~/.clawdbot/cron
chmod 700 ~/.clawdbot/devices
chmod 700 ~/.clawdbot/identity
chmod 700 ~/.clawdbot/media
chmod 600 ~/.clawdbot/update-check.json
```

#### 3.3 Install Lynis for Security Auditing

```bash
sudo apt install lynis -y

# Run initial audit
sudo lynis audit system

# Schedule monthly audit (add to crontab)
echo "0 3 1 * * root /usr/sbin/lynis audit system --cronjob" | sudo tee /etc/cron.d/lynis-audit
```

#### 3.4 Configure CloudWatch Monitoring (AWS)

```bash
# Install CloudWatch agent
wget https://s3.amazonaws.com/amazoncloudwatch-agent/ubuntu/amd64/latest/amazon-cloudwatch-agent.deb
sudo dpkg -i amazon-cloudwatch-agent.deb

# Configure to monitor auth failures, disk usage, etc.
```

---

### Phase 4: Ongoing Maintenance

#### 4.1 Regular Security Tasks

| Task | Frequency | Command |
|------|-----------|---------|
| Run Clawdbot security audit | Weekly | `clawdbot security audit --deep` |
| Check for package updates | Weekly | `apt update && apt list --upgradable` |
| Review auth logs | Weekly | `sudo journalctl -u sshd --since "1 week ago"` |
| Run Lynis audit | Monthly | `sudo lynis audit system` |
| Rotate gateway token | Quarterly | `clawdbot doctor --generate-gateway-token` |
| Review Discord token | Quarterly | Regenerate in Discord Developer Portal |

#### 4.2 AWS-Level Recommendations

1. **Enable GuardDuty** - Threat detection for AWS account
2. **Enable Amazon Inspector** - Vulnerability scanning for EC2
3. **Review Security Groups** - Ensure only necessary ports exposed
4. **Enable EBS Encryption** - Protect data at rest
5. **Enable CloudTrail** - Audit trail for AWS API calls
6. **Use dedicated AWS account/OU** - Isolate from production workloads

---

## Quick Reference: Secure Baseline Config

Save this as the target state for `clawdbot.json`:

```json
{
  "gateway": {
    "mode": "local",
    "bind": "loopback",
    "port": 18789,
    "auth": {
      "mode": "token",
      "token": "${GATEWAY_TOKEN}"
    }
  },
  "channels": {
    "whatsapp": {
      "dmPolicy": "allowlist",
      "allowFrom": ["+your-number"],
      "groupPolicy": "allowlist"
    },
    "discord": {
      "groupPolicy": "allowlist",
      "token": "${DISCORD_BOT_TOKEN}"
    }
  },
  "agents": {
    "defaults": {
      "sandbox": {
        "mode": "all",
        "scope": "agent",
        "workspaceAccess": "ro"
      }
    }
  },
  "tools": {
    "deny": ["exec", "browser"],
    "elevated": {
      "allowlist": []
    }
  }
}
```

---

## Verification Commands

After implementing changes, verify with:

```bash
# Check Clawdbot security status
clawdbot security audit

# Check firewall
sudo ufw status verbose

# Check fail2ban
sudo fail2ban-client status sshd

# Check file permissions
ls -la ~/.clawdbot/

# Check listening ports
ss -tlnp

# Check Tailscale (if installed)
tailscale status
```

---

## Risk Summary After Hardening

| Category | Before | After |
|----------|--------|-------|
| Network Exposure | HIGH | LOW |
| Authentication | MEDIUM | LOW |
| Credential Storage | HIGH | LOW |
| Sandboxing | HIGH | LOW |
| Monitoring | MEDIUM | LOW |
| Overall Risk | HIGH | LOW |
