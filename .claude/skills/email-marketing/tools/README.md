# Email Export Tool

CLI tool to export emails from Gmail and convert them to YAML format for the Email Style Capture System.

## Prerequisites

### 1. Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to **APIs & Services > Library**
4. Search for "Gmail API" and enable it

### 2. Create OAuth 2.0 Credentials

1. Go to **APIs & Services > Credentials**
2. Click **Create Credentials > OAuth client ID**
3. Select **Desktop app** as the application type
4. Name it "Email Export Tool" (or similar)
5. Click **Create**
6. Download the JSON file

### 3. Save Credentials

Save the downloaded JSON file to:

```bash
~/.email-export/credentials.json
```

Or specify a custom path with the `-c` flag.

## Installation

```bash
# From project root
pnpm install

# Build the tool
pnpm --filter email-export build
```

## Usage

### First-Time Authentication

```bash
# Run the auth command to authenticate
pnpm --filter email-export dev auth

# Or if built
./dist/index.js auth
```

This will:
1. Open a browser window for Google OAuth consent
2. Ask you to authorize the app
3. Save the token for future use

### List Available Labels

```bash
pnpm --filter email-export dev labels
```

### Export Emails

```bash
# Export emails with a specific label
pnpm --filter email-export dev export --label "Work"

# Export emails matching a search query
pnpm --filter email-export dev export --query "from:colleague@example.com"

# Export emails from a date range
pnpm --filter email-export dev export --after 2024/01/01 --before 2024/12/31

# Export a specific thread
pnpm --filter email-export dev export --thread-id "18abc123def"

# Customize output
pnpm --filter email-export dev export --label "Projects" --output ./my-exports --max 100
```

### CLI Options

| Option | Description | Default |
|--------|-------------|---------|
| `-l, --label <label>` | Filter by Gmail label | - |
| `-q, --query <query>` | Custom Gmail search query | - |
| `-a, --after <date>` | Only emails after date (YYYY/MM/DD) | - |
| `-b, --before <date>` | Only emails before date (YYYY/MM/DD) | - |
| `-o, --output <dir>` | Output directory | `./email-exports` |
| `-t, --thread-id <id>` | Export specific thread | - |
| `-m, --max <number>` | Maximum emails to export | 50 |
| `-c, --credentials <path>` | Path to credentials.json | `~/.email-export/credentials.json` |
| `--include-spam` | Include spam emails | false |
| `--include-trash` | Include trashed emails | false |

## Output Format

Each email is exported as a YAML file with this structure:

```yaml
# Email Export - Subject Line
# Exported from Gmail on 2024-01-15T10:30:00.000Z
# Fill in the annotations section to capture writing style patterns
---
metadata:
  id: "18abc123def456"
  exportedAt: "2024-01-15T10:30:00.000Z"
  source: "gmail"
  labels:
    - "Work"
    - "INBOX"

headers:
  from: "John Doe <john@example.com>"
  to: "Jane Smith <jane@example.com>"
  subject: "Project Update"
  date: "Mon, 15 Jan 2024 10:30:00 -0500"
  messageId: "<abc123@mail.example.com>"

thread:
  threadId: "18abc123def456"
  position: 1
  totalInThread: 3
  isFirstInThread: true
  isLastInThread: false

content:
  body: |
    Hi Jane,

    Here's the project update you requested...

    Best regards,
    John
  hasHtml: true
  attachments:
    - filename: "report.pdf"
      mimeType: "application/pdf"
      size: 102400

annotations:
  purpose: ""
  tone: ""
  audience: ""
  structuralPatterns: []
  rhetoricalDevices: []
  notes: ""
```

## Annotation Guide

After exporting, fill in the `annotations` section:

- **purpose**: The email's primary intent (inform, request, follow-up, etc.)
- **tone**: Overall tone (professional, casual, formal, friendly, etc.)
- **audience**: Target reader relationship (colleague, manager, client, etc.)
- **structuralPatterns**: Notable structure elements (greeting, bullet points, etc.)
- **rhetoricalDevices**: Persuasion techniques used
- **notes**: Additional observations about style

## File Naming

Files are named using the pattern:
```
{YYYY-MM-DD}_{HHMMSS}_{subject-slug}.yaml
```

Example: `2024-01-15_103000_project-update.yaml`

## Security Notes

- Credentials and tokens are stored locally in `~/.email-export/`
- The tool only requests read-only access to Gmail
- Tokens can be revoked at [Google Account Security](https://myaccount.google.com/security)
- Never commit credentials or tokens to version control

## Troubleshooting

### "Credentials file not found"

Make sure you've downloaded the OAuth credentials and saved them to `~/.email-export/credentials.json`

### "Token refresh failed"

Delete `~/.email-export/token.json` and re-run the auth command.

### "No emails found"

- Check your label name matches exactly (case-sensitive)
- Verify the search query syntax
- Try expanding the date range
