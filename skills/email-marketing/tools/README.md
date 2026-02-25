# Email Export Tool

CLI tool to export emails from Gmail and convert them to YAML format for the email-marketing skill corpus.

---

## Do You Need This Tool?

**Most users don't.** The skill already includes 118 annotated emails from Andre Chaperon's campaigns — enough to learn his style and write effective emails.

| Goal | Do You Need This Tool? |
|------|------------------------|
| Write emails using Andre's methodology | **No** — just use the skill |
| Learn from the included examples | **No** — browse `corpus/` directly |
| Add your own emails to the corpus | **Yes** |
| Capture a client's email style | **Yes** |
| Build a corpus for a different brand | **Yes** |

**Rule of thumb:** If you're writing SlideHeroes emails, skip this. If you're building a custom corpus or capturing someone else's style, read on.

---

## Quick Start (If You Do Need It)

### 1. Google Cloud Setup (10-15 min, one-time)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable **Gmail API** (APIs & Services > Library > search "Gmail API")
4. Create OAuth credentials:
   - APIs & Services > Credentials > Create Credentials > OAuth client ID
   - Application type: **Desktop app**
   - Download the JSON file
5. Save to `~/.email-export/credentials.json`

### 2. Install & Build

```bash
cd tools
npm install
npm run build
```

### 3. Authenticate

```bash
node dist/cli.js auth
```

Opens browser for Google OAuth consent. Tokens saved to `~/.email-export/token.json`.

### 4. Export Emails

```bash
# Export by label
node dist/cli.js export --label "Newsletter" --output ../corpus/_raw

# Export by sender
node dist/cli.js export --query "from:andre@example.com" --max 50

# Export date range
node dist/cli.js export --after 2024/01/01 --before 2024/12/31
```

### 5. Annotate

After exporting, add technique annotations:

```bash
cd ..
python scripts/annotate_email.py corpus/_raw --batch
```

Then organize into the correct type folder:

```bash
python scripts/organize_corpus.py --input corpus/_raw --type newsletter
```

---

## CLI Reference

### Commands

| Command | Purpose |
|---------|---------|
| `auth` | Authenticate with Gmail (opens browser) |
| `labels` | List available Gmail labels |
| `export` | Export emails to YAML |

### Export Options

| Option | Description | Default |
|--------|-------------|---------|
| `-l, --label <label>` | Filter by Gmail label | - |
| `-q, --query <query>` | Gmail search query | - |
| `-a, --after <date>` | Emails after date (YYYY/MM/DD) | - |
| `-b, --before <date>` | Emails before date (YYYY/MM/DD) | - |
| `-o, --output <dir>` | Output directory | `./email-exports` |
| `-t, --thread-id <id>` | Export specific thread | - |
| `-m, --max <number>` | Maximum emails | 50 |
| `-c, --credentials <path>` | Credentials file | `~/.email-export/credentials.json` |

---

## Output Format

Each email exports as a YAML file:

```yaml
# Email Export - Subject Line
# Exported from Gmail on 2024-01-15T10:30:00.000Z
---
metadata:
  id: "18abc123def456"
  exportedAt: "2024-01-15T10:30:00.000Z"
  source: "gmail"
  labels: ["Newsletter", "INBOX"]

headers:
  from: "Andre Chaperon <hello@example.com>"
  to: "you@example.com"
  subject: "[TWN] Issue 15: The Framework"
  date: "Mon, 15 Jan 2024 10:30:00 -0500"

thread:
  threadId: "18abc123def456"
  position: 1
  totalInThread: 1

content:
  body: |
    Hey, it's Andre...
    
    [email content]

annotations:
  # Added by annotate_email.py or manually
  campaign: "TWN"
  email_type: "newsletter"
  techniques_used:
    - technique: "Personal Greeting"
      location: "opening"
```

File naming: `{YYYY-MM-DD}_{HHMMSS}_{subject-slug}.yaml`

---

## Workflow: Capturing a New Email Style

If you want to capture emails from a different source (client, competitor, inspiration):

1. **Export** their emails using this tool
2. **Annotate** with `annotate_email.py --batch` (adds basic technique detection)
3. **Review** annotations manually — enhance with purpose, audience, quotable lines
4. **Organize** into `corpus/by-type/` folders
5. **Update** `core/best-examples.yaml` with standout emails
6. **(Optional)** Create POV files in `context/` for their brand voice

---

## Security

- **Read-only access** — tool only reads emails, never sends or modifies
- **Local storage** — credentials and tokens stay in `~/.email-export/`
- **Revoke anytime** — [Google Account Security](https://myaccount.google.com/security)
- **Never commit** credentials or tokens to git

---

## Troubleshooting

| Error | Fix |
|-------|-----|
| "Credentials file not found" | Download OAuth JSON, save to `~/.email-export/credentials.json` |
| "Token refresh failed" | Delete `~/.email-export/token.json`, re-run `auth` |
| "No emails found" | Check label spelling (case-sensitive), expand date range |
| "npm run build fails" | Run `npm install` first, check Node.js version (≥18) |
