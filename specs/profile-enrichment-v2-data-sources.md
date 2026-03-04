# Spec: Profile Enrichment v2 — New Data Sources

**Date:** 2026-03-03 (updated 2026-03-03 20:00 EST)
**Author:** Sophie (with Mike)
**Status:** Draft — decisions captured
**Area:** Profile Stage — Company/Audience Research Pipeline

---

## Overview

Extend the Profile stage's company enrichment pipeline with three new free data sources to produce richer, more credible company briefs. These sources complement the existing stack (Netrows/LinkedIn, Apollo.io, Brave Search) by adding financial data, regulatory filings, and deeper website intelligence.

### Current Pipeline (v1)

```
User Input (person + company)
    ↓
┌─────────────────────────────────────────────────────────┐
│  Parallel Enrichment                                    │
│  ├── Netrows API (person profile + company details)     │
│  ├── Apollo.io API (company financials + tech stack)    │
│  ├── Brave Search (news + industry context)             │
│  └── Website fetch (homepage content)                   │
└─────────────────────────────────────────────────────────┘
    ↓
LLM Synthesis → CompanyBrief (archetype, situation, implications)
    ↓
LLM Synthesis → AudienceBrief (communication profile, recommendations)
```

### Proposed Pipeline (v2)

```
User Input (person + company)
    ↓
┌─────────────────────────────────────────────────────────┐
│  Parallel Enrichment                                    │
│  ├── Netrows API (person profile + company details)     │
│  ├── Apollo.io API (company financials + tech stack)    │
│  ├── Brave Search (news + industry context)             │
│  ├── Website Deep Scrape (about, news, careers, blog)   │  ← NEW
│  ├── Alpha Vantage (financial snapshot)*                │  ← NEW
│  └── SEC EDGAR (risk factors, strategy, financials)*    │  ← NEW
└─────────────────────────────────────────────────────────┘
    ↓
LLM Synthesis → Enhanced CompanyBrief
    ↓
LLM Synthesis → AudienceBrief

* = public companies only (conditional)
```

---

## Data Source 1: Website Deep Scrape

### What It Adds
Currently we fetch the homepage via Brave Search's content extraction. A targeted deep scrape would capture:
- **About/Mission** — company values, leadership messaging, positioning
- **Newsroom/Press** — recent announcements, product launches, exec quotes
- **Careers/Jobs** — what they're hiring reveals strategic priorities (hiring 50 AI engineers vs. cutting sales tells you everything)
- **Blog** — thought leadership topics, what narrative they're pushing
- **Investor Relations** — for public companies, links to earnings, annual reports

### API / Access
- **Cost:** Free (web fetch)
- **Auth:** None
- **Rate limits:** Standard HTTP, respect robots.txt
- **Availability:** Universal (every company has a website)

### Implementation

#### New Service: `website-deep-scrape.service.ts`

```typescript
// Location: apps/web/app/home/(user)/ai/_lib/server/website-deep-scrape.service.ts

export interface WebsiteDeepScrapeResult {
  domain: string;
  scrapedAt: Date;
  pages: {
    about: string | null;       // /about, /about-us, /company
    newsroom: string | null;    // /news, /newsroom, /press, /press-releases
    careers: string | null;     // /careers, /jobs, /join-us
    blog: string | null;        // /blog, /insights, /resources
    investors: string | null;   // /investors, /investor-relations, /ir
  };
  jobPostings: string[];        // extracted job titles from careers page
  recentPressReleases: string[]; // titles from newsroom
}
```

**Approach:**
1. Receive company domain (already available from Apollo/Netrows)
2. Fetch homepage HTML, extract all internal links
3. Match links against known path patterns for each category:
   ```
   about:     /about, /about-us, /company, /who-we-are
   newsroom:  /news, /newsroom, /press, /press-releases, /media
   careers:   /careers, /jobs, /join, /join-us, /work-with-us, /open-positions
   blog:      /blog, /insights, /resources, /articles, /thought-leadership
   investors: /investors, /investor-relations, /ir, /shareholders
   ```
4. If no link match found, try common paths directly (e.g., `domain.com/about`)
5. Fetch top match per category (max 5 pages total)
6. Extract readable content, truncate each page to ~2,000 chars
7. Parse job titles from careers page (look for `<h2>`, `<h3>`, job listing patterns)
8. Parse press release titles from newsroom (look for article headings with dates)

**Timeouts:** 3s per page fetch, 15s total for all pages. Any page that fails is `null`.

