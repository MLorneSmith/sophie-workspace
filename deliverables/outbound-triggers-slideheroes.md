# Custom outbound triggers for SlideHeroes (non-commodity signals)

**Goal:** Identify *observable* public signals that indicate a company/person is likely to need help creating a high-stakes business presentation *right now* — and that are harder for competitors to copy than generic “raised funding / hiring SDRs” alerts.

This is inspired by Practical Prospecting #140 (Jed Mahrle), but tailored to SlideHeroes’ problem space: **sit-down, boardroom-grade presentations** (strategy, exec updates, transformation, risk, investment cases), not “pretty slides fast.”

---

## 1) A simple trigger framework

Start from the reasons someone urgently needs a deck:

1. **Decision upcoming** (board / exec / investment committee / procurement)
2. **Narrative problem** (confusion, misalignment, political friction)
3. **High stakes** (money, careers, reputational risk)
4. **Time pressure** (deadline, event date, meeting booked)

Then map:

- **Internal moment** → what’s happening inside the organization
- **External evidence** → where it shows up publicly
- **Lead hypothesis** → who is most likely building the deck
- **Outreach angle** → what SlideHeroes can help with *this week*

---

## 2) Trigger list (SlideHeroes-specific)

### A. “Decision calendar” triggers (strongest)

#### 1) Board / investor / earnings moments with known dates
- **Internal moment:** Exec team is preparing a board pack, earnings narrative, or investment committee deck.
- **External evidence:**
  - Earnings call dates (IR pages)
  - Investor day announcements
  - Annual report cycle / AGM notices
  - Public board meeting calendars (public sector, some nonprofits)
- **Who to target:** CFO org, Strategy, IR, Corp Dev, FP&A leaders.
- **Angle:** “Board-ready narrative: crisp SCQ + Pyramid + proof story.”

#### 2) RFP / procurement windows (esp. complex services)
- **Internal moment:** Pitch response being assembled; decision likely within 30–90 days.
- **External evidence:**
  - Government tender portals
  - Industry procurement portals
  - “Request for Proposal” press releases
- **Who to target:** Bid manager, Head of Partnerships, Sales Ops, GM.
- **Angle:** “Win themes + executive summary slides that read like a recommendation, not a brochure.”

#### 3) Regulatory deadline / compliance program milestone
- **Internal moment:** Risk/compliance must brief leadership on readiness or gaps.
- **External evidence:**
  - New regulation effective dates
  - Public enforcement actions in sector
  - “Consent order” / “remediation plan” news
- **Who to target:** CISO, Head of Compliance/Risk, Program Management.
- **Angle:** “Make the case for funding/remediation with evidence-based storyline.”

---

### B. “Narrative pressure” triggers (very SlideHeroes-native)

#### 4) Strategy reset / restructuring / transformation announcements
- **Internal moment:** Leadership needs to align the org and justify a new plan.
- **External evidence:**
  - Press releases: “strategic review”, “restructuring”, “transformation”, “cost reduction”, “operating model”, “new org structure”
  - Layoff announcements (esp. with stated strategic shift)
- **Who to target:** Strategy, COO, Transformation Office, Change Comms.
- **Angle:** “Turn a messy transformation into a clear exec narrative + decision slides.”

#### 5) Merger / acquisition integration milestones
- **Internal moment:** Integration workstream updates; synergy case; operating model decisions.
- **External evidence:**
  - Acquisition press release + integration updates
  - “Day 1” / “100-day plan” references in leadership comms
- **Who to target:** Corp Dev, Integration PMO, Finance transformation.
- **Angle:** “Integration story that makes tradeoffs explicit and decisionable.”

#### 6) Post-incident narrative (breach/outage/safety event)
- **Internal moment:** Executives need a tight narrative: what happened, impact, actions, funding.
- **External evidence:**
  - Incident disclosure
  - Follow-up “update” posts
  - Customer communications
- **Who to target:** CISO/CTO/COO, Incident commander, Comms lead.
- **Angle:** “Crisis-to-confidence exec update deck (facts → actions → ask).”

