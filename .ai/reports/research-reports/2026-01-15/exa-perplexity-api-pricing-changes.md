# Exa Research: Perplexity API Pricing and Availability Changes (2024-2025)

**Date**: 2026-01-15
**Agent**: exa-expert
**Search Types Used**: Neural, Keyword, Answer, Get Contents

## Query Summary

Research into Perplexity API pricing changes, deprecation notices, and availability changes between 2024 and 2025.

## Key Findings

### 1. Pricing Structure (Current as of January 2026)

#### Subscription Plans
| Plan | Price | Notes |
|------|-------|-------|
| Standard (Free) | $0/month | Unlimited quick searches, 3 Pro searches/day |
| Pro | $20/month | Unlimited Pro searches, advanced AI models |
| Enterprise Pro | $40/month/user | Business features |
| Max | $200/month | Early access, priority support |

#### API Pricing (Token-Based)
| Model | Input (per 1M tokens) | Output (per 1M tokens) | Notes |
|-------|----------------------|------------------------|-------|
| Sonar | $1.00 | $1.00 | Lightweight, cost-effective (Jan 2025) |
| Sonar Pro | $3.00 | $15.00 | Advanced search (Mar 2025) |
| Sonar Reasoning Pro | $2.00 | $8.00 | Multi-step reasoning (Mar 2025) |
| Sonar Deep Research | $2.00 | $8.00 | + $5/1K search queries (Mar 2025) |
| Sonar Pro Search | $3.00 | $15.00 | (Oct 2025) |

#### Search API
- **Price**: $5.00 per 1,000 requests
- No additional token costs for Search API

### 2. Model Deprecations

#### sonar-reasoning Model (DEPRECATED)
- **Deprecation Date**: December 15, 2025
- **Status**: Removed from API
- **Migration Path**: Users should migrate to `sonar-reasoning-pro`
- **Improvement**: Enhanced multi-step reasoning capabilities with web search

### 3. Usage Tiers System

The API uses a tiered system based on cumulative spending:

| Tier | Cumulative Spend | Access Level |
|------|-----------------|--------------|
| Tier 0 | $0 | New accounts, limited access |
| Tier 1 | $50+ | Light usage |
| Tier 2 | $250+ | Regular usage |
| Tier 3 | $500+ | Heavy usage |
| Tier 4 | $1,000+ | Production usage |
| Tier 5 | $5,000+ | Enterprise usage |

**Important**: Tier progression is based on total credits purchased over account lifetime, not current balance.

### 4. Authentication Changes

- **No major authentication changes** were announced for 2024-2025
- API key management remains consistent:
  - Keys generated through API Portal
  - Standard security practices (rotation, secure storage)
  - OpenAI SDK compatibility maintained

### 5. New Features (2025)

1. **Media Classifier** - Intelligently incorporates visual content (images/videos) into responses
2. **Sonar Pro API** - Generally available with enhanced search capabilities
3. **Citation tokens** - No longer charged for standard Sonar and Sonar Pro models (cost reduction)

### 6. Free Tier Status

- **The free tier has NOT been discontinued**
- Free plan includes:
  - Unlimited Quick Searches (basic model)
  - 5 Pro Searches per day
  - Limited file uploads (5MB per file, 3 files/day)

## Important Pricing Changes Summary

1. **July 2025**: New pricing tiers introduced/updated
2. **January 2025**: Sonar model released at $1/1M tokens
3. **March 2025**: Sonar Pro, Sonar Reasoning Pro, Sonar Deep Research released
4. **October 2025**: Sonar Pro Search released
5. **December 2025**: sonar-reasoning model deprecated

## Sources

| Source | URL | Relevance |
|--------|-----|-----------|
| Perplexity Official Pricing | https://docs.perplexity.ai/guides/pricing | High |
| Perplexity Changelog | https://docs.perplexity.ai/changelog/changelog | High |
| Rate Limits & Tiers | https://docs.perplexity.ai/guides/rate-limits-usage-tiers | High |
| PriceTimeline Analysis | https://pricetimeline.com/data/price/perplexity | Medium |
| PricePerToken Tracking | https://pricepertoken.com/pricing-page/provider/perplexity | Medium |
| API Key Management | https://docs.perplexity.ai/guides/api-key-management | Medium |

## Conclusions

1. **No free tier discontinuation** - The free tier remains available with limitations
2. **One model deprecation** - `sonar-reasoning` deprecated Dec 15, 2025, migrate to `sonar-reasoning-pro`
3. **Pricing evolution** - Multiple new models introduced throughout 2025 with varying price points
4. **No authentication changes** - API key system remains consistent
5. **Cost reduction** - Citation tokens no longer charged for standard models

## Recommendations

- If using `sonar-reasoning`, migrate to `sonar-reasoning-pro` immediately
- Review tier structure if approaching usage thresholds
- Consider Sonar model ($1/1M tokens) for high-volume, simple Q&A use cases
- Enable automatic top-up to avoid service interruptions
