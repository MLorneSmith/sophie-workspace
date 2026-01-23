#!/usr/bin/env npx tsx
/**
 * Automated Shadcn Registry Vetting Script
 *
 * Evaluates all 114 shadcn community registries and produces a ranked shortlist.
 *
 * Usage:
 *   npx tsx .ai/alpha/scripts/vet-shadcn-registries.ts
 *   npx tsx .ai/alpha/scripts/vet-shadcn-registries.ts --limit 20
 *   npx tsx .ai/alpha/scripts/vet-shadcn-registries.ts --verbose
 */

import { execSync } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";

// ============================================================================
// Types
// ============================================================================

interface Registry {
	name: string;
	url: string;
	description: string;
}

interface RegistryData {
	name: string;
	componentCount: number;
	components: string[];
	sampleCode: Map<string, string>;
	urlStatus: "reachable" | "unreachable" | "unknown";
	error?: string;
}

interface ScoreBreakdown {
	componentCount: number;
	typescriptQuality: number;
	radixPrimitives: number;
	cssVariables: number;
	accessibility: number;
	relevance: number;
}

interface RegistryScore {
	name: string;
	url: string;
	description: string;
	totalScore: number;
	breakdown: ScoreBreakdown;
	highlights: string[];
	specialty: string;
	componentCount: number;
	status: "scored" | "niche" | "failed" | "dead";
	error?: string;
}

interface VettingReport {
	runDate: string;
	totalRegistries: number;
	successfulScans: number;
	failedScans: number;
	deadRegistries: number;
	nicheRegistries: number;
	shortlist: RegistryScore[];
	nicheList: RegistryScore[];
	failedList: Array<{ name: string; error: string }>;
}

// ============================================================================
// Registry Data (114 registries from shadcn directory)
// ============================================================================