**Content extraction:** Use a lightweight HTML-to-text approach (strip tags, extract meaningful text). Same pattern as existing `web_fetch` utility.

**Privacy:** Only fetch publicly accessible pages. Respect `robots.txt`. No authentication bypass.

### Data Flow Into Synthesis

Add to `CompanyResearchInput`:
```typescript
websiteDeepScrape?: {
  aboutContent: string | null;
  newsroomContent: string | null;
  careersContent: string | null;
  blogContent: string | null;
  investorsContent: string | null;
  jobPostings: string[];
  recentPressReleases: string[];
};
```

**Synthesis prompt additions:**
- About page → feeds "company positioning" and "values/culture" sections
- Careers/job postings → feeds "strategic priorities" inference ("They're hiring heavily in AI/ML, suggesting a technology transformation")
- Newsroom → feeds "recent developments" with primary sources (not just Brave Search snippets)
- Blog → feeds "thought leadership topics" and "narrative they're pushing"

---

## Data Source 2: Alpha Vantage — Financial Snapshot

### What It Adds
Hard financial data for public companies: stock performance, revenue, margins, market cap, analyst consensus. Replaces Apollo's estimated revenue ranges with actual reported figures. Enables the LLM to make data-backed archetype classifications.

### API / Access
- **Cost:** Free (25 requests/day, 5/minute)
- **Auth:** API key (free registration at alphavantage.co)
- **Rate limits:** 25 req/day on free tier — sufficient (each profile needs 2-3 calls max)
- **Availability:** US-listed public companies + many international exchanges

### Endpoints We'd Use

#### ~~a) Symbol Search~~ — REMOVED (see Ticker Resolution below)

Ticker resolution is now handled by SEC EDGAR's `company_tickers.json` file (free, no API key, no rate limit). This saves 1 Alpha Vantage call per profile, doubling our effective daily capacity from ~12 to ~25 profiles/day on the free tier.

#### b) Company Overview — fundamental data (the only AV call we need)
```
GET https://www.alphavantage.co/query?function=OVERVIEW&symbol=MSFT&apikey=KEY
```
Returns (key fields):
- `MarketCapitalization`, `EBITDA`, `PERatio`, `PEGRatio`
- `RevenueTTM`, `GrossProfitTTM`, `ProfitMargin`, `OperatingMarginTTM`
- `ReturnOnEquityTTM`, `ReturnOnAssetsTTM`
- `RevenuePerShareTTM`, `EPS`, `DividendPerShare`, `DividendYield`
- `52WeekHigh`, `52WeekLow`, `50DayMovingAverage`, `200DayMovingAverage`
- `AnalystTargetPrice`, `AnalystRatingStrongBuy/Buy/Hold/Sell/StrongSell`
- `Beta`, `SharesOutstanding`
- `Sector`, `Industry`, `Description`, `Exchange`, `Currency`
- `LatestQuarter`, `FiscalYearEnd`

#### c) Global Quote (optional) — real-time price
```
GET https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=MSFT&apikey=KEY
```
Returns current price, daily change %, volume.

### Implementation

#### New Service: `alpha-vantage.service.ts`

```typescript
// Location: apps/web/app/home/(user)/ai/_lib/server/alpha-vantage.service.ts

export interface AlphaVantageFinancials {
  configured: boolean;
  isPublicCompany: boolean;
  ticker: string | null;
  data: {
    // Identity
    name: string;
    exchange: string;
    sector: string;
    industry: string;
    description: string;
    // Valuation
    marketCap: number | null;
    peRatio: number | null;
    pegRatio: number | null;
    // Revenue & Profit
    revenueTTM: number | null;
    grossProfitTTM: number | null;
    profitMargin: number | null;
    operatingMargin: number | null;
    ebitda: number | null;
    eps: number | null;
    // Performance
    fiftyTwoWeekHigh: number | null;
    fiftyTwoWeekLow: number | null;
    fiftyDayMA: number | null;
    twohundredDayMA: number | null;
    beta: number | null;
    // Analyst
    analystTargetPrice: number | null;
    analystConsensus: {
      strongBuy: number;
      buy: number;
      hold: number;
      sell: number;
      strongSell: number;
    } | null;
    // Dividends
    dividendYield: number | null;
    // Metadata
    latestQuarter: string | null;
    fiscalYearEnd: string | null;
  } | null;
  error?: string;
}
```

**Ticker resolution strategy (unified — shared with SEC EDGAR):**

