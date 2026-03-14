---
agent: viral
date: 2026-03-12
task_id: 36
type: aeo-optimization
status: complete
title: "AI Search Optimization (AEO) — H1/H2 Structure, FAQs & FAQ Schema"
---

# AI Search Optimization (AEO) for SlideHeroes

## TL;DR

SlideHeroes content is well-written but **not structured for AI answer engines**. Current pages lack question-based headings, FAQ sections, and FAQ schema markup — meaning ChatGPT, Perplexity, and Google AI Overviews are unlikely to cite SlideHeroes in responses. Below: the exact H1/H2 restructuring, FAQ content, and JSON-LD schema to fix that.

---

## 1. Current State Assessment

### What's Working
- Long-form content with genuine expertise (E-E-A-T signals strong)
- Authoritative citations (VCs, consultants, named sources)
- Decent keyword targeting on key pages (pitch deck, BCG review)

### What's Broken for AEO

| Issue | Impact | Pages Affected |
|-------|--------|----------------|
| No question-based H2/H3 headings | AI can't extract clean Q&A pairs | All content pages |
| No FAQ sections | Missing the #1 AEO content format | All pages |
| No FAQPage schema markup | Google won't surface FAQ rich results | All pages |
| H1 tags sometimes missing or non-descriptive | AI tools can't determine page topic quickly | Homepage, blog index |
| No "People Also Ask" targeting | Missing high-intent question queries | Blog posts |

---

## 2. H1/H2 Restructuring — Priority Pages

### Page: Pitch Deck (`/pitch-deck`)

**Current H1:** "Pitch Deck: How To Create The Perfect Funding Proposal"
**Recommended H1:** ✅ Keep (already question-adjacent and keyword-rich)

**Current H2s → Recommended H2s:**

| Current | Recommended (AEO-Optimized) |
|---------|------------------------------|
| "What is a pitch deck?" | ✅ Keep — perfect question format |
| (No H2 for audience section) | **Add:** "Who is the audience for a pitch deck?" |
| (Subsection buried as H4) | **Promote to H2:** "How many slides should a pitch deck have?" |
| (No H2) | **Add:** "What slides should be in a pitch deck?" |
| (No H2) | **Add:** "How do you structure a startup pitch deck?" |
| (No H2) | **Add:** "What makes a pitch deck stand out to investors?" |

**Why:** These map directly to high-volume questions asked in ChatGPT and Google AI Overviews about pitch decks.

---

### Page: BCG Presentation Review (`/presentation-review-bcg`)

**Current H1:** "BCG Presentation Review: Consultant's Tricks Exposed"
**Recommended H1:** "How Does BCG Structure Consulting Presentations? A Slide-by-Slide Review"

**Recommended H2s (add/restructure):**

| H2 | Purpose |
|----|---------|
| "What presentation structure does BCG use?" | Targets AI query about BCG methodology |
| "How does BCG use headlines on slides?" | Targets specific consulting technique |
| "What makes a good consulting presentation summary slide?" | Targets "how to" queries |
| "How does BCG use data charts in presentations?" | Targets chart/data viz queries |
| "What can you learn from BCG's presentation style?" | Wrap-up, citable summary |

---

### Page: Homepage (`/`)

**Current H1:** Unclear / likely missing from rendered content
**Recommended H1:** "Presentation Training for Professionals — Learn to Present Like a Consultant"

**Recommended H2s:**

| H2 | Purpose |
|----|---------|
| "What is SlideHeroes?" | Brand entity definition for AI knowledge graphs |
| "Who is presentation training for?" | Targets broad question queries |
| "What presentation frameworks do consultants use?" | Targets Pyramid Principle / SCQA queries |
| "How does SlideHeroes compare to AI presentation tools?" | Differentiation query — critical for AEO |

---

### Blog Posts (General Pattern)

Every blog post should follow this H-tag formula:

```
H1: [Primary Keyword] — [Benefit or Question]
  H2: What is [topic]?                    ← Definition (AI loves these)
  H2: Why does [topic] matter?            ← Context/importance
  H2: How do you [action related to topic]? ← Tutorial/steps
  H2: [Topic] vs [alternative]            ← Comparison (high AEO value)
  H2: Frequently Asked Questions          ← FAQ section (see below)
```

**Effort:** Medium | **Impact:** High — This is the single biggest structural change for AEO.

---

## 3. FAQ Sections — Content Recommendations

### Pitch Deck Page FAQs

