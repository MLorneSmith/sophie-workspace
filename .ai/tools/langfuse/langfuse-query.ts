/// <reference types="node" />
/**
 * Langfuse trace query script for debugging the Profile workflow step.
 *
 * Usage:
 *   npx tsx temp/langfuse-query.ts                     # Recent traces (last 24h)
 *   npx tsx temp/langfuse-query.ts --trace <traceId>   # Single trace detail
 *   npx tsx temp/langfuse-query.ts --hours 48          # Last 48 hours
 *   npx tsx temp/langfuse-query.ts --feature workflow-audience-research
 *   npx tsx temp/langfuse-query.ts --errors            # Only failed traces
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// Load .env from project root (walk up from script location)
import { execSync } from "node:child_process";
const projectRoot = execSync("git rev-parse --show-toplevel", {
	encoding: "utf8",
}).trim();
const envPath = resolve(projectRoot, ".env");
for (const line of readFileSync(envPath, "utf8").split("\n")) {
	const match = line.match(/^([A-Z_]+)=["']?(.+?)["']?\s*$/);
	if (match) process.env[match[1]!] = match[2]!;
}

const LANGFUSE_SECRET_KEY = process.env.LANGFUSE_SECRET_KEY;
const LANGFUSE_PUBLIC_KEY = process.env.LANGFUSE_PUBLIC_KEY;
const LANGFUSE_BASE_URL =
	process.env.LANGFUSE_BASE_URL ||
	process.env.LANGFUSE_HOST ||
	"https://cloud.langfuse.com";

if (!LANGFUSE_SECRET_KEY || !LANGFUSE_PUBLIC_KEY) {
	console.error("Missing LANGFUSE_SECRET_KEY or LANGFUSE_PUBLIC_KEY in .env");
	process.exit(1);
}

const AUTH = Buffer.from(
	`${LANGFUSE_PUBLIC_KEY}:${LANGFUSE_SECRET_KEY}`,
).toString("base64");

const headers = {
	Authorization: `Basic ${AUTH}`,
	"Content-Type": "application/json",
};

// ---- Types ----

interface LangfuseTrace {
	id: string;
	name?: string;
	timestamp: string;
	latency?: number;
	level?: string;
	statusMessage?: string;
	totalCost?: number;
	tags?: string[];
	metadata?: Record<string, unknown>;
	output?: Record<string, unknown>;
	userId?: string;
}

interface LangfuseObservation {
	type: string;
	name?: string;
	startTime: string;
	endTime: string;
	completionStartTime?: string;
	totalCost?: number;
	usage?: {
		promptTokens?: number;
		completionTokens?: number;
	};
	level?: string;
	statusMessage?: string;
	model?: string;
	input?: unknown;
	output?: unknown;
}

// ---- API helpers ----

async function apiGet(path: string, params?: Record<string, string>) {
	const url = new URL(`/api/public${path}`, LANGFUSE_BASE_URL);
	if (params) {
		for (const [k, v] of Object.entries(params)) {
			if (v) url.searchParams.set(k, v);
		}
	}
	const res = await fetch(url.toString(), { headers });
	if (!res.ok) {
		const body = await res.text();
		throw new Error(`Langfuse API ${res.status}: ${body}`);
	}
	return res.json();
}

// ---- Commands ----

async function listTraces(opts: {
	hours: number;
	feature?: string;
	errorsOnly?: boolean;
}) {
	const fromTimestamp = new Date(
		Date.now() - opts.hours * 60 * 60 * 1000,
	).toISOString();

	const params: Record<string, string> = {
		fromTimestamp,
		limit: "50",
	};

	if (opts.feature) {
		params.tags = opts.feature;
	}

	const data = await apiGet("/traces", params);
	let traces: LangfuseTrace[] = data.data ?? [];

	// Filter by feature in metadata if tag filter didn't work
	if (opts.feature) {
		traces = traces.filter(
			(t: LangfuseTrace) =>
				t.tags?.includes(opts.feature) ||
				t.metadata?.feature === opts.feature ||
				t.name?.includes(opts.feature),
		);
	}

	if (opts.errorsOnly) {
		traces = traces.filter(
			(t: LangfuseTrace) =>
				t.level === "ERROR" ||
				t.statusMessage?.toLowerCase().includes("error") ||
				t.output?.error,
		);
	}

	if (traces.length === 0) {
		console.log("No traces found for the given filters.");
		return;
	}

	console.log(`\n Found ${traces.length} traces (last ${opts.hours}h)\n`);
	console.log("─".repeat(120));

	for (const t of traces) {
		const duration = t.latency ? `${(t.latency / 1000).toFixed(1)}s` : "—";
		const status = t.level === "ERROR" ? "ERROR" : "OK";
		const cost = t.totalCost ? `$${t.totalCost.toFixed(4)}` : "—";
		const time = new Date(t.timestamp).toLocaleString();

		console.log(
			`${status.padEnd(6)} | ${time.padEnd(22)} | ${duration.padEnd(7)} | ${cost.padEnd(8)} | ${t.name ?? "unnamed"}`,
		);
		console.log(`       | ID: ${t.id}`);
		if (t.tags?.length) console.log(`       | Tags: ${t.tags.join(", ")}`);
		if (t.metadata?.feature) {
			const featureName = String(t.metadata.feature);
			console.log(`       | Feature: ${featureName}`);
		}
		if (t.statusMessage) console.log(`       | Status: ${t.statusMessage}`);
		console.log("─".repeat(120));
	}
}

async function getTraceDetail(traceId: string) {
	const trace = await apiGet(`/traces/${traceId}`);

	console.log("\n=== Trace Detail ===");
	console.log(`ID:        ${trace.id}`);
	console.log(`Name:      ${trace.name}`);
	console.log(`Timestamp: ${new Date(trace.timestamp).toLocaleString()}`);
	console.log(
		`Duration:  ${trace.latency ? `${(trace.latency / 1000).toFixed(1)}s` : "—"}`,
	);
	console.log(`Status:    ${trace.level ?? "OK"}`);
	console.log(
		`Cost:      ${trace.totalCost ? `$${trace.totalCost.toFixed(4)}` : "—"}`,
	);
	console.log(`Tags:      ${trace.tags?.join(", ") ?? "none"}`);
	console.log(`User:      ${trace.userId ?? "—"}`);

	if (trace.metadata) {
		console.log("\n--- Metadata ---");
		console.log(JSON.stringify(trace.metadata, null, 2));
	}

	if (trace.input) {
		console.log("\n--- Input ---");
		console.log(JSON.stringify(trace.input, null, 2).substring(0, 2000));
	}

	if (trace.output) {
		console.log("\n--- Output ---");
		console.log(JSON.stringify(trace.output, null, 2).substring(0, 2000));
	}

	if (trace.statusMessage) {
		console.log("\n--- Status Message ---");
		console.log(trace.statusMessage);
	}

	// Fetch observations (spans/generations) for this trace
	const obs = await apiGet("/observations", { traceId });
	const observations: LangfuseObservation[] = obs.data ?? [];

	if (observations.length > 0) {
		console.log(`\n=== Observations (${observations.length}) ===\n`);

		// Sort by start time
		observations.sort(
			(a: LangfuseObservation, b: LangfuseObservation) =>
				new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
		);

		for (const o of observations) {
			const dur = o.completionStartTime
				? `${((new Date(o.endTime).getTime() - new Date(o.startTime).getTime()) / 1000).toFixed(1)}s`
				: "—";
			const cost = o.totalCost ? `$${o.totalCost.toFixed(4)}` : "—";
			const tokens = o.usage
				? `in:${o.usage.promptTokens ?? 0} out:${o.usage.completionTokens ?? 0}`
				: "—";

			console.log(
				`[${o.type}] ${o.name ?? "unnamed"} | ${dur} | ${cost} | tokens: ${tokens}`,
			);
			if (o.level === "ERROR") {
				console.log(`  ERROR: ${o.statusMessage ?? "unknown error"}`);
			}
			if (o.model) console.log(`  Model: ${o.model}`);

			// Show input/output summary for generations
			if (o.type === "GENERATION") {
				if (o.input) {
					const inputStr = JSON.stringify(o.input).substring(0, 300);
					console.log(`  Input:  ${inputStr}...`);
				}
				if (o.output) {
					const outputStr = JSON.stringify(o.output).substring(0, 300);
					console.log(`  Output: ${outputStr}...`);
				}
			}
			console.log();
		}
	}
}

// ---- CLI parsing ----

const args = process.argv.slice(2);

function getArg(flag: string): string | undefined {
	const idx = args.indexOf(flag);
	return idx >= 0 ? args[idx + 1] : undefined;
}

const hasFlag = (flag: string) => args.includes(flag);

async function main() {
	const traceId = getArg("--trace");

	if (traceId) {
		await getTraceDetail(traceId);
	} else {
		const hours = Number(getArg("--hours") ?? "24");
		const feature = getArg("--feature");
		const errorsOnly = hasFlag("--errors");
		await listTraces({ hours, feature, errorsOnly });
	}
}

main().catch((err) => {
	console.error("Error:", err.message);
	process.exit(1);
});
