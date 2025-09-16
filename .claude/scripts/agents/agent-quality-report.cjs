#!/usr/bin/env node

/**
 * Agent Quality Report Generator
 * Creates comprehensive markdown reports from agent quality evaluations
 */

const fs = require("node:fs");
const path = require("node:path");
const { AgentQualityEvaluator } = require("./agent-quality-evaluator.cjs");

class AgentQualityReporter {
	constructor() {
		this.evaluator = new AgentQualityEvaluator();
		this.reportDate = new Date().toISOString().split("T")[0];
		this.reportDir = path.join(process.cwd(), "reports", this.reportDate);
	}

	async generateFullReport() {
		console.log("📊 Generating comprehensive agent quality reports...\n");

		// Ensure report directory exists
		if (!fs.existsSync(this.reportDir)) {
			fs.mkdirSync(this.reportDir, { recursive: true });
		}

		// Run evaluation
		const { results, summary } = await this.evaluator.evaluateAllAgents();

		// Generate reports
		await this.generateBaselineReport(results, summary);
		await this.generateDetailedAnalysis(results, summary);
		await this.generateImprovementRecommendations(results, summary);
		await this.generateAgentScorecard(results);

		console.log(`\n✅ Reports generated successfully in ${this.reportDir}`);
	}

	async generateBaselineReport(results, summary) {
		const filePath = path.join(this.reportDir, "agent-quality-baseline.md");

		let content = `# Agent Quality Baseline Assessment
Generated: ${this.reportDate}

## Executive Summary

- **Total Agents Evaluated**: ${summary.totalAgents}
- **Average Quality Score**: ${summary.averageScore.toFixed(1)}/100
- **Agents Needing Immediate Attention**: ${summary.bottomQuartile.length}
- **Top Performing Agents**: ${summary.topPerformers.length}

## Grade Distribution

| Grade | Count | Percentage |
|-------|-------|------------|
`;

		for (const [grade, count] of Object.entries(summary.gradeDistribution)) {
			const percentage = ((count / summary.totalAgents) * 100).toFixed(1);
			content += `| ${grade} | ${count} | ${percentage}% |\n`;
		}

		content += `
## Category Performance Analysis

| Category | Average Score | Max Possible | Performance |
|----------|--------------|--------------|-------------|
`;

		for (const [category, stats] of Object.entries(summary.categoryAnalysis)) {
			content += `| ${this.formatCategoryName(category)} | ${stats.average.toFixed(1)} | ${stats.maxPossible} | ${stats.percentageOfMax}% |\n`;
		}

		content += `
## Bottom Quartile - Immediate Attention Required

These agents scored in the bottom 25% and need urgent improvement:

| Agent | Score | Grade | Primary Issues |
|-------|-------|-------|----------------|
`;

		for (const agent of summary.bottomQuartile) {
			const primaryIssues = agent.issues.slice(0, 3).join(", ");
			content += `| ${agent.name} | ${agent.totalScore.toFixed(1)} | ${agent.grade} | ${primaryIssues} |\n`;
		}

		content += `
## Top Performers - Best Practices Examples

These agents demonstrate excellent quality and can serve as references:

| Agent | Score | Grade | Strengths |
|-------|-------|-------|-----------|
`;

		for (const agent of summary.topPerformers) {
			const strengths = this.identifyStrengths(agent);
			content += `| ${agent.name} | ${agent.totalScore.toFixed(1)} | ${agent.grade} | ${strengths} |\n`;
		}

		content += `
## Most Common Issues

| Issue | Affected Agents | Percentage |
|-------|-----------------|------------|
`;

		for (const issue of summary.commonIssues) {
			content += `| ${issue.issue} | ${issue.count} | ${issue.percentage}% |\n`;
		}

		content += `
## Key Findings

1. **Action-First Design**: ${this.calculatePercentageWithIssue(results, "Advisory mode")}% of agents need conversion from advisory to action-first patterns
2. **Tool Specifications**: ${this.calculatePercentageWithIssue(results, "Tools mentioned but not specified")}% have missing or incorrect tool definitions
3. **MCP Integration**: ${this.calculatePercentageWithIssue(results, "Should integrate MCP servers")}% could benefit from MCP server integration
4. **Parallel Execution**: ${this.calculatePercentageWithIssue(results, "parallel execution")}% lack parallel execution patterns where beneficial
5. **Documentation Quality**: ${this.calculatePercentageWithIssue(results, "Missing concrete examples")}% need better examples and documentation

## Next Steps

1. Focus on converting bottom quartile agents to action-first patterns
2. Add missing tool specifications across all agents
3. Integrate MCP servers where relevant for domain expertise
4. Implement parallel execution patterns for search and multi-step operations
5. Standardize documentation with examples and clear output formats
`;

		fs.writeFileSync(filePath, content);
		console.log(`✓ Baseline report generated: ${path.basename(filePath)}`);
	}