```markdown
## Frequently Asked Questions About Pitch Decks

### How long should a pitch deck be?
A pitch deck should be 10-15 slides. Guy Kawasaki recommends the 10/20/30 rule: 10 slides, 20 minutes, 30-point minimum font. Most VCs see 5,000+ pitches per year — brevity wins.

### What is the best format for a pitch deck?
The most effective format follows: Problem → Solution → Market → Competition → Business Model → Team → Financials → Ask. This is the consensus structure recommended by Sequoia Capital, Y Combinator, and leading VCs.

### Should a pitch deck have a lot of text?
No. Pitch deck slides should be visual with minimal text. Each slide headline should state the key takeaway. Supporting details go in your verbal pitch or appendix, not on the slide.

### How do you present a pitch deck to investors?
Lead with the problem, demonstrate market understanding, show traction (if any), and end with a clear funding ask. Practice the 3-minute version and the 10-minute version. Investors will interrupt — prepare for that.

### What are the most common pitch deck mistakes?
The top mistakes are: no clear problem statement, unrealistic financial projections, too many slides, weak competitive analysis, and not knowing your ask. SlideHeroes' training covers all five.
```

### BCG Review Page FAQs

```markdown
## Frequently Asked Questions About Consulting Presentations

### What is the consulting presentation structure?
Top consulting firms (McKinsey, BCG, Bain) use a situation-complication-resolution structure. Each slide has an action title (headline) that states the takeaway, supported by evidence below. This is sometimes called the Pyramid Principle.

### How do McKinsey and BCG format their slides?
McKinsey and BCG slides follow a consistent format: action title at the top (1-2 lines stating the conclusion), evidence in the body (charts, data, text), and footnotes/sources at the bottom. White space is used deliberately.

### What is an action title in a presentation?
An action title is a slide headline that communicates the "so what" — the key takeaway of the slide. Instead of "Q3 Revenue Data," an action title would be "Q3 revenue grew 15% driven by enterprise expansion." This is standard practice at all top consulting firms.

### How do you make a presentation look like a consulting deck?
Focus on: (1) action titles on every slide, (2) consistent formatting and fonts, (3) footnoted data sources, (4) minimal visual clutter, and (5) a clear storyline structure. SlideHeroes teaches the exact methodology used at McKinsey, BCG, and top investment banks.
```

### Homepage FAQs

```markdown
## Frequently Asked Questions

### What is SlideHeroes?
SlideHeroes is a presentation training platform that teaches professionals the presentation methodology used by McKinsey, Google, and top investment banks. Available 24/7 online with optional live coaching.

### Is SlideHeroes for individuals or teams?
Both. Individuals get self-paced courses with LinkedIn-shareable certification. Teams get a consistent methodology across the organization, with 40-50% less time required than traditional training, plus optional live coaching.

### What presentation methodology does SlideHeroes teach?
SlideHeroes teaches structured communication using the Pyramid Principle, SCQA framework (Situation-Complication-Question-Answer), and action-title slide design — the same frameworks used at McKinsey, BCG, and Bain.

### How is SlideHeroes different from AI presentation tools like Gamma or Beautiful.ai?
AI tools generate slides automatically but don't teach you how to think, structure, or communicate. SlideHeroes teaches the methodology behind great presentations — the "what to say" and "how to structure it" that no AI can replicate. Think of it as the skill layer that makes any tool more effective.
```

**Effort:** Medium | **Impact:** High — FAQs are the #1 content format cited by AI answer engines.

---

## 4. FAQ Schema Markup (JSON-LD)

