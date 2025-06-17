import {
import { createServiceLogger } from "@kit/shared/logger";

// Initialize service logger
const { getLogger } = createServiceLogger("CMS-PAYLOAD");

	containsTemplateTags,
	TemplateTagProcessor,
} from "./template-tag-processor";

// Enable detailed logging in development environment
const DEBUG = process.env.NODE_ENV === "development";

// Helper logging function
function debugLog(...args: unknown[]) {
	if (DEBUG) {
		// TODO: Async logger needed
		// (await getLogger()).info("[PayloadContentRenderer]", { data: ...args });
	}
}

// Type for nodes with various content properties
type ContentNode = {
	htmlContent?: string;
	html?: string;
	data?: { htmlContent?: string; html?: string };
	toHTML?: () => string;
	fields?: { htmlContent?: string; html?: string };
};

// Helper function to find HTML content in various locations
function findHtmlContent(node: ContentNode): string | null {
	// Check all possible locations where HTML content might be stored
	if (node.htmlContent) return node.htmlContent;
	if (node.html) return node.html;
	if (node.data?.htmlContent) return node.data.htmlContent;
	if (node.data?.html) return node.data.html;
	if (typeof node.toHTML === "function") return node.toHTML();
	if (node.fields?.htmlContent) return node.fields.htmlContent;
	if (node.fields?.html) return node.fields.html;

	return null;
}

