# AEO Requirements

Every blog post MUST include these elements for Answer Engine Optimization.

## 1. TL;DR Section

**Purpose**: AI citation, featured snippets, quick scanning

**Requirements**:
- 80-100 words (self-contained paragraph)
- Immediately after title in rendered page
- Covers key user benefits
- Can stand alone as quotable text
- No bullet points (use flowing prose)

**Example**:
> SlideHeroes v2.0 introduces AI Slide Generation, a breakthrough in presentation creation. AI Slide Generation automatically transforms your ideas, documents, and outlines into professionally designed slides--complete with layouts, visuals, and speaker notes. Your team can now create presentations 10x faster, maintain brand consistency, and focus on storytelling instead of formatting. This release marks our shift from manual design to intelligent presentation authoring.

## 2. Excerpt

**Purpose**: Listing pages, RSS feeds, social sharing

**Requirements**:
- Max 300 characters
- Different from seo.metaDescription
- Entices click-through
- 2-3 complete sentences

## 3. FAQ Section

**Purpose**: FAQPage schema, featured snippets, voice search

**Requirements**:
- 3-5 questions per post
- Questions match real search queries ("How do I...", "What is...")
- Answers are complete and self-contained (2-3 sentences)
- Each answer works without surrounding context

**Category-specific FAQ focus**:
| Category | FAQ Focus |
|----------|-----------|
| Technology | Implementation, architecture, scaling |
| Company | Impact, timeline, vision |
| Product | Pricing, migration, compatibility |

## 4. Meta Description

**Requirements**:
- Exactly 150-160 characters
- Include primary keyword
- Match actual content
- End with benefit or CTA

## 5. Three-CTA Pattern

Blog posts should include contextual CTAs:

1. **Above the fold**: After TL;DR (+18% opt-in rate)
2. **Mid-content**: Most relevant section (+32% conversions)
3. **End of post**: Strong close (45% of total conversions)

**CTA types**:
- `lead-magnet`: Download, template, checklist
- `signup`: Free trial, demo request
- `docs`: Documentation link

## 6. Internal Links

Link to 3-5 related docs:
- Feature docs: `/docs/features/{feature}`
- API reference: `/docs/api-reference/{endpoint}`
- Quick start: `/docs/get-started/quickstart`
- Pricing: `/pricing`

## 7. External Citations

**Minimum**: 5+ external sources for credibility (E-E-A-T)

**Source types**:
- Research papers (arXiv, Google Research)
- Industry reports (Gartner, Forrester)
- Technical documentation (MDN, official docs)
- News sources (TechCrunch, The Verge)

## 8. Author Attribution

Every post includes author bio with E-E-A-T signals:
- Name and role
- Years of experience
- Relevant expertise
- LinkedIn (optional)

Currently hardcoded to: **Jeevan Pillay, Founder**

## SEO Checklist

### Required Fields
- [ ] `tldr`: 80-100 words, self-contained summary
- [ ] `excerpt`: Max 300 chars, distinct from metaDescription
- [ ] `seo.metaDescription`: 150-160 chars with keyword
- [ ] `seo.focusKeyword`: Primary keyword selected
- [ ] `seo.faq`: 3-5 Q&A pairs

### Content Requirements
- [ ] 3-5 internal links to docs
- [ ] 5+ external citations
- [ ] Code examples (Technology posts)
- [ ] Focus keyword used naturally (2-3 times)
- [ ] Author bio at end
