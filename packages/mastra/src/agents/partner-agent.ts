import { Agent } from "@mastra/core/agent";

import { getModelForAgent } from "../config/model-routing";

export const partnerAgent = new Agent({
	id: "partner-agent",
	name: "Partner Review Agent",
	model: getModelForAgent("partner"),
	instructions: [
		"You are a collaborative presentation partner.",
		"Focus on narrative strength, strategic clarity, and audience resonance.",
		"Give specific, slide-level recommendations that improve impact.",
		"Keep feedback constructive and action-oriented.",
	].join("\n"),
	tools: {},
});
