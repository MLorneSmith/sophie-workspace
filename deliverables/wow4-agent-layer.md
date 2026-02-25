# WOW #4 — Agent Layer: Specialized AI Agents for Presentations

**Status:** Planning  
**Owner:** Mike + Sophie  
**Task:** #436  
**Date:** 2026-02-14  

---

## The Idea

A suite of specialized AI agents that each perform a specific analysis, test, or enhancement on your presentation. Each agent does one thing brilliantly. Together, they form a platform that no competitor offers.

Agents are available before, during, or after the core workflow (Profile → Assemble → Outline → Storyboard → Generate). They're optional — users pick which ones to run.

When Audience Profiling (WOW #1) is active, agents automatically leverage the audience context to make their output smarter.

---

## Why This Is a WOW

1. **Each agent is its own wow moment.** Every time a user runs a new agent, they discover another thing SlideHeroes can do that nothing else does.
2. **Extensible platform.** We can ship new agents over time — each one is a feature announcement, a reason to come back, a differentiator.
3. **Audience-aware intelligence.** Combined with WOW #1, agents don't just analyze the deck — they analyze it *from the perspective of the specific audience*.
4. **Consulting DNA.** These agents mirror what senior consultants do: stress-test arguments, prepare for questions, check consistency, tailor the message. SlideHeroes automates the partner review.

---

## Agent Catalog

### High Priority — Launch Candidates

**🎯 The Partner** — *Presentation Coach*
The senior partner who reviews your deck at 11pm and sends it back covered in red ink. Tough but makes you better.
- "Slide 7 is too dense for a C-suite audience"
- "Your conclusion doesn't tie back to the SCQA"
- "The ask on slide 15 comes too late — move to slide 3"
- Scores each slide on clarity, relevance, and impact

**📋 The Skeptic** — *Q&A Prep*
That person in every meeting who asks the uncomfortable question. Now they work for you.
- "The CFO will ask about payback period — you address it on slide 18 but she'll want it by slide 5"
- "Expect pushback on the build-vs-buy assumption on slide 10"
- Generates a prep sheet with suggested answers and supporting data points

**📝 The Whisperer** — *Speaker Notes*
The voice in your ear telling you exactly what to say and when. Your personal teleprompter.
- Key messages to emphasize
- Transition phrases between slides
- Timing guidance ("spend 2 minutes here, 30 seconds here")
- What NOT to say (avoid reading the slide)

**✂️ The Editor** — *Deck Shrinker*
Kills your darlings so you don't have to. "You don't need slide 23. You never needed slide 23."
- Identifies redundant slides
- Merges overlapping content
- Moves detail to appendix
- Preserves the narrative arc

### Medium Priority — Post-Launch

**⚖️ The Devil's Advocate** — *Counter-Argument*
Actively tries to destroy your pitch so nobody else can.
- "Your market size claim assumes 100% TAM penetration — the audience will catch this"
- "Slide 9 contradicts slide 4 on timeline"
- Suggests how to preemptively address each weakness

**🔍 The Auditor** — *Fact Checker*
Trusts nothing. Verifies everything. "That stat is from 2019. Try again."
- Flags outdated statistics and suggests newer data
- Checks whether sources actually support the claims being made
- Identifies unsubstantiated claims

**📊 The Translator** — *Data Storyteller*
Speaks both numbers and human. Turns your spreadsheet into a story.
- "This chart shows revenue grew 40% — but the insight is that growth accelerated in Q3 after the pricing change"
- Suggests better chart types for the story you're telling
- Writes slide takeaway headlines from data

**📏 The Perfectionist** — *Consistency Checker*
Notices you said "revenue" on slide 3 and "sales" on slide 8. Won't let it go.
- Terminology alignment across all slides
- Numbers that don't add up between slides
- Tone shifts (formal → casual)

### Future / Explore

**🏢 The Spy** — *Competitor Scanner*
Knows what the other side is thinking before they do.
- "If Deloitte compares you to Tome, here's how you differentiate"
- Pulls recent competitor news, product updates, pricing

**🌍 The Diplomat** — *Localization*
Makes your deck feel local everywhere.
- Cultural communication norms (direct vs. indirect)
- Local market data and references
- Translation with business context preserved

**♿ The Advocate** — *Accessibility*
Makes sure nobody gets left out.
- Color contrast ratios
- Font size minimums
- Alt text for images and charts
- Colorblind-safe palette suggestions

**⏱️ The Timekeeper** — *Timing*
"You have 20 minutes. This deck takes 35. We need to talk."
- Estimates time per slide, flags pacing issues
- Identifies data-heavy sections where attention drops
- Suggests where to speed up, slow down, or cut

---

## UX Pattern

### How Users Access Agents

**Option A: Agent Panel (sidebar)**
A persistent sidebar during deck editing with agent icons. Click one → it runs → results appear inline.

**Option B: Agent Menu (on-demand)**
"Run an agent" button that opens a menu of available agents. Pick one, see results in a modal or overlay.

**Option C: Suggested Agents (smart)**
After generating a deck, SlideHeroes suggests 2-3 relevant agents: "Your deck is ready. Want to run Presentation Coach or Q&A Prep before you export?"

**Recommendation:** Start with Option C (suggested after generation) + Option B (on-demand access). Add the always-visible sidebar (Option A) when the agent catalog is large enough.

### Results Display
- **Inline annotations** on slides (Coach, Consistency Checker)
- **Separate report** (Q&A Prep, Fact Checker, Counter-Argument)
- **Modified deck** (Deck Shrinker, Data Storyteller, Speaker Notes)
- All results are suggestions — user accepts, rejects, or modifies

---

## Integration with Other WOWs

| Agent | + WOW #1 (Audience Profiling) | + WOW #2 (Deck Intelligence) | + WOW #3 (Brain Dump) |
|-------|-------------------------------|------------------------------|-----------------------|
| Coach | Feedback tailored to audience expectations | Compares rewrite quality to original | — |
| Q&A Prep | Questions specific to the person/role | — | — |
| Counter-Argument | Objections this audience would raise | — | Flags weak points from brain dump |
| Data Storyteller | Data framing matched to audience sophistication | — | — |

---

## Open Questions

1. **Pricing** — are agents included in base subscription, or premium add-ons?
2. **Agent marketplace** — can third parties build agents? (future)
3. **Run order** — does it matter? Can you chain agents? (e.g., Coach → fix suggestions → Q&A Prep)
4. **History** — do agent results persist? Can you re-run after edits?
5. **Batch mode** — run all suggested agents at once?

---

## Success Metrics

- **Agent adoption:** % of decks where at least one agent is run
- **Most popular agents:** which ones drive the most usage
- **Quality lift:** user satisfaction scores for decks with agents vs. without
- **Retention impact:** do agent users retain better?
- **Discovery:** how many agents does the average user try in their first month?