Add this to the `<head>` of every page that has an FAQ section. Example for the pitch deck page:

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "How long should a pitch deck be?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "A pitch deck should be 10-15 slides. Guy Kawasaki recommends the 10/20/30 rule: 10 slides, 20 minutes, 30-point minimum font. Most VCs see 5,000+ pitches per year — brevity wins."
      }
    },
    {
      "@type": "Question",
      "name": "What is the best format for a pitch deck?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "The most effective format follows: Problem → Solution → Market → Competition → Business Model → Team → Financials → Ask. This is the consensus structure recommended by Sequoia Capital, Y Combinator, and leading VCs."
      }
    },
    {
      "@type": "Question",
      "name": "Should a pitch deck have a lot of text?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "No. Pitch deck slides should be visual with minimal text. Each slide headline should state the key takeaway. Supporting details go in your verbal pitch or appendix, not on the slide."
      }
    },
    {
      "@type": "Question",
      "name": "How do you present a pitch deck to investors?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Lead with the problem, demonstrate market understanding, show traction (if any), and end with a clear funding ask. Practice the 3-minute version and the 10-minute version. Investors will interrupt — prepare for that."
      }
    },
    {
      "@type": "Question",
      "name": "What are the most common pitch deck mistakes?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "The top mistakes are: no clear problem statement, unrealistic financial projections, too many slides, weak competitive analysis, and not knowing your ask."
      }
    }
  ]
}
</script>
```

### Schema for Homepage

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "What is SlideHeroes?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "SlideHeroes is a presentation training platform that teaches professionals the presentation methodology used by McKinsey, Google, and top investment banks. Available 24/7 online with optional live coaching."
      }
    },
    {
      "@type": "Question",
      "name": "What presentation methodology does SlideHeroes teach?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "SlideHeroes teaches structured communication using the Pyramid Principle, SCQA framework (Situation-Complication-Question-Answer), and action-title slide design — the same frameworks used at McKinsey, BCG, and Bain."
      }
    },
    {
      "@type": "Question",
      "name": "How is SlideHeroes different from AI presentation tools like Gamma or Beautiful.ai?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "AI tools generate slides automatically but don't teach you how to think, structure, or communicate. SlideHeroes teaches the methodology behind great presentations — the skill layer that makes any tool more effective."
      }
    },
    {
      "@type": "Question",
      "name": "Is SlideHeroes for individuals or teams?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Both. Individuals get self-paced courses with LinkedIn-shareable certification. Teams get a consistent methodology across the organization, with 40-50% less time required than traditional training, plus optional live coaching."
      }
    }
  ]
}
</script>
```

**Pattern for Neo:** For every page with an FAQ section, generate the corresponding `FAQPage` JSON-LD. Each question `name` must exactly match the rendered H3 text. Each `text` answer should be 1-3 sentences — concise enough for AI to extract verbatim.

**Effort:** Low (template-driven) | **Impact:** High — Enables Google FAQ rich results + signals structure to AI crawlers.

---

## 5. Additional AEO Signals to Implement

| Action | Effort | Impact | Owner |
|--------|--------|--------|-------|
| Add `Organization` schema to homepage with `sameAs` links (LinkedIn, YouTube) | Low | Medium | Neo |
| Add `Course` schema to training pages | Low | Medium | Neo |
| Add author bios with `Person` schema on blog posts | Medium | High | Neo + Hemingway |
| Ensure every blog post has a "Key Takeaways" summary in first 100 words | Low | High | Hemingway |
| Add `dateModified` to all content pages + keep content updated | Low | Medium | Neo |
| Build a dedicated `/faq` page aggregating top questions across all content | Medium | High | Neo + Viral |
| Target "People Also Ask" queries in new blog content | Ongoing | High | Viral → Hemingway |

---

## 6. Priority Rollout Plan

### Week 1: Quick Wins
1. Add FAQ sections to homepage, pitch deck page, BCG review page (content above)
2. Add FAQPage JSON-LD schema to those 3 pages
3. Add Organization schema to homepage

### Week 2: Content Structure
4. Restructure H1/H2 tags on the 3 priority pages per recommendations above
5. Add author bios with Person schema to blog posts
6. Add "Key Takeaways" summaries to existing blog posts

### Week 3-4: Scale
7. Build dedicated /faq page
8. Apply question-based H2 pattern to all remaining blog content
9. Begin targeting "People Also Ask" queries in new blog posts

**Expected results:** FAQ rich results appearing within 2-4 weeks of schema deployment. AI citation improvements harder to measure but should begin within 1-2 model training cycles (3-6 months).

---

## 7. How to Measure AEO Success

| Metric | Tool | Baseline |
|--------|------|----------|
| FAQ rich result appearances | Google Search Console → "FAQ" filter | 0 (currently) |
| AI Overview citations | Manual checks for target queries in Google AI Mode | Not tracked |
| ChatGPT/Perplexity mentions | Monthly manual queries for "best presentation training" etc. | Not tracked |
| Organic clicks from question queries | GSC → query filter for "how", "what", "why" | Establish baseline |

---

*Report generated 2026-03-12 by Viral 🚀. All recommendations are specific to slideheroes.com and based on current site structure analysis + AEO best practices from Semrush, Google's structured data docs, and AI search behavior patterns.*
