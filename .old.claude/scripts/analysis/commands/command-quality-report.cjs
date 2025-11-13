#!/usr/bin/env node

/**
 * Command Quality Report Generator
 * Creates comprehensive markdown and JSON reports from command quality evaluations
 */

const fs = require("node:fs");
const path = require("node:path");
const CommandQualityEvaluator = require("./command-quality-evaluator.cjs");

class CommandQualityReporter {
	constructor() {
		this.evaluator = new CommandQualityEvaluator();
		this.reportDate = new Date().toISOString().split("T")[0];
		this.reportDir = path.join(process.cwd(), "reports", this.reportDate);
	}

	async generateFullReport() {
		console.log("📊 Generating comprehensive command quality reports...\n");

		// Ensure report directory exists
		if (!fs.existsSync(this.reportDir)) {
			fs.mkdirSync(this.reportDir, { recursive: true });
		}

		// Run evaluation
		const { results, summary } = await this.evaluator.evaluateAllCommands();

		// Generate reports
		await this.generateBaselineReport(results, summary);
		await this.generateDetailedAnalysis(results, summary);
		await this.generatePrimeComplianceMatrix(results);
		await this.generateImprovementPlan(results, summary);
		await this.generateJsonReport(results, summary);

		console.log(`\n✅ Reports generated successfully in ${this.reportDir}`);
		console.log("   - command-quality-baseline.md");
		console.log("   - command-quality-analysis.md");
		console.log("   - command-prime-compliance.md");
		console.log("   - command-improvement-plan.md");
		console.log("   - command-quality-data.json");

		return { reportDir: this.reportDir, summary };
	}

	async generateBaselineReport(results, summary) {
		const filePath = path.join(this.reportDir, "command-quality-baseline.md");

		let content = `# Command Quality Baseline Assessment
Generated: ${this.reportDate}

## Executive Summary

- **Total Commands Evaluated**: ${summary.totalCommands}
- **Average Quality Score**: ${summary.averageScore.toFixed(1)}/100
- **Commands Needing Immediate Attention**: ${summary.bottomQuartile.length}
- **Top Performing Commands**: ${summary.topPerformers.length}
- **Most Common Issue**: ${summary.commonIssues[0]?.issue || "None"} (${summary.commonIssues[0]?.percentage || 0}% of commands)

## Grade Distribution

| Grade | Count | Percentage | Description |
|-------|-------|------------|-------------|
`;

		const gradeDescriptions = {
			A: "PRIME-compliant, action-first, well-integrated",
			B: "Good structure, minor improvements needed",
			C: "Functional but needs optimization",
			D: "Major gaps in best practices",
			F: "Requires significant restructuring",
		};

		for (const [grade, count] of Object.entries(summary.gradeDistribution)) {
			const percentage = ((count / summary.totalCommands) * 100).toFixed(1);
			content += `| ${grade} | ${count} | ${percentage}% | ${gradeDescriptions[grade]} |\n`;
		}

		content += `
## Category Performance Analysis

| Category | Average Score | Max Possible | Performance |
|----------|--------------|--------------|-------------|
`;

		for (const [_, stats] of Object.entries(summary.categoryAnalysis)) {
			const performanceBar = this.generatePerformanceBar(stats.percentageOfMax);
			content += `| ${stats.name} | ${stats.average.toFixed(1)} | ${stats.maxPossible} | ${performanceBar} ${stats.percentageOfMax}% |\n`;
		}

		content += `
## Commands Requiring Immediate Attention

These commands scored in the bottom 25% and need urgent improvement:

| Command | Score | Grade | Primary Issues |
|---------|-------|-------|----------------|
`;

		for (const command of summary.bottomQuartile) {
			const primaryIssues = command.issues.slice(0, 3).join("; ");
			const shortName =
				command.name.length > 30
					? command.name.substring(0, 27) + "..."
					: command.name;
			content += `| ${shortName} | ${command.totalScore.toFixed(1)} | ${command.grade} | ${primaryIssues} |\n`;
		}

		content += `
## Top Performing Commands

These commands demonstrate excellent quality and can serve as references:

| Command | Score | Grade | Key Strengths |
|---------|-------|-------|---------------|
`;

		for (const command of summary.topPerformers) {
			const strengths = this.identifyStrengths(command);
			const shortName =
				command.name.length > 30
					? command.name.substring(0, 27) + "..."
					: command.name;
			content += `| ${shortName} | ${command.totalScore.toFixed(1)} | ${command.grade} | ${strengths} |\n`;
		}

		content += `
## Most Common Issues

| Issue | Occurrence | Percentage | Impact |
|-------|------------|------------|--------|
`;

		for (const { issue, count, percentage } of summary.commonIssues) {
			const impact = this.assessImpact(issue);
			content += `| ${issue} | ${count} | ${percentage}% | ${impact} |\n`;
		}

		content += `
## Quick Wins

Based on the analysis, here are the top 5 quick improvements that would have the most impact:

1. **Add PRIME Framework Structure** - ${this.countCommandsWithIssue(results, "PRIME")} commands lack proper PRIME phases
2. **Convert to Action-First Design** - ${this.countCommandsWithIssue(results, "advisory")} commands use too much advisory language
3. **Add Error Handling** - ${this.countCommandsWithIssue(results, "error handling")} commands missing error handling
4. **Specify Allowed Tools** - ${this.countCommandsWithIssue(results, "tools")} commands need tool specifications
5. **Add Examples** - ${this.countCommandsWithIssue(results, "examples")} commands lack concrete examples

## Next Steps

1. **Immediate** (This Week)
   - Fix all F-grade commands (${summary.gradeDistribution.F} commands)
   - Add missing PRIME phases to D-grade commands

2. **Short-term** (Next 2 Weeks)
   - Convert advisory language to action verbs
   - Add error handling patterns to all commands
   - Implement validation checks

3. **Medium-term** (Next Month)
   - Integrate specialized agents where appropriate
   - Add MCP server integration for enhanced capabilities
   - Improve documentation with examples and success criteria

---
*Use the detailed analysis reports for specific command improvements*`;

		fs.writeFileSync(filePath, content);
	}

