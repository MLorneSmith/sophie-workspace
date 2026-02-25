# WOW #2 — Deck Intelligence: Upload → Rewrite + Extract Template

**Status:** Planning  
**Owner:** Mike + Sophie  
**Task:** #436  
**Date:** 2026-02-14  

---

## The Idea

Upload an existing PowerPoint deck → SlideHeroes does two things simultaneously:

1. **Rewrites the content** — analyzes structure, flow, and narrative; identifies weaknesses; rebuilds it as a consulting-grade deck with proper SCQA, pyramid structure, and clean flow
2. **Extracts the template** — reads the design language (colors, fonts, layouts, master slides) and creates a reusable brand template in SlideHeroes for all future decks

"Here's your deck rewritten in your own brand — and every future deck will match."

This is powered by the RAG system built into the Assemble step.

---

## Why This Is WOW #2

1. **Solves the #1 enterprise adoption barrier.** Every consulting firm has their "official template" that partners obsess over. If SlideHeroes can ingest that template and produce native-looking output, adoption resistance drops dramatically.

2. **Immediate value from existing content.** Users don't start from zero — they bring their messy 40-slide deck and get back something better. The AI proves itself on *their* content, not a generic demo.

3. **Two-for-one lock-in.** The rewrite shows what SlideHeroes can do. The template extraction ensures they stay — their brand now lives in the platform.

4. **Natural entry point.** "Upload a deck you've already built" is a lower-friction ask than "create something from scratch." Users who are skeptical about AI-generated content can start by letting the AI *improve* their existing work.

---

## How It Works

### Input
- Upload one or more PowerPoint files (.pptx)
- Optional: "What was this deck for?" (context helps the rewrite)

### Processing

**Content Analysis (→ Rewrite)**
- Parse slide content: titles, body text, charts, data
- Identify narrative structure (or lack thereof)
- Detect problems:
  - Buried lead (conclusion on slide 25)
  - No clear storyline or SCQA framework
  - Inconsistent messaging
  - Data without insight ("so what?" missing)
  - Too many slides / too dense / too sparse
- Rebuild with:
  - Proper SCQA framework
  - Pyramid principle structure
  - Executive summary upfront
  - Clear slide takeaways
  - Tightened language

**Design Analysis (→ Template Extraction)**
- Extract from master slides and slide layouts:
  - Color palette (primary, secondary, accent)
  - Typography (heading fonts, body fonts, sizes)
  - Logo placement and usage
  - Layout patterns (title slides, content slides, divider slides, data slides)
  - Footer/header conventions
  - Chart styling (colors, labels, gridlines)
- Generate a SlideHeroes brand template that reproduces the look

### Output

**1. Rewritten Deck**
- Side-by-side: original vs. rewritten (or just the improved version)
- Annotations: "We moved your conclusion to slide 2" / "We added an executive summary" / "We restructured around SCQA"
- User can accept, reject, or tweak changes

**2. Saved Brand Template**
- Available in template picker for all future decks
- Named after the source: "Acme Consulting Brand" 
- Editable — user can adjust colors, fonts, layouts
- Preview: sample slides showing the template applied

---

## User Experience Flow

```
Upload PPT → Processing (30-60s) → Results Screen
                                      ├── "Your Rewritten Deck" (view / edit / download)
                                      └── "Your Brand Template" (saved / preview / customize)
```

### Results Screen
- **Left panel:** Rewritten deck preview with change annotations
- **Right panel:** Extracted template with sample slides
- **Actions:** 
  - "Use this deck" → opens in editor
  - "Start a new deck with this template" → Profile → Assemble with template pre-selected
  - "Save template for later" → added to template library

---

## Combines with WOW #1

When Audience Profiling (WOW #1) + Deck Intelligence (WOW #2) work together:

1. User uploads their firm's existing deck → template extracted
2. User creates new deck → Profile step researches the audience
3. Assemble uses SCQA tailored to the audience
4. Generate outputs in the user's own brand template

The result: a consulting-grade, audience-tailored deck that looks like it came from *their* firm. That's the full SlideHeroes promise.

---

## Open Questions

1. **PPT parsing depth** — how well can we read complex PowerPoint files? Charts, SmartArt, animations, grouped objects?
2. **Rewrite quality bar** — how aggressive should the rewrite be? Light touch ("restructured your flow") vs. heavy ("rewrote your content")?
3. **Multiple uploads** — if they upload 5 decks, do we extract one merged template or offer choices?
4. **Template fidelity** — how close can we get to pixel-perfect reproduction of their brand? What's "good enough"?
5. **Comparison view** — before/after side-by-side, or just show the improved version?
6. **Enterprise use case** — can a team admin upload the "official template" once for the whole org?

---

## Technical Considerations

- **PPT parsing:** python-pptx for structure, possibly LibreOffice for rendering fidelity checks
- **Master slide extraction:** read slide masters, layouts, theme XML from .pptx
- **Content analysis:** LLM-powered — send slide text + structure, get back narrative assessment + rewrite
- **Template generation:** map extracted design tokens to SlideHeroes template format
- **RAG integration:** uploaded deck content feeds into the RAG system for future reference

---

## Success Metrics

- **Upload rate:** % of users who upload an existing deck in first session
- **Rewrite acceptance:** % of suggested changes users keep
- **Template reuse:** % of future decks that use an extracted template
- **Conversion:** upload users vs. non-upload users — retention difference
- **Time to value:** how fast from upload → "this is better than my original"

---

## Complete WOW Roadmap

| # | WOW | Description |
|---|-----|-------------|
| **1** | **Audience Profiling** | Research who you're presenting to → tailor everything |
| **2** | **Deck Intelligence** | Upload PPT → rewrite content + extract brand template |
| 3 | Brief-to-SCQA | One sentence → full consulting framework + outline |
| 4 | Time Saved Counter | "You've saved X hours ($Y)" with consulting economics |
| 5 | URL-to-Deck | Paste any URL → instant presentation |
| 6 | Role-Based Smart Start | Role at signup → tailored templates |
| 7 | Smart Suggestions | After a deck → AI suggests the next one you need |
