# Template System — Vision & Architecture

> **Status:** Approved (2026-02-27)
> **Decision Maker:** Mike Smith
> **Author:** Sophie (AI Assistant)
> **Related Tasks:** #537, MC tasks TBD

---

## 1. Problem Statement

The Generate step currently produces presentations with hardcoded visual styles. Every deck looks the same regardless of audience, context, or brand. For a product that helps people build professional presentations, **design quality and variety is table stakes**.

Users need to be able to choose a visual identity for their deck that matches their context — a board presentation should look different from a startup pitch.

---

## 2. Vision

A **template** is not just a PPTX file with placeholders. It's a multi-layered design token system that controls every visual decision in the generated output.

Templates are reusable, selectable, and eventually customizable. They live in a **Library** alongside other reusable assets (audience profiles, company profiles).

---

## 3. What Is a Template?

A template is composed of four layers:

### Layer 1: Visual Identity ("brand skin")
- Color palette — primary, secondary, accent, background, text, muted
- Typography — heading font, body font, size scale, weights
- Image treatment — rounded corners, overlays, borders
- Logo placement rules (future, via Brand Kit)

### Layer 2: Layout System ("spatial grammar")
- Slide master layouts — title, section divider, content, two-column, comparison, data, quote, closing
- Grid system — margins, gutters, content zones
- Alignment rules — title position, page numbers, footer
- Whitespace philosophy — dense (McKinsey) vs airy (Apple) vs balanced

### Layer 3: Content Patterns ("narrative structures")
- Slide archetypes — situation setup, data proof point, comparison, recommendation, executive summary
- Chart/data styling — colors, borders, label placement
- Callout boxes — highlight style for key insights
- Icon system — library reference, style (outline vs filled)

### Layer 4: Tone & Character ("personality")
- Density — how much content per slide
- Formality — language register hints for AI generation
- Visual weight — bold vs subtle, contrast levels

---

## 4. Template Config Schema

The PPTX generator (and future export formats) consumes a `TemplateConfig` object:

```typescript
interface TemplateConfig {
  id: string;
  name: string;
  description: string;
  previewImage: string;          // thumbnail for selection UI

  colors: {
    primary: string;             // main brand/accent color
    secondary: string;           // supporting color
    accent: string;              // highlights, CTAs
    background: string;          // slide background
    backgroundAlt: string;       // alternate background (section dividers)
    text: string;                // primary text
    textMuted: string;           // secondary text
    textOnPrimary: string;       // text on primary-colored backgrounds
  };

  typography: {
    headingFont: string;         // font family for titles/headings
    bodyFont: string;            // font family for body text
    monoFont?: string;           // font for code/data (optional)
    sizes: {
      title: number;             // slide title (pt)
      heading: number;           // section heading (pt)
      subheading: number;        // subheading (pt)
      body: number;              // body text (pt)
      caption: number;           // small text, footnotes (pt)
    };
    weights: {
      heading: number;           // e.g., 700
      body: number;              // e.g., 400
      emphasis: number;          // e.g., 600
    };
  };

  layout: {
    margins: {
      top: number;               // inches
      bottom: number;
      left: number;
      right: number;
    };
    density: 'compact' | 'balanced' | 'airy';
    slideSize: {
      width: number;             // inches (default 13.333 for 16:9)
      height: number;            // inches (default 7.5 for 16:9)
    };
    footerStyle: 'minimal' | 'standard' | 'none';
    pageNumbers: boolean;
  };

  charts?: {
    colorSequence: string[];     // ordered colors for data series
    gridLines: boolean;
    borderRadius: number;        // for bar charts
    labelStyle: 'inside' | 'outside' | 'legend';
  };

  assets?: {
    logo?: string;               // URL or R2 path
    logoPlacement?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
    customFonts?: Array<{
      family: string;
      url: string;               // font file URL
      weight: number;
      style: 'normal' | 'italic';
    }>;
  };
}
```

---

## 5. Curated Templates (MVP)

Five templates covering the most common professional contexts:

| # | Name | Tone | Use Case | Whitespace | Colors |
|---|------|------|----------|------------|--------|
| 1 | **Consulting Classic** | Formal, structured, dense | Strategy, board decks | Compact | Navy, white, subtle accent |
| 2 | **Modern Minimal** | Clean, airy, tech-forward | Product updates, team | Airy | Light grays, single accent |
| 3 | **Bold Pitch** | High energy, big numbers | Pitches, sales decks | Balanced | Vibrant primary, dark text |
| 4 | **Executive Dark** | Authority, premium | C-suite, investors | Balanced | Dark background, gold/silver |
| 5 | **Clean Academic** | Data-forward, neutral | Research, training | Balanced | White, muted blues, clean |

Each template will be defined as a `TemplateConfig` JSON file with a preview thumbnail.

---

## 6. Architecture Decisions

### Where templates are selected
- **Primary:** At the Generate step, before PPTX creation
- **Future:** Also selectable at workflow start (influences AI tone suggestions)

### Storage
- Curated templates: shipped with the app (JSON config + preview images in `/public/templates/`)
- Custom templates (future): stored in Supabase per workspace

### PPTX Generator refactor
- Current: hardcoded styles throughout `pptx-generator.ts`
- Target: `generate(slides, templateConfig)` — all style decisions come from the config
- The refactor extracts current hardcoded values into a "Default" template, then adds the ability to swap configs

### Library (left nav)
- New menu item in the left sidebar
- Sections: Templates, Individual Profiles, Company Profiles
- Future sections: Brand Kits, Outline Templates

---

## 7. Decisions Made (2026-02-27)

| Decision | Choice | Rationale |
|----------|--------|-----------|
| MVP template count | 5 curated | Covers key use cases without scope creep |
| Customization | None (MVP) | Prove the system works first |
| Brand extraction (#540) | Deferred to v2 | Complex AI/CV problem, not needed for MVP |
| Template schema | Supports brand data | Schema is future-proof even if extraction comes later |
| Library contents (MVP) | Templates + Profiles | Brand Kits and Outline Templates are v2 |
| User custom templates | Deferred to v2 | Start curated, add custom later |

---

## 8. Execution Plan

| Step | Task | Dependencies | Assignee |
|------|------|-------------|----------|
| 1 | Template Architecture Spec (this document) | None | Sophie ✅ |
| 2 | Refactor PPTX generator to accept TemplateConfig | This spec | Neo |
| 3 | Build 5 curated template definitions | Step 2 (schema) | Design + Neo |
| 4 | Template selection UI in Generate step | Steps 2, 3 | Neo |
| 5 | Library shell (left nav: Templates + Profiles) | Step 4 | Neo |

---

## 9. Open Questions (for future)

- Should template selection influence AI generation prompts? (e.g., "Consulting Classic" → more structured language)
- How do we handle template previews — static screenshots or live-rendered thumbnails?
- Should templates include speaker notes styling?
- Multi-language font support (CJK, Arabic, etc.)

---

## 10. Related Documents

- Product Design Bible: `.ai/ai_docs/context-docs/development/design/DesignSystem.md`
- PPTX Generator: `apps/web/app/home/(user)/ai/storyboard/_lib/services/powerpoint/pptx-generator.ts`
- Storyboard schemas: `apps/web/app/home/(user)/ai/_lib/schemas/presentation-artifacts.ts`
- Brand template extraction (#540): deferred, will reference this schema
