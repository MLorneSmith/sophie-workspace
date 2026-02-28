# SlideHeroes SEO Audit Checklist

**Purpose:** Comprehensive SEO audit and optimization guide for slideheroes.com.

**Created:** 2026-02-27
**Task:** #160
**Status:** Ready for implementation (post-product launch)

---

## 1. Technical SEO Foundation

### A. Core Web Vitals
- [ ] **LCP (Largest Contentful Paint)** < 2.5s
- [ ] **FID (First Input Delay)** < 100ms
- [ ] **CLS (Cumulative Layout Shift)** < 0.1
- [ ] Test with PageSpeed Insights
- [ ] Monitor in Search Console

### B. Site Architecture
- [ ] XML sitemap at `/sitemap.xml`
- [ ] robots.txt properly configured
- [ ] Canonical URLs on all pages
- [ ] HTTPS enforced (redirect HTTP)
- [ ] www/non-www redirect consistent
- [ ] Clean URL structure (no query params for content)

### C. Next.js Specific
- [ ] Use `next/image` for all images (auto optimization)
- [ ] Implement `next/font` for font optimization
- [ ] Enable static generation where possible (SSG)
- [ ] Use ISR for semi-dynamic content
- [ ] Implement proper `metadata` API (not deprecated `head`)
- [ ] Preload critical assets

### D. Mobile-First
- [ ] Responsive design on all pages
- [ ] Mobile-friendly navigation
- [ ] Touch targets ≥ 48px
- [ ] No horizontal scroll
- [ ] Test with Google Mobile-Friendly Test

---

## 2. On-Page SEO

### A. Title Tags
- [ ] Unique title on every page
- [ ] 50-60 characters optimal
- [ ] Primary keyword near beginning
- [ ] Brand name at end (| SlideHeroes)
- [ ] No duplicate titles

### B. Meta Descriptions
- [ ] Unique description on every page
- [ ] 150-160 characters optimal
- [ ] Include primary keyword
- [ ] Compelling CTA
- [ ] No duplicate descriptions

### C. Heading Structure
- [ ] Single H1 per page (matches title intent)
- [ ] Logical H2-H6 hierarchy
- [ ] Keywords in headings (natural)
- [ ] No skipping levels (H1 → H3)

### D. Content Quality
- [ ] 300+ words on main pages
- [ ] 1000+ words on pillar content
- [ ] Original content (no duplication)
- [ ] Readable at 8th grade level
- [ ] Broken into scannable sections

### E. Internal Linking
- [ ] Link to related content
- [ ] Descriptive anchor text
- [ ] No orphan pages
- [ ] Breadcrumb navigation
- [ ] Footer links to key pages

---

## 3. Target Keywords

### Primary Keywords (to optimize for)

| Keyword | Intent | Target Page | Priority |
|---------|--------|-------------|----------|
| AI presentation maker | Commercial | /features/ai-presentation | High |
| presentation software | Commercial | /features | High |
| create presentations with AI | Informational | /blog/ai-presentations | Medium |
| business presentation templates | Commercial | /templates | Medium |
| consulting presentation examples | Informational | /blog/consulting-decks | Medium |

### Long-tail Keywords

| Keyword | Intent | Target Page |
|---------|--------|-------------|
| how to create professional slides fast | Informational | /blog/fast-slides |
| AI tool for pitch decks | Commercial | /features/pitch-deck |
| presentation design tips for consultants | Informational | /blog/consultant-tips |
| turn content into slides automatically | Commercial | /features/ai-presentation |

---

## 4. Page-Specific Optimization

### Homepage (/)
- [ ] Title: "AI Presentation Software | Create Professional Slides Fast | SlideHeroes"
- [ ] H1: "Create Stunning Presentations with AI"
- [ ] Meta description with primary value proposition
- [ ] Clear CTA above the fold
- [ ] Social proof section

### Features Page (/features)
- [ ] Unique sections for each feature
- [ ] Schema markup for SoftwareApplication
- [ ] Screenshots with alt text
- [ ] Internal links to feature detail pages

### Pricing Page (/pricing)
- [ ] Schema markup for Product/Offer
- [ ] Clear pricing tiers
- [ ] FAQ section with FAQ schema
- [ ] Comparison table

### Blog (/blog)
- [ ] Category pages with descriptions
- [ ] Author pages with bios
- [ ] Publication dates visible
- [ ] Related posts section
- [ ] Social sharing buttons

### Testimonials (/testimonials)
- [ ] Review schema markup
- [ ] Real customer names/companies
- [ ] Video testimonials if available

---

## 5. Schema Markup

### Required Schema Types

