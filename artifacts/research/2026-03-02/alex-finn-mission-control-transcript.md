# Alex Finn — "OpenClaw is 100x better with this tool (Mission Control)"

**Video:** https://youtu.be/RhLpV6QDBFE
**Date scraped:** 2026-03-02

## Full Transcript (cleaned up)

I'm about to show you how to give your OpenClaw superpowers. You need to build a mission control inside your OpenClaw. And in this video, I'll show you how to do it in just a couple of prompts.

Mission control is a custom dashboard for your OpenClaw that allows it to build any tool it needs on the fly. In this video, I'll take you through my entire mission control setup, every tool I use, and show you how to set up your own in just a couple of prompts. Zero programming experience needed, zero technical experience needed.

### Setup Prompt
"Hey, I want my own mission control where we can build custom tools. Please build it in Next.js and host it on the local host." Once you do that, it will build a template. You can also say "make it a clean interface that looks like Linear" and you'll get a mission control that's as beautiful as this.

---

## Tool 1: Task Board (Kanban)

A simple kanban board where every task is assigned to either me or Henry (his agent). Shows a description of the task. On the left hand side is a **live activity feed** which allows him to see every single thing Henry is doing in detail. Confirms Henry is doing the work he's saying he's doing.

As Henry does the work, he moves tasks over on the board towards the right until it's done. Anything that needs to be reviewed is in "review" and Alex can approve it.

**Key feature:** In every heartbeat, the agent checks the task board, sees if any tasks are assigned to it in the backlog, and then does them autonomously.

**Prompt:** Just describe what I showed to you and your agent will build it for you.

---

## Tool 2: Calendar

Shows what cron jobs and tasks are scheduled for the OpenClaw. Confirms the agent is being proactive. Solves the problem where agents say "Hey, I'll do that for you" and then never actually schedule those things.

**Prompt:** "Build a calendar for me that shows all the cron jobs and scheduled tasks."

---

## Tool 3: Project Screen

Tracks every project you're working on. Good for staying focused on what moves the ball forward. Shows how close you are to completing projects.

**Key feature:** Hooks into all other screens — can link tasks, memories, documents to every project.

**Reverse prompting tip:** "What's one task we can do right now that will help us progress in one of our major projects?"

**Prompt:** "If you were to categorize five projects we're working on right now, what would you say those five projects are?" → then build a project screen from that.

---

## Tool 4: Memory Screen

View every memory organized by day. Almost like journal entries. Great for finding old thoughts and conversations.

**Prompt:** "I want a memory screen in our mission control that allows me to view every memory you have organized by day. Build that out for me, please. And also have a long-term memory document that allows me to see all the long-term memories we have as well."

---

## Tool 5: Docs Screen

Every document the OpenClaw creates goes into the docs screen. Newsletters, planning docs, architecture docs, product requirement docs. Searchable and categorized.

**Prompt:** "I want a docs tool where I can go back and view all the previous documents you created for me in a nicely formatted view. Make it searchable and categorize the documents."

---

## Tool 6: Team Screen

Shows every agent, sub-agent, their roles, and the mission statement. Like an org structure for the digital company.

**Key feature:** Mission statement at the top — all proactive tasks work towards this. Agents reference the team screen to know who to delegate to.

**Reverse prompting tip:** "What task can we do right now that brings us closer to our mission statement?"

---

## Tool 7: Office Screen (Fun/Visual)

A 2D pixel art office that visualizes what all agents are doing. Agents go to their desks when working, sometimes meet at the water cooler.

**Prompt:** "I want a screen that visualizes all the work you're doing. I want a 2D pixel art office that shows you and all the sub agents. I want them to have desks and when they are doing work, they go to their desk and actually do the work."

---

## Key Philosophy: Reverse Prompting

Don't just copy — use reverse prompting after building the initial version:

"Based on what you know about me, what we've done, our workflows, our mission statement, our goals — what custom tools should we build out in our mission control?"

This builds custom tools that are way more relevant for your specific workflows.
