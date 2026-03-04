# Perplexity Research: Company Logo APIs Comparison 2026

**Date**: 2026-03-03
**Agent**: perplexity-expert
**Search Type**: Chat API (sonar-pro, 3 queries)

## Query Summary

Researched the best free/freemium company logo APIs available in 2026 for use in a startup SaaS product.
Specifically compared Clearbit Logo API, Brandfetch, Logo.dev, Google Favicon API, and alternatives.
Verified pricing, free tier limits, attribution requirements, commercial use restrictions, and integration quality.

---

## Critical Finding: Clearbit Logo API is DEAD (as of Dec 2025)

The classic logo.clearbit.com free API has been sunset as of December 1, 2025 after HubSpot acquired
Clearbit. It is now a legacy product bundled only in paid HubSpot enrichment suites.
Do not use Clearbit Logo API for new projects. Logo.dev was built explicitly as the replacement.

---

## API Comparison Table

| API | Free Tier | Paid Plans | Attribution Required | Coverage | SVG | Best For |
|-----|-----------|-----------|----------------------|----------|-----|----------|
| Logo.dev | 500K req/mo (w/ attribution) | $280/yr (1M), $1,260/yr (5M) | Yes (free tier) | 10M+ logos | Yes | General SaaS, fintech (ticker/ISIN) |
| Brandfetch | 500K-1M req/mo (fair use) | $99/mo (10K) | No | 5M+ logos (89% coverage) | Yes | Design-rich SaaS, brand metadata |
| Clearbit | RETIRED Dec 1, 2025 | HubSpot paid suites only | N/A | 3M+ logos (was B2B focused) | Unknown | Legacy only - avoid |
| Google Favicon API | Unlimited free | None | No | Universal (all domains) | No (PNG only) | Fallback/basic use only |
| Brand.dev | Not confirmed | Unknown | Unknown | Unknown | Unknown | Brandfetch alternative |

---

## Detailed Notes Per API

### Logo.dev

- Free tier: 500,000 requests/month with required attribution ("Powered by Logo.dev" badge/link)
- Paid: $280/year for 1M req (Startup), $1,260/year for 5M req (Pro), Enterprise custom
- Attribution in practice: A visible "Powered by Logo.dev" link near logo displays, typically in
  footer. Paid plans are completely white-label.
- Coverage: 10M+ logos, strongest on established companies. Weaker on startups and international brands.
- Integration: URL-based. No official SDK needed. Very easy to integrate as a Next.js Image src.
  Format: https://img.logo.dev/{domain}?token=YOUR_KEY
- Quality: Vector-first (SVG). Fast CDN, under 100ms avg response.
- Special features: Ticker symbol search (great for fintech), ISIN support.
- Commercial SaaS use: Yes, allowed on free tier with attribution.
- Verdict: Best all-around choice. The 500K/mo free tier is extremely generous for a startup.

### Brandfetch

- Free tier: 500K-1M requests/month under "fair use" policy. No attribution required.
- Paid: $99/month starting
- Coverage: 5M+ logos, claims 89% coverage rate. Real-time brand indexing.
- Integration: Official JavaScript SDK available. Returns full brand package: logos + colors + fonts.
- Quality: SVG support. Slower than Logo.dev at ~200ms avg.
- Special features: Returns brand metadata beyond just logos (brand colors, font info, multiple
  logo variants like dark/light). Excellent for design-forward SaaS.
- Commercial SaaS use: Yes, no explicit commercial restrictions. GDPR-compliant.
- Verdict: Best for SaaS that needs brand consistency data beyond just a logo image.

### Google Favicon API

- URL: https://www.google.com/s2/favicons?domain=example.com&sz=64
- Free tier: Completely free, no API key needed, no documented rate limits
- Coverage: Universal - every domain with a favicon
- Quality: Low - favicons only (16-256px PNG), not official brand logos
- Use case: Only suitable as a fallback when logo APIs return no result
- Verdict: Use only as last-resort fallback. Not suitable as primary logo source.

### Clearbit Logo API (logo.clearbit.com) - DEPRECATED

- Status: Sunset December 1, 2025. No longer operational as a standalone free API.
- Action required: Migrate to Logo.dev (the de facto replacement).

### Brand.dev

- Positioned as a Brandfetch alternative with claimed better performance and costs.
- Insufficient data to fully evaluate - treat as "worth investigating" if Brandfetch has issues.

---

## Note on "Quikturn"

Multiple AI-generated comparisons cited "Quikturn" as having 17M+ logos and a 500K free tier.
This appears to be AI hallucination - this service could not be verified as having an established
track record. Do not plan around Quikturn without manually verifying it at quikturn.com first.

---

## Recommendation for a Startup SaaS Product

Recommended Approach: Logo.dev as Primary + Google Favicon as Fallback

Why Logo.dev:
1. 500K free requests/month - enough for a startup through significant growth
2. Clean URL-based integration, works perfectly as Next.js Image src
3. No SDK required, minimal code
4. 10M+ logos covers the vast majority of real-world companies
5. Attribution requirement is manageable on free tier (one "Powered by" badge)
6. Proven, actively maintained, specifically built to replace Clearbit

When to Choose Brandfetch Instead:
- Need brand color palettes to auto-theme UI per company
- Need multiple logo variants (dark mode, stacked, icon-only)
- Want zero attribution requirement even on free tier
- Need brand font information

### Upgrade Path

| Stage | Solution | Cost |
|-------|---------|------|
| Pre-launch / early growth | Logo.dev free with attribution | $0 |
| ~1M+ req/month | Logo.dev Startup | $280/yr ($23/mo) |
| Need brand metadata | Brandfetch | $99/mo |

---

## Key Takeaways

- Clearbit is dead - sunset Dec 2025. Migrate immediately if you use it.
- Logo.dev is the clear winner for startup SaaS: 500K free req/month, great coverage, simple integration
- Brandfetch is the better choice if you need brand metadata (colors, fonts, variants)
- Google Favicon is a free fallback only - not suitable as a primary logo source
- Always implement a fallback chain: Logo.dev -> Google Favicon -> initials avatar
- Logo.dev free tier attribution is a small trade-off for a very generous free limit

## Sources & Citations

- Logo.dev official documentation and pricing: https://logo.dev
- Brandfetch API documentation: https://brandfetch.com/developers
- Clearbit sunset announcement (post HubSpot acquisition): referenced in multiple comparisons
- Google Favicon API: https://www.google.com/s2/favicons?domain=example.com

## Related Searches

- Logo.dev SDK integration Next.js TypeScript
- Brandfetch brand colors API Next.js
- Company logo fallback strategy missing logos
- Brand.dev API pricing review 2026