const REGISTRIES: Registry[] = [
	{
		name: "@8bitcn",
		url: "https://www.8bitcn.com",
		description: "8-bit styled retro components",
	},
	{
		name: "@8starlabs-ui",
		url: "https://8starlabs.dev",
		description: "High-utility UI elements for developers",
	},
	{
		name: "@abui",
		url: "https://abui.dev",
		description:
			"Shadcn-compatible registry with reusable components and blocks",
	},
	{
		name: "@abstract",
		url: "https://abstract.money",
		description: "React components for cryptocurrency patterns",
	},
	{
		name: "@aceternity",
		url: "https://ui.aceternity.com",
		description: "Modern components with Tailwind CSS and Motion",
	},
	{
		name: "@agents-ui",
		url: "https://agents.livekit.io",
		description: "Components for LiveKit AI Agent interfaces",
	},
	{
		name: "@aevr",
		url: "https://aevr.vercel.app",
		description: "Production-ready components for React/Next.js",
	},
	{
		name: "@ai-blocks",
		url: "https://aiblocks.dev",
		description: "AI components for the web with WebLLM",
	},
	{
		name: "@ai-elements",
		url: "https://ai-elements.dev",
		description: "Pre-built components for AI-native applications",
	},
	{
		name: "@algolia",
		url: "https://www.algolia.com",
		description: "AI search infrastructure and components",
	},
	{
		name: "@aliimam",
		url: "https://aliimam.dev",
		description: "Digital experiences and product development components",
	},
	{
		name: "@animate-ui",
		url: "https://animate-ui.com",
		description: "Fully animated React component distribution",
	},
	{
		name: "@assistant-ui",
		url: "https://www.assistant-ui.com",
		description: "Radix-style primitives for AI chat",
	},
	{
		name: "@better-upload",
		url: "https://better-upload.dev",
		description: "File upload components for S3-compatible services",
	},
	{
		name: "@basecn",
		url: "https://basecn.dev",
		description: "Shadcn/ui components powered by Base UI",
	},
	{
		name: "@billingsdk",
		url: "https://billingsdk.com",
		description: "SaaS billing components for Dodo Payments and Stripe",
	},
	{
		name: "@blocks",
		url: "https://blocks.so",
		description: "Clean, modern application building blocks",
	},
	{
		name: "@bundui",
		url: "https://bundui.io",
		description: "Collection of 150+ handcrafted UI components",
	},
	{
		name: "@cardcn",
		url: "https://cardcn.dev",
		description: "Beautifully-designed shadcn card components",
	},
	{
		name: "@chamaac",
		url: "https://chamaac.dev",
		description: "Beautiful, animated components for web projects",
	},
	{
		name: "@clerk",
		url: "https://clerk.com",
		description: "Authentication and user management components",
	},
	{
		name: "@coss",
		url: "https://coss.dev",
		description: "Modern UI component library built on Base UI",
	},
	{
		name: "@creative-tim",
		url: "https://www.creative-tim.com",
		description: "Open-source UI components, blocks, and AI Agents",
	},
	{
		name: "@cult-ui",
		url: "https://www.cult-ui.com",
		description: "Curated shadcn-compatible components with Framer Motion",
	},
	{
		name: "@diceui",
		url: "https://www.diceui.com",
		description: "Accessible shadcn/ui components with React and Tailwind",
	},
	{
		name: "@doras-ui",
		url: "https://www.doras-ui.com",
		description: "Beautiful, reusable component blocks built with React",
	},
	{
		name: "@elements",
		url: "https://elements.dev",
		description: "Full-stack shadcn/ui components with auth, monetization",
	},
	{
		name: "@elevenlabs-ui",
		url: "https://elevenlabs.io",
		description: "Open source agent and audio components",
	},
	{
		name: "@efferd",
		url: "https://efferd.dev",
		description: "Beautifully crafted Shadcn/UI blocks",
	},
	{
		name: "@einui",
		url: "https://einui.com",
		description: "Beautiful Shadcn components with frosted glass morphism",
	},
	{
		name: "@eldoraui",
		url: "https://www.eldoraui.site",
		description:
			"Open-source modern UI with TypeScript, Tailwind, Framer Motion",
	},
	{
		name: "@formcn",
		url: "https://formcn.dev",
		description: "Production-ready forms built with shadcn components",
	},
	{
		name: "@gaia",
		url: "https://gaia-ui.dev",
		description: "Production-ready UI components for AI assistants",
	},
	{
		name: "@glass-ui",
		url: "https://glass-ui.dev",
		description: "40+ glassmorphic React/TypeScript components",
	},
	{
		name: "@ha-components",
		url: "https://ha-components.dev",
		description: "Customizable components for Home Assistant",
	},
	{
		name: "@hextaui",
		url: "https://hextaui.com",
		description: "Ready-to-use foundation components and blocks",
	},
	{
		name: "@hooks",
		url: "https://hooks.shadcn.dev",
		description: "Comprehensive React Hooks Collection",
	},
	{
		name: "@intentui",
		url: "https://intentui.com",
		description: "Accessible React component library",
	},
	{
		name: "@kibo-ui",
		url: "https://kibo-ui.com",
		description: "Composable, accessible open source components",
	},
	{
		name: "@kanpeki",
		url: "https://kanpeki.dev",
		description: "Perfect-designed components with React Aria and Motion",
	},
	{
		name: "@kokonutui",
		url: "https://kokonutui.com",
		description: "Stunning components with Tailwind, shadcn/ui, Motion",
	},
	{
		name: "@lens-blocks",
		url: "https://lens-blocks.dev",
		description: "Social media components for Lens Protocol",
	},
	{
		name: "@limeplay",
		url: "https://limeplay.dev",
		description: "Modern UI Library for media players in React",
	},
	{
		name: "@lucide-animated",
		url: "https://lucide-animated.dev",
		description: "Smooth animated lucide icons",
	},
	{
		name: "@lytenyte",
		url: "https://lytenyte.dev",
		description: "High-performance React data grid with Tailwind theming",
	},
	{
		name: "@magicui",
		url: "https://magicui.design",
		description: "150+ free animated components for Design Engineers",
	},
	{
		name: "@manifest",
		url: "https://manifest.dev",
		description: "Agentic UI toolkit for MCP Apps",
	},
	{
		name: "@mui-treasury",
		url: "https://mui-treasury.com",
		description: "Hand-crafted interfaces on MUI components",
	},
	{
		name: "@moleculeui",
		url: "https://moleculeui.dev",
		description: "Modern React library for intuitive interactions",
	},
	{
		name: "@motion-primitives",
		url: "https://www.motion-primitives.com",
		description: "Beautifully designed motion components",
	},
	{
		name: "@ncdai",
		url: "https://ncdai.dev",
		description: "Collection of reusable components",
	},
	{
		name: "@nuqs",
		url: "https://nuqs.47ng.com",
		description: "Type-safe URL state management utilities",
	},
	{
		name: "@neobrutalism",
		url: "https://neobrutalism.dev",
		description: "Neobrutalism-styled components based on shadcn/ui",
	},
	{
		name: "@nexus-elements",
		url: "https://nexus-elements.dev",
		description: "Ready-made React components",
	},
	{
		name: "@optics",
		url: "https://optics.dev",
		description: "Design system with re-styled components and utilities",
	},
	{
		name: "@oui",
		url: "https://oui.dev",
		description: "React Aria Components with shadcn characteristics",
	},
	{
		name: "@paceui",
		url: "https://paceui.com",
		description: "Animated components with smooth interactions",
	},
	{
		name: "@paykit-sdk",
		url: "https://paykit.dev",
		description: "Unified payments SDK for checkout and billing",
	},
	{
		name: "@plate",
		url: "https://platejs.org",
		description: "AI-powered rich text editor for React",
	},
	{
		name: "@prompt-kit",
		url: "https://prompt-kit.dev",
		description: "Core building blocks for AI apps",
	},
	{
		name: "@prosekit",
		url: "https://prosekit.dev",
		description: "Powerful, flexible rich text editor",
	},
	{
		name: "@phucbm",
		url: "https://phucbm.dev",
		description: "Modern React UI components with GSAP animations",
	},
	{
		name: "@react-aria",
		url: "https://react-spectrum.adobe.com/react-aria",
		description: "Customizable components with adaptive interactions",
	},
	{
		name: "@react-bits",
		url: "https://reactbits.dev",
		description: "Large collection of animated, interactive React components",
	},
	{
		name: "@retroui",
		url: "https://retroui.dev",
		description: "Neobrutalism styled React and TailwindCSS library",
	},
	{
		name: "@reui",
		url: "https://reui.io",
		description: "Open-source collection of UI components",
	},
	{
		name: "@scrollxui",
		url: "https://scrollxui.dev",
		description: "Motion-driven animated React components",
	},
	{
		name: "@square-ui",
		url: "https://square-ui.dev",
		description: "Beautifully crafted open-source layouts",
	},
	{
		name: "@systaliko-ui",
		url: "https://systaliko-ui.dev",
		description: "UI component library for flexibility",
	},
	{
		name: "@roiui",
		url: "https://roiui.dev",
		description: "UI components with Base UI primitives and Framer motion",
	},
	{
		name: "@solaceui",
		url: "https://solaceui.com",
		description: "Production-ready sections and templates for Next.js",
	},
	{
		name: "@shadcnblocks",
		url: "https://shadcnblocks.com",
		description: "Hundreds of extra blocks for shadcn ui",
	},
	{
		name: "@shadcndesign",
		url: "https://shadcndesign.com",
		description: "High-quality blocks and themes",
	},
	{
		name: "@shadcn-map",
		url: "https://shadcn-map.dev",
		description: "Map component built with Leaflet",
	},
	{
		name: "@shadcn-studio",
		url: "https://shadcn.studio",
		description: "Components, blocks, and templates with theme generator",
	},
	{
		name: "@shadcn-editor",
		url: "https://shadcn-editor.dev",
		description: "Rich text editor with Lexical and Shadcn/UI",
	},
	{
		name: "@shadcnui-blocks",
		url: "https://shadcnui-blocks.com",
		description: "Premium, production-ready blocks",
	},
	{
		name: "@shadcraft",
		url: "https://shadcraft.dev",
		description: "Polished shadcn/ui components and marketing blocks",
	},
	{
		name: "@smoothui",
		url: "https://smoothui.dev",
		description: "Motion components with React, Framer Motion",
	},
	{
		name: "@spectrumui",
		url: "https://spectrumui.dev",
		description: "Modern component library with shadcn/ui and Tailwind",
	},
	{
		name: "@supabase",
		url: "https://supabase.com/ui",
		description: "React components connecting to Supabase back-end",
	},
	{
		name: "@svgl",
		url: "https://svgl.app",
		description: "Beautiful library with SVG logos",
	},
	{
		name: "@tailark",
		url: "https://tailark.dev",
		description: "Shadcn blocks for modern marketing websites",
	},
	{
		name: "@taki",
		url: "https://taki.dev",
		description: "Accessible components with React Aria Components",
	},
	{
		name: "@tour",
		url: "https://tour.dev",
		description: "Onboarding tour component for shadcn/ui",
	},
	{
		name: "@uitripled",
		url: "https://uitripled.dev",
		description: "Open-source, production-ready UI components",
	},
	{
		name: "@utilcn",
		url: "https://utilcn.dev",
		description: "Fullstack registry for ChatGPT apps, file uploading",
	},
	{
		name: "@wandry-ui",
		url: "https://wandry-ui.dev",
		description: "Fully controlled React Inertia form elements",
	},
	{
		name: "@wigggle-ui",
		url: "https://wigggle-ui.dev",
		description: "Beautiful copy-and-paste widgets",
	},
	{
		name: "@zippystarter",
		url: "https://zippystarter.com",
		description: "Expertly crafted blocks and themes for shadcn/ui",
	},
	{
		name: "@uicapsule",
		url: "https://uicapsule.dev",
		description: "Curated components with AI/UI experiments",
	},
	{
		name: "@ui-layouts",
		url: "https://ui-layouts.dev",
		description: "Components, effects, and ready-made blocks",
	},
	{
		name: "@pureui",
		url: "https://pureui.dev",
		description: "Refined, animated, accessible components",
	},
	{
		name: "@tailwind-builder",
		url: "https://tailwind-builder.dev",
		description: "Free UI blocks and AI tools for forms, tables, charts",
	},
	{
		name: "@tailwind-admin",
		url: "https://tailwind-admin.dev",
		description: "Free tailwind admin dashboard templates",
	},
	{
		name: "@forgeui",
		url: "https://forgeui.dev",
		description: "Beautifully designed, accessible, customizable components",
	},
	{
		name: "@skiper-ui",
		url: "https://skiper-ui.dev",
		description: "Uncommon components for Next.js projects",
	},
	{
		name: "@animbits",
		url: "https://animbits.dev",
		description: "Animated UI components using Framer Motion",
	},
	{
		name: "@icons-animated",
		url: "https://icons-animated.dev",
		description: "Open-source library of animated icons",
	},
	{
		name: "@heroicons-animated",
		url: "https://heroicons-animated.dev",
		description: "316 beautifully animated heroicons",
	},
	{
		name: "@darx",
		url: "https://darx.dev",
		description: "Magic 3D Tabs with mouse-interactive rotation",
	},
	{
		name: "@beste-ui",
		url: "https://beste-ui.dev",
		description: "Production-ready UI blocks for landing pages, dashboards",
	},
	{
		name: "@tokenui",
		url: "https://tokenui.dev",
		description: "Interactive documentation components",
	},
	{
		name: "@lumiui",
		url: "https://lumiui.dev",
		description: "Composable React components with Base UI and Tailwind",
	},
	{
		name: "@uselayouts",
		url: "https://uselayouts.com",
		description: "Premium animated React components and micro-interactions",
	},
	{
		name: "@joyco",
		url: "https://joyco.dev",
		description: "MobileMenu, ScrollArea, Chat UI, HLSVideoPlayer",
	},
	{
		name: "@gooseui",
		url: "https://gooseui.dev",
		description: "Open source animated components and beautiful effects",
	},
	{
		name: "@baselayer",
		url: "https://baselayer.dev",
		description: "Components with React Aria, Tailwind, tailwind-variants",
	},
	{
		name: "@jolyui",
		url: "https://jolyui.dev",
		description: "Modern React library with TypeScript and Tailwind",
	},
	{
		name: "@fab-ui",
		url: "https://fab-ui.dev",
		description: "Beautifully designed UI components for modern web apps",
	},
	{
		name: "@asanshay",
		url: "https://asanshay.dev",
		description: "Clean, beautiful, simple UI primitives and AI elements",
	},
	{
		name: "@headcodecms",
		url: "https://headcodecms.com",
		description: "Minimalistic Web CMS for Next.js",
	},
	{
		name: "@typedora-ui",
		url: "https://typedora-ui.dev",
		description: "Extension layer for shadcn/ui with full type-safety",
	},
];

