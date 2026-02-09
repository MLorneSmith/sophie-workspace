# Getting Agents Deployed into GTM Systems
**Source:** Joe Rhew @ AI x GTM Summit (The Signal)
**URL:** https://youtube.com/watch?v=dB68LOUOfmo
**Article:** https://www.thesignal.club/p/getting-agents-deployed
**Captured:** 2026-02-04
**Type:** Video + Article

---

## Key Takeaways

Joe Rhew from The Workflow Company shared hard-won lessons from deploying AI agents into production GTM systems. Key insight: it's not about replacing everything with agents—it's about using the right level of automation for each use case.

---

## Best Practices Extracted

### 1. Use the Workflow-to-Agent Spectrum Strategically
**Domain:** Operations, AI/Agents
**Practice:** Match automation level to use case—use deterministic workflows for reliability, agentic workflows for flexibility, and full agents only where you've earned trust through testing.
- **Workflows:** Predetermined, no LLM. 100% control (Zapier, sequences)
- **Agentic Workflows:** Predetermined steps with AI in the middle, structured output (JSON)
- **Agents:** Tools on loops with a goal, autonomous decision-making
**Why it matters:** Teams that skip straight to "agents everywhere" get chaos. Start deterministic, layer in intelligence.

### 2. Context Engineering > Prompt Engineering
**Domain:** AI/Agents, Product
**Practice:** Instead of crafting clever prompts, architect what information the AI has access to. The skill is knowing exactly what context to include—not more, not less.
**Example:** A cold email prompt with product info, persona details, LinkedIn data, and writing guidelines produces 10x better results than "write me a cold email."
**Quote:** "Context engineering is the delicate art and science of filling the context window with just the right information." — Andrej Karpathy

### 3. Build Unified Context That Powers All AI Systems
**Domain:** Operations, AI/Agents
**Practice:** Store GTM context (products, personas, messaging, guidelines) in structured files. Update once, all AI systems use it immediately.
**Implementation:** Joe uses markdown files in GitHub. The AI built its own knowledge base from emails, Slack, marketing copy, LinkedIn posts.
**Compound effect:** Knowledge compounds over time. Every interaction generates learnings that feed back into the system.

### 4. Start Deterministic, Then Layer AI
**Domain:** Operations
**Practice:** Build reliable workflows with full control over inputs/outputs before adding AI autonomy. Test thoroughly at each level before graduating to the next.

### 5. Human-in-the-Loop Always (At First)
**Domain:** Operations, Sales
**Practice:** Approvals are cheap. Mistakes are expensive. Phase out human review slowly as you build confidence in the system.
**Example:** Joe's system surfaces website visitors but waits for human approval before drafting and enrolling emails.

### 6. Keep Agents Internal Before Customer-Facing
**Domain:** Sales, Marketing
**Practice:** Use agents for research and brainstorming before you let them touch anything customer-facing. Less risk of public messes.
**Implementation:** Joe's Slack agent doesn't send emails until explicitly told to.

### 7. Build Modules → Tools
**Domain:** Product, Operations
**Practice:** Test a function until it's reliable, then wrap it as a tool you can give to agents. Modular design lets you swap components in and out.

### 8. Minimize Abstraction
**Domain:** Product, AI/Agents
**Practice:** Work closer to the metal with tools like Claude Code. The cost of abstraction layers (drag-and-drop UIs) is becoming too high.
**Why:** Direct LLM access lets you build custom solutions faster than configuring no-code tools.

### 9. Let Agent Interactions Evolve Your System
**Domain:** Operations, AI/Agents
**Practice:** Every task generates byproducts—edge cases, new patterns, gaps in your framework. Capture these and feed them back in.
**Example:** After analyzing a prospect, Joe's agent proposed adding a new "Influencer/Referral Partner" persona to the context files—the system evolved as a byproduct of work.

---

## Implementation Framework

1. Build your context layer (products, personas, messaging, guidelines)
2. Start with deterministic workflows
3. Add AI steps where they help
4. Keep humans in the loop
5. Graduate to full agents only for internal, low-risk use cases
6. Let the system learn and evolve

---

## Source Details

- **Speaker:** Joe Rhew (The Workflow Company - wfco.co)
- **Channel:** The Signal club (10 subscribers at time of capture)
- **Event:** AI x GTM Summit, Session #3
- **Posted:** ~2026-02-02
