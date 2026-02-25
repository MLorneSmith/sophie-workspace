# ActiveCampaign → Loops migration plan (SlideHeroes)

## Executive summary

SlideHeroes is moving from ActiveCampaign (AC) to Loops for a simpler, SaaS-oriented email stack (campaigns + lifecycle automations (“Loops”) + API-triggered transactional). This plan assumes **no ActiveCampaign API access yet**, so the migration centers on:

- A **thorough AC audit + exports** (primarily CSV + screenshots/PDFs of automation logic)
- **Rebuilding automations** natively in Loops (manual)
- **Importing contacts + properties** into Loops (CSV and/or API)
- **Switching transactional email sending** to Loops’ `/transactional` API endpoint
- Validating deliverability, segmentation, and event-triggered flows before cutover


---

## 1) Loops capabilities (what we are migrating *to*)

From Loops docs:

- **Email types**
  - **Campaigns**: one-off marketing sends to audience/segments (newsletters, announcements). <https://loops.so/docs/types-of-emails>
  - **Loops (automations)**: event/property/list-triggered sequences with emails, timers, filters, and branches. <https://loops.so/docs/loop-builder>
  - **Transactional**: API-triggered 1:1 emails (password resets, receipts). Transactional emails do not include unsubscribe links and do not track opens/clicks. <https://loops.so/docs/transactional>

- **Audience model**
  - Contacts have default properties (email, firstName, lastName, source, subscribed, userGroup, userId, etc.) and **custom contact properties** (string/number/boolean/date). <https://loops.so/docs/contacts/properties>
  - **Segments** are saved filters based on contact properties and campaign/loop activity (sends/opens/clicks). <https://loops.so/docs/contacts/filters-segments>
  - **Mailing lists** are primarily for *public opt-in/opt-out* via a preference center; Loops recommends using segments/filters for internal organization. <https://loops.so/docs/contacts/mailing-lists>

- **API** (import + lifecycle + transactional)
  - Auth: Bearer API key. Baseline rate limit: **10 requests/sec/team**. <https://loops.so/docs/api-reference/intro>
  - Contacts:
    - Create: `POST https://app.loops.so/api/v1/contacts/create` <https://loops.so/docs/api-reference/create-contact>
    - Update (creates if missing): `PUT https://app.loops.so/api/v1/contacts/update` <https://loops.so/docs/api-reference/update-contact>
  - Events:
    - Send: `POST https://app.loops.so/api/v1/events/send` (supports `Idempotency-Key`) <https://loops.so/docs/api-reference/send-event>
  - Transactional:
    - Send: `POST https://app.loops.so/api/v1/transactional` (supports `addToAudience`, attachments, `Idempotency-Key`) <https://loops.so/docs/api-reference/send-transactional-email>

- **Bulk import**
  - CSV upload supports creating/updating contacts, setting `Subscribed`, not overwriting with empty cells, and clearing fields with literal `null`. Can also trigger loops after import. <https://loops.so/docs/add-users/csv-upload>


---

## 2) What typically exists in an ActiveCampaign account that must be migrated

Even without API access, expect these AC assets to exist and require explicit handling:

### Contact & audience data
- Contacts (email + name)
- **Lists** (often used as “audience containers”)
- **Tags** (often used as the *real* segmentation backbone)
- **Custom fields** (plan, role, company, usage, lifecycle dates, lead source, UTM data, etc.)
- Subscription statuses (subscribed/unsubscribed), list-specific subscriptions
- GDPR/consent fields (marketing consent date/source)

### Lifecycle automation assets
- **Automations** (entry triggers, wait conditions, if/else, goals, tag adds/removals, list subscribe/unsubscribe, webhook calls)
- Email templates used inside automations
- Split testing logic (if present)

### Acquisition assets
- Embedded / hosted **forms**
- Landing pages (if AC pages used)
- Double opt-in flows (if enabled)

### Integrations & tracking
- AC integrations (Stripe, Segment, Zapier, internal webhooks)
- Site/event tracking (if used)
- Attribution tracking/UTMs

### Often present but *not* directly portable to Loops
- **CRM / Deals / Pipelines** (AC has a CRM product; Loops is primarily email)
- Lead scoring
- Sales automation tied to CRM objects