We use SEC EDGAR's `company_tickers.json` as the single source for ticker + CIK resolution. This is free, requires no API key, and solves both Alpha Vantage (needs ticker) and SEC EDGAR (needs CIK) in one step.

```
GET https://www.sec.gov/files/company_tickers.json
```

Returns ~10K entries, each with `company_name`, `ticker`, and `cik_str`. We:
1. Download and cache locally (refresh weekly, ~2MB file)
2. Fuzzy-match the target company name against the cached list
3. If strong match found → we have both ticker (for AV) and CIK (for EDGAR)
4. If no match → company is likely private, skip AV + EDGAR entirely
5. Cache resolved mappings in Supabase `ticker_mappings` table (30-day TTL)

**Fallback if fuzzy match is ambiguous:**
- Yahoo Finance autocomplete (unofficial but reliable): `query2.finance.yahoo.com/v1/finance/search?q=CompanyName` — no key needed
- Cross-reference with Apollo data (website domain, industry) to pick the right match

This approach means **zero Alpha Vantage calls are spent on ticker resolution** — each profile costs exactly 1 AV call (`OVERVIEW`), giving us ~25 profiles/day on free tier.

**Caching:** Cache Alpha Vantage results in `company_briefs` table (or a new `company_financials` table) with 24-hour TTL. Financial data doesn't change faster than daily for our purposes.

### Data Flow Into Synthesis

Add to `CompanyResearchInput`:
```typescript
financialData?: {
  ticker: string;
  marketCap: number | null;
  revenueTTM: number | null;
  profitMargin: number | null;
  peRatio: number | null;
  fiftyTwoWeekHigh: number | null;
  fiftyTwoWeekLow: number | null;
  analystConsensus: string;  // e.g. "12 Buy, 5 Hold, 1 Sell"
  beta: number | null;
  dividendYield: number | null;
};
```

**Synthesis prompt additions:**
- Revenue + margins → hard numbers for "financial health" assessment
- Stock vs. 52-week range → momentum indicator ("trading near 52-week high = confidence")
- Analyst consensus → external validation of trajectory
- PE ratio vs. industry → "market expects growth" or "valued as mature"
- Beta → risk profile of the company
- Dividend yield → shareholder return strategy

---

## Data Source 3: SEC EDGAR — Strategic Filings

### What It Adds
Direct access to what executives tell regulators about their strategy, risks, and performance. This is the single most authoritative source for understanding a US public company's priorities, because they're legally required to be truthful.

### API / Access
- **Cost:** Free (US government, public data)
- **Auth:** None (just requires `User-Agent` header with contact email)
- **Rate limits:** 10 requests/second (very generous)
- **Availability:** US-registered public companies (SEC filers)

### Endpoints We'd Use

#### a) Company Search — resolve name → CIK number
```
GET https://efts.sec.gov/LATEST/search-index?q="Microsoft"&dateRange=...
```
Or use the company tickers JSON:
```
GET https://www.sec.gov/files/company_tickers.json
```
Returns CIK numbers mapped to tickers. Can cross-reference with Alpha Vantage ticker.

#### b) Company Submissions — filing index
```
GET https://data.sec.gov/submissions/CIK{10-digit-padded}.json
```
Returns all recent filings with form types, dates, accession numbers. We filter for:
- `10-K` (annual report) — primary target
- `10-Q` (quarterly) — fallback if 10-K is >6 months old
- `8-K` (material events) — optional, for very recent developments

#### c) Filing Document — fetch specific filing
Using the accession number from submissions, construct document URL:
```
GET https://www.sec.gov/Archives/edgar/data/{CIK}/{accession}/{document}
```

#### d) Company Facts — structured XBRL data
```
GET https://data.sec.gov/api/xbrl/companyfacts/CIK{10-digit-padded}.json
```
Returns all structured financial disclosures (revenue, net income, assets, etc.) as time series. Useful for trend analysis without parsing filing text.

### Implementation

#### New Service: `sec-edgar.service.ts`