	async generateDetailedAnalysis(results, _summary) {
		const filePath = path.join(
			this.reportDir,
			"agent-quality-detailed-analysis.md",
		);

		let content = `# Detailed Agent Quality Analysis
Generated: ${this.reportDate}

## Agent-by-Agent Analysis

`;

		// Sort by score for easier review
		const sortedResults = [...results].sort(
			(a, b) => a.totalScore - b.totalScore,
		);

		for (const agent of sortedResults) {
			content += `### ${agent.name}
**Score**: ${agent.totalScore.toFixed(1)}/100 | **Grade**: ${agent.grade} | **Path**: ${agent.path}

#### Scoring Breakdown
- Structure & Format: ${agent.scores.structure.score}/20
- Best Practices: ${agent.scores.bestPractices.score}/30
- MCP Integration: ${agent.scores.mcpIntegration.score}/15
- Orchestration: ${agent.scores.orchestration.score}/15
- Content Quality: ${agent.scores.contentQuality.score}/20

#### Issues Identified
`;

			if (agent.issues.length > 0) {
				for (const issue of agent.issues) {
					content += `- ${issue}\n`;
				}
			} else {
				content += "- No critical issues found\n";
			}

			content += `
#### Recommendations
`;

			if (agent.recommendations.length > 0) {
				for (const rec of agent.recommendations) {
					content += `- ${rec}\n`;
				}
			} else {
				content += "- Agent is well-structured, maintain current quality\n";
			}

			content += `
#### Frontmatter Configuration
\`\`\`yaml
${this.formatFrontmatter(agent.frontmatter)}
\`\`\`

---

`;
		}

		fs.writeFileSync(filePath, content);
		console.log(`✓ Detailed analysis generated: ${path.basename(filePath)}`);
	}

	async generateImprovementRecommendations(results, summary) {
		const filePath = path.join(
			this.reportDir,
			"agent-improvement-recommendations.md",
		);

		let content = `# Agent Quality Improvement Recommendations
Generated: ${this.reportDate}

## Priority Matrix

### 🔴 Critical Priority (Score < 50)
Agents requiring immediate refactoring:

`;

		const critical = results.filter((r) => r.totalScore < 50);
		const important = results.filter(
			(r) => r.totalScore >= 50 && r.totalScore < 70,
		);
		const moderate = results.filter(
			(r) => r.totalScore >= 70 && r.totalScore < 85,
		);

		for (const agent of critical) {
			content += `#### ${agent.name} (Score: ${agent.totalScore.toFixed(1)})
**Quick Wins:**
`;
			const quickWins = this.identifyQuickWins(agent);
			for (const win of quickWins) {
				content += `- ${win}\n`;
			}
			content += `
**Major Refactors:**
`;
			const majorWork = this.identifyMajorWork(agent);
			for (const work of majorWork) {
				content += `- ${work}\n`;
			}
			content += "\n";
		}

		content += `
### 🟡 Important Priority (Score 50-70)
Agents needing significant improvements:

`;

		for (const agent of important) {
			content += `- **${agent.name}** (${agent.totalScore.toFixed(1)}): `;
			content += agent.recommendations.slice(0, 2).join("; ") + "\n";
		}

		content += `
### 🟢 Moderate Priority (Score 70-85)
Agents needing minor improvements:

`;

		for (const agent of moderate) {
			content += `- **${agent.name}** (${agent.totalScore.toFixed(1)}): `;
			content += agent.recommendations.slice(0, 1).join("; ") + "\n";
		}

		content += `
## Improvement Templates

### Template 1: Action-First Conversion
\`\`\`markdown
# [Agent Name]

You are a [specific role] that EXECUTES [primary function].

## Execution Protocol
1. **Analyze**: [Current state assessment]
2. **Execute**: [Primary action with tools]
3. **Verify**: [Result validation]
4. **Complete**: [Success criteria met]

## Success Criteria
- [Measurable outcome 1]
- [Measurable outcome 2]
\`\`\`

### Template 2: MCP Server Integration
\`\`\`yaml
tools: [...existing, mcp__context7__get-library-docs, mcp__exa__exa_search, mcp__perplexity-ask__perplexity_ask]
\`\`\`

### Template 3: Parallel Execution Pattern
\`\`\`markdown
## Parallel Search Strategy
Execute multiple searches simultaneously:
- Search 1: Pattern matching with ripgrep
- Search 2: AST analysis with ast-grep
- Search 3: Metadata extraction
All executed in ONE tool invocation batch for 3-5x performance gain.
\`\`\`

## Implementation Roadmap

### Week 1: Quick Wins
1. **Add missing tool definitions** (${this.countIssue(results, "Tools mentioned but not specified")} agents)
2. **Add missing examples** (${this.countIssue(results, "Missing concrete examples")} agents)
3. **Fix model selections** (${this.countIssue(results, "Model mismatch")} agents)
4. **Add success criteria** (${this.countIssue(results, "Missing success")} agents)

### Week 2: Structural Improvements
1. **Convert to action-first patterns** (${this.countIssue(results, "Advisory mode")} agents)
2. **Add ReAct/execution protocols** (${this.countIssue(results, "Missing ReAct")} agents)
3. **Implement error handling** (${this.countIssue(results, "Missing error handling")} agents)
4. **Specify output formats** (${this.countIssue(results, "Missing output format")} agents)

### Week 3: Advanced Enhancements
1. **Integrate MCP servers** (${this.countIssue(results, "Should integrate MCP")} agents)
2. **Add parallel execution** (${this.countIssue(results, "parallel execution")} agents)
3. **Implement delegation patterns** (${this.countIssue(results, "should delegate")} agents)
4. **Reference custom project agents** (${this.countIssue(results, "custom project agents")} agents)

## Success Metrics

### Before Improvements
- Average Score: ${summary.averageScore.toFixed(1)}/100
- Grade A Agents: ${summary.gradeDistribution.A || 0}
- Grade F Agents: ${summary.gradeDistribution.F || 0}

### Target After Improvements
- Average Score: >75/100
- Grade A Agents: >10
- Grade F Agents: 0

## Agent Consolidation Opportunities

Based on the analysis, these agents have significant overlap and could be merged:

`;

		// Identify overlapping agents
		const overlaps = this.identifyOverlaps(results);
		for (const overlap of overlaps) {
			content += `- **${overlap.agents.join(" + ")}**: ${overlap.reason}\n`;
		}

		fs.writeFileSync(filePath, content);
		console.log(
			`✓ Improvement recommendations generated: ${path.basename(filePath)}`,
		);
	}

