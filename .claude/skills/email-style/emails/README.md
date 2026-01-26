# Extended Email Corpus

This directory contains the full annotated email corpus with two organizational schemes:

1. **By Type** - For learning style patterns (welcome, nurture, story, etc.)
2. **By Campaign** - For understanding email sequences as coherent units

## Directory Structure

```
emails/
├── welcome/     # 6 emails - Welcome sequence openers
├── nurture/     # 39 emails - Relationship-building sequences
├── story/       # 12 emails - Story-driven emails
├── sales/       # 3 emails - Sales/offer emails
├── newsletter/  # 23 emails - Newsletter issues
└── campaigns/   # Complete campaign sequences
    └── bpm-onboarding/    # 16-email SlideHeroes onboarding sequence
        ├── _campaign.yaml # Campaign manifest (metadata, sequence, narrative arc)
        └── 01-*.yaml      # Symlinks to emails in sequence order
```

## Loading Strategy

### By Email Type

Files are loaded **on-demand** based on the email type being written:

| Request | Files Loaded |
|---------|--------------|
| `/email-style write welcome "..."` | `core/*` + `emails/welcome/*` |
| `/email-style write nurture "..."` | `core/*` + `emails/nurture/*` |
| `/email-style write story "..."` | `core/*` + `emails/story/*` |
| `/email-style write sales "..."` | `core/*` + `emails/sales/*` |
| `/email-style write newsletter "..."` | `core/*` + `emails/newsletter/*` |

### By Campaign

For working with complete email sequences:

| Request | Files Loaded |
|---------|--------------|
| `/email-style campaign bpm-onboarding` | `core/*` + `emails/campaigns/bpm-onboarding/*` |
| `/email-style write --campaign bpm-onboarding "email 17..."` | Campaign context + new email generation |

**When to use campaign context:**
- Writing a new email for an existing campaign
- Understanding the narrative arc before writing
- Ensuring consistency with previous emails in sequence
- Generating a similar campaign for a different product

## Why On-Demand Loading?

The full corpus (83 emails) would consume significant context. By loading only relevant examples:
- **Token efficiency**: Load 3-12 emails instead of 83
- **Focused context**: Examples match the task at hand
- **Better generation**: More relevant patterns to follow

## File Format

Each email is a YAML file with:
- `metadata` - Gmail export info
- `headers` - From, to, subject, date
- `content.body` - Full email text
- `annotations` - Campaign, type, techniques, hooks, effectiveness notes

## Symlink Structure

Files are symlinked from the export tool location:
```
.ai/tools/email-export/.claude/skills/email-style/emails/raw/
```

This keeps the source of truth in one place while providing organized access by type.

## Campaigns Represented

### Andre Chaperon Reference Campaigns

| Campaign | Full Name | Primary Type |
|----------|-----------|--------------|
| LEM | Lucrative Email Marketing | nurture |
| ARM | AutoResponder Madness | nurture |
| TW | Tiny Worlds (welcome series) | welcome |
| TWN | Tiny Worlds Newsletter | newsletter |
| EMN | Emergent Marketing Newsletter | newsletter |
| MMS | Modern Marketing System | sales |

### SlideHeroes Campaigns (Your Campaigns)

| Campaign | Full Name | Emails | Status |
|----------|-----------|--------|--------|
| BPM | Business Presentation Mastery Onboarding | 16 | Active |

The BPM campaign is your actual onboarding sequence with emails prefixed "TEST:" in subject lines.
It follows the Andre Chaperon methodology and serves as both a reference and production campaign.

See `campaigns/bpm-onboarding/_campaign.yaml` for the full campaign manifest including:
- Narrative arc and phases
- Email sequence with purposes
- Techniques used in each email