---

### C. “Presentation-heavy role/activity” triggers (high intent)

#### 7) Hiring signals for presentation-intensive work
These are common, but we can make them **non-commodity** by focusing on *specific* job patterns.

- **Internal moment:** They are scaling a function that produces executive decks.
- **External evidence:** job postings containing:
  - “Board materials”, “board deck”, “exec update”, “investor materials”, “IC memo”, “pyramid”, “Minto”, “consulting-style”, “strategy deck”, “narrative”, “storytelling with data”
  - Roles: Chief of Staff, Strategy & Ops, BizOps, Corp Dev, FP&A, Transformation
- **Who to target:** hiring manager + new hire once joined.
- **Angle:** “Make your first 30 days decks sharper; use our consulting-grade structure.”

#### 8) Consulting deliverable pressure (boutiques + internal consulting)
- **Internal moment:** Consulting teams producing client decks weekly; quality varies.
- **External evidence:**
  - Boutique consulting firms announcing new practice areas
  - Firms hiring for “slide writing”, “deck building”, “PowerPoint specialist”
  - “Internal consulting / enterprise PMO” growth
- **Who to target:** Partners, Ops lead, Practice leads.
- **Angle:** “Standardize deck quality without partner rewrites.”

---

### D. “Moments that force a deck” triggers (events)

#### 9) Conference/keynote/industry panel announcements (specific, date-bound)
- **Internal moment:** Speaker needs a deck by a date.
- **External evidence:**
  - Speaker lineup posts
  - Agenda pages
  - “We’re speaking at…” social posts
- **Who to target:** speaker + comms/marketing.
- **Angle:** “Boardroom-grade narrative for a talk: what’s the assertion, what’s the proof?”

#### 10) Analyst / investor / customer briefing cadence
- **Internal moment:** Quarterly business reviews (QBRs), analyst briefings, customer exec updates.
- **External evidence:**
  - Customer webinars
  - “Quarterly update” events
  - Analyst relations activity
- **Who to target:** Customer Success leadership, PMM, AR.
- **Angle:** “Make QBR decks decisionable, not status soup.”

---

## 3) “Signal sources” cheat sheet

- **IR / earnings calendars:** company investor relations pages
- **SEC filings / SEDAR:** 8-K, 10-Q, prospectus filings
- **Tender portals:** government procurement sites, industry bid boards
- **Job boards:** LinkedIn jobs, Greenhouse pages (search for keyword clusters)
- **News triggers:** Google News alerts, industry newsletters, press release wires
- **Events:** conference agenda pages, Luma/Eventbrite, company blogs

---

## 4) Keyword clusters for bulk monitoring

### Strategy / decision moments
- strategic review, transformation, operating model, restructuring, reorganization, cost takeout, synergy, integration

### Deck / narrative work
- board deck, investor deck, IC memo, exec update, narrative, storyline, pyramid principle, Minto, consulting-style

### Risk / compliance
- remediation, consent order, regulatory deadline, compliance program, audit findings

---

## 5) A practical “bulk research” prompt template

Use this to quickly score leads when a signal fires.

> You are helping identify whether this company likely needs **executive-grade presentation work** in the next 30–60 days.
> 
> Inputs:
> - Company: {company}
> - Signal observed: {signal}
> - Evidence link(s): {urls}
> 
> Tasks:
> 1) Summarize the internal event and the likely *decision moment*.
> 2) List 2–3 plausible stakeholders who would own the deck (roles, not names).
> 3) Propose 3 outreach angles tied to SlideHeroes’ value (SCQ, Pyramid, proof/story).
> 4) Rate urgency 1–5 and explain.
> 
> Output JSON with keys: summary, stakeholders, angles, urgency, why.

---

## 6) Recommended next step (operational)

1. Pick **one category** to start (e.g., transformation announcements).
2. Define **exact keyword filters** + sources.
3. Run a 2-week test: capture 20 signals → manually score urgency/fit.
4. Turn winners into a repeatable playbook (message templates + CTAs).
