# Website Visitor Identification Tools Research Report
**Date:** 2026-02-12
**Researcher:** Subagent (visitor-id-research)
**Requestor:** SlideHeroes (pre-beta SaaS startup)

---

## Executive Summary

This report analyzes three website visitor identification tools for SlideHeroes' specific needs:
- Pre-beta stage with low traffic
- US-focused visitor identification
- Data feeds into BigQuery for ICP scoring
- PostHog integration required
- Attio CRM integration needed

---

## Tool Analysis

### 1. RB2B — Person-Level Visitor Identification

#### Pricing
| Plan | Price | Credits | Key Features |
|-------|--------|---------|--------------|
| Free | $0/month | 150 credits/month, Slack delivery, LinkedIn profiles, unlimited users |
| Pro | $129/year ($10.75/mo) | 300 credits/month, Hot Pages/Hot Leads, CSV download, pageview history, repeat visitor tracking |
| Pro+ | $299/year ($24.92/mo) | 1,000 credits/month, Deep HubSpot integration, Outreach.io/Salesloft integrations, Webhook push |
| Custom | Quote | 2,000+ credits |

**Triggers for upgrade:** Need CSV export, pageview history, repeat visitor tracking, filtering capabilities, CRM integrations beyond Slack.

#### How It Works
- **Technical approach:** Places tracking pixel/code in website header
- **Method:** Uses first-party data (cookies, IP addresses, device IDs) combined with proprietary publisher network
- **Geographic scope:** US visitors only (to avoid GDPR restrictions)
- **Identification:** Matches visitors to LinkedIn profiles

#### Data Provided
| Field | Availability |
|--------|--------------|
| Person name | ✅ |
| Job title | ✅ |
| LinkedIn profile | ✅ |
| Company name | ✅ |
| Company size, industry, location | ✅ |
| Revenue | ✅ |
| Email address | ❌ (no email addresses provided) |
| Pageview history | ✅ (Pro+ only) |
| Repeat visitor tracking | ✅ (Pro+ only) |

#### Integration Status

| Platform | Native Integration | Alternative Path |
|----------|-------------------|------------------|
| PostHog | ❌ | Webhook → PostHog (custom implementation) |
| BigQuery | ❌ | Webhook → Cloud Function → BigQuery, or CSV export |
| Attio CRM | ❌ | Zapier or webhook (if Attio has webhook support) |
| HubSpot | ✅ | Deep integration (Pro+ only) |
| Slack | ✅ | Native |
| Zapier | ✅ | Native (Pro plans) |
| Clay | ✅ | Native (Pro plans) |
| Apollo.io | ✅ | Native (Pro plans) |

**Local implementation (this repo):**
- Bash loader: `scripts/import-rb2b-csv-to-bigquery.sh`
- Internal Tools UI: `slideheroes-internal-tools/app` → `/rb2b-import` (uploads RB2B CSV and runs the loader)
- Target table: raw CSV → BigQuery *staging* dataset (autodetect schema for initial ingestion)


#### GDPR Compliance
- **EU visitors:** Not tracked (US-only to avoid GDPR)
- **Compliance:** CCPA/CPRA compliant (California state laws)
- **Consent:** No consent requirements for US visitors
- **Data handling:** Limited to US-based IP addresses

#### Quality & Accuracy
- **Match rates (claimed):** 10-20% person-level identification
- **Reddit user feedback:** "70 to 80 percent from RB2B probably means 70 to 80 percent of identifiable traffic, not total visitors, which is a huge difference"
- **User feedback highlights:**
  - Pros: Easy setup, lead generation, personalized experiences
  - Cons: Limited integrations, credit pricing can be expensive at scale

#### Fit for Early-Stage SaaS
**Verdict: ✅ GOOD FIT for pre-beta**

