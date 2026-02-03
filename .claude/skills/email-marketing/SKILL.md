---
name: email-marketing
description: "Write compelling marketing emails using Andre Chaperon's methodology with SlideHeroes voice. Includes 119 annotated examples, hook quality scoring, two-stage campaign workflow, and Gmail export tool."
license: MIT
metadata:
  version: 1.0.0
  model: opus
  domains: [marketing, email, copywriting, content]
  type: workflow
  inputs: [campaign-goal, audience-description, email-position]
  outputs: [campaign-strategy-yaml, email-yaml, validation-report]
---

# Email Marketing Skill

Write compelling marketing emails using Andre Chaperon's "Art of Email" methodology with SlideHeroes-specific voice and context.

---

## Quick Start

**Design a campaign:**
```
/email-campaign course-launch "announcing DDM to existing subscribers"
```

**Write an email:**
```
/email-write course-launch 1
```

That's it. The skill handles methodology, examples, and quality checks.

---

## Triggers

- `/email-campaign [name] "[audience]"` - Create campaign strategy with hooks
- `/email-write [campaign] [position]` - Write individual email
- `/email-write [campaign] [position] --validate` - Validate existing draft
- `email marketing skill` - Natural language activation
- `write email in Andre style` - Style-specific trigger
- `create email campaign` - Campaign creation trigger

| Input | Output | Quality Gate |
|-------|--------|--------------|
| Campaign goal + audience | Strategy YAML | Hook score ≥40/50 |
| Campaign + position | Email YAML | Mandatory elements check |

---

## Two-Stage Workflow

```
Campaign Strategy (/email-campaign)
    │
    ├── Gather context (questions)
    ├── Select relevant POVs
    ├── Develop hooks (scored)
    ├── Design narrative arc
    └── Save strategy YAML
    │
    ▼
Email Execution (/email-write)
    │
    ├── Load campaign strategy
    ├── Load adjacent emails
    ├── Apply techniques
    ├── Self-review checklist
    └── Save email YAML
```

**WHY two stages:** Strategy ensures consistent arc across emails. Execution focuses on individual quality. Separation prevents drift.

---

## Commands

| Command | Purpose |
|---------|---------|
| `/email-campaign` | Create campaign strategy with hooks and arc |
| `/email-write` | Write individual email from strategy |
| `/email-write --validate` | Validate draft against style patterns |

### Command Files

Commands are in `commands/` directory:
- `commands/email-campaign.md` - Full campaign workflow
- `commands/email-write.md` - Individual email workflow

---

## Core Resources

**Always loaded:**

| File | Contents |
|------|----------|
| `core/techniques.yaml` | 24 techniques across 7 categories |
| `core/hooks-library.yaml` | 45 hooks across 8 categories |
| `core/best-examples.yaml` | 12 gold standard annotated emails |
| `core/principles.md` | Andre's 7 core philosophy principles |

**Loaded for SlideHeroes campaigns:**

| File | Contents |
|------|----------|
| `context/slideheroes-product.yaml` | Product positioning, audience, voice |
| `context/presentation-povs.yaml` | 32 belief statements for hooks |
| `context/ai-presentation-povs.yaml` | AI + presentations POVs |

---

## Hook Quality Scoring

Every hook is scored against 5 weighted criteria:

| Criterion | Weight | What It Measures |
|-----------|--------|------------------|
| Open Loop Power | 3 | Creates unresolved psychological tension |
| Specificity | 2 | Uses concrete details vs. generic |
| Relevance | 2 | Connects to audience pain points |
| Bridge Potential | 2 | Leads naturally to main content |
| Authenticity | 1 | Rings true to SlideHeroes voice |

**Scoring:** Rate each 1-5, multiply by weight. Total: XX/50

| Score | Verdict |
|-------|---------|
| 40-50 | Strong hook - proceed |
| 30-39 | Needs refinement |
| <30 | Rethink approach |

**Script:** `python scripts/score_hook.py --criteria "4,5,4,4,3"` → Total: 42/50 ✓

---

## Email Corpus

119 annotated emails organized two ways:

### By Type (for style patterns)
```
corpus/by-type/
├── welcome/     # 6 emails - Welcome sequence openers
├── nurture/     # 39 emails - Relationship-building
├── story/       # 12 emails - Story-driven emails
├── sales/       # 3 emails - Sales/offer emails
├── newsletter/  # 24 emails - Newsletter issues
└── onboarding/  # 18 emails - Feature-first product adoption (Superhuman)
```

### By Campaign (for sequence context)
```
corpus/campaigns/
└── bpm-onboarding/          # 16-email SlideHeroes sequence
    ├── _campaign.yaml       # Campaign manifest
    └── 01-*.yaml → 16-*.yaml
```

### Loading Strategy

| Task | What to Load |
|------|--------------|
| Basic email | `core/*` only |
| Write welcome email | `core/*` + 2-3 from `corpus/by-type/welcome/` |
| Write for campaign | `core/*` + campaign manifest + adjacent emails |
| Hook development | `core/*` + POVs + perplexity research |

---

## Scripts

### validate_email.py

Validate email against Andre's style patterns.

```bash
python scripts/validate_email.py path/to/email.yaml
```

