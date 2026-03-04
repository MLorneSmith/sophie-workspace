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

// ---------------------------------------------------------------------------
// Utility Functions
// ---------------------------------------------------------------------------

/**
 * Check if a path is allowed by robots.txt
 * Returns true by default on any failure (graceful degradation)
 */
async function checkRobotsTxt(domain: string, path: string): Promise<boolean> {
	try {
		const robotsUrl = `https://${domain}/robots.txt`;
		const controller = new AbortController();
		const timer = setTimeout(() => controller.abort(), PAGE_TIMEOUT_MS);

		const res = await fetch(robotsUrl, {
			signal: controller.signal,
		});

		clearTimeout(timer);

		if (!res.ok) return true;

		const text = await res.text();
		const lines = text.split("\n");

		let userAgent = "";
		const disallows: string[] = [];

		for (const line of lines) {
			const trimmed = line.trim().toLowerCase();
			if (trimmed.startsWith("user-agent:")) {
				const agent = trimmed.substring("user-agent:".length).trim();
				if (agent === "*" || agent === "") {
					userAgent = agent;
				}
			} else if (trimmed.startsWith("disallow:")) {
				const disallowPath = trimmed.substring("disallow:".length).trim();
				if (userAgent === "*" && disallowPath) {
					disallows.push(disallowPath);
				}
			}
		}

		// Check if path matches any disallow rule
		for (const disallow of disallows) {
			if (path.startsWith(disallow) || disallow === "/") {
				return false;
			}
		}

		return true;
	} catch {
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
		const path = href.replace(/^https?:\/\/[^/]+/, "").split("?")[0];
		if (path && path.startsWith("/")) {
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
	const headingPattern = /<(?:h2|h3)[^>]*>([^<]+)<\/[h2h3]>/gi;
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
	const headingPattern = /<(?:h1|h2|h3|a)[^>]*>([^<]{10,150})<\/[h123a]>/gi;
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
async function fetchPage(domain: string, path: string): Promise<string | null> {
	try {
		const url = `https://${domain}${path}`;
		const controller = new AbortController();
		const timer = setTimeout(() => controller.abort(), PAGE_TIMEOUT_MS);

		const res = await fetch(url, {
			signal: controller.signal,
		});

		clearTimeout(timer);

		if (!res.ok) return null;

		const html = await res.text();
		return stripHtmlToText(html).substring(0, 2000);
	} catch {
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

	try {
		// Step 1: Fetch homepage to extract internal links
		const homepageHtml = await fetchPage(normalizedDomain, "/");
		if (!homepageHtml) {
			return result;
		}

		const internalLinks = extractInternalLinks(homepageHtml, normalizedDomain);

		// Step 2: Find matching links for each category
		const pagePromises: Array<{
			category: keyof WebsiteDeepScrapeResult["pages"];
			promise: Promise<{ content: string | null; path: string }>;
		}> = [];

		for (const [category, patterns] of Object.entries(PATH_PATTERNS)) {
			// First try to find from extracted links
			let targetPath = findMatchingLink(internalLinks, patterns);

			// If no match, try common paths directly
			if (!targetPath) {
				for (const pattern of patterns) {
					const allowed = await checkRobotsTxt(normalizedDomain, pattern);
					if (allowed) {
						targetPath = pattern;
						break;
					}
				}
			}

			// Check robots.txt before fetching
			if (targetPath) {
				const allowed = await checkRobotsTxt(normalizedDomain, targetPath);
				if (!allowed) {
					continue;
				}

				const pathToFetch = targetPath;
				pagePromises.push({
					category: category as keyof WebsiteDeepScrapeResult["pages"],
					promise: (async () => {
						const content = await fetchPage(normalizedDomain, pathToFetch);
						return { content, path: pathToFetch };
					})(),
				});
			}
		}

		// Step 3: Fetch all pages in parallel with timeout
		const fetchPromise = Promise.all(
			pagePromises.map(async (p) => {
				try {
					const result = await p.promise;
					return { category: p.category, ...result };
				} catch {
					return { category: p.category, content: null, path: "" };
				}
			}),
		);

		const timeoutPromise = new Promise<never>((_, reject) =>
			setTimeout(
				() => reject(new Error("Total scrape timed out")),
				TOTAL_TIMEOUT_MS,
			),
		);

		const pageResults = await Promise.race([fetchPromise, timeoutPromise]);

		// Step 4: Populate results
		for (const pageResult of pageResults) {
			const category = pageResult.category;
			result.pages[category] = pageResult.content;

			// Extract structured data from relevant pages
			if (pageResult.content && category === "careers") {
				result.jobPostings = extractJobPostings(pageResult.content);
			}

			if (pageResult.content && category === "newsroom") {
				result.recentPressReleases = extractPressReleaseTitles(
					pageResult.content,
				);
			}
		}
	} catch {
		// Return result with null pages on catastrophic failure
	}

	return result;
}