// ============================================================================
// CLI Arguments Parsing
// ============================================================================

interface CliArgs {
	limit: number;
	verbose: boolean;
	skipUrlCheck: boolean;
}

function parseArgs(): CliArgs {
	const args = process.argv.slice(2);
	const result: CliArgs = {
		limit: REGISTRIES.length,
		verbose: false,
		skipUrlCheck: false,
	};

	for (let i = 0; i < args.length; i++) {
		const nextArg = args[i + 1];
		if (args[i] === "--limit" && nextArg) {
			result.limit = parseInt(nextArg, 10);
			i++;
		} else if (args[i] === "--verbose") {
			result.verbose = true;
		} else if (args[i] === "--skip-url-check") {
			result.skipUrlCheck = true;
		}
	}

	return result;
}

// ============================================================================
// Relevance Keywords for SlideHeroes
// ============================================================================

const RELEVANCE_KEYWORDS: Record<string, string[]> = {
	dashboard: ["card", "grid", "layout", "panel", "dashboard", "stat", "widget"],
	charts: [
		"chart",
		"graph",
		"progress",
		"stats",
		"metric",
		"analytics",
		"sparkline",
	],
	animation: [
		"animated",
		"motion",
		"transition",
		"animate",
		"framer",
		"gsap",
		"spring",
	],
	forms: [
		"form",
		"input",
		"select",
		"dialog",
		"modal",
		"dropdown",
		"picker",
		"slider",
	],
	tables: [
		"table",
		"data-table",
		"list",
		"grid",
		"column",
		"row",
		"pagination",
	],
	presentation: ["slide", "carousel", "gallery", "hero", "landing", "showcase"],
	media: ["video", "audio", "player", "image", "gallery", "lightbox"],
	collaboration: [
		"chat",
		"comment",
		"presence",
		"avatar",
		"notification",
		"badge",
	],
	auth: ["auth", "login", "signup", "user", "profile", "account"],
	billing: ["billing", "payment", "checkout", "subscription", "pricing"],
};

