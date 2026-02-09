# Notion Second Brain: Recommendation for Mike

*Prepared by Sophie | February 2026*

---

## Executive Summary

I recommend a **PARA-inspired structure** adapted to your specific ecosystem. Notion becomes your "thinking space" for strategy, knowledge, and project briefs — while **Todoist handles execution** and **Mission Control manages our collaboration**.

---

## 1. Philosophy: "Think in Notion, Act in Todoist, Collaborate in Mission Control"

### The Core Principle
**Notion is for thinking, not doing.** 

Most second brain failures happen when people try to manage tasks *and* knowledge in the same place. The cognitive modes are different:
- **Knowledge work** = slow, reflective, non-linear
- **Task execution** = fast, focused, linear

### Your Three Systems

| System | Purpose | Mode |
|--------|---------|------|
| **Notion** | Think, plan, capture knowledge | Reflective |
| **Todoist** | Execute tasks, daily work | Action |
| **Mission Control** | Sophie collaboration, delegation | Coordination |

### Flow Direction
```
Ideas/Research → Notion (capture & organize)
                    ↓
              Project Briefs → Todoist (tasks) + Mission Control (Sophie tasks)
                    ↓
              Completed work → Notion (archive & learnings)
```

---

## 2. Recommended Structure (PARA-Adapted)

### Top-Level Pages

```
📥 Inbox
   └── Quick capture, unsorted notes, ideas to process

🎯 Projects
   └── Active initiatives with clear outcomes
   └── (Sub-pages for each project with briefs, notes, assets)

🔄 Areas
   └── Ongoing life/business domains (no end date)
   └── SlideHeroes Business
   └── Personal Development
   └── Family
   └── Health
   └── Finances

📚 Resources
   └── Reference material by topic
   └── Best Practices (extracted insights — ties to Task #14)
   └── Research & Learning
   └── Templates
   └── People & Contacts

🗄️ Archive
   └── Completed projects
   └── Inactive areas
   └── Old resources (still searchable)

📊 Dashboards
   └── Weekly Review
   └── Project Overview
   └── Learning Log
```

### Database Structure

I recommend **databases over pages** for anything you'll query or filter:

**Projects Database** (properties):
- Name (title)
- Area (relation → Areas)
- Status (select: Planning / Active / Paused / Complete)
- Priority (select: High / Medium / Low)
- Start Date (date)
- Target End (date)
- Outcome (text) — what does "done" look like?
- Todoist Project (URL) — link to execution
- Sophie Involved (checkbox) — flags for MC integration

**Resources Database** (properties):
- Name (title)
- Type (select: Article / Book / Video / Course / Template / Tool)
- Topics (multi-select)
- Source URL (URL)
- Key Takeaways (text)
- Date Added (date)
- Rating (select: ⭐⭐⭐⭐⭐)

**Best Practices Database** (properties):
- Practice (title)
- Domain (multi-select: Sales / Product / Marketing / Operations / Leadership)
- Source (relation → Resources)
- Context (text) — when to apply
- Implementation Notes (text)
- Date Captured (date)

---

## 3. Key Templates

### Project Brief Template
```markdown
# [Project Name]

## Outcome
What does success look like? (1-2 sentences)

## Context
Why are we doing this now?

## Scope
- In scope:
- Out of scope:

## Key Milestones
1. [ ] Milestone 1 — [date]
2. [ ] Milestone 2 — [date]

## Resources Needed
- 
- 

## Links
- Todoist Project: [link]
- Mission Control Tasks: [link]
- Related Resources: [links]

## Notes & Decisions
(Running log)
```

### Weekly Review Template
```markdown
# Week of [Date]

## What went well?
- 

## What didn't go well?
- 

## Key learnings
- 

## Projects Status
| Project | Status | Next Action |
|---------|--------|-------------|
|         |        |             |

## Upcoming priorities
1. 
2. 
3. 

## Sophie collaboration notes
- Tasks delegated:
- Tasks completed:
- Feedback:
```

