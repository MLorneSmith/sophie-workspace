# Customer Feedback / Roadmap Tool — Shortlist & Recommendation

Date: 2026-02-19

Goal: pick a customer-facing tool for feedback intake + prioritization + public roadmap/changelog, with a reasonable integration story for our stack (Attio + Mission Control).

## What we actually need (requirements)

Must-have:
- Customer-facing **feedback portal** (upvotes, comments)
- **Public roadmap** (at least status columns: Planned / In Progress / Done)
- **Changelog/announcements** (nice-to-have but strongly preferred)
- Basic moderation (merge duplicates, tagging)
- **Integrations**: at minimum Slack + Zapier/webhooks. Direct Linear/Jira nice but not required.

Nice-to-have:
- AI assist (dedupe/summarize)
- User identification (tie feedback to accounts)
- Private boards (customer-specific portals)
- SSO

Key integration constraint:
- We don’t currently run product development inside Linear/Jira as the single source of truth (we have **Mission Control** tasks + internal tooling). So “built on Linear” is a plus only if we *want* to adopt Linear for product work; otherwise it can become friction.

---

## Option A: Productlane

Source: https://productlane.com/

What it is (per Productlane site):
- Customer support + feedback tool “**built on Linear**”
- Mentions: public roadmap, changelog, feedback hub, knowledge base, AI assistant

Pros:
- If we adopt **Linear** as core issue/roadmap system, Productlane looks like the most “closed loop” option.
- Strong promise around eliminating duplication between support and product work.

Cons / risks:
- Linear-centric. If we keep Mission Control as the core system, we may end up duplicating anyway.
- Overlaps with “support inbox” tools; might be more surface area than we want right now.

Best if:
- We decide “Linear is our product system” and want support+roadmap tightly tied to it.

---

## Option B: Canny

Source: https://canny.io/

What it is (per Canny site):
- Feedback portal + prioritization + roadmaps
- AI features (autopilot capture/dedupe/summaries)
- “Works well with your existing workflow” + integrations page

Pros:
- Mature, common default in SaaS; less risky.
- Integrations-first posture; likely easiest to connect to Mission Control via Zapier/webhooks/API.
- Strong on the customer-facing portal/roadmap patterns.

Cons:
- Typically more expensive at scale than newer entrants.
- Can become a “second backlog” unless we enforce process.

Best if:
- We want the safest choice that won’t fight our existing workflow.

---

## Option C: Frill

Source: https://frill.co/

What it is (per Frill site):
- Feedback + public roadmap + announcements (“their version of changelog”)
- Emphasis on simple UI/UX
- Integrations listed: Slack, Jira, Trello, Zendesk, Intercom, Help Scout, Zapier, etc.

Pros:
- Leaner + simpler product footprint.
- Has the three core objects we need (feedback, roadmap, changelog).
- Integration story looks good (Slack + Zapier etc.).

Cons:
- Typically fewer enterprise features than Canny.
- Need to validate API/webhooks depth for Mission Control syncing.

Best if:
- We want “Canny-lite”: simple, fast to set up, good enough integrations.

---

## Option D: Upvoty

Source: https://upvoty.com/

What it is (per Upvoty site):
- All-in-one feedback platform: widgets + boards + roadmap

Pros:
- Broad “all-in-one” promise.

Cons / unknowns:
- Need to validate integrations/API depth and admin UX.

Best if:
- We want another credible alternative to Canny/Frill and pricing is compelling.

---

## Recommendation (pragmatic)

1) **Default recommendation: Canny**
- Lowest decision risk.
- Most likely to integrate cleanly with Mission Control + Attio via Zapier/webhooks.

2) **Lean alternative: Frill**
- If we want faster setup + simpler UX and don’t need enterprise depth.

3) **Conditional: Productlane**
- Only if we *explicitly* decide to run product work in Linear and want Linear-native closed loop.

---

## Next steps (to finalize in <1 hour)

- Pick top 2 (Canny vs Frill).
- Confirm:
  - pricing tier that includes public roadmap + changelog
  - API/webhooks (create/update posts, status changes)
  - SSO requirements (if any)
- Decide our “source of truth” rule:
  - Feedback tool = intake + customer comms
  - Mission Control = execution backlog
  - Define the minimal sync: when item moves to Planned/In Progress/Done → create/update Mission Control task + push status back to portal.
