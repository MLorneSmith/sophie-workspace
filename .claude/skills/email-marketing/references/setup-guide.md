# Email Marketing Skill - Setup Guide

Complete setup instructions for the Gmail export tool and skill configuration on a new machine.

---

## Prerequisites

- Node.js 18+ (for Gmail export tool)
- Python 3.8+ (for validation scripts)
- Claude Code installed

---

## 1. Copy Skill to New Machine

Copy the entire `email-marketing/` directory to your Claude skills location:

```bash
# Option A: Copy to default location
cp -r email-marketing ~/.claude/skills/

# Option B: Copy to project-specific location
cp -r email-marketing /path/to/project/.claude/skills/
```

---

## 2. Gmail Export Tool Setup (Optional)

Only needed if you want to import new emails from Gmail.

### 2.1 Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Navigate to **APIs & Services > Library**
4. Search for "Gmail API" and enable it

### 2.2 Create OAuth Credentials

1. Go to **APIs & Services > Credentials**
2. Click **Create Credentials > OAuth client ID**
3. Select **Desktop app** as application type
4. Name it "Email Export Tool"
5. Click **Create**
6. Download the JSON file

### 2.3 Save Credentials

```bash
mkdir -p ~/.email-export
mv ~/Downloads/client_secret_*.json ~/.email-export/credentials.json
```

### 2.4 Install Dependencies

```bash
cd ~/.claude/skills/email-marketing/tools
npm install
npm run build
```

### 2.5 Authenticate

```bash
npm run dev auth
```

This will:
1. Open browser for Google OAuth consent
2. Ask you to authorize the app
3. Save token for future use

---

## 3. Verify Installation

### Check Skill Files

```bash
# Count corpus files
find ~/.claude/skills/email-marketing/corpus -name "*.yaml" | wc -l
# Should be 80+ files

# Check core files
ls ~/.claude/skills/email-marketing/core/
# Should show: techniques.yaml, hooks-library.yaml, best-examples.yaml, principles.md
```

### Test Validation Script

```bash
cd ~/.claude/skills/email-marketing
python scripts/validate_email.py corpus/by-type/nurture/*.yaml | head -50
```

### Test Hook Scorer

```bash
python scripts/score_hook.py --criteria "5,4,4,4,3"
# Should output: Total: 42/50 - PASS
```

### Test Gmail Export (if configured)

```bash
cd tools
npm run dev labels
# Should list your Gmail labels
```

---

## 4. Configure Claude Code

The skill should auto-register when placed in `~/.claude/skills/`.

Verify by running:
```bash
claude code
# Then type: /email
# Should show email-campaign and email-write as options
```

---

## 5. First Use

### Create a Campaign Strategy

```
/email-campaign test-campaign "testing the skill"
```

### Write an Email

```
/email-write test-campaign 1
```

---

## Troubleshooting

### "Credentials file not found"

Make sure credentials are at `~/.email-export/credentials.json`

### "Token refresh failed"

Delete token and re-authenticate:
```bash
rm ~/.email-export/token.json
cd ~/.claude/skills/email-marketing/tools
npm run dev auth
```

### "No emails found" when exporting

- Check label name matches exactly (case-sensitive)
- Verify search query syntax
- Try expanding date range

### Python script errors

Ensure Python 3.8+ is installed:
```bash
python3 --version
```

If `yaml` module missing, install:
```bash
pip install pyyaml
```

---

## Security Notes

- Credentials and tokens are stored locally in `~/.email-export/`
- The tool only requests read-only access to Gmail
- Tokens can be revoked at [Google Account Security](https://myaccount.google.com/security)
- Never commit credentials or tokens to version control

---

## File Locations

| Item | Location |
|------|----------|
| Skill root | `~/.claude/skills/email-marketing/` |
| Gmail credentials | `~/.email-export/credentials.json` |
| Gmail token | `~/.email-export/token.json` |
| Campaign outputs | `.ai/content/emails/strategies/` |
| Email outputs | `.ai/content/emails/[campaign]/` |