- ✅ Free tier available (150 credits/month - generous for low traffic)
- ✅ No credit card required
- ✅ Simple setup (just add tracking code)
- ✅ Person-level data (not just company)
- ✅ Unlimited users
- ⚠️ Limited to US visitors (may be acceptable for SlideHeroes' needs)
- ⚠️ No email addresses provided
- ⚠️ No native PostHog or BigQuery integration (requires custom development)
- ⚠️ BigQuery export requires webhook implementation or CSV manual import

---

### 2. Koala — Intent Signals + Visitor Identification for PLG

**Important Note:** Research revealed multiple tools named "Koala":
- **koala.sh:** AI content writing tool (not relevant)
- **koala-apps.io:** Shopify spy/analysis tool (not relevant)
- **PLG Developer Intent Koala:** The tool referenced in reo.dev article as a developer intent platform

Based on available information about the PLG-focused Koala:

#### Pricing
**Not available publicly** - requires contacting sales. The reo.dev article describes Koala as "a great starting point for early-stage DevTool teams exploring intent-based GTM" but notes limitations at scale.

#### How It Works
- **Primary focus:** Developer intent tracking for PLG companies
- **Data sources:** GitHub activity (stars, forks, PRs, issues, comments)
- **Integration methods:** SDK installation or connection to analytics tools (Segment, Rudderstack, Heap, etc.)
- **Server-side:** Supports server-side data delivery for client-side tracking limitations

#### Data Provided
| Field | Availability |
|--------|--------------|
| GitHub activity | ✅ |
| Stars, forks, PRs | ✅ |
| Open-source install attribution | ❌ (misses npm, Docker, pip installs) |
| In-product signals (SDK, API, CLI) | ❌ |
| Person identification | ❌ |
| Company identification | ❌ |
| Enriched profiles | ❌ |

#### Limitations (per reo.dev analysis)
1. **Custom Product Usage Signals:** Misses deeper in-product signals like SDK imports, API calls, CLI usage
2. **OSS Install Attribution:** No native support for npm, Docker, PyPI, Maven install tracking
3. **Flexible Scoring Models:** Uses fixed scoring (no custom funnel stages or signal weights)
4. **Champion-Level Insight:** Doesn't identify who's behind activity (no enriched profiles, titles, org mapping)
5. **Actionable GTM Playbooks:** Basic alerts only

#### Integration Status

| Platform | Native Integration | Notes |
|----------|-------------------|--------|
| PostHog | Unknown | Likely via Segment or custom integration |
| BigQuery | Unknown | Likely requires custom export |
| Attio CRM | Unknown | Likely via Zapier or API |
| Segment | ✅ | Supported |
| Rudderstack | ✅ | Supported |
| Heap | ✅ | Supported |

#### GDPR Compliance
**Information not available** - would require direct inquiry with the company.

#### Quality & Accuracy
**No public match rate data available.** The reo.dev article focuses on feature limitations rather than performance metrics.

#### Fit for Early-Stage SaaS
**Verdict: ⚠️ UNCLEAR FIT for SlideHeroes**

- ❌ Limited public information on pricing
- ❌ No evidence of company/person-level identification
- ❌ GitHub-focused (may not match SlideHeroes' use case if not developer tool)
- ❌ Missing critical integrations for SlideHeroes' stack
- ✅ Supports Segment (which could connect to PostHog)
- ⚠️ Fixed scoring models (less flexible for custom ICP)
- ⚠️ Designed for DevTools/OSS companies

**Recommendation:** Direct inquiry with Koala needed to determine if it fits SlideHeroes' requirements. If SlideHeroes is not a developer tool with active GitHub community, Koala is likely not the right choice.

---

### 3. Clearbit Reveal (HubSpot Breeze Intelligence)

#### Pricing
| Plan | Price | Credits | Features |
|-------|--------|---------|-----------|
| Free | $0 | 25 credits/month (lead discovery, visitor ID, list building in HubSpot) |
| Growth | $150-$275/month | 125-1,000 credits |
| Business | Custom (volume-based) | Unlimited credits, company/contact enrichment, lead scoring |
| Breeze Intelligence (HubSpot) | $45-$50/month | 100 credits, plus HubSpot subscription required |

**Note:** Clearbit was acquired by HubSpot in 2023 and is now branded as "Breeze Intelligence." Pricing is tied to HubSpot tiers.

#### How It Works
- **Technical approach:** Reverse IP lookup to company databases
- **Method:** Matches IP addresses to company profiles using B2B data network
- **Form enrichment:** Shortens HubSpot forms by autofilling known company data
- **Scope:** Global company identification (not person-level)

#### Data Provided
| Field | Availability |
|--------|--------------|
| Company name | ✅ |
| Company size, industry, location | ✅ |
| Employee count | ✅ |
| Revenue | ✅ |
| Technologies used | ✅ |
| Contact enrichment | ✅ (only when email provided or form filled) |
| Person name | ❌ (company-level only) |
| Email addresses | ✅ (via enrichment, not visitor ID) |
| LinkedIn profiles | ✅ (via enrichment) |

#### Integration Status

| Platform | Native Integration | Alternative Path |
|----------|-------------------|------------------|
| PostHog | ❌ | Via Segment → PostHog (requires custom setup) |
| BigQuery | ⚠️ | Via HubSpot → BigQuery (if using HubSpot), or custom API |
| Attio CRM | ❌ | Zapier or HubSpot → Attio sync (if available) |
| HubSpot | ✅ | Native (full integration) |
| Salesforce | ✅ | Native |
| Marketo | ✅ | Native |
| Pardot | ✅ | Native |
| Segment | ✅ | Native |

#### GDPR Compliance
- **EU visitors:** Supported, but limited compared to European-focused tools
- **Compliance:** GDPR and CCPA compliant
- **Consent:** Respects cookie consent preferences
- **Data location:** US-based data centers

#### Quality & Accuracy
- **Match rates:** ~20% for company-level identification
- **Database:** 20M+ companies, 200M+ contacts
- **Reddit feedback:** "Intent signals can be improved," "many duplicates" in enrichment
- **G2 reviews:** Confusion around credit-based billing, quality varies

#### Fit for Early-Stage SaaS
**Verdict: ⚠️ MODERATE FIT for pre-beta**

- ✅ Free tier available (25 credits/month)
- ❌ Company-level only (no person identification)
- ❌ Requires HubSpot subscription for full Breeze Intelligence features
- ❌ Expensive for early-stage (Growth starts at $150/month + HubSpot costs)
- ⚠️ BigQuery integration requires HubSpot platform investment
- ⚠️ Complex credit-based pricing
- ✅ Strong API for custom integrations
- ✅ Rich company data for enrichment

**Recommendation:** If SlideHeroes is already using HubSpot, Clearbit/Breeze is worth considering. If not, it's likely overkill and expensive for pre-beta stage.

---

## Newer Tools (2025-2026)

### Notable Emerging Tools:

#### Leadpipe
- **Match rate:** Claims 40%+ (3x more than competitors)
- **Person-level:** ✅ Yes
- **Pricing:** Free trial (500 leads), then custom
- **Fit:** Good for higher identification rates

#### Vector
- **Match rate:** 15-30% (US-only)
- **Person-level:** ✅ Yes
- **Pricing:** $4,500/quarter or $15,000/year
- **Fit:** Expensive for early-stage

#### Reo.dev
- **Focus:** Developer-native intent platform
- **Features:** GitHub activity, OSS install attribution (40+ package managers), product usage telemetry
- **Best for:** DevTool and OSS companies
- **Fit:** For SlideHeroes only if building for developers

#### Pocus
- **Focus:** Product-led growth (PLG) specifically
- **Features:** Product usage tracking, custom scoring, PQLs
- **Best for:** PLG SaaS teams
- **Fit:** Could be relevant if SlideHeroes has strong product telemetry

---

## Comparison Table

| Feature | RB2B | Koala (PLG) | Clearbit/Breeze |
|----------|--------|----------------|-----------------|
| **Pricing - Free Tier** | 150 credits/mo | Unknown | 25 credits/mo |
| **Pricing - Paid Start** | $129/year | Contact sales | $150/month |
| **Identification Level** | Person (US-only) | Intent/Activity signals | Company (global) |
| **Match Rate** | 10-20% | Unknown | ~20% |
| **Email Provided** | ❌ | ❌ | ✅ (enrichment) |
| **LinkedIn Profile** | ✅ | ❌ | ✅ (enrichment) |
| **PostHog Integration** | ❌ (webhook only) | Unknown (via Segment?) | ❌ (via Segment) |
| **BigQuery Integration** | ❌ (webhook/CSV) | Unknown | ⚠️ (via HubSpot) |
| **Attio Integration** | ❌ (via Zapier) | Unknown | ❌ (via Zapier/HubSpot) |
| **GDPR Compliance** | US-only (avoids EU) | Unknown | GDPR/CCPA compliant |
| **Fit for Low Traffic** | ✅ | ⚠️ | ⚠️ (credit limits) |
| **Setup Complexity** | Low | Unknown | Medium |

---

## Integration Path Recommendations

### For BigQuery Export

**Option 1: Webhook → Cloud Function → BigQuery**
```
Visitor ID Tool → Webhook → Google Cloud Function → BigQuery
```
- Works with: RB2B (Pro+), Koala (if supported), Clearbit (via API)
- Effort: Medium (requires development)
- Real-time: ✅

**Option 2: Periodic CSV Export → BigQuery Load**
```
Visitor ID Tool → CSV → Scheduled Job → BigQuery
```
- Works with: RB2B (Pro), most tools
- Effort: Low
- Real-time: ❌ (batch)

**Option 3: HubSpot → BigQuery (if using HubSpot)**
```
Clearbit → HubSpot → BigQuery (native)
```
- Works with: Clearbit/Breeze only
- Effort: Low
- Real-time: Near real-time

### For PostHog Integration

**Option 1: Webhook → PostHog HTTP API**
```
Visitor ID Tool → Webhook → PostHog Identify/Track events
```
- Effort: Low-Medium
- Real-time: ✅

**Option 2: Segment Bridge (if supported)**
```
Visitor ID Tool → Segment → PostHog (as destination)
```
- Works with: Koala (likely), Clearbit
- Effort: Low
- Real-time: ✅

### For Attio Integration

**Option 1: Zapier**
```
Visitor ID Tool → Zapier → Attio CRM
```
- Effort: Low
- Real-time: Near real-time
- Cost: Zapier subscription

**Option 2: Attio Webhook → Custom Handler**
```
Visitor ID Tool → Attio Webhook → Custom Function
```
- Effort: Medium
- Real-time: ✅
- Cost: Free (development time only)

---

## Recommendation for SlideHeroes

### Primary Recommendation: **RB2B (Start with Free Tier)**

**Why RB2B fits SlideHeroes' pre-beta stage:**

1. **Cost-effective:** Free tier with 150 credits/month is generous for low traffic
2. **No commitment:** No credit card required to start
3. **Person-level data:** Provides individual names and LinkedIn profiles
4. **US-focused:** Matches SlideHeroes' need for US visitor identification
5. **Simple setup:** One-line tracking code, fast deployment
6. **Upgrade path:** Clear upgrade triggers when credits become limiting

### Implementation Plan:

**Phase 1: Validation (Week 1-2)**
- Install RB2B free tier
- Collect initial data
- Verify match rates for SlideHeroes' traffic
- Test webhook integration to BigQuery (custom)

**Phase 2: ICP Scoring (Week 3-4)**
- Export visitor data to BigQuery
- Join with PostHog event data
- Build ICP scoring models
- Identify high-intent visitors

**Phase 3: Scale (Month 2+)**
- Evaluate credit usage
- If >150/month, upgrade to Pro ($129/year)
- Implement Attio sync via Zapier
- Build automated outreach workflows

### Alternative: Clearbit (If HubSpot User)

If SlideHeroes is already using HubSpot:
- Evaluate Clearbit's free tier (25 credits)
- Test Breeze Intelligence form shortening
- Consider if HubSpot → BigQuery is acceptable data path

### Not Recommended: Koala

- Insufficient public information for evaluation
- Designed for DevTools/OSS companies
- Unclear if it matches SlideHeroes' use case
- Would require direct sales inquiry

---

## Key Risks & Considerations

### Common Across All Tools:
1. **Match Rate Realism:** Vendors often claim 70-80% match rates, but this typically refers to "identifiable traffic" not total visitors. Expect 10-20% person-level, 20-40% company-level.
2. **Credit Consumption:** Credits are consumed per identification, not per visitor. High-traffic sites burn credits quickly.
3. **Remote Workers:** Match rates drop significantly for visitors on home networks vs corporate networks.
4. **Integration Complexity:** Native integrations are limited. Expect custom development work for BigQuery/PostHog.

### RB2B Specific:
- No email addresses provided
- US-only (EU visitors ignored)
- Credits don't roll over
- Pro+ required for HubSpot integration

### Clearbit Specific:
- Company-level only (no person names)
- Requires HubSpot platform investment
- Complex pricing with multiple add-ons
- Lower EU coverage than European alternatives

---

## Next Steps

1. **Implement RB2B free tier** for initial testing
2. **Build webhook → BigQuery pipeline** for visitor data
3. **Create ICP scoring model** joining RB2B + PostHog data
4. **Monitor match rates** for 30 days to validate ROI
5. **Re-evaluate at scale** (when credits exceed free tier)

---

## Questions for Vendor Evaluation

When talking to sales reps:
- What is the actual match rate for B2B SaaS traffic?
- Do you offer BigQuery native export or roadmap plans?
- Can you provide sample data structure for API integration?
- What happens to credits when identification fails?
- Do you offer startup programs or discounts for early-stage companies?
- What's the retention rate for identified data?

---

## References

Sources consulted:
- RB2B: b2bfusiongroup.com, coldiq.com, marketbetter.ai, leadpipe.com
- Clearbit/Breeze: cognism.com, swordfish.ai, hubspot.com documentation
- Koala: reo.dev, opentools.ai, finsmes.com
- Comparison reviews: marketbetter.ai, zoominfo.com, leadpipe.com
- User feedback: Reddit (r/b2bmarketing, r/hubspot)
- Integrations: zapier.com, attio.com documentation

---

*End of Report*