// ============================================================================
// Utility Functions
// ============================================================================

function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

function log(message: string, verbose: boolean, force = false): void {
	if (verbose || force) {
		console.log(`[${new Date().toISOString()}] ${message}`);
	}
}

// ============================================================================
// URL Verification
// ============================================================================

async function verifyRegistryUrl(
	name: string,
	url: string,
	verbose: boolean,
): Promise<"reachable" | "unreachable" | "unknown"> {
	try {
		log(`Checking URL: ${url}`, verbose);
		const controller = new AbortController();
		const timeout = setTimeout(() => controller.abort(), 5000);

		const response = await fetch(url, {
			method: "HEAD",
			signal: controller.signal,
			redirect: "follow",
		});

		clearTimeout(timeout);

		if (response.ok || response.status === 405) {
			// 405 = Method Not Allowed, but URL exists
			return "reachable";
		}
		return "unreachable";
	} catch (error) {
		log(`URL check failed for ${name}: ${error}`, verbose);
		return "unknown";
	}
}

// ============================================================================
// Registry Search Functions
// ============================================================================

async function searchRegistry(
	name: string,
	verbose: boolean,
): Promise<RegistryData> {
	const result: RegistryData = {
		name,
		componentCount: 0,
		components: [],
		sampleCode: new Map(),
		urlStatus: "unknown",
	};

	try {
		log(`Searching registry: ${name}`, verbose);

		// Execute shadcn search command with timeout
		const command = `npx shadcn@latest search ${name} 2>&1`;
		const output = execSync(command, {
			timeout: 30000,
			encoding: "utf8",
			maxBuffer: 10 * 1024 * 1024,
		});

		// Parse the output to extract component names
		// shadcn search typically outputs components in a list format
		const lines = output.split("\n").filter((line) => line.trim());

		// Extract component names from output
		// Format varies but typically includes component names
		const componentPattern = new RegExp(
			`${name.replace("@", "")}[/]([\\w-]+)`,
			"g",
		);
		const matches = output.matchAll(componentPattern);

		for (const match of matches) {
			if (match[1] && !result.components.includes(match[1])) {
				result.components.push(match[1]);
			}
		}

		// Also try to extract from list-style output
		for (const line of lines) {
			// Look for lines that might be component names
			const cleanLine = line.trim();
			if (
				cleanLine &&
				!cleanLine.startsWith("›") &&
				!cleanLine.startsWith("?") &&
				!cleanLine.includes("http") &&
				!cleanLine.includes(":") &&
				cleanLine.length < 50 &&
				/^[\w-]+$/.test(cleanLine)
			) {
				if (!result.components.includes(cleanLine)) {
					result.components.push(cleanLine);
				}
			}
		}

		result.componentCount = result.components.length;
		log(`Found ${result.componentCount} components in ${name}`, verbose);
	} catch (error: unknown) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		result.error = `Search failed: ${errorMessage}`;
		log(`Error searching ${name}: ${errorMessage}`, verbose);
	}

	return result;
}