### Resource Capture Template
```markdown
# [Resource Title]

**Type:** Article / Book / Video
**Source:** [URL]
**Date Consumed:** [date]

## Summary
(2-3 sentences)

## Key Takeaways
1. 
2. 
3. 

## Best Practices Extracted
- [ ] [Practice 1] — added to Best Practices DB
- [ ] [Practice 2] — added to Best Practices DB

## How I might use this
- 

## Related to
- Projects: 
- Areas:
```

---

## 4. Integration Architecture

### Notion ↔ Todoist

**Recommended approach:** Manual project linking (not auto-sync)

Why: Auto-sync tools (2sync, Pleexy) work but add complexity. For your workflow, I recommend:

1. **Create project in Notion first** (the brief, the thinking)
2. **Create matching Todoist project** for execution tasks
3. **Link them** via URL property in Notion
4. **Review weekly** in Notion, update Todoist as needed

If you want auto-sync later, 2sync is the cleanest option.

### Notion ↔ Mission Control

**Mission Control handles Sophie collaboration.** Keep it separate but linked:

| Notion | Mission Control |
|--------|-----------------|
| Project briefs | Tasks I work on |
| Strategy docs | Execution tracking |
| Resources | Activity log |
| Best practices | Sophie's docs (TBD from Task #13) |

**Integration points:**
- When you create a project in Notion that needs Sophie help, you (or I) create tasks in MC
- MC Docs can link to Notion pages for deeper context
- My activity reports can reference Notion project briefs

### Notion ↔ Sophie Memory

**My memory system is intentionally separate** — it contains conversation context, your preferences, and operational state that shouldn't clutter your second brain.

However, **I can read/write to Notion** via the API. Useful for:
- Adding extracted best practices automatically
- Creating resource entries from articles you share
- Updating project status based on our conversations
- Pulling context from your project briefs when working on tasks

---

## 5. Recommended Workflow

### Daily
1. Capture ideas/notes to **Notion Inbox** (quick capture)
2. Work from **Todoist** (task execution)
3. Chat with **Sophie via Discord** (collaboration)

### Weekly (30-45 min)
1. **Process Inbox** — move items to proper locations
2. **Review Projects** — update status, check progress
3. **Weekly Review template** — reflect and plan
4. **Review MC tasks** — anything to delegate to Sophie?

### When Starting a Project
1. Create **Project page** in Notion (use template)
2. Think through the brief, outcomes, scope
3. Create **Todoist project** with immediate tasks
4. If Sophie involved → create **MC tasks** for delegation

### When Consuming Content
1. Capture in **Notion Resources** (use template)
2. Extract **Best Practices** to the database
3. Link to relevant **Projects/Areas**

---

## 6. What NOT to Put in Notion

Keep Notion clean by excluding:
- Day-to-day tasks (→ Todoist)
- Sophie collaboration specifics (→ Mission Control)
- Meeting scheduling (→ Calendar)
- Quick communications (→ Email/Discord)
- Sensitive operational data (→ appropriate secure location)

---

## 7. Getting Started

### Phase 1: Foundation (Week 1)
1. Create top-level structure (Projects, Areas, Resources, Archive, Dashboards)
2. Create Projects and Resources databases
3. Set up 2-3 current projects with briefs
4. Import any existing docs you want to keep

### Phase 2: Templates (Week 2)
1. Create Project Brief template
2. Create Weekly Review template
3. Create Resource Capture template
4. Do first Weekly Review

### Phase 3: Integration (Week 3)
1. Link existing Todoist projects to Notion
2. Establish MC ↔ Notion linking convention
3. Share relevant Notion pages with Sophie integration
4. Test: have Sophie read/write to a test page

### Phase 4: Habit Formation (Weeks 4+)
1. Daily inbox capture
2. Weekly reviews (non-negotiable)
3. Project briefs before execution
4. Resource capture when consuming content

---

## Questions for You

Before I help you implement this:

1. **Do you have an existing Notion workspace?** (If so, I can propose migration steps)
2. **Which Areas feel right for your life?** (I suggested some but you know best)
3. **Do you want Notion ↔ Todoist auto-sync?** (Or manual linking?)
4. **Should I have write access to Notion?** (To add resources/practices automatically)

---

*This recommendation connects to Task #13 (MC Docs strategy) and Task #14 (Best Practices extraction). Once you approve this structure, those recommendations will build on it.*
