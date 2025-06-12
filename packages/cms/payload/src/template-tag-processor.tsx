

// Enable detailed logging in development environment
const DEBUG = process.env.NODE_ENV === "development";

// Helper logging function
function debugLog(...args: any[]) {
	if (DEBUG) {
		console.log("[TemplateTagProcessor]", ...args);
	}
}

type TemplateTagProcessorProps = {
	content: string;
};

/**
 * Process r2file tags for file downloads
 * Format: {% r2file awsurl="URL" filedescription="Description" /%}
 */
function processR2FileTags(text: string): string {
	// Count matches before processing
	const matches = text.match(/{%\s*r2file.*?\/%}/g) || [];
	if (DEBUG && matches.length > 0) {
		debugLog(`Found ${matches.length} r2file tags`);
	}

	// Standard pattern
	const r2filePattern =
		/{%\s*r2file\s+awsurl="([^"]+)"\s+filedescription="([^"]+)"\s*\/%}/g;

	// Process standard format
	let processedText = text.replace(r2filePattern, (match, url, description) => {
		if (DEBUG) {
			debugLog(
				`Processing r2file: URL=${url.substring(0, 30)}..., Description=${description}`,
			);
		}

		return `
      <div class="flex items-center justify-between rounded-lg border border-gray-200 p-3 dark:border-gray-700 my-2">
        <div class="flex-grow">
          <p class="font-medium">${description}</p>
        </div>
        <a
          href="${url}"
          download
          class="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          target="_blank"
          rel="noopener noreferrer"
          data-source="r2file-tag"
        >
          Download
        </a>
      </div>
    `;
	});

	// Alternative format (in case order is different)
	const alternativePattern =
		/{%\s*r2file\s+filedescription="([^"]+)"\s+awsurl="([^"]+)"\s*\/%}/g;

	processedText = processedText.replace(
		alternativePattern,
		(match, description, url) => {
			if (DEBUG) {
				debugLog(
					`Processing alternative r2file: Description=${description}, URL=${url.substring(0, 30)}...`,
				);
			}

			return `
      <div class="flex items-center justify-between rounded-lg border border-gray-200 p-3 dark:border-gray-700 my-2">
        <div class="flex-grow">
          <p class="font-medium">${description}</p>
        </div>
        <a
          href="${url}"
          download
          class="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          target="_blank"
          rel="noopener noreferrer"
          data-source="r2file-alt-tag"
        >
          Download
        </a>
      </div>
    `;
		},
	);

	// Check for unprocessed r2file tags (for debugging)
	if (DEBUG) {
		const remainingMatches = processedText.match(/{%\s*r2file.*?\/%}/g) || [];
		if (remainingMatches.length > 0) {
			debugLog(`Warning: ${remainingMatches.length} r2file tags not processed`);
			debugLog(`First unprocessed tag: ${remainingMatches[0]}`);
		}
	}

	return processedText;
}

/**
 * Process bunny video tags
 * Format: {% bunny bunnyvideoid="ID" /%}
 */
function processBunnyVideoTags(text: string): string {
	// Count matches before processing
	const matches = text.match(/{%\s*bunny.*?\/%}/g) || [];
	if (DEBUG && matches.length > 0) {
		debugLog(`Found ${matches.length} bunny video tags`);
	}

	const bunnyPattern = /{%\s*bunny\s+bunnyvideoid="([^"]+)"\s*\/%}/g;

	return text.replace(bunnyPattern, (match, videoId) => {
		if (DEBUG) {
			debugLog(`Processing bunny video: ID=${videoId}`);
		}

		const libraryId = "264486"; // Default library ID

		return `
      <div class="my-8">
        <div class="relative" style="padding-bottom: 56.25%;">
          <iframe
            src="https://iframe.mediadelivery.net/embed/${libraryId}/${videoId}"
            loading="lazy"
            style="border: none; position: absolute; top: 0; left: 0; height: 100%; width: 100%;"
            allow="accelerometer; gyroscope; encrypted-media; picture-in-picture;"
            allowfullscreen="true"
            title="Bunny.net Video"
            data-source="bunny-tag"
            data-video-id="${videoId}"
          ></iframe>
        </div>
      </div>
    `;
	});
}

/**
 * Process custom bullet tags
 * Format: {% custombullet status="right-arrow" /%}
 */