async function viewComponent(
	registry: string,
	component: string,
	verbose: boolean,
): Promise<string> {
	try {
		log(`Viewing component: ${registry}/${component}`, verbose);

		const command = `npx shadcn@latest view ${registry}/${component} 2>&1`;
		const output = execSync(command, {
			timeout: 15000,
			encoding: "utf8",
			maxBuffer: 5 * 1024 * 1024,
		});

		return output;
	} catch (error: unknown) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		log(`Error viewing ${registry}/${component}: ${errorMessage}`, verbose);
		return "";
	}
}

// ============================================================================
// Scoring Functions
// ============================================================================

function scoreComponentCount(count: number): number {
	if (count >= 11) return 15;
	if (count >= 4) return 10;
	if (count >= 1) return 5;
	return 0;
}

function scoreTypescriptQuality(code: string): number {
	let score = 0;

	// Check for TypeScript patterns
	if (code.includes(": React.") || code.includes("<React.")) score += 5;
	if (code.includes("interface ") || code.includes("type ")) score += 5;
	if (
		code.includes(": string") ||
		code.includes(": number") ||
		code.includes(": boolean")
	)
		score += 5;
	if (code.includes("React.FC") || code.includes("React.ComponentProps"))
		score += 5;

	return Math.min(score, 20);
}