```typescript
// Location: apps/web/app/home/(user)/ai/_lib/server/sec-edgar.service.ts

export interface SECEdgarResult {
  isSecFiler: boolean;
  cik: string | null;
  ticker: string | null;
  filings: {
    latestAnnualReport: {
      formType: string;        // "10-K" or "10-Q"
      filedDate: string;
      periodOfReport: string;
      // Extracted sections (text, truncated to ~token budget)
      riskFactors: string | null;        // Item 1A
      businessDescription: string | null; // Item 1
      mdAndA: string | null;             // Item 7 (Management Discussion & Analysis)
    } | null;
    recentMaterialEvents: Array<{
      formType: string;        // "8-K"
      filedDate: string;
      description: string;     // first ~500 chars
    }>;
  };
  financialFacts: {
    // From XBRL companyfacts — last 4 periods
    revenueHistory: Array<{ period: string; value: number }>;
    netIncomeHistory: Array<{ period: string; value: number }>;
    totalAssetsLatest: number | null;
    totalDebtLatest: number | null;
  } | null;
  error?: string;
}
```

**CIK resolution strategy:**

Handled by the unified ticker resolution (see Alpha Vantage section above). The same `company_tickers.json` lookup that gives us the ticker also gives us the CIK. No additional API calls needed.

**10-K Section extraction approach:**
1. Fetch the filing index to find the primary document (usually the `.htm` file)
2. Download the HTML document
3. Extract sections by matching standard 10-K headings:
   - `Item 1.` or `Item 1 —` → Business Description
   - `Item 1A.` or `Item 1A —` → Risk Factors
   - `Item 7.` or `Item 7 —` → MD&A
4. Use regex patterns: `/Item\s+1A[\.\s—\-]+Risk\s+Factors/i` through to next `Item` heading
5. Strip HTML tags, normalize whitespace
6. Truncate each section to configurable limit (default: 3,000 chars for risk factors, 4,000 for MD&A, 2,000 for business description)

**XBRL financial facts extraction:**
1. Fetch companyfacts JSON
2. Look for standard US-GAAP concepts:
   - `us-gaap:Revenues` or `us-gaap:RevenueFromContractWithCustomerExcludingAssessedTax`
   - `us-gaap:NetIncomeLoss`
   - `us-gaap:Assets`
   - `us-gaap:LongTermDebt` or `us-gaap:DebtCurrent`
3. Extract last 4 annual periods (10-K filings), sorted by date
4. Return as simple arrays for trend analysis

**10-K parsing fallback (LLM-assisted):**

The regex approach works for ~80% of filings. For the remaining ~20% with non-standard formatting:
1. First attempt: regex-based section extraction (fast, no cost)
2. If regex fails to find a section (returns null for Risk Factors or MD&A):
   - Send the first ~8,000 chars of the filing to the LLM with a targeted extraction prompt
   - Prompt: "Extract the Risk Factors section from this 10-K filing. Return only the extracted text, no commentary."
   - Use the same model/config as the synthesis step
3. Cap the LLM fallback to 1 attempt per section, with a 10s timeout
4. If both regex and LLM fail → that section is `null` (graceful degradation)

This adds ~1-2s and minimal cost for the ~20% of filings that need it, while keeping the fast path free.

**Timeouts:** 5s for submissions lookup, 10s for filing document fetch, 15s total budget (excluding LLM fallback, which has its own 10s budget).

