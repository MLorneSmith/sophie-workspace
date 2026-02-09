# Presentation Examples Discovery System - Research Findings

**Prepared by Sophie | February 5, 2026**
**Status:** Initial research complete

---

## Executive Summary

Researched sources for high-quality consulting and business presentation examples. Found several excellent curated collections with 600+ freely downloadable decks, plus technical tools for automated discovery via SEC filings.

---

## 1. Primary Sources (Curated Collections)

### Analyst Academy - **⭐ Top Pick**
**URL:** https://www.theanalystacademy.com/consulting-presentations/
**Count:** 600+ presentations
**Firms:** BCG, McKinsey, Deloitte, Bain, and more
**Format:** Direct PDF links
**Quality:** High - real client/industry presentations

Notable features:
- Organized by firm (BCG, McKinsey, Deloitte sections)
- Direct download links to PDFs
- Mix of client deliverables and industry reports
- Examples include city/government projects, industry analyses, COVID response

**Sample BCG decks with direct links:**
- Reshaping NYCHA support functions (2012)
- COVID-19 BCG Perspectives Series
- True-Luxury Global Consumer Insights (multiple editions)
- CEO's Roadmap on Generative AI
- Technology Is the Fast Track to Net Zero

### Slideworks
**URL:** https://slideworks.io/resources/
**Count:** 
- 47 McKinsey presentations
- 105 BCG presentations  
- Bain collection available
**Quality:** High - curated by ex-McKinsey/BCG consultants

Organized collections:
- https://slideworks.io/resources/47-real-mckinsey-presentations
- https://slideworks.io/resources/54-real-bcg-presentations

### SlideScience
**URL:** https://slidescience.co/consulting-presentations/
**Count:** 221+ consulting presentations
**Firms:** McKinsey, Bain, BCG, Kearney, L.E.K, Oliver Wyman, Strategy&
**Format:** Downloadable archive

Specific pages:
- https://slidescience.co/mckinsey-presentations/ (60+ McKinsey)
- https://slidescience.co/bcg-presentations/ (8+ BCG)

### Ampler
**URL:** https://ampler.io/articles/
**Collections:**
- 50+ Free McKinsey PowerPoint Slide Decks
- 60+ Boston Consulting Group (BCG) Slide Decks

---

## 2. SEC EDGAR (Investor Presentations)

### Why SEC Filings?
- S-1 filings contain investor presentations
- High-quality, professionally designed
- Real financial/business data
- Covers tech companies, IPOs, major announcements

### Tools for Automated Download

**sec-edgar Python Library**
```bash
pip install sec-edgar
```
GitHub: https://github.com/sec-edgar/sec-edgar

**SEC API (Commercial)**
- PDF Generator API for converting filings
- Supports all EDGAR form types
- https://sec-api.io/docs/sec-filings-render-api

**Direct EDGAR Access**
- Free access: https://www.sec.gov/edgar.shtml
- Search by company, form type (S-1, 10-K, 8-K)
- Investor presentations often attached as exhibits

### High-Quality SEC Sources
- IPO S-1 filings (Airbnb, DoorDash, Stripe, etc.)
- Quarterly earnings presentations (8-K exhibits)
- Merger/acquisition presentations

---

## 3. GitHub Repositories

### Awesome-Decks
**URL:** https://github.com/rafaecheve/Awesome-Decks
**Content:** Curated list of startup pitch decks
**Focus:** VC-funded startup pitches

### pitch-deck
**URL:** https://github.com/joelparkerhenderson/pitch-deck
**Content:** Pitch deck advice and examples
**Focus:** Startup fundraising

### sec-edgar
**URL:** https://github.com/sec-edgar/sec-edgar
**Content:** Python library for downloading SEC filings
**Use:** Automated bulk download of investor presentations

---

## 4. Other Sources

### SlideShare (Limited)
- Many decks now behind registration wall
- Quality has declined
- Better alternatives available above

### Scribd (Limited)
- Requires subscription for full access
- Some free previews available

### Company IR Pages
- Direct from investor relations sections
- Goldman Sachs: https://www.goldmansachs.com/investor-relations/
- Morgan Stanley: https://www.morganstanley.com/about-us-ir
- Often have earnings presentations, investor days

---

## 5. Quality Criteria for Evaluation

### What Makes a "Great" Example?

**Structure & Organization:**
- Clear narrative flow
- Pyramid principle (conclusion first)
- Logical section progression
- Effective use of executive summary

**Visual Design:**
- Clean, professional layout
- Consistent styling
- Effective use of whitespace
- Quality charts and graphs

**Content Quality:**
- Data-driven insights
- Actionable recommendations
- Clear takeaways per slide
- Evidence-backed arguments

**Relevance to SlideHeroes:**
- Board-level presentations (not just marketing)
- Strategy/transformation topics
- Financial analysis included
- M&A or growth strategy focus

### Scoring Framework (1-5)
| Criterion | Weight |
|-----------|--------|
| Structure & narrative | 25% |
| Visual design quality | 25% |
| Content depth & data | 25% |
| Relevance to target use cases | 25% |

---

## 6. Recommended Implementation Plan

### Phase 1: Bulk Download (Week 1)
1. Scrape Analyst Academy BCG/McKinsey sections
2. Download Slideworks collections
3. Fetch recent SEC S-1 investor presentations
4. Store in organized folder structure

### Phase 2: Cataloging (Week 1-2)
1. Create metadata index (source, date, topic, type)
2. Extract slide count and key themes
3. Tag by industry/topic
4. Build searchable database

### Phase 3: Quality Scoring (Week 2-3)
1. Manual review of top 50 candidates
2. Apply scoring framework
3. Create "gold standard" subset
4. Document why each is exemplary

### Phase 4: Integration (Week 3-4)
1. Add to Context Foundation for content system
2. Build retrieval system for similar examples
3. Create template extraction pipeline
4. Test in content generation workflows

---

## 7. Immediate Next Steps

1. **Start with Analyst Academy** - highest density of quality decks
2. **Build scraper** for automated download with rate limiting
3. **Create storage structure:**
   ```
   presentations/
   ├── bcg/
   ├── mckinsey/
   ├── deloitte/
   ├── sec-filings/
   └── other/
   ```
4. **Metadata schema:**
   ```json
   {
     "id": "uuid",
     "title": "string",
     "source": "bcg|mckinsey|sec|etc",
     "sourceUrl": "url",
     "downloadedAt": "date",
     "fileType": "pdf|pptx",
     "slideCount": "number",
     "topics": ["strategy", "digital", "m&a"],
     "qualityScore": "1-5",
     "notes": "string"
   }
   ```

---

## 8. Open Questions for Mike

1. **Scope:** Focus on MBB only, or include Big 4 (Deloitte, PwC, EY, KPMG)?
2. **Investment banking:** Include Goldman/Morgan Stanley pitch books if found?
3. **Storage:** Local filesystem or cloud (S3/R2)?
4. **Volume goal:** Start with 50-100 or aim higher?
5. **Legal:** Any concerns about hosting/using these for training?

---

*Ready for next phase. Recommend starting with Analyst Academy bulk download.*