---

## 3) Feature mapping: ActiveCampaign → Loops

Use this to spot gaps early and decide what to rebuild vs. replace.

### Audience model
- **AC Lists** → Loops **Mailing lists** (only if you need user-visible opt-in/out) *or* Loops **Segments** (recommended for internal segmentation).
- **AC Tags** → Loops **custom contact properties** and/or **mailing lists**.
  - Common migration approach:
    - “State” tags (e.g., `trial_started`, `paid`, `churned`) → boolean/date/string **properties** (better than tags)
    - Interest tags (e.g., `interested_consulting`, `interested_training`) → **mailing lists** (if user-controlled) or **properties** (if internal)

### Automations
- **AC Automations** → Loops **Loops** (trigger + emails + timers + audience filters + branches). <https://loops.so/docs/loop-builder>
- **AC If/Else** → Loops **Branch node** (left-to-right matching filters; add a “default” branch with no conditions). <https://loops.so/docs/loop-builder/branching-loops>
- **AC “Goals” / jump-to-step** → typically re-modeled with **event triggers**, **properties**, and **branches** (manual design).

### Events & tracking
- **AC Event tracking / webhook triggers** → Loops **Events** (`/events/send`) + event properties. <https://loops.so/docs/api-reference/send-event>

### Transactional email
- **AC transactional sends** (often via SMTP / Mandrill / Postmark / etc.) → Loops **Transactional** emails via `/transactional`. <https://loops.so/docs/transactional>

### Forms
- **AC forms** → Loops **Forms** (built-in) or custom forms integrating to Loops (via their form guides).
  - Plan: rebuild all acquisition points (website newsletter forms, waitlists, lead magnets) in Loops.

### CRM (if used)
- **AC Deals/CRM** → **No direct Loops equivalent**.
  - Mitigation: keep CRM in a dedicated tool (HubSpot/Pipedrive) or in SlideHeroes app + data warehouse, and sync lifecycle properties into Loops.


---

## 4) Pre‑migration audit checklist (what to export from ActiveCampaign)

Because we don’t have AC API access yet, treat this as a **manual inventory + export** sprint.

### A. Account & sending setup
- [ ] From domains, sender identities, reply-to addresses
- [ ] SPF/DKIM/DMARC settings and sending domain/subdomain strategy
- [ ] Suppression lists (unsubscribes, bounces, complaints)
- [ ] Email footer/legal text, physical address, branding

### B. Audience exports
Export at least one CSV per “logical audience” (AC list and/or master list), containing:
- [ ] Email
- [ ] First name / last name (if available)
- [ ] Tags (critical)
- [ ] Custom fields (all)
- [ ] Subscription status / marketing consent
- [ ] Acquisition source (form name, UTM, referrer if stored)
- [ ] Lifecycle timestamps (signup date, trial start, activation, purchase, cancellation, etc.)

Also export:
- [ ] A master list of **all tags** and what they mean (dictionary)
- [ ] A master list of **custom fields** (name, type, allowed values)
- [ ] List membership rules (which lists are used for opt-in vs internal)

### C. Automations & sequences
For each automation:
- [ ] Name + purpose (what business outcome)
- [ ] Entry criteria / trigger (tag added, list subscribed, event, form submission)
- [ ] Email steps (subject lines, content, timing)
- [ ] Wait conditions (time-based vs behavior-based)
- [ ] If/else logic
- [ ] Exit conditions / goal logic
- [ ] Side effects (tag add/remove, list subscribe/unsubscribe, webhook calls)
- [ ] Any split tests

Export/recover assets:
- [ ] All automation emails (HTML/MJML if possible) and plaintext versions
- [ ] Shared templates (header/footer components)

### D. Forms & acquisition points
- [ ] List every embedded form / popup / lead magnet
- [ ] Fields captured (and required)
- [ ] Double opt-in settings (if used)
- [ ] Post-submit actions (tagging, automation entry)

### E. Integrations
- [ ] List integrations (Stripe, Zapier, Segment, webhooks)
- [ ] Data mapping (which tags/fields they set)
- [ ] Any outgoing webhooks used for downstream systems