function scoreRadixPrimitives(code: string): number {
	const radixPatterns = [
		"@radix-ui",
		"Radix.",
		"radix-ui/react",
		"from '@radix",
		'from "radix',
	];

	for (const pattern of radixPatterns) {
		if (code.includes(pattern)) return 15;
	}
	return 0;
}

function scoreCssVariables(code: string): number {
	const cssVarPatterns = [
		"var(--",
		"className={cn(",
		"className={`",
		"tailwind",
		"tw-",
	];

	for (const pattern of cssVarPatterns) {
		if (code.includes(pattern)) return 10;
	}
	return 0;
}

function scoreAccessibility(code: string): number {
	let accessibilityMatches = 0;

	const a11yPatterns = [
		"aria-",
		"role=",
		"tabIndex",
		"aria-label",
		"aria-hidden",
		"aria-expanded",
		"aria-describedby",
		"focusable",
		"keyboard",
	];

	for (const pattern of a11yPatterns) {
		if (code.includes(pattern)) accessibilityMatches++;
	}

	if (accessibilityMatches >= 3) return 15;
	if (accessibilityMatches >= 1) return 8;
	return 0;
}

function scoreRelevance(
	components: string[],
	description: string,
): { score: number; matchedCategories: string[] } {
	let totalScore = 0;
	const matchedCategories: string[] = [];
	const searchText = [...components, description].join(" ").toLowerCase();

	for (const [category, keywords] of Object.entries(RELEVANCE_KEYWORDS)) {
		for (const keyword of keywords) {
			if (searchText.includes(keyword.toLowerCase())) {
				totalScore += 5;
				if (!matchedCategories.includes(category)) {
					matchedCategories.push(category);
				}
				break; // Only count each category once
			}
		}
	}

	return { score: Math.min(totalScore, 25), matchedCategories };
}

function detectSpecialty(
	_components: string[],
	description: string,
	matchedCategories: string[],
): string {
	const descLower = description.toLowerCase();

	// Check description first for explicit specialties
	if (
		descLower.includes("animation") ||
		descLower.includes("motion") ||
		descLower.includes("animated")
	)
		return "Animation";
	if (
		descLower.includes("ai") ||
		descLower.includes("chat") ||
		descLower.includes("assistant")
	)
		return "AI/Chat";
	if (descLower.includes("auth") || descLower.includes("login"))
		return "Authentication";
	if (descLower.includes("billing") || descLower.includes("payment"))
		return "Payments";
	if (descLower.includes("form")) return "Forms";
	if (descLower.includes("chart") || descLower.includes("dashboard"))
		return "Dashboard/Charts";
	if (descLower.includes("block") || descLower.includes("landing"))
		return "Marketing Blocks";
	if (descLower.includes("editor") || descLower.includes("rich text"))
		return "Rich Text Editor";
	if (descLower.includes("icon")) return "Icons";

	// Fall back to matched categories
	const firstCategory = matchedCategories[0];
	if (firstCategory) {
		return firstCategory.charAt(0).toUpperCase() + firstCategory.slice(1);
	}

	return "General UI";
}

function selectHighlights(components: string[], maxHighlights = 5): string[] {
	// Prioritize interesting/useful-sounding components
	const priorityKeywords = [
		"button",
		"card",
		"modal",
		"dialog",
		"chart",
		"table",
		"form",
		"hero",
		"nav",
		"animated",
	];

	const prioritized = components.filter((c) =>
		priorityKeywords.some((k) => c.toLowerCase().includes(k)),
	);

	const highlights = [...prioritized];
	for (const comp of components) {
		if (!highlights.includes(comp)) {
			highlights.push(comp);
		}
		if (highlights.length >= maxHighlights) break;
	}

	return highlights.slice(0, maxHighlights);
}

