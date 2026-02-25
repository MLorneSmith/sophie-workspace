# Research: LinkedIn / person+company data providers (for WOW #1 Audience Profiling)

Date: 2026-02-17 (UTC)

## Goal
Identify practical options to power SlideHeroes **person + company research** for Audience Profiling (WOW #1), with an emphasis on:
- structured data (person title/role history/company info)
- scalability + reliability
- legal/compliance risk
- developer-friendly API access

## Executive takeaway
If we want **scalable, API-first enrichment** without requiring “bring your own LinkedIn account/cookies”, **Proxycurl** is the most straightforward baseline.

Tools like **PhantomBuster** can work for **small-scale, manual/ops workflows** but introduce “BYO LinkedIn account” constraints and higher ban/TOS risk if used as core infrastructure.

For “non-LinkedIn” enrichment at very large scale (and often with phones/emails), consider broader enrichment vendors (e.g., **People Data Labs**, **Apollo**, **ZoomInfo**) depending on budget and compliance posture.

## Options (quick comparison)

### 1) Proxycurl (API-first LinkedIn enrichment)
**What it is:** API product for retrieving structured person/company profile data based on LinkedIn URLs (and related endpoints).

**Pros**
- Developer-first API and scalable infrastructure.
- Does **not** require bringing your own LinkedIn account/cookies.
- Fast at scale (API throughput vs “browser automation”).

**Cons / risks**
- Still LinkedIn-adjacent data acquisition; needs careful legal/compliance review.
- Pricing varies by endpoint/credits; can be confusing without a usage model.

**Notes (from third-party comparison)**
- Third-party comparison highlights Proxycurl as oriented to **public profile** style retrieval + enrichment and better for scaling vs “BYO account scrapers”.

Source: https://nubela.co/blog/proxycurl-api-vs-phantombusters-linkedin-profile-scraper/

### 2) PhantomBuster (automation/scraping workflows)
**What it is:** UI-driven automation platform with “phantoms” for LinkedIn (profile scraper, company scraper, etc.).

**Pros**
- Great for quick experiments and non-technical ops workflows.
- Good when you need browser-like automation.

**Cons / risks**
- Generally requires **bringing your own LinkedIn account/session cookies**.
- Scaling limited by LinkedIn account constraints and ban risk.
- Higher compliance/TOS risk if used as core product infrastructure.

Source: https://nubela.co/blog/proxycurl-api-vs-phantombusters-linkedin-profile-scraper/

### 3) People Data Labs (PDL) (broad person/company enrichment)
**What it is:** Large enrichment API (person + company datasets) typically not “pure LinkedIn scraping” but aggregates from multiple sources.

**Pros**
- Very broad coverage; often includes rich fields.
- Strong developer story.

**Cons / risks**
- Might not reliably return “LinkedIn-like narrative” details we want (published content, nuanced role context) without additional web research.
- Cost can rise quickly at scale.

(Need follow-up research focused on specific endpoints + pricing + match rates for our target ICP.)

### 4) Apollo / Lusha / ZoomInfo (sales intelligence platforms)
**What they are:** Sales databases that provide contacts + sometimes phones/emails + firmographics.

**Pros**
- Good for outbound sales workflows (phones/emails).
- Often have Chrome extensions and list-building.

**Cons / risks**
- More “sales intel” than “audience reasoning context”; may not map cleanly to SlideHeroes’ profiling brief.
- Per-seat pricing and usage policies can constrain embedding into a SaaS product.

(See general enrichment API comparisons; needs deeper, vendor-specific research.)

## Key decision factors for SlideHeroes

### A) Product architecture fit
We likely need two layers:
1) **Structured enrichment** (names, titles, company basics) for deterministic UX.
2) **Web research summarization** (strategy, recent news, priorities, likely objections) via web fetch/search + LLM.

A pure enrichment provider won’t cover (2) well; we still need a research engine.

### B) Compliance posture
We should decide explicitly:
- Are we comfortable with “LinkedIn URL → structured profile” providers?
- Do we require GDPR/CCPA claims + DPA availability?
- Do we need a “no scraping / only licensed data” posture for enterprise?

### C) Scale + reliability
For core product features, avoid anything that:
- requires storing LinkedIn cookies
- depends on headless browser automation
- limits throughput per account

## Recommended next steps
1) **Pick 2 candidates to validate quickly** (suggestion: Proxycurl + People Data Labs).
2) Define the **Audience Brief minimal schema** and map which fields come from (a) enrichment vs (b) research.
3) Run a small experiment:
   - 25 target profiles (a mix of consultants + corporate execs)
   - measure: field coverage, freshness, failure rate, latency, and cost per profile
4) In parallel: do the legal/TOS review task (#516) so we don’t build on shaky ground.