Deliverable of this phase: a single “AC Inventory” doc + a folder of exports.


---

## 5) Loops setup steps (foundation before data import)

### A. Sending domain & deliverability
1. Add sending domain/subdomain in Loops and configure DNS records (MX/TXT/CNAME as required by Loops). <https://loops.so/docs/quickstart>
2. Decide whether to send from `mail.<domain>` or root domain.
3. Configure DMARC if not already set; align SPF/DKIM.
4. Create consistent From names and reply-to addresses.

### B. Account structure
- Create team members / access controls.
- Generate API keys (separate keys by environment/use-case if helpful). <https://loops.so/docs/api-reference/intro>

### C. Define Loops data model (critical design step)
Create a **migration data dictionary** that maps AC tags/fields → Loops properties/lists.

Recommended core properties for SlideHeroes (examples; adjust to your product):
- `accountId` (string) – internal account identifier
- `userId` (Loops default) – internal user id (important for updates)
- `role` (string) – consultant / admin / member
- `plan` (string) – free / trial / pro / team
- `trialStartedAt` (date)
- `activatedAt` (date)
- `paidAt` (date)
- `churnedAt` (date)
- `lastActiveAt` (date)
- `signupSource` (string)
- `utmSource`, `utmCampaign` (string)
- `isPaying` (boolean)

Create these as **custom contact properties** in Loops (UI or API). <https://loops.so/docs/contacts/properties>

### D. Mailing lists vs segments
- Create Loops **mailing lists** only for user-visible subscription groups (e.g., “Newsletter”, “Product updates”, “Webinars”). <https://loops.so/docs/contacts/mailing-lists>
- Use **segments** for operational targeting (e.g., “trial users who haven’t activated”). <https://loops.so/docs/contacts/filters-segments>


---

## 6) Data migration plan

### Phase 1 — Prepare exports into a Loops-friendly schema

1. Normalize contacts into a single “contacts master” file:
   - one row per email (or per userId if email changes are common)
   - include **all** fields you will need for segmentation and personalization

2. Convert AC tags into:
   - Boolean properties (e.g., `interestedInTeamPlan=true`)
   - String “status” properties (e.g., `lifecycleStage="trial"|"active"|"churned"`)
   - Dates (e.g., `trialStartedAt`)

3. Decide how to represent AC Lists:
   - If lists were simply organizational, convert them to `userGroup` or a property.
   - If lists were preference-based, create Loops mailing lists and map membership.

### Phase 2 — Create Loops properties & lists

- Create all required custom contact properties in Loops before import.
  - Loops API supports property creation: `POST /contacts/properties`. <https://loops.so/docs/contacts/properties>

- Create any required mailing lists (Settings → Lists).

### Phase 3 — Import contacts

You have two viable approaches:

#### Option A: CSV import (recommended first pass)
- Use Loops CSV upload. <https://loops.so/docs/add-users/csv-upload>
- Notes from Loops docs that matter operationally:
  - Imported contacts are marked **subscribed** by default; add a `Subscribed` column with `false` to import unsubscribed contacts.
  - Empty CSV cells do **not** overwrite existing values.
  - Clear a field by providing literal `null`.
  - Updates match by `User ID` first, then `Email`.

When to prefer CSV:
- One-time bulk migration
- Easy human review and correction

#### Option B: API-based import (best for continuous sync / staged cutover)
- Use `PUT /contacts/update` for idempotent upserts. <https://loops.so/docs/api-reference/update-contact>
- Respect rate limiting (10 rps baseline) and add retries/backoff.
- Include `userId` early if you ever need to change emails later (Loops requires `userId` to change email via update).

### Phase 4 — Move list membership (if used)

If you decide to use Loops mailing lists:
- Loops can add/remove list subscriptions via `mailingLists` object when creating/updating contacts or when sending events. <https://loops.so/docs/contacts/mailing-lists#add-contacts-to-lists-with-the-api>

### Phase 5 — Rebuild segments

- Recreate core segments using Loops filters (properties + activity). <https://loops.so/docs/contacts/filters-segments>
- Save frequently-used segments.


---

## 7) Automation migration (AC automations → Loops “Loops”)

### A. Rebuild strategy
Since AC automation logic is not directly importable, plan to **rebuild manually** in Loops:

1. Start with the highest business-impact flows:
   - Onboarding / welcome
   - Trial nurture
   - Activation nudges (based on in-app behavior)
   - Payment success / upgrade education
   - Churn prevention / cancellation follow-ups

2. Model each AC automation as one Loops “Loop” with:
   - Trigger: Contact added / Contact updated / Contact added to list / Event received. <https://loops.so/docs/loop-builder>
   - Email nodes
   - Timer nodes
   - Audience filter nodes
   - Branch nodes for if/else. <https://loops.so/docs/loop-builder/branching-loops>

### B. Event-driven lifecycle (recommended for SlideHeroes)

Use Loops **events** for product behavior, so email logic is driven by actual usage rather than tag hacks.

Examples of event names to standardize:
- `signed_up`
- `onboarding_completed`
- `deck_created`
- `exported_slides`
- `trial_started`
- `trial_ending_3d`
- `payment_succeeded`
- `subscription_canceled`

Send events via API:
- `POST https://app.loops.so/api/v1/events/send` with `email` or `userId`, `eventName`, optional `eventProperties`, optional contact property updates, and optional `mailingLists`. <https://loops.so/docs/api-reference/send-event>
- Use `Idempotency-Key` to avoid duplicate sends when processing retries.

### C. Where Loops differs from AC (design implications)
- Loops branches evaluate filters **left-to-right** and contacts follow the **first matching** branch; if no match, they exit. Design a default branch. <https://loops.so/docs/loop-builder/branching-loops>
- Loops supports pausing loops to edit; when paused, new contacts are queued up to 24 hours. <https://loops.so/docs/loop-builder>


---

## 8) Transactional email migration

### A. Inventory
List every transactional email currently sent from AC or via AC-adjacent tooling:
- password reset
- magic link/login link
- invoice/receipt
- subscription status notifications
- export/usage notifications

### B. Implement in Loops
1. Create transactional templates in Loops (editor or MJML). <https://loops.so/docs/transactional>
2. Identify required **data variables** per template.
3. Update SlideHeroes backend to send via:
   - `POST https://app.loops.so/api/v1/transactional` including `transactionalId`, `email`, `dataVariables`. <https://loops.so/docs/api-reference/send-transactional-email>
4. Add `Idempotency-Key` to prevent duplicate transactional sends on retries.
5. Decide whether to use `addToAudience: true`:
   - Use `true` when you want recipients to become marketing contacts automatically (be careful with consent).


---

## 9) What can be automated vs. manual

### Automatable
- Bulk contact import via CSV or API upserts
- Property creation via Loops API (`POST /contacts/properties`)
- Continuous syncing of product lifecycle properties from SlideHeroes → Loops via API
- Event sending from product to drive loops (`/events/send`)

### Mostly manual
- Rebuilding AC automations as Loops flows (mapping triggers, goals, waits)
- Rebuilding emails in Loops editor / MJML and QA’ing rendering
- Rebuilding forms and updating website embed points
- Auditing consent model (what “subscribed” means in Loops vs. AC)


---

## 10) Post‑migration validation checklist

### Data correctness
- [ ] Random sample of contacts: fields match expectations (names, plan, lifecycle dates)
- [ ] Unsubscribed users remain unsubscribed (marketing)
- [ ] Key segments produce expected counts
- [ ] Mailing list membership correct (if used)

### Automation behavior
- [ ] Each loop trigger works (contact added, property updated, event received)
- [ ] Branch logic routes correctly
- [ ] Timers wait expected durations
- [ ] Emails do not send to excluded/unsubscribed contacts

### Transactional
- [ ] Each transactional template sends successfully via API
- [ ] Required dataVariables always present (otherwise sends fail)
- [ ] Idempotency prevents duplicates

### Deliverability
- [ ] Domain verification complete
- [ ] Warm-up plan: start with highly engaged segment before full sends (Loops recommends warming up with a welcome sequence). <https://loops.so/docs/quickstart>
- [ ] Monitor bounces/complaints and adjust


---

## 11) Suggested timeline (pragmatic estimate)

Assumes a small team, moderate automation complexity.

