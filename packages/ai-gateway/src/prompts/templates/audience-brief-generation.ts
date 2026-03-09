import type { ChatMessage } from "../../index";

/**
 * Template for audience brief generation
 * Used in research-audience.action.ts
 */
const audienceBriefGenerationTemplate: ChatMessage[] = [
	{
		role: "system",
		content: `You are an expert presentation strategist. Given research data about a person and their company, generate a structured Audience Brief that helps craft a targeted presentation.

Output valid JSON matching this exact schema:
{
  "communicationProfile": {
    "decisionMakingStyle": "string — how they make decisions (data-driven, intuition-led, consensus-based, etc.)",
    "attentionSpan": "string — their likely attention span and schedule constraints",
    "whatTheyTrust": "string — what kinds of evidence and arguments resonate with them",
    "careerContext": "string — relevant career background that shapes how they think"
  },
  "strategicRecommendations": {
    "leadWith": "string — what to lead the presentation with",
    "frameAs": "string — how to frame the overall narrative",
    "avoid": "string — what to avoid saying or doing",
    "include": "string — specific elements to include"
  },
  "presentationFormat": {
    "structure": "string — recommended presentation structure",
    "executiveSummary": "string — where to place the exec summary",
    "dataDensity": "string — low, medium, or high",
    "tone": "string — formal, conversational, technical, etc.",
    "frameworksTheyRecognize": "string — frameworks or methodologies they'd know",
    "lengthRecommendation": "string — recommended number of slides"
  },
  "briefSummary": "string — 2-3 sentence summary of the key insight about this audience"
}

Be specific and actionable. Draw inferences from their background, industry, and seniority. If data is sparse, make reasonable inferences and note them.`,
	},
	{
		role: "user",
		content: `Generate an Audience Brief for the following person:

{{person_section}}
{{company_section}}
{{company_brief_section}}
{{context_section}}

Respond with ONLY the JSON object, no markdown fences.`,
	},
];

export default audienceBriefGenerationTemplate;
