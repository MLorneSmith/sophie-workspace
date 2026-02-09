# SlideHeroes Context Foundation

This directory contains the foundational context layer for all AI-powered content creation and the Sophie Loop autonomous work system.

## Philosophy

> "Context engineering is the delicate art and science of filling the context window with just the right information — not more, not less."

Build once, maintain well, use everywhere. Context files serve two purposes:
1. **Creation input** — Builder agents load them to produce on-brand, persona-aware work
2. **Review criteria** — Reviewer agents load them to verify output matches voice, guidelines, and positioning

## Directory Structure

```
contexts/
├── skill-mappings.yaml   # Per-skill context loading configuration
│
├── company/              # What SlideHeroes is
│   ├── about.md          # Mission, story, founder, social proof
│   ├── products.md       # DDM course, team training, free resources, AI SaaS
│   ├── differentiators.md # Competitive positioning & moats
│   └── roadmap.md        # Product direction & pivot to AI SaaS
│
├── personas/             # Who we serve
│   ├── overview.md       # Quick reference for all personas
│   ├── solo-consultant.md # Primary persona (with scenarios)
│   ├── boutique-consultancy.md # Team buyers (with scenarios)
│   ├── corporate-professional.md # Career-focused buyers (with scenarios)
│   └── anti-personas.md  # Who we DON'T target
│
├── voice/                # How we sound
│   ├── brand-voice.md    # SlideHeroes tone and style
│   ├── mike-style.md     # Mike's personal voice
│   ├── pov-presentations.md # Our beliefs about presentations (32 POVs)
│   ├── pov-ai.md         # Our beliefs about AI & presentations
│   └── vocabulary.md     # Words we use/avoid
│
├── messaging/            # What we say
│   ├── positioning.md    # Market positioning & competitive landscape
│   ├── value-props.md    # Value propositions by persona
│   ├── pain-points.md    # Problems we solve (by persona + intensity)
│   └── objections.md     # Objection handling with responses
│
├── guidelines/           # How we write
│   ├── blog-guidelines.md      # Blog post rules (SEO, structure, voice)
│   ├── email-guidelines.md     # Marketing email rules (Andre Chaperon)
│   ├── outbound-guidelines.md  # Cold email rules
│   └── social-guidelines.md    # LinkedIn/Twitter guidelines
│
└── campaigns/            # Active work (TBD)
    ├── active/           # Current campaigns
    └── archive/          # Past campaigns
```

## Status

### Company (4 files)
| File | Status | Notes |
|------|--------|-------|
| company/about.md | ✅ Expanded | Founder bio, company direction, enhanced social proof |
| company/products.md | ✅ Expanded | Detailed DDM, team training, free resources, product landscape |
| company/differentiators.md | 🆕 Created | Big Three + supporting differentiators, competitive matrix |
| company/roadmap.md | 🆕 Created | Course → AI SaaS pivot, timeline, messaging implications |

### Personas (5 files)
| File | Status | Notes |
|------|--------|-------|
| personas/overview.md | ✅ Complete | Quick reference for all personas |
| personas/solo-consultant.md | ✅ Deepened | Added 3 realistic scenarios, writing guidance |
| personas/boutique-consultancy.md | ✅ Deepened | Added 3 scenarios, writing guidance |
| personas/corporate-professional.md | ✅ Deepened | Added 3 scenarios, writing guidance |
| personas/anti-personas.md | ✅ Complete | 5 anti-personas with redirect language |

### Voice (5 files)
| File | Status | Notes |
|------|--------|-------|
| voice/brand-voice.md | ✅ Complete | Core voice defined with examples |
| voice/mike-style.md | ✅ Complete | Personal writing style with calibration |
| voice/vocabulary.md | ✅ Complete | Comprehensive use/avoid lists |
| voice/pov-presentations.md | ✅ Complete | 32 POVs from blog |
| voice/pov-ai.md | 🆕 Created | AI + presentations POVs, content hooks |

### Messaging (4 files)
| File | Status | Notes |
|------|--------|-------|
| messaging/positioning.md | ✅ Expanded | Market opportunity, competitive moats, one-liner test |
| messaging/pain-points.md | ✅ Complete | By persona + intensity ladder |
| messaging/value-props.md | ✅ Complete | By persona with proof points |
| messaging/objections.md | ✅ Complete | With responses and usage guidance |

### Guidelines (4 files)
| File | Status | Notes |
|------|--------|-------|
| guidelines/blog-guidelines.md | ✅ Complete | SEO, structure, templates, quality checklist |
| guidelines/email-guidelines.md | ✅ Complete | Andre Chaperon methodology |
| guidelines/outbound-guidelines.md | ✅ Complete | Cold email rules, sequences |
| guidelines/social-guidelines.md | ✅ Complete | LinkedIn-focused strategy |

### Configuration
| File | Status | Notes |
|------|--------|-------|
| skill-mappings.yaml | 🆕 Created | Per-skill context loading (always + per-persona + optional) |

**Total: 23 files** (20 content + 1 README + 1 YAML config + campaigns dir)

## Context Loading (skill-mappings.yaml)

The `skill-mappings.yaml` file defines which context files each agent type loads. This ensures:
- Deterministic context assembly (same agent + same mapping = consistent output)
- Token efficiency (only load what's needed)
- Per-persona customization (load the right persona for the target audience)

Example for blog-writing:
```yaml
blog-writing:
  always:           # Always loaded
    - company/about.md
    - voice/brand-voice.md
    - guidelines/blog-guidelines.md
  per-persona:      # Loaded based on target persona
    solo-consultant: personas/solo-consultant.md
  optional:         # Loaded when relevant
    - voice/pov-ai.md   # for AI topics
```

## Maintenance

- **Quarterly review:** Check for outdated information
- **After product changes:** Update products.md, roadmap.md, positioning.md
- **After successful content:** Add learnings back to contexts
- **After failed content:** Document what didn't work in anti-patterns
- **After Mike feedback:** Incorporate corrections into relevant files
- **Context refresh:** Part of Sophie Loop's maintenance cycle

## Review Status

Files marked 🆕 or ✅ Expanded need Mike's review before they're fully validated. Existing files (✅ Complete) were reviewed on initial creation (2026-02-04).

## Owner

Mike (strategy, voice, final approval)
Sophie (drafting, maintenance, updates)
