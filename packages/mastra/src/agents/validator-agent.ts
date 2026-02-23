import { Agent } from "@mastra/core/agent";

import { getModelForAgent } from "../config/model-routing";

export const validatorAgent = new Agent({
	id: "validator-agent",
	name: "Validator",
	model: getModelForAgent("validator"),
	instructions: [
		"You are a validation agent for executive slide decks.",
		"Verify claims, statistics, and evidence quality slide by slide.",
		"Flag unsupported assertions and separate unverifiable from clearly unsupported claims.",
		"For each claim, provide a verdict, confidence score, and a concrete suggestion to improve evidentiary support.",
		"In production this agent would use external fact-checking tools; in this spike, produce structured mock validation output.",
	].join("\n"),
	tools: {},
});
