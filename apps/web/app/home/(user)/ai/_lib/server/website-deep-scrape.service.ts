import "server-only";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface WebsiteDeepScrapeResult {
	domain: string;
	scrapedAt: Date;
	pages: {
		about: string | null;
		newsroom: string | null;
		careers: string | null;
		blog: string | null;
		investors: string | null;
	};
	jobPostings: string[];
	recentPressReleases: string[];
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PAGE_TIMEOUT_MS = 3000;
const TOTAL_TIMEOUT_MS = 15000;

const PATH_PATTERNS: Record<keyof WebsiteDeepScrapeResult["pages"], string[]> =
	{
		about: ["/about", "/about-us", "/company", "/who-we-are"],
		newsroom: ["/news", "/newsroom", "/press", "/press-releases", "/media"],
		careers: [
			"/careers",
			"/jobs",
			"/join",
			"/join-us",
			"/work-with-us",
			"/open-positions",
		],
		blog: [
			"/blog",
			"/insights",
			"/resources",
			"/articles",
			"/thought-leadership",
		],
		investors: ["/investors", "/investor-relations", "/ir", "/shareholders"],
	};

interface FetchedPage {
	html: string;
	text: string;
}

interface RobotsRule {
	type: "allow" | "disallow";
	path: string;
}

interface RobotsGroup {
	userAgents: string[];
	rules: RobotsRule[];
}

// ---------------------------------------------------------------------------
// Utility Functions
// ---------------------------------------------------------------------------

/**
 * Check if a path is allowed by robots.txt
 * Returns true by default on any failure (graceful degradation)
 */
function isAbortError(error: unknown): boolean {
	if (error instanceof DOMException) {
		return error.name === "AbortError";
	}

	return error instanceof Error && error.name === "AbortError";
}

/**
 * Creates an abort controller with timeout and workflow signal handling
 * Returns the controller and a cleanup function to clear timers
 */
function createRequestAbortController(
	workflowSignal: AbortSignal,
	deadlineMs: number,
): { controller: AbortController; cleanup: () => void } {
	const controller = new AbortController();
	const remainingMs = Math.max(1, deadlineMs - Date.now());
	const timeoutMs = Math.min(PAGE_TIMEOUT_MS, remainingMs);
	const timer = setTimeout(() => controller.abort(), timeoutMs);
	const onWorkflowAbort = () => controller.abort();
	workflowSignal.addEventListener("abort", onWorkflowAbort, { once: true });

	return {
		controller,
		cleanup: () => {
			clearTimeout(timer);
			workflowSignal.removeEventListener("abort", onWorkflowAbort);
		},
	};
}

/**
 * Parse robots.txt content into structured groups with user agents and rules
 */
function parseRobotsTxt(text: string): RobotsGroup[] {
	const groups: RobotsGroup[] = [];
	let currentUserAgents: string[] = [];
	let currentRules: RobotsRule[] = [];
	let hasRulesForCurrentGroup = false;

	for (const rawLine of text.split("\n")) {
		const withoutComment = rawLine.split("#")[0]?.trim().toLowerCase() ?? "";
		if (!withoutComment) {
			continue;
		}

		const separatorIndex = withoutComment.indexOf(":");
		if (separatorIndex === -1) {
			continue;
		}

		const directive = withoutComment.slice(0, separatorIndex).trim();
		const value = withoutComment.slice(separatorIndex + 1).trim();

		if (directive === "user-agent") {
			if (currentUserAgents.length > 0 && hasRulesForCurrentGroup) {
				groups.push({
					userAgents: currentUserAgents,
					rules: currentRules,
				});
				currentUserAgents = [];
				currentRules = [];
				hasRulesForCurrentGroup = false;
			}

			if (value.length > 0) {
				currentUserAgents.push(value);
			}
			continue;
		}

		if (
			(directive === "allow" || directive === "disallow") &&
			currentUserAgents.length > 0
		) {
			hasRulesForCurrentGroup = true;
			if (directive === "disallow" && value.length === 0) {
				continue;
			}

			currentRules.push({
				type: directive,
				path: value,
			});
		}
	}

	if (currentUserAgents.length > 0) {
		groups.push({
			userAgents: currentUserAgents,
			rules: currentRules,
		});
	}

	return groups;
}

/**
 * Check if a path is allowed based on parsed robots.txt groups
 * Uses wildcard (*) rules when no user-agent specific rules exist
 */
function isPathAllowedByGroups(path: string, groups: RobotsGroup[]): boolean {
	const wildcardRules = groups
		.filter((group) => group.userAgents.includes("*"))
		.flatMap((group) => group.rules);

	if (wildcardRules.length === 0) {
		return true;
	}

	let matchedRule: RobotsRule | null = null;
	for (const rule of wildcardRules) {
		if (!path.startsWith(rule.path)) {
			continue;
		}

		if (
			!matchedRule ||
			rule.path.length > matchedRule.path.length ||
			(rule.path.length === matchedRule.path.length && rule.type === "allow")
		) {
			matchedRule = rule;
		}
	}

	if (!matchedRule) {
		return true;
	}

	return matchedRule.type === "allow";
}

/**
 * Check if a path is allowed to be scraped by fetching and parsing robots.txt
 * Returns true by default on any failure (graceful degradation)
 */
async function checkRobotsTxt(
	domain: string,
	path: string,
	workflowSignal: AbortSignal,
	deadlineMs: number,
): Promise<boolean> {
	try {
		if (workflowSignal.aborted) {
			throw new DOMException("Total scrape timed out", "AbortError");
		}

		const robotsUrl = `https://${domain}/robots.txt`;
		const { controller, cleanup } = createRequestAbortController(
			workflowSignal,
			deadlineMs,
		);

		const res = await fetch(robotsUrl, {
			signal: controller.signal,
			cache: "no-store",
		});

		cleanup();

		if (!res.ok) return true;

		const text = await res.text();
		return isPathAllowedByGroups(path, parseRobotsTxt(text));
	} catch (error) {
		if (isAbortError(error)) {
			throw error;
		}

		// Graceful degradation - allow on any failure
		return true;
	}
}

/**
 * Strip HTML tags to plain text, collapse whitespace
 */
function stripHtmlToText(html: string): string {
	return html
		.replace(/<[^>]*>/g, " ")
		.replace(/\s+/g, " ")
		.trim();
}

/**
 * Extract internal links from HTML, filtered to same domain
 */
function extractInternalLinks(html: string, domain: string): string[] {
	const linkPattern = /href=["']([^"']+)["']/gi;
	const links: string[] = [];
	const domainLower = domain.toLowerCase();

	let match: RegExpExecArray | null = linkPattern.exec(html);
	while (match !== null) {
		const href = match[1];
		if (!href) continue;

		// Skip external links, javascript, mailto, etc.
		if (href.startsWith("http") && !href.toLowerCase().includes(domainLower)) {
			continue;
		}
		if (
			href.startsWith("#") ||
			href.startsWith("javascript:") ||
			href.startsWith("mailto:")
		) {
			continue;
		}

		// Normalize path
		const path = href.replace(/^https?:\/\/[^/]+/, "").split("?")[0] ?? "";
		if (path.startsWith("/")) {
			links.push(path);
		}

		match = linkPattern.exec(html);
	}

	return [...new Set(links)];
}

/**
 * Find matching link from extracted links for given path patterns
 */
function findMatchingLink(
	extractedLinks: string[],
	patterns: string[],
): string | null {
	for (const pattern of patterns) {
		for (const link of extractedLinks) {
			if (
				link === pattern ||
				link.startsWith(`${pattern}/`) ||
				link === `${pattern}/`
			) {
				return link;
			}
		}
	}
	return null;
}

/**
 * Extract job titles from careers page HTML
 */
function extractJobPostings(html: string): string[] {
	const titles: string[] = [];

	// Extract from h2 and h3 elements (common job listing patterns)
	const headingPattern = /<(?:h2|h3)[^>]*>([^<]+)<\/(?:h2|h3)>/gi;
	let match: RegExpExecArray | null = headingPattern.exec(html);
	while (match !== null) {
		const matchedText = match[1];
		if (!matchedText) continue;
		const text = stripHtmlToText(matchedText).trim();
		// Filter likely job titles (exclude navigation, generic text)
		if (
			text.length > 5 &&
			text.length < 150 &&
			!/^(about|contact|home|blog|news|menu|search|login|sign in|register)/i.test(
				text,
			)
		) {
			titles.push(text);
		}

		match = headingPattern.exec(html);
	}

	// Look for common job listing patterns
	const jobLinkPattern =
		/<(?:a|span|div)[^>]*class=["'][^"']*(?:job|title|position|role)[^"']*["'][^>]*>([^<]+)<\/(?:a|span|div)>/gi;
	match = jobLinkPattern.exec(html);
	while (match !== null) {
		const matchedText = match[1];
		if (!matchedText) continue;
		const text = stripHtmlToText(matchedText).trim();
		if (text.length > 5 && text.length < 150) {
			titles.push(text);
		}

		match = jobLinkPattern.exec(html);
	}

	// Dedupe and limit
	return [...new Set(titles)].slice(0, 20);
}

/**
 * Extract press release titles from newsroom HTML
 */
function extractPressReleaseTitles(html: string): string[] {
	const titles: string[] = [];

	// Look for article headings and headlines
	const headingPattern =
		/<(?:h1|h2|h3|a)[^>]*>([^<]{10,150})<\/(?:h1|h2|h3|a)>/gi;
	let match: RegExpExecArray | null = headingPattern.exec(html);

	while (match !== null) {
		const matchedText = match[1];
		if (!matchedText) continue;
		const text = stripHtmlToText(matchedText).trim();
		// Press releases typically have dates nearby and are news-like
		if (
			text.length > 10 &&
			text.length < 200 &&
			!/^(home|about|contact|menu|search|login|privacy|terms|jobs|careers)/i.test(
				text,
			)
		) {
			titles.push(text);
		}

		match = headingPattern.exec(html);
	}

	// Also look for article patterns with dates
	const articlePattern =
		/<article[^>]*>[\s\S]*?<h[1-3][^>]*>([^<]+)<\/h[1-3]>[\s\S]*?<\/article>/gi;
	match = articlePattern.exec(html);
	while (match !== null) {
		const matchedText = match[1];
		if (!matchedText) continue;
		const text = stripHtmlToText(matchedText).trim();
		if (text.length > 10 && text.length < 200) {
			titles.push(text);
		}

		match = articlePattern.exec(html);
	}

	// Dedupe and limit
	return [...new Set(titles)].slice(0, 15);
}

/**
 * Fetch a single page with timeout
 */
async function fetchPage(
	domain: string,
	path: string,
	workflowSignal: AbortSignal,
	deadlineMs: number,
): Promise<FetchedPage | null> {
	try {
		if (workflowSignal.aborted) {
			throw new DOMException("Total scrape timed out", "AbortError");
		}

		const url = `https://${domain}${path}`;
		const { controller, cleanup } = createRequestAbortController(
			workflowSignal,
			deadlineMs,
		);

		const res = await fetch(url, {
			signal: controller.signal,
			cache: "no-store",
		});

		cleanup();

		if (!res.ok) return null;

		const html = await res.text();
		return {
			html,
			text: stripHtmlToText(html).substring(0, 2000),
		};
	} catch (error) {
		if (isAbortError(error)) {
			throw error;
		}

		return null;
	}
}

// ---------------------------------------------------------------------------
// Main Scrape Function
// ---------------------------------------------------------------------------

/**
 * Deep scrape a company website, extracting content from multiple pages
 */
export async function scrapeWebsiteDeep(
	domain: string,
): Promise<WebsiteDeepScrapeResult> {
	const result: WebsiteDeepScrapeResult = {
		domain,
		scrapedAt: new Date(),
		pages: {
			about: null,
			newsroom: null,
			careers: null,
			blog: null,
			investors: null,
		},
		jobPostings: [],
		recentPressReleases: [],
	};

	// Normalize domain
	const normalizedDomain = domain
		.replace(/^https?:\/\//, "")
		.replace(/\/$/, "");

	const workflowAbortController = new AbortController();
	const workflowTimer = setTimeout(
		() => workflowAbortController.abort(),
		TOTAL_TIMEOUT_MS,
	);
	const deadlineMs = Date.now() + TOTAL_TIMEOUT_MS;

	try {
		// Step 1: Fetch homepage to extract internal links
		const homepage = await fetchPage(
			normalizedDomain,
			"/",
			workflowAbortController.signal,
			deadlineMs,
		);
		if (!homepage) {
			return result;
		}

		const internalLinks = extractInternalLinks(homepage.html, normalizedDomain);

		// Step 2: Find matching links for each category
		const pagePromises: Array<{
			category: keyof WebsiteDeepScrapeResult["pages"];
			promise: Promise<{
				page: FetchedPage | null;
				path: string;
			}>;
		}> = [];

		for (const [category, patterns] of Object.entries(PATH_PATTERNS)) {
			if (workflowAbortController.signal.aborted) {
				throw new DOMException("Total scrape timed out", "AbortError");
			}

			// First try to find from extracted links
			let targetPath = findMatchingLink(internalLinks, patterns);

			// If no match, try common paths directly
			if (!targetPath) {
				for (const pattern of patterns) {
					const allowed = await checkRobotsTxt(
						normalizedDomain,
						pattern,
						workflowAbortController.signal,
						deadlineMs,
					);
					if (allowed) {
						targetPath = pattern;
						break;
					}
				}
			}

			// Check robots.txt before fetching
			if (targetPath) {
				const allowed = await checkRobotsTxt(
					normalizedDomain,
					targetPath,
					workflowAbortController.signal,
					deadlineMs,
				);
				if (!allowed) {
					continue;
				}

				const pathToFetch = targetPath;
				pagePromises.push({
					category: category as keyof WebsiteDeepScrapeResult["pages"],
					promise: (async () => {
						const page = await fetchPage(
							normalizedDomain,
							pathToFetch,
							workflowAbortController.signal,
							deadlineMs,
						);
						return { page, path: pathToFetch };
					})(),
				});
			}
		}

		// Step 3: Fetch all pages in parallel
		const pageResults = await Promise.all(
			pagePromises.map(async (p) => {
				const pageResult = await p.promise;
				return { category: p.category, ...pageResult };
			}),
		);

		// Step 4: Populate results
		for (const pageResult of pageResults) {
			const category = pageResult.category;
			result.pages[category] = pageResult.page?.text ?? null;

			// Extract structured data from relevant pages
			if (pageResult.page?.html && category === "careers") {
				result.jobPostings = extractJobPostings(pageResult.page.html);
			}

			if (pageResult.page?.html && category === "newsroom") {
				result.recentPressReleases = extractPressReleaseTitles(
					pageResult.page.html,
				);
			}
		}
	} catch (error) {
		if (!isAbortError(error)) {
			// Return result with null pages on catastrophic failure
		}
	} finally {
		clearTimeout(workflowTimer);
		workflowAbortController.abort();
	}

	return result;
}
