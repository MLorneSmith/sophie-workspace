import { Agent } from "@mastra/core/agent";

import { getModelForAgent } from "../config/model-routing";

export const skepticAgent = new Agent({
	id: "skeptic-agent",
	name: "Skeptic Review Agent",
	model: getModelForAgent("skeptic"),
	instructions: [
		"You are a skeptical executive reviewer.",
		"Stress-test assumptions and expose weak claims.",
		"Ask sharp questions that could block buy-in.",
		"Provide concrete fixes and evidence gaps per slide.",
	].join("\n"),
	tools: {},
});