**Checks:**
- [ ] Personal Greeting present
- [ ] Short Line Rhythm (avg 3-8 words)
- [ ] P.S. Section present
- [ ] White space ratio 40-60%
- [ ] Techniques applied (≥3)

**Exit codes:** 0=pass, 10=validation failure

### score_hook.py

Calculate weighted hook quality score.

```bash
python scripts/score_hook.py --criteria "5,4,4,4,3"
# Output: Total: 42/50 - PASS (threshold: 40)
```

**Arguments:**
- `--criteria` - Comma-separated scores (loop,specific,relevant,bridge,authentic)
- `--threshold` - Minimum passing score (default: 40)

### organize_corpus.py

Move exported emails into correct corpus directories.

```bash
python scripts/organize_corpus.py --input exports/ --type nurture
```

---

## Gmail Export Tool

TypeScript CLI for exporting Gmail emails to YAML format.

### Setup (One-time)

See `references/setup-guide.md` for full instructions.

1. Create Google Cloud project
2. Enable Gmail API
3. Create OAuth credentials
4. Save to `~/.email-export/credentials.json`
5. Install dependencies: `cd tools && npm install`
6. Build: `npm run build`

### Usage

```bash
# Authenticate
cd tools && npm run dev auth

# Export by label
npm run dev export --label "Newsletter" --output ../corpus/by-type/newsletter

# Export by query
npm run dev export --query "from:andre@example.com" --max 50
```

---

## Mandatory Email Elements

Every email MUST have:

| Element | Example |
|---------|---------|
| **Personal Greeting** | "Hey, it's Mike..." |
| **Short Line Rhythm** | Single sentences, blank lines between |
| **P.S. Section** | Strategic purpose, not just repeated CTA |
| **Clever Signature** | Mike "phrase" Smith |

---

## SlideHeroes Voice

**Do:**
- Use "Hey, it's [Name]" openings
- Write in short, punchy lines
- Include conversational asides in parentheses
- Challenge bad presentation advice (contrarian)
- Reference the 5S framework where relevant

**Don't:**
- Use formal corporate language
- Write long paragraphs
- Push hard sells
- Use generic hooks
- Forget the P.S.

---

## POV-to-Hook Mapping

Use POVs from `context/presentation-povs.yaml` to ground hooks:

| POV Category | Best Hook Types |
|--------------|-----------------|
| Identity ("presentations aren't speeches") | Contrarian, Pattern Interrupt |
| Structure ("answer a question") | Reframe, Question |
| Evidence ("demonstrate, don't assert") | Story (with proof), Data |
| Design ("minimalist ethos") | Contrarian, Permission |
| Delivery ("have conviction") | Tough Love, Empathy |

---

## Anti-Patterns

| Avoid | Why | Instead |
|-------|-----|---------|
| Loading full corpus | Wastes context tokens | Load by type on-demand |
| Hardcoded paths | Breaks portability | Use relative paths |
| P.S. that repeats CTA | Boring, wastes opportunity | Strategic subplot |
| Generic hooks | Don't engage | Use specific details |
| Selling before email 5-6 | Damages trust | Value first |

---

## Verification

After creating/modifying this skill:

- [ ] Copy to temp directory, invoke triggers
- [ ] Verify all corpus files present (no broken refs)
- [ ] Run `python scripts/validate_email.py` on sample
- [ ] Run `python scripts/score_hook.py` with test scores
- [ ] Follow setup guide on fresh machine (if exporting)

---

## Output Locations

| Content | Location |
|---------|----------|
| Campaign strategies | `.ai/content/emails/strategies/[name]-strategy.yaml` |
| Individual emails | `.ai/content/emails/[campaign]/[position]-[slug].yaml` |
| Validation reports | stdout |

---

## Example Session

```
User: /email-campaign course-launch "announcing DDM to subscribers"

[Skill gathers context through questions]
[Skill develops 3 hook options with scores]
[Skill designs 6-email arc]
[Skill saves strategy to .ai/content/emails/strategies/course-launch-strategy.yaml]

User: /email-write course-launch 1

[Skill loads strategy]
[Skill applies techniques from strategy]
[Skill presents draft with annotations]
[User approves]
[Skill saves to .ai/content/emails/course-launch/1-welcome.yaml]

User: /email-write course-launch 1 --validate

[Skill runs validation checks]
[Skill outputs report with scores and suggestions]
```

---

## Extension Points

1. **Add products:** Create new files in `context/` for other brands
2. **Expand corpus:** Export more emails, run `organize_corpus.py`
3. **New email types:** Add directory in `corpus/by-type/`
4. **ESP integration:** Add API scripts in `tools/`
5. **A/B testing:** Extend `score_hook.py` with comparison mode

---

## Related Resources

- [Setup Guide](references/setup-guide.md) - Gmail export configuration
- [Loading Strategy](references/loading-strategy.md) - When to load what
- [Andre Chaperon's Art of Email](https://sphereofinfluence.co) - Source methodology

---

## Changelog

### v1.0.0 (2026-02-03)
- Initial consolidation from email-style skill
- Added validation and scoring scripts
- Made fully portable
- Included Gmail export tool
- Created comprehensive documentation