function processCustomBulletTags(text: string): string {
	// Count matches before processing
	const matches = text.match(/{%\s*custombullet.*?\/%}/g) || [];
	if (DEBUG && matches.length > 0) {
		debugLog(`Found ${matches.length} custom bullet tags`);
	}

	const bulletPattern = /{%\s*custombullet\s+status="([^"]+)"\s*\/%}/g;

	return text.replace(bulletPattern, (match, status) => {
		if (DEBUG) {
			debugLog(`Processing custom bullet: status=${status}`);
		}

		let bulletHtml = "";

		switch (status) {
			case "right-arrow":
				bulletHtml =
					'<span class="inline-block mr-2" data-bullet-type="right-arrow">→</span>';
				break;
			case "check":
				bulletHtml =
					'<span class="inline-block mr-2" data-bullet-type="check">✓</span>';
				break;
			case "x":
				bulletHtml =
					'<span class="inline-block mr-2" data-bullet-type="x">✗</span>';
				break;
			default:
				bulletHtml = `<span class="inline-block mr-2" data-bullet-type="default" data-status="${status}">•</span>`;
		}

		return bulletHtml;
	});
}

/**
 * Process lesson header tags
 * Format: ### Lesson Header
 */
function processHeaderTags(text: string): string {
	return text.replace(/^###\s+(.*)$/gm, (match, headerText) => {
		if (DEBUG) {
			debugLog(`Processing header: "${headerText}"`);
		}
		return `<h3 class="text-xl font-bold mt-6 mb-3">${headerText}</h3>`;
	});
}

/**
 * Process all template tags in content
 * @param content The content string containing template tags
 * @returns Component with processed content
 */
export function TemplateTagProcessor({ content }: TemplateTagProcessorProps) {
	if (!content || typeof content !== "string") {
		if (DEBUG) {
			debugLog("Received empty or non-string content");
		}
		return null;
	}

	// Log basic stats about the content in development
	if (DEBUG) {
		const contentPreview =
			content.length > 100 ? `${content.substring(0, 100)}...` : content;

		debugLog(`Processing content (${content.length} chars): ${contentPreview}`);

		// Count tag occurrences
		const r2fileMatches = content.match(/{%\s*r2file.*?\/%}/g) || [];
		const bunnyMatches = content.match(/{%\s*bunny.*?\/%}/g) || [];
		const bulletMatches = content.match(/{%\s*custombullet.*?\/%}/g) || [];

		debugLog(
			`Found tags: ${r2fileMatches.length} r2file, ${bunnyMatches.length} bunny, ${bulletMatches.length} custombullet`,
		);

		// Log the first few matches of each type
		const logFirstMatches = (matches: string[], label: string) => {
			if (matches.length > 0) {
				debugLog(`${label} examples:`);
				for (const [i, match] of matches.slice(0, 2).entries()) {
					debugLog(`  ${i + 1}. ${match}`);
				}
			}
		};

		if (r2fileMatches.length > 0) logFirstMatches(r2fileMatches, "r2file");
		if (bunnyMatches.length > 0) logFirstMatches(bunnyMatches, "bunny");
		if (bulletMatches.length > 0)
			logFirstMatches(bulletMatches, "custombullet");
	}

	try {
		// Apply all processors in sequence
		let processedContent = content;

		// First process downloads to ensure they're properly handled
		processedContent = processR2FileTags(processedContent);

		// Then process other media elements
		processedContent = processBunnyVideoTags(processedContent);

		// Then process formatting elements
		processedContent = processCustomBulletTags(processedContent);

		// Process headers last to avoid conflicts
		processedContent = processHeaderTags(processedContent);

		// Remove any duplicate HTML tags that might have been created during processing
		processedContent = processedContent.replace(/<\/(div|h3|p)>\s*<\1>/g, " ");

		// Add wrapper with diagnostic classes in development
		return (
			<div
				className={`template-content ${DEBUG ? "template-processed" : ""}`}
				data-processed-length={processedContent.length}
				data-original-length={content.length}
			>
				{/* biome-ignore lint/security/noDangerouslySetInnerHtml: Processing trusted CMS content with template tags */}
				<div dangerouslySetInnerHTML={{ __html: processedContent }} />
			</div>
		);
	} catch (error) {
		if (DEBUG) {
			debugLog("Error processing template tags:", error);
		}

		// Fallback to a basic rendering with error indication in development
		if (DEBUG) {
			return (
				<div className="template-content template-error">
					<div className="rounded border border-red-200 bg-red-50 p-4">
						<p className="text-red-700">Error processing template tags</p>
						<pre className="mt-2 max-h-40 overflow-auto text-xs text-red-600">
							{error instanceof Error ? error.toString() : String(error)}
						</pre>
					</div>
					{/* biome-ignore lint/security/noDangerouslySetInnerHtml: Fallback rendering of original CMS content when template processing fails */}
					<div dangerouslySetInnerHTML={{ __html: content }} />
				</div>
			);
		}

		// In production, just render the content directly
		// biome-ignore lint/security/noDangerouslySetInnerHtml: Production fallback for trusted CMS content
		return <div dangerouslySetInnerHTML={{ __html: content }} />;
	}
}

/**
 * Check if content contains template tags that need processing
 */
export function containsTemplateTags(content: unknown): boolean {
	if (typeof content !== "string") {
		return false;
	}

	return content.includes("{%") && content.includes("%}");
}
