# .ai/ — Content Development System

This directory houses SlideHeroes content creation infrastructure.

## Structure

```
.ai/
├── contexts/           # Shared knowledge layer (stable)
│   ├── company/        # About, products, differentiators, roadmap
│   ├── personas/       # Target audience profiles
│   ├── voice/          # Brand voice, Mike's style, POVs
│   ├── messaging/      # Positioning, value props, pain points
│   ├── guidelines/     # Email, blog, outbound best practices
│   └── campaigns/      # Active and archived campaign angles
│
├── content/            # Working drafts (churning)
│   ├── emails/         # Marketing email campaigns (subscribers)
│   ├── outbound/       # Sales sequences (prospects)
│   ├── blog/           # Blog post drafts → Payload CMS
│   └── social/         # LinkedIn, Twitter drafts
│
└── published/          # Archive of shipped content (optional)
```

## Workflow

1. **Sophie drafts** content in `content/`
2. **Mike reviews** via Discord/Mission Control
3. **Approved content** → pushed to destination (Payload CMS, email tool, etc.)
4. **Optionally archived** in `published/`

## Key Principle

> "Context engineering is the delicate art and science of filling the context window with just the right information — not more, not less."

The `contexts/` layer is loaded into every content workflow, ensuring consistent, on-brand output.

## Related

- Design doc: `~/clawd/deliverables/content-development-system-design.md`
- Mission Control board: #5 (Content Development System)