```json
// Organization (on homepage)
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "SlideHeroes",
  "url": "https://slideheroes.com",
  "logo": "https://slideheroes.com/logo.png",
  "sameAs": [
    "https://twitter.com/slideheroes",
    "https://linkedin.com/company/slideheroes"
  ]
}

// SoftwareApplication (on features page)
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "SlideHeroes",
  "applicationCategory": "BusinessApplication",
  "operatingSystem": "Web",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD"
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.8",
    "ratingCount": "150"
  }
}

// FAQ (on pricing page)
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Is there a free trial?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes, SlideHeroes offers a 14-day free trial..."
      }
    }
  ]
}
```

---

## 6. Image Optimization

### Requirements
- [ ] All images have descriptive alt text
- [ ] Images compressed (WebP format preferred)
- [ ] Responsive images with srcset
- [ ] Lazy loading for below-fold images
- [ ] Descriptive file names (not IMG_1234.jpg)

### Alt Text Examples
- ❌ "image of presentation"
- ✅ "AI presentation software creating slides from outline"
- ✅ "consultant presenting data visualization slide to clients"

---

## 7. Local SEO (if applicable)

- [ ] Google Business Profile claimed
- [ ] NAP consistent everywhere
- [ ] Local business schema
- [ ] Customer reviews on GMB

---

## 8. Content Strategy

### Pillar Pages to Create
1. **"AI Presentation Guide"** - Comprehensive guide to AI-powered presentations
2. **"Consulting Presentation Playbook"** - Industry-specific guide
3. **"Pitch Deck Templates"** - Template resource page
4. **"Presentation Design Principles"** - Educational content

### Blog Content Calendar
- 2-4 posts per week post-launch
- Mix of how-to, industry insights, product updates
- Target long-tail keywords
- Guest posts from consultants/trainers

---

## 9. Tools to Use

| Tool | Purpose | Frequency |
|------|---------|-----------|
| Google Search Console | Monitor performance | Weekly |
| Screaming Frog | Technical audit | Monthly |
| Ahrefs/SEMrush | Keyword research | Weekly |
| PageSpeed Insights | Performance | Weekly |
| Surfer SEO | Content optimization | Per page |
| Schema Validator | Test markup | Per page |

---

## 10. Monitoring & KPIs

### Key Metrics
| Metric | Current | Target (90 days) |
|--------|---------|------------------|
| Organic traffic | 0 | 1,000/mo |
| Indexed pages | ~20 | 50+ |
| Domain rating | N/A | 30+ |
| Avg position (target keywords) | N/A | Top 20 |
| Core Web Vitals pass | Unknown | All green |

### Weekly Checks
- [ ] Search Console for errors
- [ ] New backlinks acquired
- [ ] Ranking changes for target keywords
- [ ] Organic traffic trends

---

## 11. Implementation Priority

### Phase 1: Foundation (Week 1-2)
- [ ] Technical SEO audit
- [ ] Fix critical errors
- [ ] Implement schema markup
- [ ] Optimize core pages (home, features, pricing)

### Phase 2: Content (Week 3-6)
- [ ] Create pillar pages
- [ ] Launch blog with 5-10 posts
- [ ] Optimize existing content
- [ ] Internal linking pass

### Phase 3: Authority (Ongoing)
- [ ] Build backlinks
- [ ] Guest posting
- [ ] Content promotion
- [ ] Monitor and iterate

---

## 12. Next.js Implementation

### Metadata API (app router)
```typescript
// app/layout.tsx
export const metadata: Metadata = {
  title: {
    default: 'AI Presentation Software | SlideHeroes',
    template: '%s | SlideHeroes'
  },
  description: 'Create professional presentations in minutes with AI. SlideHeroes helps consultants, executives, and teams build stunning slides automatically.',
  openGraph: {
    title: 'SlideHeroes - AI Presentation Software',
    description: 'Create professional presentations in minutes with AI.',
    url: 'https://slideheroes.com',
    siteName: 'SlideHeroes',
    images: [{ url: 'https://slideheroes.com/og.png' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SlideHeroes - AI Presentation Software',
    description: 'Create professional presentations in minutes with AI.',
    images: ['https://slideheroes.com/og.png'],
  },
}
```

### Sitemap Generation
```typescript
// app/sitemap.ts
import { MetadataRoute } from 'next/server'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: 'https://slideheroes.com', lastModified: new Date() },
    { url: 'https://slideheroes.com/features', lastModified: new Date() },
    { url: 'https://slideheroes.com/pricing', lastModified: new Date() },
    { url: 'https://slideheroes.com/blog', lastModified: new Date() },
    // Add all pages
  ]
}
```

### Robots.txt
```typescript
// app/robots.ts
import { MetadataRoute } from 'next/server'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/' },
    sitemap: 'https://slideheroes.com/sitemap.xml',
  }
}
```