	async generateDetailedAnalysis(results, summary) {
		const filePath = path.join(this.reportDir, "command-quality-analysis.md");

		let content = `# Command Quality Detailed Analysis
Generated: ${this.reportDate}

## Analysis by Command Category

`;

		// Group commands by directory
		const commandsByCategory = {};
		for (const result of results) {
			const category = path.dirname(result.relativePath);
			if (!commandsByCategory[category]) {
				commandsByCategory[category] = [];
			}
			commandsByCategory[category].push(result);
		}

		// Sort categories by average score
		const categoryStats = Object.entries(commandsByCategory)
			.map(([cat, cmds]) => {
				const avgScore =
					cmds.reduce((sum, c) => sum + c.totalScore, 0) / cmds.length;
				return { category: cat, commands: cmds, averageScore: avgScore };
			})
			.sort((a, b) => b.averageScore - a.averageScore);

		for (const { category, commands, averageScore } of categoryStats) {
			const categoryName =
				category === "."
					? "Root Commands"
					: category
							.replace(/\//g, " / ")
							.replace(/-/g, " ")
							.replace(/\b\w/g, (l) => l.toUpperCase());

			content += `### ${categoryName}
**Average Score**: ${averageScore.toFixed(1)}/100 | **Commands**: ${commands.length}

| Command | Score | Grade | Issues | Recommendations |
|---------|-------|-------|--------|-----------------|
`;

			for (const cmd of commands.sort((a, b) => b.totalScore - a.totalScore)) {
				const cmdName = path.basename(cmd.relativePath, ".md");
				const issues = cmd.issues.length;
				const topRec = cmd.recommendations[0] || "None";
				content += `| ${cmdName} | ${cmd.totalScore.toFixed(1)} | ${cmd.grade} | ${issues} | ${topRec} |\n`;
			}

			content += "\n";
		}

		content += `
## Score Distribution Analysis

\`\`\`
Score Range | Count | Visual
------------|-------|${"-".repeat(50)}
90-100 (A)  | ${String(summary.gradeDistribution.A).padStart(3)} | ${"█".repeat(Math.min(50, summary.gradeDistribution.A * 2))}
80-89 (B)   | ${String(summary.gradeDistribution.B).padStart(3)} | ${"█".repeat(Math.min(50, summary.gradeDistribution.B * 2))}
70-79 (C)   | ${String(summary.gradeDistribution.C).padStart(3)} | ${"█".repeat(Math.min(50, summary.gradeDistribution.C * 2))}
60-69 (D)   | ${String(summary.gradeDistribution.D).padStart(3)} | ${"█".repeat(Math.min(50, summary.gradeDistribution.D * 2))}
0-59 (F)    | ${String(summary.gradeDistribution.F).padStart(3)} | ${"█".repeat(Math.min(50, summary.gradeDistribution.F * 2))}
\`\`\`

## Category Score Breakdown

`;

		for (const [key, stats] of Object.entries(summary.categoryAnalysis)) {
			const excellentCount = results.filter(
				(r) => r.scores[key].score >= stats.maxPossible * 0.9,
			).length;
			const goodCount = results.filter(
				(r) =>
					r.scores[key].score >= stats.maxPossible * 0.7 &&
					r.scores[key].score < stats.maxPossible * 0.9,
			).length;
			const poorCount = results.filter(
				(r) => r.scores[key].score < stats.maxPossible * 0.5,
			).length;

			content += `### ${stats.name}
- **Maximum Points**: ${stats.maxPossible}
- **Average Score**: ${stats.average.toFixed(1)} (${stats.percentageOfMax}%)
- **Excellent (90%+)**: ${excellentCount} commands
- **Good (70-89%)**: ${goodCount} commands
- **Poor (<50%)**: ${poorCount} commands

Top Issues in this category:
`;

			// Find most common issues for this category
			const categoryIssues = {};
			for (const result of results) {
				for (const issue of result.scores[key].issues || []) {
					categoryIssues[issue] = (categoryIssues[issue] || 0) + 1;
				}
			}

			const topIssues = Object.entries(categoryIssues)
				.sort((a, b) => b[1] - a[1])
				.slice(0, 3);

			for (const [issue, count] of topIssues) {
				content += `- ${issue} (${count} commands)\n`;
			}

			content += "\n";
		}

		fs.writeFileSync(filePath, content);
	}

	async generatePrimeComplianceMatrix(results) {
		const filePath = path.join(this.reportDir, "command-prime-compliance.md");

		let content = `# PRIME Framework Compliance Matrix
Generated: ${this.reportDate}

## Overview

The PRIME framework ensures systematic command construction:
- **P**urpose: Clear objectives and success criteria
- **R**ole: Defined expertise and authority
- **I**nputs: Comprehensive material gathering
- **M**ethod: Action-driven execution flow
- **E**xpectations: Validation and quality output

## Compliance Matrix

| Command | P | R | I | M | E | Score | Status |
|---------|---|---|---|---|---|-------|--------|
`;

		for (const result of results.sort((a, b) => b.totalScore - a.totalScore)) {
			const cmdName =
				result.name.length > 25
					? result.name.substring(0, 22) + "..."
					: result.name;

			const phases = {
				P: this.hasPhase(result, "purpose"),
				R: this.hasPhase(result, "role"),
				I: this.hasPhase(result, "inputs"),
				M: this.hasPhase(result, "method"),
				E: this.hasPhase(result, "expectations"),
			};

			const phaseIcons = Object.entries(phases).map(([_, has]) =>
				has ? "✅" : "❌",
			);

			const complianceScore = Object.values(phases).filter((v) => v).length;
			const status =
				complianceScore === 5
					? "✨ Full"
					: complianceScore >= 3
						? "⚠️ Partial"
						: "❌ Low";

			content += `| ${cmdName} | ${phaseIcons.join(" | ")} | ${complianceScore}/5 | ${status} |\n`;
		}

		content += `
## Phase Implementation Statistics

| PRIME Phase | Implemented | Missing | Implementation Rate |
|-------------|-------------|---------|-------------------|
`;

		const phaseStats = {
			Purpose: 0,
			Role: 0,
			Inputs: 0,
			Method: 0,
			Expectations: 0,
		};

		for (const result of results) {
			if (this.hasPhase(result, "purpose")) phaseStats.Purpose++;
			if (this.hasPhase(result, "role")) phaseStats.Role++;
			if (this.hasPhase(result, "inputs")) phaseStats.Inputs++;
			if (this.hasPhase(result, "method")) phaseStats.Method++;
			if (this.hasPhase(result, "expectations")) phaseStats.Expectations++;
		}

		for (const [phase, implemented] of Object.entries(phaseStats)) {
			const missing = results.length - implemented;
			const rate = ((implemented / results.length) * 100).toFixed(1);
			const bar = this.generatePerformanceBar(parseInt(rate));
			content += `| ${phase} | ${implemented} | ${missing} | ${bar} ${rate}% |\n`;
		}

		content += `
## Commands with Full PRIME Compliance

These commands follow the complete PRIME framework and can serve as templates:

| Command | Path | Score |
|---------|------|-------|
`;

		const fullyCompliant = results
			.filter((r) => {
				const hasAll = [
					"purpose",
					"role",
					"inputs",
					"method",
					"expectations",
				].every((phase) => this.hasPhase(r, phase));
				return hasAll;
			})
			.sort((a, b) => b.totalScore - a.totalScore);

		if (fullyCompliant.length > 0) {
			for (const cmd of fullyCompliant.slice(0, 10)) {
				content += `| ${cmd.name} | ${cmd.relativePath} | ${cmd.totalScore.toFixed(1)} |\n`;
			}
		} else {
			content += "| *No commands with full PRIME compliance* | - | - |\n";
		}

		content += `
## Commands Missing Multiple PRIME Phases

These commands need significant restructuring:

| Command | Missing Phases | Priority |
|---------|---------------|----------|
`;

		const needsWork = results
			.filter((r) => {
				const missingCount = [
					"purpose",
					"role",
					"inputs",
					"method",
					"expectations",
				].filter((phase) => !this.hasPhase(r, phase)).length;
				return missingCount >= 3;
			})
			.sort((a, b) => a.totalScore - b.totalScore);

		for (const cmd of needsWork.slice(0, 15)) {
			const missing = ["purpose", "role", "inputs", "method", "expectations"]
				.filter((phase) => !this.hasPhase(cmd, phase))
				.map((p) => p.charAt(0).toUpperCase())
				.join(", ");
			const priority =
				cmd.grade === "F"
					? "🔴 Critical"
					: cmd.grade === "D"
						? "🟠 High"
						: "🟡 Medium";
			content += `| ${cmd.name} | ${missing} | ${priority} |\n`;
		}

		content += `
## Implementation Recommendations

### Quick Fixes (< 30 minutes each)
1. Add missing Purpose sections with clear objectives
2. Define Role sections with expertise level
3. Add Expectations with success criteria

### Medium Effort (1-2 hours each)
1. Restructure commands to follow P→R→I→M→E sequence
2. Implement comprehensive Input gathering phases
3. Convert Method sections to action-verb driven steps

### High Effort (2+ hours each)
1. Full PRIME framework implementation for F-grade commands
2. Add dynamic context loading to Input phases
3. Implement validation patterns in Expectations phases

---
*Full PRIME compliance significantly improves command quality and maintainability*`;

		fs.writeFileSync(filePath, content);
	}

	async generateImprovementPlan(results, summary) {
		const filePath = path.join(this.reportDir, "command-improvement-plan.md");

		let content = `# Command Quality Improvement Plan
Generated: ${this.reportDate}

## Current State Summary
- **Total Commands**: ${summary.totalCommands}
- **Average Score**: ${summary.averageScore.toFixed(1)}/100
- **Target Score**: 85/100
- **Gap to Target**: ${(85 - summary.averageScore).toFixed(1)} points

## Prioritized Improvement Plan

### 🔴 Phase 1: Critical Fixes (Week 1)
**Goal**: Bring all F-grade commands to at least D-grade

| Command | Current | Target | Required Actions |
|---------|---------|--------|-----------------|
`;

		const fGrades = results
			.filter((r) => r.grade === "F")
			.sort((a, b) => a.totalScore - b.totalScore);

		for (const cmd of fGrades) {
			const actions = cmd.recommendations.slice(0, 2).join("; ");
			content += `| ${cmd.name} | ${cmd.totalScore.toFixed(0)}/F | 60/D | ${actions} |\n`;
		}

		if (fGrades.length === 0) {
			content += "| *No F-grade commands* | - | - | - |\n";
		}

		content += `
### 🟠 Phase 2: High Priority (Week 2)
**Goal**: Upgrade D-grade commands to C-grade

| Command | Current | Target | Required Actions |
|---------|---------|--------|-----------------|
`;

		const dGrades = results
			.filter((r) => r.grade === "D")
			.sort((a, b) => a.totalScore - b.totalScore)
			.slice(0, 10);

		for (const cmd of dGrades) {
			const actions = cmd.recommendations.slice(0, 2).join("; ");
			content += `| ${cmd.name} | ${cmd.totalScore.toFixed(0)}/D | 70/C | ${actions} |\n`;
		}

		content += `
### 🟡 Phase 3: Optimization (Week 3-4)
**Goal**: Bring C-grade commands to B-grade

Focus Areas:
1. **PRIME Compliance** - Add missing phases to ${this.countCommandsMissingPhase(results)} commands
2. **Action-First Design** - Convert advisory language in ${this.countCommandsWithIssue(results, "advisory")} commands
3. **Integration** - Add agent delegation to ${this.countCommandsWithIssue(results, "delegate")} commands
4. **Documentation** - Add examples to ${this.countCommandsWithIssue(results, "examples")} commands

### 🟢 Phase 4: Excellence (Month 2)
**Goal**: Achieve 85+ average score

Strategic Improvements:
`;

		// Calculate improvement opportunities
		const improvements = {
			"Implement dynamic context loading": this.countCommandsWithIssue(
				results,
				"context loading",
			),
			"Add MCP server integration": this.countCommandsWithIssue(results, "MCP"),
			"Add validation patterns": this.countCommandsWithIssue(
				results,
				"validation",
			),
			"Implement parallel execution": this.countCommandsWithIssue(
				results,
				"parallel",
			),
			"Add progress tracking": this.countCommandsWithIssue(results, "progress"),
		};

		for (const [improvement, count] of Object.entries(improvements)) {
			if (count > 0) {
				const impact = Math.min(5, Math.round(count * 0.5));
				content += `- **${improvement}** (${count} commands) - Est. +${impact} points average\n`;
			}
		}

		content += `
## Improvement Tracking Metrics

| Metric | Current | Week 1 Target | Week 2 Target | Month End Target |
|--------|---------|---------------|---------------|------------------|
| Average Score | ${summary.averageScore.toFixed(1)} | ${(summary.averageScore + 5).toFixed(1)} | ${(summary.averageScore + 10).toFixed(1)} | 85.0 |
| A-Grade Commands | ${summary.gradeDistribution.A} | ${summary.gradeDistribution.A + 2} | ${summary.gradeDistribution.A + 5} | ${Math.round(summary.totalCommands * 0.4)} |
| F-Grade Commands | ${summary.gradeDistribution.F} | 0 | 0 | 0 |
| PRIME Compliant | ${this.countFullyPrimeCompliant(results)} | ${this.countFullyPrimeCompliant(results) + 5} | ${this.countFullyPrimeCompliant(results) + 15} | ${Math.round(summary.totalCommands * 0.8)} |

## Resource Requirements

### Time Investment
- **Phase 1**: ~${fGrades.length * 2} hours (${fGrades.length} commands × 2 hours)
- **Phase 2**: ~${Math.min(10, summary.gradeDistribution.D) * 1.5} hours
- **Phase 3**: ~${Math.min(15, summary.gradeDistribution.C)} hours
- **Phase 4**: ~20 hours for strategic improvements

### Tools & Resources
- PRIME Framework Template: \`.claude/templates/command-template.md\`
- Command Creator: \`/command/new\`
- This evaluation system: \`.claude/scripts/commands/command-quality-evaluator.cjs\`

## Success Criteria
✅ No F-grade commands
✅ Average score ≥ 85
✅ 80% PRIME compliance
✅ All commands have error handling
✅ Top 10 commands score 90+

---
*Run command quality evaluation weekly to track progress*`;

		fs.writeFileSync(filePath, content);
	}

	async generateJsonReport(results, summary) {
		const filePath = path.join(this.reportDir, "command-quality-data.json");

		const report = {
			metadata: {
				generatedDate: this.reportDate,
				evaluatorVersion: "1.0.0",
				totalCommands: summary.totalCommands,
				averageScore: summary.averageScore,
			},
			summary,
			results: results.map((r) => ({
				name: r.name,
				path: r.path,
				score: r.totalScore,
				grade: r.grade,
				scores: r.scores,
				issues: r.issues,
				recommendations: r.recommendations,
			})),
		};

		fs.writeFileSync(filePath, JSON.stringify(report, null, 2));
	}

	// Helper methods
	generatePerformanceBar(percentage) {
		const filled = Math.round(percentage / 10);
		const empty = 10 - filled;
		return "█".repeat(filled) + "░".repeat(empty);
	}

	identifyStrengths(command) {
		const strengths = [];

		if (command.scores.primeCompliance.score >= 25) {
			strengths.push("PRIME compliant");
		}
		if (command.scores.actionFirstDesign.score >= 13) {
			strengths.push("Action-first");
		}
		if (command.scores.integration.score >= 13) {
			strengths.push("Well-integrated");
		}
		if (command.scores.documentation.score >= 8) {
			strengths.push("Well-documented");
		}

		return strengths.length > 0
			? strengths.join(", ")
			: "Good overall structure";
	}

	assessImpact(issue) {
		const highImpact = ["PRIME", "action", "error", "validation"];
		const mediumImpact = ["example", "usage", "delegate", "MCP"];

		for (const keyword of highImpact) {
			if (issue.toLowerCase().includes(keyword.toLowerCase())) {
				return "High";
			}
		}

		for (const keyword of mediumImpact) {
			if (issue.toLowerCase().includes(keyword.toLowerCase())) {
				return "Medium";
			}
		}

		return "Low";
	}

	countCommandsWithIssue(results, keyword) {
		return results.filter((r) =>
			r.issues.some((issue) =>
				issue.toLowerCase().includes(keyword.toLowerCase()),
			),
		).length;
	}

	countCommandsMissingPhase(results) {
		return results.filter((r) =>
			r.issues.some(
				(issue) =>
					issue.toLowerCase().includes("missing") &&
					issue.toLowerCase().includes("phase"),
			),
		).length;
	}

	countFullyPrimeCompliant(results) {
		return results.filter((r) => {
			const issues = r.scores.primeCompliance.issues || [];
			return issues.length === 0;
		}).length;
	}

	hasPhase(result, phase) {
		const issues = result.scores.primeCompliance.issues || [];
		const missingPhase = issues.some(
			(issue) =>
				issue.toLowerCase().includes("missing") &&
				issue.toLowerCase().includes(phase.toLowerCase()),
		);
		return !missingPhase;
	}
}

// Export for use as module
module.exports = CommandQualityReporter;

// Run if called directly
if (require.main === module) {
	const reporter = new CommandQualityReporter();

	reporter
		.generateFullReport()
		.then(({ reportDir, summary }) => {
			console.log("\n📊 Report Summary:");
			console.log(`   Average Score: ${summary.averageScore.toFixed(1)}/100`);
			console.log(
				`   Grade Distribution: A=${summary.gradeDistribution.A}, B=${summary.gradeDistribution.B}, C=${summary.gradeDistribution.C}, D=${summary.gradeDistribution.D}, F=${summary.gradeDistribution.F}`,
			);
			console.log(`   Reports saved to: ${reportDir}`);
		})
		.catch((error) => {
			console.error("Error generating reports:", error.message);
			process.exit(1);
		});
}