async function scoreRegistry(
	registry: Registry,
	data: RegistryData,
	verbose: boolean,
): Promise<RegistryScore> {
	// Sample up to 3 components for code analysis
	const samplesToFetch = Math.min(3, data.components.length);
	let combinedCode = "";

	for (let i = 0; i < samplesToFetch; i++) {
		const componentName = data.components[i];
		if (!componentName) continue;
		const componentCode = await viewComponent(
			registry.name,
			componentName,
			verbose,
		);
		combinedCode += componentCode + "\n";
		data.sampleCode.set(componentName, componentCode);
		await sleep(500); // Rate limiting
	}

	const componentCountScore = scoreComponentCount(data.componentCount);
	const typescriptScore = scoreTypescriptQuality(combinedCode);
	const radixScore = scoreRadixPrimitives(combinedCode);
	const cssScore = scoreCssVariables(combinedCode);
	const a11yScore = scoreAccessibility(combinedCode);
	const { score: relevanceScore, matchedCategories } = scoreRelevance(
		data.components,
		registry.description,
	);

	const breakdown: ScoreBreakdown = {
		componentCount: componentCountScore,
		typescriptQuality: typescriptScore,
		radixPrimitives: radixScore,
		cssVariables: cssScore,
		accessibility: a11yScore,
		relevance: relevanceScore,
	};

	const totalScore =
		componentCountScore +
		typescriptScore +
		radixScore +
		cssScore +
		a11yScore +
		relevanceScore;

	return {
		name: registry.name,
		url: registry.url,
		description: registry.description,
		totalScore,
		breakdown,
		highlights: selectHighlights(data.components),
		specialty: detectSpecialty(
			data.components,
			registry.description,
			matchedCategories,
		),
		componentCount: data.componentCount,
		status: data.componentCount >= 10 ? "scored" : "niche",
	};
}

// ============================================================================
// Report Generation
// ============================================================================

function generateMarkdownReport(report: VettingReport): string {
	let md = `# Shadcn Registry Vetting Results

**Run Date:** ${report.runDate}
**Total Registries:** ${report.totalRegistries}
**Successful Scans:** ${report.successfulScans}
**Failed Scans:** ${report.failedScans}
**Dead Registries:** ${report.deadRegistries}

## Summary

This report ranks shadcn community registries based on:
- Component count (0-15 pts)
- TypeScript quality (0-20 pts)
- Radix UI primitives usage (0-15 pts)
- CSS variables/Tailwind usage (0-10 pts)
- Accessibility features (0-15 pts)
- Relevance to SlideHeroes (0-25 pts)

**Maximum possible score: 100 points**

---

## Top 20 Ranked Registries

| Rank | Registry | Score | Components | Specialty | Recommendation |
|------|----------|-------|------------|-----------|----------------|
`;

	const topRegistries = report.shortlist.slice(0, 20);
	topRegistries.forEach((reg, index) => {
		const recommendation =
			reg.totalScore >= 70 ? "HIGH" : reg.totalScore >= 50 ? "MEDIUM" : "LOW";
		md += `| ${index + 1} | ${reg.name} | ${reg.totalScore} | ${reg.componentCount} | ${reg.specialty} | ${recommendation} |\n`;
	});

	md += `
---

## Category Breakdown

### Animation & Motion
${report.shortlist
	.filter((r) => r.specialty === "Animation")
	.slice(0, 5)
	.map((r) => `- **${r.name}** (${r.totalScore} pts) - ${r.description}`)
	.join("\n")}

### AI & Chat Components
${report.shortlist
	.filter((r) => r.specialty === "AI/Chat")
	.slice(0, 5)
	.map((r) => `- **${r.name}** (${r.totalScore} pts) - ${r.description}`)
	.join("\n")}

### Dashboard & Charts
${report.shortlist
	.filter((r) => r.specialty === "Dashboard/Charts")
	.slice(0, 5)
	.map((r) => `- **${r.name}** (${r.totalScore} pts) - ${r.description}`)
	.join("\n")}

### Forms
${report.shortlist
	.filter((r) => r.specialty === "Forms")
	.slice(0, 5)
	.map((r) => `- **${r.name}** (${r.totalScore} pts) - ${r.description}`)
	.join("\n")}

### Marketing Blocks
${report.shortlist
	.filter((r) => r.specialty === "Marketing Blocks")
	.slice(0, 5)
	.map((r) => `- **${r.name}** (${r.totalScore} pts) - ${r.description}`)
	.join("\n")}

---

## Niche/Specialized Registries

These registries have fewer than 10 components but may be valuable for specific use cases:

${report.nicheList
	.slice(0, 15)
	.map(
		(r) =>
			`- **${r.name}** (${r.componentCount} components) - ${r.description}`,
	)
	.join("\n")}

---

## Recommendations for SlideHeroes

Based on the scoring, here are the top recommendations:

### Must Evaluate (Score >= 70)
${report.shortlist
	.filter((r) => r.totalScore >= 70)
	.map(
		(r) =>
			`1. **${r.name}** - ${r.description}\n   - Highlights: ${r.highlights.join(", ")}`,
	)
	.join("\n")}

### Worth Considering (Score 50-69)
${report.shortlist
	.filter((r) => r.totalScore >= 50 && r.totalScore < 70)
	.slice(0, 10)
	.map((r) => `- **${r.name}** - ${r.description}`)
	.join("\n")}

---

## Failed Scans

These registries could not be scanned and may need manual review:

${report.failedList.map((r) => `- **${r.name}**: ${r.error}`).join("\n")}

---

*Generated by vet-shadcn-registries.ts*
`;

	return md;
}

