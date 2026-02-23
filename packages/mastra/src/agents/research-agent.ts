/**
 * Research Agent — the first Mastra agent for SlideHeroes.
 *
 * Responsible for:
 * - Person research (LinkedIn profile lookup, career analysis)
 * - Company research (web search, news, industry context)
 * - Brief synthesis (combining person + company data into actionable briefs)
 *
 * This agent wraps the existing research services (netrows, company-research,
 * company-brief-synthesis) behind Mastra's agent abstraction, enabling
 * memory, observability, and tool-calling patterns.
 */

import { Agent } from "@mastra/core/agent";

import { getModelForAgent } from "../config/model-routing";

export const researchAgent = new Agent({
	id: "research-agent",
	name: "Research Agent",
	model: getModelForAgent("research"),
	instructions: [
		"You are an expert audience researcher for presentation preparation.",
		"Your job is to research a person and their company to help craft a targeted presentation.",
		"",
		"When researching a person, gather:",
		"- Professional background (role, seniority, career trajectory)",
		"- Communication style indicators (decision-making approach, what they value)",
		"- LinkedIn profile data when available",
		"",
		"When researching a company, gather:",
		"- Current situation (growth/decline, strategic focus, recent news)",
		"- Industry context (trends, competitors, regulatory landscape)",
		"- Presentation implications (framing advice, topics to acknowledge/avoid)",
		"",
		"Synthesize findings into structured briefs that help the presenter:",
		"1. Understand who they're presenting to",
		"2. Frame their message appropriately",
		"3. Anticipate questions and concerns",
		"4. Choose the right tone, depth, and evidence",
	].join("\n"),
	// Tools will be added in Phase 3B when we wire the existing services as Mastra tools
	tools: {},
});
