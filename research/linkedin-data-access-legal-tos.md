# LinkedIn data access — legal/TOS risk assessment (2026-02-18)

## TL;DR
- **LinkedIn’s User Agreement explicitly forbids scraping/copying profiles and other data using automated tools** (bots, scripts, crawlers, browser plugins, etc.).
- Even if some **public-profile scraping may not trigger CFAA “hacking” liability** under *hiQ v. LinkedIn* (Ninth Circuit; discussed below), **contract/TOS enforcement and other legal risks remain**.
- For SlideHeroes features that want “audience/person/company research,” the lowest-risk path is: **(a) user-provided data + (b) licensed third-party datasets + (c) open web sources**, and **avoid automated LinkedIn collection** unless we obtain explicit permission/partnership.

## What LinkedIn’s User Agreement says (authoritative)
Source: LinkedIn User Agreement (Effective Nov 3, 2025): https://www.linkedin.com/legal/user-agreement

In the “Dos and Don’ts” section (8.2 “Don’ts”), LinkedIn states members will not:
- “**Develop, support or use software, devices, scripts, robots or any other means or processes (such as crawlers, browser plugins and add-ons or any other technology) to scrape or copy the Services, including profiles and other data from the Services**;”
- “Override any security feature or bypass or circumvent any access controls or use limits …”
- “Use bots or other unauthorized automated methods to access the Services … or otherwise drive inauthentic engagement;”

This is the clearest “do not scrape LinkedIn” language and should be treated as the baseline compliance constraint.

## *hiQ v. LinkedIn* (CFAA vs. contract) — why it doesn’t make scraping ‘safe’
A helpful law-firm summary (Fenwick) explains that the Ninth Circuit held that automated capture of data from **publicly accessible webpages** (no login required) does not violate the CFAA’s “without authorization” prong, in light of *Van Buren*.
- Source: Fenwick (Aug 2025 article; discusses April 18, 2022 decision): https://www.fenwick.com/insights/publications/hiq-labs-scrapes-by-again-the-ninth-circuit-reaffirms-that-data-scraping-does-not-violate-the-cfaa-1

Key nuance in Fenwick’s writeup:
- CFAA is an “anti-intrusion” statute; public pages may have “no gates.”
- But it is **not a green light**: copyright, trespass-to-chattels/overload, privacy, and especially **contract/TOS** can still be enforced.
- Fenwick explicitly notes: if a scraper **agrees to a site’s ToS that prohibit scraping**, the site may enforce the contract to stop scraping.

**Practical takeaway:** Even if CFAA risk is lower for *public* pages in some jurisdictions, LinkedIn’s contract terms still forbid it, and LinkedIn is known to actively enforce.

## Practical guidance for SlideHeroes
### 1) Recommended ‘safe’ data sources/approaches
- **User-provided inputs**: role, industry, company name/domain, audience description, goals, geography.
- **Open web**: company websites, press releases, SEC filings/earnings releases, credible news, Wikipedia (as a starting point), etc.
- **Licensed enrichment vendors** (where we have a contract granting rights): e.g., Clearbit (now HubSpot), Apollo, Crunchbase, People Data Labs, etc. (Vendor selection needed.)
- **Manual copy/paste mode**: if a user pastes LinkedIn profile text themselves, we can process *user-supplied* content, but we should avoid encouraging ToS violations.

### 2) “LinkedIn URL in → profile out” is high risk
Any feature that:
- logs into LinkedIn,
- scrapes pages,
- uses browser automation on LinkedIn,
- or buys “scraped LinkedIn” datasets
…creates elevated risk under LinkedIn’s User Agreement and could cause account bans, IP blocks, legal threats, or vendor instability.

### 3) If we *must* incorporate LinkedIn
Options (in increasing risk):
- **Official LinkedIn APIs / partner access** (best, but typically restricted): build around approved endpoints/permissions and comply with caching/display rules.
- **A research agreement / written permission** (LinkedIn UA references exceptions “explicitly permitted … in a separate writing”).
- **Third-party providers that claim compliance**: still requires careful contract review; ensure licensing, provenance, permitted use, retention, and redistribution rights.

## Proposed product/policy guardrails (implementation-friendly)
- Add an internal rule: **“No automated LinkedIn scraping or automation.”**
- For any “profile enrichment,” require data source to be one of:
  1) user-supplied,
  2) open web,
  3) contractually-licensed dataset with documented rights.
- Keep a “Data Source Register” (vendor → allowed fields → permitted use → retention).

## Open questions to bring to Mike
1) Are we trying to support “enter LinkedIn URL and auto-fill persona” (high risk), or “enter company/person name and use open web + licensed vendors” (lower risk)?
2) If LinkedIn is a must-have: do we pursue partner/API access, or accept risk and sandbox it as an internal-only tool?
3) What is our tolerance for account bans and vendor shutdowns?
