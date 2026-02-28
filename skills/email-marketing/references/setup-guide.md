# Email Marketing Skill - Setup Guide

Setup instructions for the email-marketing skill and optional Gmail export tool.

---

## What You Need vs. What's Optional

| Component | Required? | Purpose |
|-----------|-----------|---------|
| Skill files | **Yes** | Core methodology, corpus, scripts |
| Python 3.8+ | **Yes** | Validation and annotation scripts |
| Gmail export tool | **No** | Only if adding new emails to corpus |
| Google Cloud OAuth | **No** | Only for Gmail export tool |

**Most users:** Just copy the skill and verify Python works. Skip the Gmail setup.

---

## 1. Install the Skill

Copy to your Clawdbot skills location:

```bash
# Default location
cp -r email-marketing ~/.openclaw/skills/
```

The skill includes:
- 118 annotated email examples
- Andre Chaperon's methodology (techniques, hooks, principles)
- SlideHeroes context and POVs
- Validation and scoring scripts

---

## 2. Verify Installation

### Check Files

```bash
cd ~/.openclaw/skills/email-marketing

# Count corpus files (should be 100+)
find corpus -name "*.yaml" -type f | wc -l

# Check core files exist
ls core/
# → techniques.yaml, hooks-library.yaml, best-examples.yaml, principles.md
```

### Test Scripts

```bash
# Hook scorer
python3 scripts/score_hook.py --criteria "5,4,4,4,3"
# → Total: 42/50 - PASS

# Email validator
python3 scripts/validate_email.py corpus/by-type/welcome/2019-08-09_163739_lem-lucrative-email-marketing-prologue.yaml
# → Should output validation report
```

If Python complains about missing `yaml`:
```bash
pip3 install pyyaml
```

---

## 3. Gmail Export Tool (Optional)

**Skip this section** unless you want to:
- Add your own emails to the corpus
- Capture a client's email style
- Build a corpus for a different brand

### 3.1 Google Cloud Setup (10-15 min)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable **Gmail API** (APIs & Services > Library)
4. Create OAuth credentials:
   - APIs & Services > Credentials > Create Credentials > OAuth client ID
   - Application type: **Desktop app**
   - Download the JSON file
5. Save credentials:
   ```bash
   mkdir -p ~/.email-export
   mv ~/Downloads/client_secret_*.json ~/.email-export/credentials.json
   ```

### 3.2 Build the Tool

```bash
cd ~/.openclaw/skills/email-marketing/tools
npm install
npm run build
```

### 3.3 Authenticate

```bash
node dist/cli.js auth
# Opens browser for Google OAuth consent
```

### 3.4 Test

```bash
node dist/cli.js labels
# Should list your Gmail labels
```

See `tools/README.md` for full usage.

---

## 4. First Use

### Option A: Write a Standalone Email

Just start a conversation:
```
Write a nurture email for SlideHeroes subscribers about the importance of structure in presentations.
```

The skill will load automatically when triggered.

### Option B: Create a Campaign

```
/email-campaign course-launch "announcing DDM to existing subscribers"
```

Then write individual emails:
```
/email-write course-launch 1
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Python `yaml` module missing | `pip3 install pyyaml` |
| Scripts not executable | `chmod +x scripts/*.py` |
| Gmail "credentials not found" | Save JSON to `~/.email-export/credentials.json` |
| Gmail "token refresh failed" | Delete `~/.email-export/token.json`, re-run `auth` |
| npm build fails | Check Node.js ≥18: `node --version` |

---

## File Locations

| Item | Location |
|------|----------|
| Skill root | `~/.openclaw/skills/email-marketing/` |
| Email corpus | `corpus/by-type/` and `corpus/campaigns/` |
| Core methodology | `core/` |
| Scripts | `scripts/` |
| Gmail credentials (if used) | `~/.email-export/credentials.json` |
| Gmail token (if used) | `~/.email-export/token.json` |
| Campaign outputs | `.ai/content/emails/strategies/` |
| Written emails | `.ai/content/emails/[campaign]/` |