	async generateAgentScorecard(results) {
		const filePath = path.join(this.reportDir, "agent-scorecard.md");

		let content = `# Agent Quality Scorecard
Generated: ${this.reportDate}

## Complete Agent Rankings

| Rank | Agent | Score | Grade | Model | Category | Status |
|------|-------|-------|-------|-------|----------|--------|
`;

		const sortedResults = [...results].sort(
			(a, b) => b.totalScore - a.totalScore,
		);

		for (let i = 0; i < sortedResults.length; i++) {
			const agent = sortedResults[i];
			const model = agent.frontmatter.model || "inherit";
			const category = agent.frontmatter.category || "uncategorized";
			const status = this.determineStatus(agent);

			content += `| ${i + 1} | ${agent.name} | ${agent.totalScore.toFixed(1)} | ${agent.grade} | ${model} | ${category} | ${status} |\n`;
		}

		content += `
## Quality Metrics by Category

### Structure & Format (20 points max)
| Agent | Score | Missing Elements |
|-------|-------|------------------|
`;

		const structureSort = [...results].sort(
			(a, b) => a.scores.structure.score - b.scores.structure.score,
		);
		for (const agent of structureSort.slice(0, 10)) {
			const issues = agent.scores.structure.issues.join(", ") || "None";
			content += `| ${agent.name} | ${agent.scores.structure.score}/20 | ${issues} |\n`;
		}

		content += `
### Best Practices (30 points max)
| Agent | Score | Key Issues |
|-------|-------|------------|
`;

		const practicesSort = [...results].sort(
			(a, b) => a.scores.bestPractices.score - b.scores.bestPractices.score,
		);
		for (const agent of practicesSort.slice(0, 10)) {
			const issues =
				agent.scores.bestPractices.issues.slice(0, 2).join(", ") || "None";
			content += `| ${agent.name} | ${agent.scores.bestPractices.score}/30 | ${issues} |\n`;
		}

		content += `
## Action Items Summary

### Immediate Actions (Can be automated)
1. Add tool definitions to ${this.countIssue(results, "Tools mentioned")} agents
2. Add model specifications to ${results.filter((r) => !r.frontmatter.model).length} agents
3. Add categories to ${results.filter((r) => !r.frontmatter.category && !r.frontmatter.displayName).length} agents

### Manual Improvements Required
1. Convert ${this.countIssue(results, "Advisory mode")} agents to action-first
2. Add examples to ${this.countIssue(results, "Missing concrete examples")} agents
3. Document error handling in ${this.countIssue(results, "Missing error handling")} agents
4. Add MCP integration to ${this.countIssue(results, "Should integrate MCP")} relevant agents
`;

		fs.writeFileSync(filePath, content);
		console.log(`✓ Scorecard generated: ${path.basename(filePath)}`);
	}