### Week 0–1: Audit & design
- AC inventory + exports (contacts, tags, fields, automations)
- Loops data dictionary (properties/lists/segments)
- Define event taxonomy for SlideHeroes

### Week 1–2: Loops foundation + initial import
- Domain + deliverability setup
- Create properties + lists
- Import contacts (CSV first pass)
- Recreate top 5–10 segments

### Week 2–3: Automations rebuild
- Rebuild core onboarding/trial/payment loops
- QA with test contacts (@example.com / @test.com supported for loop testing) <https://loops.so/docs/loop-builder>

### Week 3–4: Transactional + cutover
- Implement transactional endpoint in backend
- Dual-run period (if possible): keep AC marketing sends paused while Loops runs, or run in parallel to a small segment
- Final cutover + decommission plan


---

## 12) Risks, gotchas, and mitigations

### 1) Consent / subscription status mismatches
**Risk:** AC’s list-based subscription vs. Loops’ `subscribed` property and mailing list subscriptions can differ.
- Loops note: imported contacts are marked subscribed by default unless `Subscribed=false` column is present. <https://loops.so/docs/add-users/csv-upload>
**Mitigation:**
- Treat suppression/unsubscribe data as first-class.
- Include `Subscribed` explicitly in migration CSV.
- Keep unsubscribed contacts in Loops (Loops recommends keeping them; they are not billed). <https://loops.so/docs/contacts/properties#subscribed>

### 2) Tag explosion → poor Loops model
**Risk:** Porting tags 1:1 leads to unmaintainable segmentation.
**Mitigation:**
- Convert tags into a smaller set of typed properties (boolean/date/string enums).

### 3) Automation parity gaps (AC goals, complex waits)
**Risk:** AC automations may rely on features that require redesign.
**Mitigation:**
- Re-implement using Loops events + properties + branching.
- Document “automation acceptance tests” (inputs → expected email path).

### 4) Duplicate event/email sends
**Risk:** Retries or out-of-order processing can cause duplicate events and duplicate transactional emails.
**Mitigation:**
- Use `Idempotency-Key` on `/events/send` and `/transactional`. <https://loops.so/docs/api-reference/send-event>

### 5) Deliverability reputation reset
**Risk:** New sending domain/subdomain or new provider can temporarily hurt inbox placement.
**Mitigation:**
- Warm up gradually with engaged recipients.
- Monitor bounces/complaints.

### 6) Loops API usage limits
**Risk:** Bulk import or event bursts exceed 10 rps baseline.
**Mitigation:**
- Batch and backoff on 429s. <https://loops.so/docs/api-reference/intro>


---

## Appendix A — Concrete migration mapping examples

### Example: AC tag → Loops properties
- AC tag: `paid_user`
  - Loops: `isPaying=true` (boolean)
- AC tag: `plan_pro`
  - Loops: `plan="pro"` (string)
- AC tag: `trial_started_2026_02_01`
  - Loops: `trialStartedAt="2026-02-01"` (date)

### Example: AC list → Loops list vs segment
- AC list: “Newsletter” (user opt-in)
  - Loops: Mailing list “Newsletter” (public)
- AC list: “All users” (internal grouping)
  - Loops: Segment `userGroup == "Users"` or property filter


## Appendix B — Key Loops docs referenced
- Quickstart: <https://loops.so/docs/quickstart>
- Types of emails: <https://loops.so/docs/types-of-emails>
- Transactional: <https://loops.so/docs/transactional>
- Loop builder: <https://loops.so/docs/loop-builder>
- Branching loops: <https://loops.so/docs/loop-builder/branching-loops>
- Contact properties: <https://loops.so/docs/contacts/properties>
- Filters & segments: <https://loops.so/docs/contacts/filters-segments>
- Mailing lists: <https://loops.so/docs/contacts/mailing-lists>
- API intro: <https://loops.so/docs/api-reference/intro>
- API create contact: <https://loops.so/docs/api-reference/create-contact>
- API update contact: <https://loops.so/docs/api-reference/update-contact>
- API send event: <https://loops.so/docs/api-reference/send-event>
- API send transactional: <https://loops.so/docs/api-reference/send-transactional-email>
- CSV upload: <https://loops.so/docs/add-users/csv-upload>