**Caching:** Cache extracted filing data in Supabase with TTL = 7 days (filings don't change often). Key by CIK + form type.

### Data Flow Into Synthesis

Add to `CompanyResearchInput`:
```typescript
secFilings?: {
  riskFactors: string | null;
  businessDescription: string | null;
  mdAndA: string | null;
  revenueHistory: Array<{ period: string; value: number }>;
  netIncomeHistory: Array<{ period: string; value: number }>;
  recentMaterialEvents: string[];
};
```

**Synthesis prompt additions:**
- Risk factors → "What keeps leadership up at night" — directly informs presentation framing
- MD&A → Strategic priorities in the company's own words
- Revenue/income trend → growth trajectory with hard numbers over multiple periods
- Material events (8-K) → Very recent developments (M&A, leadership changes, restructuring)
- Business description → How the company describes itself to regulators (often more honest than marketing copy)

---

## Integration: Updated Research Flow

### Modified `research-audience.action.ts`

The main changes to the existing action:

```typescript
// New parallel enrichment block (additions marked with ←)
const [
  webResearch,
  apolloResult,
  websiteDeepScrape,    // ← NEW
  alphaVantageResult,   // ← NEW (conditional)
  secEdgarResult,       // ← NEW (conditional)
] = await Promise.allSettled([
  withTimeout(researchCompany(data.company, industry, domain), 15_000, "Web research"),
  apolloPromise,
  withTimeout(deepScrapeWebsite(domain), 15_000, "Website deep scrape"),          // ← NEW
  isLikelyPublic ? withTimeout(getFinancials(data.company), 10_000, "Alpha Vantage") : Promise.resolve(null),  // ← NEW
  isLikelyPublic ? withTimeout(getSecFilings(data.company, ticker), 20_000, "SEC EDGAR") : Promise.resolve(null),  // ← NEW
]);
```

### Public Company Detection

Before firing Alpha Vantage + SEC EDGAR, we need to determine if the company is likely public. Heuristic:

```typescript
function isLikelyPublicCompany(
  apolloData?: ApolloEnrichmentResult,
  netrowsData?: NetrowsCompanyDetails,
): boolean {
  // Apollo signals
  if (apolloData?.organization?.funding_stage === 'ipo') return true;
  if (apolloData?.organization?.crunchbase_url) {
    // Could check for IPO status, but funding_stage is usually enough
  }

  // Employee count heuristic — very large companies are usually public
  const employees = apolloData?.organization?.employee_count
    ?? netrowsData?.staffCount;
  if (employees && employees > 5000) return true;

  // Revenue heuristic
  if (apolloData?.organization?.annual_revenue &&
      apolloData.organization.annual_revenue > 100_000_000) return true;

  return false;
}
```

**Better approach (Phase 2):** Use the Alpha Vantage `SYMBOL_SEARCH` itself as the detector. If it returns a strong match (high score, exact name match), the company is public. If no match, skip SEC EDGAR too. This is 1 API call.

### Sequencing Strategy

To avoid burning Alpha Vantage's 25/day limit on private companies:

```
Phase 1 (parallel):
  - Netrows (person + company)
  - Apollo (company enrichment)
  - Brave Search (news + industry)
  - Website Deep Scrape ← always runs

Phase 2 (conditional, after Phase 1 partial results):
  - If isLikelyPublicCompany(apolloResult):
    - Alpha Vantage: SYMBOL_SEARCH → OVERVIEW
    - SEC EDGAR: submissions → 10-K extraction → XBRL facts
  - Else: skip financial sources

Phase 3:
  - LLM Synthesis with all available data
```

This means the total pipeline time for private companies stays roughly the same (just adds the website scrape). For public companies, it adds ~5-10s for the financial data fetches.

### Updated Synthesis Prompt

The `company-brief-synthesis.service.ts` prompt needs to be updated to incorporate the new data. Key additions to the system prompt:

```
If financial data is provided (public company):
- Use actual revenue figures, not estimates
- Note revenue and income trends over the past 4 periods
- Interpret analyst consensus and stock performance
- Factor PE ratio and margins into the archetype classification

If SEC filing data is provided:
- Risk factors reveal the company's own assessment of threats — use these to inform
  "challenges" and "topics to acknowledge" in the presentation implications
- MD&A reveals strategic priorities in management's own words — use for "strategic focus"
- Prefer filing language over news snippets for strategic direction (it's more authoritative)

If website deep scrape data is provided:
- Job postings reveal investment areas — infer strategic priorities
- Blog/thought leadership topics show what narrative they're pushing publicly
- About page language reveals how they want to be perceived
- Newsroom items are primary sources — prefer over Brave Search snippets
```

### Updated `CompanyBrief` Type

Add new optional sections:

```typescript
export interface CompanyBrief {
  // ... existing fields ...

  financialSnapshot?: {                    // ← NEW
    revenueTTM: string;                    // formatted, e.g. "$198.3B"
    profitMargin: string;                  // e.g. "36.7%"
    revenueGrowth: string;                // e.g. "+12% YoY"
    marketCap: string;                     // e.g. "$3.1T"
    analystSentiment: string;              // e.g. "Strongly positive (28 Buy, 3 Hold, 1 Sell)"
    stockPerformance: string;              // e.g. "Trading near 52-week high"
  };

  strategicPriorities?: {                  // ← NEW
    fromFilings: string[];                 // extracted from MD&A
    fromJobPostings: string[];             // inferred from hiring patterns
    fromBlog: string[];                    // topics they're pushing
  };

  riskProfile?: {                          // ← NEW
    keyRisks: string[];                    // from 10-K Item 1A
    regulatoryExposure: string;            // from risk factors
  };
}
```

---

## New Environment Variables

```env
# Alpha Vantage (free tier)
ALPHA_VANTAGE_API_KEY=          # Get from: https://www.alphavantage.co/support/#api-key

# SEC EDGAR (no key needed, just contact email)
SEC_EDGAR_CONTACT_EMAIL=        # Required in User-Agent header per SEC fair access policy

# No new keys needed for website deep scrape (uses standard HTTP fetch)
```

---

## Caching Strategy

| Data Source | Cache Location | TTL | Key |
|-------------|---------------|-----|-----|
| Website Deep Scrape | `company_briefs` table (new column) | 7 days | company_domain |
| Alpha Vantage | New `company_financials` table | 24 hours | ticker |
| SEC EDGAR (filing text) | New `company_sec_filings` table | 7 days | CIK + form_type |
| SEC EDGAR (XBRL facts) | Same table | 7 days | CIK |
| Ticker → CIK mapping | New `ticker_mappings` table | 30 days | ticker |
| company_tickers.json | Local file cache | 7 days | static |

---

## Error Handling Philosophy

All three new sources are **non-blocking**. If any source fails:
- Log a warning
- Pass `null` for that source's data into synthesis
- The LLM works with whatever data is available (graceful degradation)
- The existing sources (Netrows, Apollo, Brave) still produce a usable brief

This matches the existing pattern — Apollo already fails gracefully, and the brief is generated even if all enrichment fails.

---

## Token Budget

The synthesis prompt is already substantial. With three new sources, we need to manage input size:

| Source | Max Chars | ~Tokens |
|--------|-----------|---------|
| Existing (Netrows + Apollo + Brave + website) | ~8,000 | ~2,000 |
| Website Deep Scrape (5 pages × 2,000 chars) | ~10,000 | ~2,500 |
| Alpha Vantage (structured numbers) | ~1,000 | ~250 |
| SEC Risk Factors | ~3,000 | ~750 |
| SEC MD&A | ~4,000 | ~1,000 |
| SEC Business Description | ~2,000 | ~500 |
| SEC XBRL (4 periods × 2 metrics) | ~500 | ~125 |
| **Total new data** | **~20,500** | **~5,125** |
| **Total all sources** | **~28,500** | **~7,125** |

With system prompt + output, total synthesis call ≈ 9-10K tokens input. Well within limits for any model. Cost per synthesis call at current rates: negligible.

---

## Implementation Order

**Phase 1: Website Deep Scrape** (lowest risk, highest immediate value, no API key needed)
- New service file
- Integration into parallel enrichment
- Updated synthesis prompt
- No new env vars or DB tables needed (reuse company_briefs)

**Phase 2: Alpha Vantage** (simple API, structured data, small implementation)
- New service file
- Ticker resolution + caching
- New `company_financials` table migration
- Updated synthesis prompt with financial data
- New env var: `ALPHA_VANTAGE_API_KEY`

**Phase 3: SEC EDGAR** (most complex — filing parsing, XBRL extraction)
- New service file
- CIK resolution + caching
- 10-K section extraction logic (regex-based)
- XBRL companyfacts parsing
- New `company_sec_filings` table migration
- Updated synthesis prompt with filing data
- New env var: `SEC_EDGAR_CONTACT_EMAIL`

---

## Success Metrics

How we'd know these sources are adding value:

1. **Company Brief quality** — A/B test briefs with and without new sources. Do users rate the enhanced brief as more useful?
2. **Archetype accuracy** — For public companies, does the financial data improve archetype classification? (e.g., fewer "stable-mature" companies that are actually in trouble)
3. **Presentation relevance** — Do presentations created with enhanced profiles better address the audience's actual concerns?
4. **Coverage** — What % of companies successfully return data from each source?
   - Website scrape: should be ~95%+ (nearly universal)
   - Alpha Vantage: ~30-40% of companies (public only)
   - SEC EDGAR: ~30-40% (US public only, overlaps with AV)

---

## Decisions (2026-03-03)

1. **UI presentation** — ✅ DECIDED: Everything stays synthesized. Raw enrichment data (job postings, press releases, financials) feeds into the LLM synthesis only. Users see the CompanyBrief output, not raw sources.

2. **Alpha Vantage daily limit** — ✅ RESOLVED: Ticker resolution moved to SEC EDGAR's `company_tickers.json` (free, no API key). Each profile now costs 1 AV call instead of 2, giving ~25 profiles/day on free tier. Sufficient for launch.

3. **International coverage** — ✅ DECIDED: US-only for now (Alpha Vantage + SEC EDGAR). International equivalents (UK Companies House, EU ESMA, etc.) are a future phase.

4. **10-K parsing reliability** — ✅ DECIDED: Regex-based extraction as primary, with LLM fallback for the ~20% of filings with non-standard formatting. See implementation details in SEC EDGAR section.
