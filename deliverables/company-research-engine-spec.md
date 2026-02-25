# Company Research Engine — Spec (MVP → v1)

**Task:** #510 — Build company research engine (web, earnings, news, strategy)

## Goal
Create a repeatable, mostly-automated way to generate a **high-quality company brief** for SlideHeroes work (sales, positioning, competitive intel, pitch decks).

The engine should:
- Accept a company identifier (domain/ticker/company name)
- Gather/refresh key sources (official site, investor relations, filings, earnings, news, competitive landscape)
- Produce a **structured, citeable** research bundle + a human-readable brief
- Store outputs so they can be reused across decks and Mission Control workstreams

Non-goals (MVP): fully autonomous investment-grade analysis; paywalled data scraping; complex entity resolution across subsidiaries.

## Primary User Stories
1. **“I need a fast, credible company overview.”** → 1-page exec summary + key facts with citations.
2. **“I need deck-ready inputs.”** → positioning, strategy, product lines, customers, competitors, narrative angles.
3. **“I need what changed recently.”** → news/earnings deltas since last run.
4. **“I need sources I can trust.”** → every claim has a URL citation (and ideally quote/snippet).

## Inputs
- `company_name` (required unless domain/ticker provided)
- `domain` (preferred; best for web discovery)
- `ticker` (optional; used for filings/earnings)
- `country`/`region` (optional; helps disambiguation)
- `industry` (optional; helps competitor discovery)

## Outputs
### 1) Research Bundle (structured)
A JSON “bundle” that can be saved to disk + indexed in Mission Control:
- `entity`: canonical name, domain(s), ticker(s), identifiers
- `facts`: founded, HQ, employee count (if known), leadership, segments
- `products`: product lines/services + short descriptions
- `customers`: notable customers/segments (if available)
- `strategy`: stated strategy pillars, priorities, bets
- `financials`: revenue ranges/segments, guidance highlights (best-effort)
- `earnings`: latest quarter highlights + KPI callouts
- `news`: last N days items + topics
- `competitors`: list + why they’re competitors
- `sources`: array of sources with type, URL, retrieved_at, extracted_text_hash
- `citations`: inline citation map (claim → source url + snippet)

### 2) Human Brief (markdown)
A deck-writer-ready brief:
- Executive summary
- What they sell + who they sell to
- Business model (best-effort)
- Strategic priorities (stated vs inferred)
- Recent developments (news + earnings)
- Competitive landscape
- Risks / open questions
- “Slide angles” (narrative hooks)
- Appendix: sources

## Data Sources (MVP-friendly)
Prioritize sources that are easy to fetch reliably:
1. **Official website**: About, Products, Solutions, Customers, Pricing (if available)
2. **Investor Relations** (public companies): press releases, earnings decks, transcripts *when accessible*
3. **Regulatory filings**: SEC 10-K/20-F/8-K (US) — via SEC EDGAR APIs
4. **News**: Google News RSS or other accessible feeds (avoid heavy scraping)
5. **Wikipedia / Wikidata** (optional): quick background + disambiguation

Stretch sources:
- Crunchbase/PitchBook (paid)
- Similarweb (paid)
- App store / Chrome store listings
- LinkedIn company page (scrape-unfriendly)

## Architecture (Internal Tools)
### Components
1. **Fetcher layer** (deterministic):
   - URL discovery (domain → key pages)
   - Fetch HTML/PDF
   - Extract readable text (markdown)
   - Store raw + extracted

2. **Normalizer layer**:
   - dedupe pages
   - chunking (by section/headings)
   - lightweight entity extraction (names, products, KPIs)

3. **Synthesizer layer** (LLM):
   - produce structured bundle JSON
   - generate markdown brief
   - enforce citation discipline (no uncited claims)

4. **Storage/Index**:
   - Save bundles under `data/company-research/<slug>/<run-id>/`
   - Optionally register a “Resource” in Mission Control Docs/Resources for the brief

5. **UI/Workflow** (later):
   - Mission Control: “Research” action on a Company record → triggers run

### Suggested File Layout (repo: `slideheroes-internal-tools` OR this workspace)
- `scripts/company-research/`
  - `run.sh` (or `run.ts`)
  - `sources.ts` (source discovery)
  - `fetch.ts` (fetch + extract)
  - `synthesize.ts` (LLM prompts)
  - `schemas.ts` (zod schemas)
- `data/company-research/` (gitignored)

## MVP Implementation Plan (2–3 days)
### Phase 0 — Define schemas + prompts (0.5 day)
- Write Zod schema for bundle output
- Draft prompts:
  - “bundle synthesizer” (JSON)
  - “brief writer” (markdown)
  - citation rules

### Phase 1 — Fetch + extract (0.5–1 day)
- Given `domain`, fetch:
  - homepage
  - about page
  - products/solutions page(s)
  - pricing (if exists)
  - blog/newsroom
- Use readability extraction (existing tooling or `web_fetch` equivalent in code)
- Persist raw + extracted.

### Phase 2 — News + filings (0.5–1 day)
- News: RSS-based pull for last 30–90 days
- SEC EDGAR (if ticker provided or can be resolved): latest 10-K and latest earnings press release.

### Phase 3 — Synthesis + output (0.5 day)
- Run LLM on extracted corpus → bundle JSON + brief markdown
- Save outputs + a `run.json` metadata file

### Phase 4 — Hook into Mission Control (later)
- Add a simple form in MC (company name/domain/ticker) that triggers a server-side job
- Save brief in MC Docs + link to Company

## Quality Rules (hard constraints)
- Every non-trivial claim must be supported by a citation URL.
- If not found, state “Unknown / not publicly available from sources used.”
- Separate **stated strategy** (explicit wording) from **inferred strategy**.
- Track freshness: include retrieved timestamps and “as of” date.

## Open Questions / Decisions Needed
1. Where should this live first: **workspace scripts** vs **slideheroes-internal-tools** repo?
2. News source: do we standardize on Google News RSS, or add a lightweight provider?
3. Do we want to store outputs in MC DB (tables) or keep filesystem first?
4. Should we model a new MC entity type: `companies`?

## Next Step Recommendation
Start with a **CLI-first MVP** in the workspace (fast iteration), then port to `slideheroes-internal-tools` once the schema and prompts prove out.