// ============================================================================
// Main Execution
// ============================================================================

async function main(): Promise<void> {
	const args = parseArgs();
	const registriesToProcess = REGISTRIES.slice(0, args.limit);

	console.log("=".repeat(60));
	console.log("Shadcn Registry Vetting Script");
	console.log("=".repeat(60));
	console.log(`Processing ${registriesToProcess.length} registries...`);
	console.log(`Verbose: ${args.verbose}`);
	console.log(`Skip URL Check: ${args.skipUrlCheck}`);
	console.log("");

	const scores: RegistryScore[] = [];
	const nicheList: RegistryScore[] = [];
	const failedList: Array<{ name: string; error: string }> = [];
	let deadCount = 0;

	for (let i = 0; i < registriesToProcess.length; i++) {
		const registry = registriesToProcess[i];
		if (!registry) continue;

		const progress = `[${i + 1}/${registriesToProcess.length}]`;

		console.log(`${progress} Processing ${registry.name}...`);

		// URL verification (optional)
		let urlStatus: "reachable" | "unreachable" | "unknown" = "unknown";
		if (!args.skipUrlCheck) {
			urlStatus = await verifyRegistryUrl(
				registry.name,
				registry.url,
				args.verbose,
			);
			if (urlStatus === "unreachable") {
				console.log("  ⚠️  URL appears unreachable");
				deadCount++;
			}
		}

		// Search the registry
		const data = await searchRegistry(registry.name, args.verbose);
		data.urlStatus = urlStatus;

		if (data.error && data.componentCount === 0) {
			console.log(`  ❌ Failed: ${data.error}`);
			failedList.push({ name: registry.name, error: data.error });
			continue;
		}

		if (data.componentCount === 0) {
			console.log("  ⚠️  No components found");
			failedList.push({
				name: registry.name,
				error: "No components found in search results",
			});
			continue;
		}

		// Score the registry
		const score = await scoreRegistry(registry, data, args.verbose);

		if (score.status === "niche") {
			console.log(`  📦 Niche registry: ${data.componentCount} components`);
			nicheList.push(score);
		} else {
			console.log(
				`  ✅ Scored: ${score.totalScore}/100 (${data.componentCount} components)`,
			);
			scores.push(score);
		}

		// Rate limiting between registries
		await sleep(1500);
	}

	// Sort scores by total score descending
	scores.sort((a, b) => b.totalScore - a.totalScore);
	nicheList.sort((a, b) => b.componentCount - a.componentCount);

	// Generate report
	const dateStr =
		new Date().toISOString().split("T")[0] ??
		new Date().toISOString().slice(0, 10);
	const report: VettingReport = {
		runDate: dateStr,
		totalRegistries: registriesToProcess.length,
		successfulScans: scores.length + nicheList.length,
		failedScans: failedList.length,
		deadRegistries: deadCount,
		nicheRegistries: nicheList.length,
		shortlist: scores,
		nicheList,
		failedList,
	};

	// Write JSON report
	const jsonPath = path.join(
		process.cwd(),
		".ai/alpha/reports/registry-vetting-results.json",
	);
	fs.writeFileSync(
		jsonPath,
		JSON.stringify(
			report,
			(_key, value) =>
				value instanceof Map ? Object.fromEntries(value) : value,
			2,
		),
	);
	console.log(`\n📄 JSON report written to: ${jsonPath}`);

	// Write Markdown report
	const mdPath = path.join(
		process.cwd(),
		".ai/alpha/reports/registry-vetting-summary.md",
	);
	fs.writeFileSync(mdPath, generateMarkdownReport(report));
	console.log(`📄 Markdown report written to: ${mdPath}`);

	// Summary
	console.log("\n" + "=".repeat(60));
	console.log("Summary");
	console.log("=".repeat(60));
	console.log(`Total processed: ${registriesToProcess.length}`);
	console.log(`Successful scans: ${scores.length + nicheList.length}`);
	console.log(`Failed scans: ${failedList.length}`);
	console.log(`Niche registries (<10 components): ${nicheList.length}`);
	console.log(`Ranked registries: ${scores.length}`);

	if (scores.length > 0) {
		console.log("\nTop 5 registries:");
		scores.slice(0, 5).forEach((s, i) => {
			console.log(
				`  ${i + 1}. ${s.name} - ${s.totalScore}/100 (${s.componentCount} components)`,
			);
		});
	}
}

main().catch((error) => {
	console.error("Fatal error:", error);
	process.exit(1);
});