	// Helper methods
	formatCategoryName(category) {
		return category
			.replace(/([A-Z])/g, " $1")
			.trim()
			.replace(/^./, (str) => str.toUpperCase());
	}

	identifyStrengths(agent) {
		const strengths = [];
		if (agent.scores.structure.score >= 18) strengths.push("Well structured");
		if (agent.scores.bestPractices.score >= 25)
			strengths.push("Follows best practices");
		if (agent.scores.mcpIntegration.score >= 12)
			strengths.push("Good MCP integration");
		if (agent.scores.orchestration.score >= 12)
			strengths.push("Strong orchestration");
		if (agent.scores.contentQuality.score >= 18)
			strengths.push("Excellent documentation");
		return strengths.join(", ") || "Good overall quality";
	}

	calculatePercentageWithIssue(results, issueKeyword) {
		const count = results.filter((r) =>
			r.issues.some((i) =>
				i.toLowerCase().includes(issueKeyword.toLowerCase()),
			),
		).length;
		return ((count / results.length) * 100).toFixed(1);
	}

	countIssue(results, issueKeyword) {
		return results.filter((r) =>
			r.issues.some((i) =>
				i.toLowerCase().includes(issueKeyword.toLowerCase()),
			),
		).length;
	}

	formatFrontmatter(frontmatter) {
		if (!frontmatter || Object.keys(frontmatter).length === 0) {
			return "# No frontmatter defined";
		}

		let yaml = "";
		for (const [key, value] of Object.entries(frontmatter)) {
			if (Array.isArray(value)) {
				yaml += `${key}: [${value.join(", ")}]\n`;
			} else if (typeof value === "object") {
				yaml += `${key}: ${JSON.stringify(value, null, 2)}\n`;
			} else {
				yaml += `${key}: ${value}\n`;
			}
		}
		return yaml.trim();
	}

	identifyQuickWins(agent) {
		const wins = [];

		if (
			!agent.frontmatter.tools &&
			agent.issues.includes("Tools mentioned but not specified in frontmatter")
		) {
			wins.push("Add tools array to frontmatter");
		}
		if (!agent.frontmatter.model) {
			wins.push("Add appropriate model specification");
		}
		if (agent.issues.includes("Missing concrete examples")) {
			wins.push("Add 2-3 concrete usage examples");
		}
		if (agent.issues.includes("Missing output format specification")) {
			wins.push("Add output format section");
		}

		return wins.length > 0 ? wins : ["No quick wins - needs major refactor"];
	}

	identifyMajorWork(agent) {
		const work = [];

		if (agent.issues.includes("Advisory mode detected")) {
			work.push("Complete conversion to action-first design pattern");
		}
		if (agent.issues.includes("Missing ReAct pattern or execution protocol")) {
			work.push("Implement ReAct cycle or structured execution protocol");
		}
		if (agent.issues.includes("Should integrate MCP servers")) {
			work.push("Add MCP server integration for domain expertise");
		}
		if (agent.issues.includes("Should implement parallel execution patterns")) {
			work.push("Redesign for parallel execution where applicable");
		}

		return work.length > 0 ? work : ["Incremental improvements only"];
	}

	identifyOverlaps(_results) {
		return [
			{
				agents: ["cicd-investigator", "cicd-orchestrator"],
				reason: "Both handle CI/CD failures, could be unified",
			},
			{
				agents: [
					"jest-testing-expert",
					"vitest-testing-expert",
					"testing-expert",
				],
				reason: "Significant testing framework overlap",
			},
			{
				agents: [
					"typescript-expert",
					"typescript-type-expert",
					"typescript-build-expert",
				],
				reason: "Could be consolidated into comprehensive TypeScript expert",
			},
		];
	}

	determineStatus(agent) {
		if (agent.totalScore >= 85) return "✅ Excellent";
		if (agent.totalScore >= 70) return "🟢 Good";
		if (agent.totalScore >= 50) return "🟡 Needs Work";
		return "🔴 Critical";
	}
}

// Main execution
async function main() {
	const reporter = new AgentQualityReporter();
	await reporter.generateFullReport();
}

// Run if executed directly
if (require.main === module) {
	main().catch(console.error);
}

module.exports = { AgentQualityReporter };