// Function to render Lexical content
export function PayloadContentRenderer({ content }: { content: unknown }) {
	// If content is null or undefined, return null
	if (!content) {
		if (DEBUG) debugLog("Received null or undefined content");
		return null;
	}

	// For string content, check if it contains template tags
	if (typeof content === "string") {
		if (containsTemplateTags(content)) {
			if (DEBUG)
				debugLog("Content contains template tags, using TemplateTagProcessor");
			return <TemplateTagProcessor content={content} />;
		}

		if (DEBUG)
			debugLog("Content is string but has no template tags, rendering as HTML");
		// Note: Content trusted as it comes from Payload CMS admin
		return <div dangerouslySetInnerHTML={{ __html: content }} />;
	}

	// Log content type for debugging
	if (DEBUG) {
		if (content && typeof content === "object") {
			if ((content as { root?: unknown }).root) {
				debugLog("Content appears to be Lexical format");
			} else {
				debugLog(
					"Content is an object but not Lexical format:",
					Object.keys(content as object),
				);
			}
		}
	}

	// Type for Lexical content structure
	type LexicalNode = {
		type: string;
		tag?: string;
		text?: string;
		children?: LexicalNode[];
		fields?: Record<string, unknown>;
		blockType?: string;
		videoId?: string;
		libraryId?: string;
		title?: string;
		aspectRatio?: string;
		headline?: string;
		subheadline?: string;
		content?: string;
		buttonText?: string;
		leftButtonLabel?: string;
		leftButtonUrl?: string;
		rightButtonLabel?: string;
		rightButtonUrl?: string;
	};

	// For Lexical content, extract the text and render it
	try {
		const lexicalContent = content as { root?: { children?: LexicalNode[]; text?: string } };

		// Check if lexicalContent.root exists
		if (lexicalContent.root) {
			// If children exists and is an array, render each child
			if (Array.isArray(lexicalContent.root.children)) {
				return (
					<div className="payload-content">
						{lexicalContent.root.children.map((node: LexicalNode, i: number) => {
							// Handle custom blocks
							// Check for Call To Action block
							if (
								node.type === "custom-call-to-action" ||
								(node.fields &&
									node.fields.blockType === "custom-call-to-action") ||
								node.blockType === "custom-call-to-action"
							) {
								// TODO: Async logger needed
		// (await getLogger()).info("Found Call To Action block:", { data: node });

								// Try to extract the HTML content from various locations
								const htmlContent = findHtmlContent(node);

								if (htmlContent) {
									// TODO: Async logger needed
		// (await getLogger()).info("Using HTML content for Call To Action:", { arg1: `${htmlContent.substring(0, arg2: 100 })}...`,
									);
									// Note: Content trusted as it comes from Payload CMS admin
									return (
										<div
											key={`cta-html-${i}-${node.blockType || 'cta'}`}
											dangerouslySetInnerHTML={{ __html: htmlContent }}
										/>
									);
								}

								// Fallback rendering for Call To Action block
								return (
									<div
										key={`cta-fallback-${i}-${node.headline || node.text || 'cta'}`}
										className="my-6 rounded-md border border-blue-200 bg-blue-50 p-4"
									>
										<h3 className="text-lg font-bold text-blue-700">
											Call To Action
										</h3>
										<p className="mt-2 text-blue-600">
											{String(node.headline ||
												node.text ||
												node.content ||
												"Call to action content")}
										</p>
										{node.buttonText && (
											<button type="button" className="mt-4 rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600">
												{String(node.buttonText)}
											</button>
										)}
									</div>
								);
							}

							// Check for Test Block
							if (
								node.type === "test-block" ||
								(node.fields && node.fields.blockType === "test-block") ||
								node.blockType === "test-block"
							) {
								// TODO: Async logger needed
		// (await getLogger()).info("Found Test Block:", { data: node });

								// Try to extract the HTML content from various locations
								const htmlContent = findHtmlContent(node);

								if (htmlContent) {
									// TODO: Async logger needed
		// (await getLogger()).info("Using HTML content for Test Block:", { arg1: `${htmlContent.substring(0, arg2: 100 })}...`,
									);
									// Note: Content trusted as it comes from Payload CMS admin
									return (
										<div
											key={`test-fallback-${i}-${node.blockType || 'test'}`}
											dangerouslySetInnerHTML={{ __html: htmlContent }}
										/>
									);
								}

								// Fallback rendering for Test Block
								return (
									<div
										key={`test-fallback-${i}-${node.blockType || 'test'}`}
										className="my-6 rounded-md border border-blue-100 bg-blue-50 p-4"
									>
										<h3 className="text-lg font-bold text-blue-700">
											Test Block
										</h3>
										<p className="mt-2 text-blue-600">
											{String(node.text || node.content || "Test block content")}
										</p>
									</div>
								);
							}

							// Check for Bunny Video block
							if (
								node.type === "bunny-video" ||
								(node.fields && node.fields.blockType === "bunny-video") ||
								node.blockType === "bunny-video"
							) {
								// TODO: Async logger needed
		// (await getLogger()).info("Found Bunny Video block:", { data: node });

								// Try to extract the HTML content from various locations
								const htmlContent = findHtmlContent(node);

								if (htmlContent) {
									// TODO: Async logger needed
		// (await getLogger()).info("Using HTML content for Bunny Video:", { arg1: `${htmlContent.substring(0, arg2: 100 })}...`,
									);
									// Note: Content trusted as it comes from Payload CMS admin
									return (
										<div
											key={`bunny-video-${i}-${node.videoId || 'video'}`}
											dangerouslySetInnerHTML={{ __html: htmlContent }}
										/>
									);
								}

								// Extract video data with defaults
								const videoId = String(node.videoId || node.fields?.videoId || "");
								const libraryId = String(
									node.libraryId || node.fields?.libraryId || "1234"
								);
								const title = String(node.title || node.fields?.title || "Video");
								const aspectRatio = String(
									node.aspectRatio || node.fields?.aspectRatio || "16:9"
								);

								// Calculate padding based on aspect ratio
								const getPaddingBottom = () => {
									if (aspectRatio === "16:9") return "56.25%"; // 9/16 = 0.5625 = 56.25%
									if (aspectRatio === "4:3") return "75%"; // 3/4 = 0.75 = 75%
									if (aspectRatio === "1:1") return "100%"; // Square
									return "56.25%"; // Default to 16:9
								};

								// If no videoId is provided, show a placeholder
								if (!videoId) {
									return (
										<div
											key={`node-${i}-${node.type || 'unknown'}`}
											className="my-6 rounded-md border border-gray-200 bg-gray-50 p-4"
										>
											<h3 className="text-lg font-bold text-gray-700">
												{title}
											</h3>
											<div className="flex items-center justify-center rounded bg-gray-100 p-8">
												<p className="text-gray-500">
													Bunny.net Video (ID not provided)
												</p>
											</div>
										</div>
									);
								}

								// Render the Bunny.net video player
								return (
									<div key={`bunny-video-${i}-${node.videoId || 'video'}`} className="my-6">
										<h3 className="mb-2 text-lg font-bold">{title}</h3>
										<div
											className="relative"
											style={{ paddingBottom: getPaddingBottom() }}
										>
											<iframe
												src={`https://iframe.mediadelivery.net/embed/${libraryId}/${videoId}`}
												loading="lazy"
												style={{
													border: "none",
													position: "absolute",
													top: 0,
													left: 0,
													height: "100%",
													width: "100%",
												}}
												allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
												allowFullScreen={true}
												title={title}
											/>
										</div>
									</div>
								);
							}

							// Check for YouTube Video block
							if (
								node.type === "youtube-video" ||
								(node.fields && node.fields.blockType === "youtube-video") ||
								node.blockType === "youtube-video"
							) {
								// TODO: Async logger needed
		// (await getLogger()).info("Found YouTube Video block:", { data: node });

								// Try to extract the HTML content from various locations
								const htmlContent = findHtmlContent(node);

								if (htmlContent) {
									// TODO: Async logger needed
		// (await getLogger()).info("Using HTML content for YouTube Video:", { arg1: `${htmlContent.substring(0, arg2: 100 })}...`,
									);
									// Note: Content trusted as it comes from Payload CMS admin
									return (
										<div
											key={`youtube-video-${i}-${node.videoId || 'video'}`}
											dangerouslySetInnerHTML={{ __html: htmlContent }}
										/>
									);
								}

								// Helper function to extract YouTube ID from URL or ID
								const extractYouTubeId = (input: string): string => {
									// Return if input is empty
									if (!input) return "";

									// Regular expression to match YouTube video ID from various URL formats
									const regExp =
										/^.*(?:(?:youtu\.be\/|v\/|vi\/|u\/\w\/|embed\/|shorts\/)|(?:(?:watch)?\?v(?:i)?=|&v(?:i)?=))([^#&?]*).*/;
									const match = input.match(regExp);

									if (match?.[1]) {
										// If it's a URL, return the extracted ID
										return match[1];
									}

									// If it's not a URL, assume it's already an ID
									return input;
								};

								// Extract video data with defaults
								const rawVideoId = node.videoId || node.fields?.videoId || "";
								const youtubeId = extractYouTubeId(String(rawVideoId));
								const title = String(
									node.title || node.fields?.title || "YouTube Video"
								);
								const aspectRatio = String(
									node.aspectRatio || node.fields?.aspectRatio || "16:9"
								);

								// Calculate padding based on aspect ratio
								const getPaddingBottom = () => {
									if (aspectRatio === "16:9") return "56.25%"; // 9/16 = 0.5625 = 56.25%
									if (aspectRatio === "4:3") return "75%"; // 3/4 = 0.75 = 75%
									if (aspectRatio === "1:1") return "100%"; // Square
									return "56.25%"; // Default to 16:9
								};

								// If no videoId is provided, show a placeholder
								if (!youtubeId) {
									return (
										<div
											key={`youtube-video-${i}-${node.videoId || 'video'}`}
											className="my-6 rounded-md border border-gray-200 bg-gray-50 p-4"
										>
											<h3 className="text-lg font-bold text-gray-700">
												{title}
											</h3>
											<div className="flex items-center justify-center rounded bg-gray-100 p-8">
												<p className="text-gray-500">
													YouTube Video (ID not provided)
												</p>
											</div>
										</div>
									);
								}

								// Render the YouTube video player
								return (
									<div key={`youtube-video-${i}-${node.videoId || 'video'}`} className="my-6">
										<h3 className="mb-2 text-lg font-bold">{title}</h3>
										<div
											className="relative"
											style={{ paddingBottom: getPaddingBottom() }}
										>
											<iframe
												src={`https://www.youtube.com/embed/${youtubeId}`}
												loading="lazy"
												style={{
													border: "none",
													position: "absolute",
													top: 0,
													left: 0,
													height: "100%",
													width: "100%",
												}}
												allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
												allowFullScreen={true}
												title={title}
											/>
										</div>
									</div>
								);
							}

							// Handle standard node types
							if (node.type === "paragraph") {
								// Check if node.children exists and is an array
								if (Array.isArray(node.children)) {
									return (
										<p key={`p-block-${i}-${node.text?.slice(0, 20) || 'text'}`}>
											{node.children.map((textNode: LexicalNode, j: number) => (
												<span key={`text-${i}-${j}-${textNode.text?.slice(0, 10) || 'empty'}`}>{textNode.text || ""}</span>
											))}
										</p>
									);
								}
								// Fallback for when children is not an array
								return <p key={`p-${i}-${node.text?.slice(0, 20) || 'text'}`}>{node.text || ""}</p>;
							}

							if (node.type === "heading") {
								// Use a switch statement to handle different heading levels
								const tag = node.tag || "h2"; // Default to h2 if tag is not specified

								// Check if node.children exists and is an array
								if (!Array.isArray(node.children)) {
									// Fallback for when children is not an array
									// Use switch for the fallback case too
									switch (tag) {
										case "h1":
											return <h1 key={`h1-${i}-${node.text?.slice(0, 20) || 'heading'}`}>{node.text || ""}</h1>;
										case "h2":
											return <h2 key={`h2-${i}-${node.text?.slice(0, 20) || 'heading'}`}>{node.text || ""}</h2>;
										case "h3":
											return <h3 key={`h3-${i}-${node.text?.slice(0, 20) || 'heading'}`}>{node.text || ""}</h3>;
										case "h4":
											return <h4 key={`h4-${i}-${node.text?.slice(0, 20) || 'heading'}`}>{node.text || ""}</h4>;
										case "h5":
											return <h5 key={`h5-${i}-${node.text?.slice(0, 20) || 'heading'}`}>{node.text || ""}</h5>;
										case "h6":
											return <h6 key={`h6-${i}-${node.text?.slice(0, 20) || 'heading'}`}>{node.text || ""}</h6>;
										default:
											return <h2 key={`h2-${i}-${node.text?.slice(0, 20) || 'heading'}`}>{node.text || ""}</h2>;
									}
								}

								// Render the appropriate heading with children
								const headingContent = node.children.map(
									(textNode: LexicalNode, j: number) => (
										<span key={`heading-${i}-${j}-${textNode.text?.slice(0, 10) || 'empty'}`}>{textNode.text || ""}</span>
									),
								);

								switch (tag) {
									case "h1":
										return <h1 key={`h1-${i}-${node.text?.slice(0, 20) || 'heading'}`}>{headingContent}</h1>;
									case "h2":
										return <h2 key={`h2-${i}-${node.text?.slice(0, 20) || 'heading'}`}>{headingContent}</h2>;
									case "h3":
										return <h3 key={`h3-${i}-${node.text?.slice(0, 20) || 'heading'}`}>{headingContent}</h3>;
									case "h4":
										return <h4 key={`h4-${i}-${node.text?.slice(0, 20) || 'heading'}`}>{headingContent}</h4>;
									case "h5":
										return <h5 key={`h5-${i}-${node.text?.slice(0, 20) || 'heading'}`}>{headingContent}</h5>;
									case "h6":
										return <h6 key={`h6-${i}-${node.text?.slice(0, 20) || 'heading'}`}>{headingContent}</h6>;
									default:
										return <h2 key={`h2-${i}-${node.text?.slice(0, 20) || 'heading'}`}>{headingContent}</h2>;
								}
							}

							// Handle block type nodes
							if (node.type === "block") {
								// TODO: Async logger needed
		// (await getLogger()).info("Found block type node:", { data: node });

								// Check for Call To Action block in fields
								if (node.fields && node.fields.blockType === "call-to-action") {
									// TODO: Async logger needed
		// (await getLogger()).info("Found Call To Action block in fields:", { arg1: node.fields, arg2:  });

									return (
										<div
											key={`cta-fallback-${i}-${node.headline || node.text || 'cta'}`}
											className="my-6 rounded-md border border-blue-200 bg-blue-50 p-4"
										>
											<h3 className="text-lg font-bold text-blue-700">
												{String(node.fields.headline || "Call To Action")}
											</h3>
											<p className="mt-2 text-blue-600">
												{String(node.fields.subheadline ||
													node.fields.text ||
													node.fields.content ||
													"Call to action content")}
											</p>
											<div className="mt-4 flex flex-wrap gap-4">
												{Boolean(node.fields.leftButtonLabel) && (
													<a
														href={String(node.fields.leftButtonUrl || "#")}
														className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
													>
														{String(node.fields.leftButtonLabel)}
													</a>
												)}
												{Boolean(node.fields.rightButtonLabel) && (
													<a
														href={String(node.fields.rightButtonUrl || "#")}
														className="rounded border border-blue-500 bg-white px-4 py-2 text-blue-500 hover:bg-blue-50"
													>
														{String(node.fields.rightButtonLabel)}
													</a>
												)}
											</div>
										</div>
									);
								}

								// Check for Test Block in fields
								if (node.fields && node.fields.blockType === "test-block") {
									// TODO: Async logger needed
		// (await getLogger()).info("Found Test Block in fields:", { data: node.fields });

									return (
										<div
											key={`test-fallback-${i}-${node.blockType || 'test'}`}
											className="my-6 rounded-md border border-blue-100 bg-blue-50 p-4"
										>
											<h3 className="text-lg font-bold text-blue-700">
												{String(node.fields.headline || "Test Block")}
											</h3>
											<p className="mt-2 text-blue-600">
												{String(node.fields.text ||
													node.fields.content ||
													"Test block content")}
											</p>
										</div>
									);
								}

								// Check for Bunny Video block in fields
								if (node.fields && node.fields.blockType === "bunny-video") {
									// TODO: Async logger needed
		// (await getLogger()).info("Found Bunny Video block in fields:", { arg1: node.fields, arg2:  });

									// Extract video data with defaults
									const videoId = String(node.fields.videoId || "");
									const libraryId = String(node.fields.libraryId || "1234");
									const title = String(node.fields.title || "Video");
									const aspectRatio = String(node.fields.aspectRatio || "16:9");

									// Calculate padding based on aspect ratio
									const getPaddingBottom = () => {
										if (aspectRatio === "16:9") return "56.25%"; // 9/16 = 0.5625 = 56.25%
										if (aspectRatio === "4:3") return "75%"; // 3/4 = 0.75 = 75%
										if (aspectRatio === "1:1") return "100%"; // Square
										return "56.25%"; // Default to 16:9
									};

									// If no videoId is provided, show a placeholder
									if (!videoId) {
										return (
											<div
												key={`node-${i}-${node.type || 'unknown'}`}
												className="my-6 rounded-md border border-gray-200 bg-gray-50 p-4"
											>
												<h3 className="text-lg font-bold text-gray-700">
													{title}
												</h3>
												<div className="flex items-center justify-center rounded bg-gray-100 p-8">
													<p className="text-gray-500">
														Bunny.net Video (ID not provided)
													</p>
												</div>
											</div>
										);
									}

									// Render the Bunny.net video player
									return (
										<div key={`bunny-video-${i}-${node.videoId || 'video'}`} className="my-6">
											<h3 className="mb-2 text-lg font-bold">{title}</h3>
											<div
												className="relative"
												style={{ paddingBottom: getPaddingBottom() }}
											>
												<iframe
													src={`https://iframe.mediadelivery.net/embed/${libraryId}/${videoId}`}
													loading="lazy"
													style={{
														border: "none",
														position: "absolute",
														top: 0,
														left: 0,
														height: "100%",
														width: "100%",
													}}
													allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
													allowFullScreen={true}
													title={title}
												/>
											</div>
										</div>
									);
								}

								// Check for YouTube Video block in fields
								if (node.fields && node.fields.blockType === "youtube-video") {
									// TODO: Async logger needed
		// (await getLogger()).info("Found YouTube Video block in fields:", { arg1: node.fields, arg2:  });

									// Helper function to extract YouTube ID from URL or ID
									const extractYouTubeId = (input: string): string => {
										// Return if input is empty
										if (!input) return "";

										// Regular expression to match YouTube video ID from various URL formats
										const regExp =
											/^.*(?:(?:youtu\.be\/|v\/|vi\/|u\/\w\/|embed\/|shorts\/)|(?:(?:watch)?\?v(?:i)?=|&v(?:i)?=))([^#&?]*).*/;
										const match = input.match(regExp);

										if (match?.[1]) {
											// If it's a URL, return the extracted ID
											return match[1];
										}

										// If it's not a URL, assume it's already an ID
										return input;
									};

									// Extract video data with defaults
									const rawVideoId = String(node.fields.videoId || "");
									const youtubeId = extractYouTubeId(rawVideoId);
									const title = String(node.fields.title || "YouTube Video");
									const aspectRatio = String(node.fields.aspectRatio || "16:9");

									// Calculate padding based on aspect ratio
									const getPaddingBottom = () => {
										if (aspectRatio === "16:9") return "56.25%"; // 9/16 = 0.5625 = 56.25%
										if (aspectRatio === "4:3") return "75%"; // 3/4 = 0.75 = 75%
										if (aspectRatio === "1:1") return "100%"; // Square
										return "56.25%"; // Default to 16:9
									};

									// If no videoId is provided, show a placeholder
									if (!youtubeId) {
										return (
											<div
												key={`youtube-video-${i}-${node.videoId || 'video'}`}
												className="my-6 rounded-md border border-gray-200 bg-gray-50 p-4"
											>
												<h3 className="text-lg font-bold text-gray-700">
													{title}
												</h3>
												<div className="flex items-center justify-center rounded bg-gray-100 p-8">
													<p className="text-gray-500">
														YouTube Video (ID not provided)
													</p>
												</div>
											</div>
										);
									}

									// Render the YouTube video player
									return (
										<div key={`youtube-video-${i}-${node.videoId || 'video'}`} className="my-6">
											<h3 className="mb-2 text-lg font-bold">{title}</h3>
											<div
												className="relative"
												style={{ paddingBottom: getPaddingBottom() }}
											>
												<iframe
													src={`https://www.youtube.com/embed/${youtubeId}`}
													loading="lazy"
													style={{
														border: "none",
														position: "absolute",
														top: 0,
														left: 0,
														height: "100%",
														width: "100%",
													}}
													allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
													allowFullScreen={true}
													title={title}
												/>
											</div>
										</div>
									);
								}
							}

							// For any unhandled node types, log them for debugging
							// TODO: Async logger needed
		// (await getLogger()).info("Unhandled node type:", { arg1: node.type, arg2: node });
							return null;
						})}
					</div>
				);
			}

			// If root exists but children is not an array, try to render the root directly
			// TODO: Async logger needed
		// (await getLogger()).info("Root exists but children is not an array:", { arg1: lexicalContent.root, arg2:  });
			return (
				<div className="payload-content">
					<p>
						{lexicalContent.root.text || JSON.stringify(lexicalContent.root)}
					</p>
				</div>
			);
		}
	} catch (error) {
		// TODO: Async logger needed
		// (await getLogger()).error("Error rendering Lexical content:", { data: error });
	}

	// Fallback for non-Lexical content
	// Note: Content trusted as it comes from Payload CMS admin
	return <div dangerouslySetInnerHTML={{ __html: String(content) }} />;
}
