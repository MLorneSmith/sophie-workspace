import { TemplateTagProcessor, containsTemplateTags, } from "./template-tag-processor";
// Enable detailed logging in development environment
const DEBUG = process.env.NODE_ENV === "development";
// Helper logging function
function debugLog(...args) {
    if (DEBUG) {
        console.log("[PayloadContentRenderer]", ...args);
    }
}
// Helper function to find HTML content in various locations
function findHtmlContent(node) {
    var _a, _b, _c, _d;
    // Check all possible locations where HTML content might be stored
    if (node.htmlContent)
        return node.htmlContent;
    if (node.html)
        return node.html;
    if ((_a = node.data) === null || _a === void 0 ? void 0 : _a.htmlContent)
        return node.data.htmlContent;
    if ((_b = node.data) === null || _b === void 0 ? void 0 : _b.html)
        return node.data.html;
    if (typeof node.toHTML === "function")
        return node.toHTML();
    if ((_c = node.fields) === null || _c === void 0 ? void 0 : _c.htmlContent)
        return node.fields.htmlContent;
    if ((_d = node.fields) === null || _d === void 0 ? void 0 : _d.html)
        return node.fields.html;
    return null;
}
// Function to render Lexical content
export function PayloadContentRenderer({ content }) {
    // If content is null or undefined, return null
    if (!content) {
        if (DEBUG)
            debugLog("Received null or undefined content");
        return null;
    }
    // For string content, check if it contains template tags
    if (typeof content === "string") {
        if (containsTemplateTags(content)) {
            if (DEBUG)
                debugLog("Content contains template tags, using TemplateTagProcessor");
            return <TemplateTagProcessor content={content}/>;
        }
        if (DEBUG)
            debugLog("Content is string but has no template tags, rendering as HTML");
        return <div dangerouslySetInnerHTML={{ __html: content }}/>;
    }
    // Log content type for debugging
    if (DEBUG) {
        if (content && typeof content === "object") {
            if (content.root) {
                debugLog("Content appears to be Lexical format");
            }
            else {
                debugLog("Content is an object but not Lexical format:", Object.keys(content));
            }
        }
    }
    // For Lexical content, extract the text and render it
    try {
        const lexicalContent = content;
        // Check if lexicalContent.root exists
        if (lexicalContent.root) {
            // If children exists and is an array, render each child
            if (Array.isArray(lexicalContent.root.children)) {
                return (<div className="payload-content">
						{lexicalContent.root.children.map((node, i) => {
                        var _a, _b, _c, _d, _e, _f, _g;
                        // Handle custom blocks
                        // Check for Call To Action block
                        if (node.type === "custom-call-to-action" ||
                            (node.fields &&
                                node.fields.blockType === "custom-call-to-action") ||
                            node.blockType === "custom-call-to-action") {
                            console.log("Found Call To Action block:", node);
                            // Try to extract the HTML content from various locations
                            const htmlContent = findHtmlContent(node);
                            if (htmlContent) {
                                console.log("Using HTML content for Call To Action:", `${htmlContent.substring(0, 100)}...`);
                                return (<div key={i} dangerouslySetInnerHTML={{ __html: htmlContent }}/>);
                            }
                            // Fallback rendering for Call To Action block
                            return (<div key={i} className="my-6 rounded-md border border-blue-200 bg-blue-50 p-4">
										<h3 className="text-lg font-bold text-blue-700">
											Call To Action
										</h3>
										<p className="mt-2 text-blue-600">
											{node.headline ||
                                    node.text ||
                                    node.content ||
                                    "Call to action content"}
										</p>
										{node.buttonText && (<button className="mt-4 rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600">
												{node.buttonText}
											</button>)}
									</div>);
                        }
                        // Check for Test Block
                        if (node.type === "test-block" ||
                            (node.fields && node.fields.blockType === "test-block") ||
                            node.blockType === "test-block") {
                            console.log("Found Test Block:", node);
                            // Try to extract the HTML content from various locations
                            const htmlContent = findHtmlContent(node);
                            if (htmlContent) {
                                console.log("Using HTML content for Test Block:", `${htmlContent.substring(0, 100)}...`);
                                return (<div key={i} dangerouslySetInnerHTML={{ __html: htmlContent }}/>);
                            }
                            // Fallback rendering for Test Block
                            return (<div key={i} className="my-6 rounded-md border border-blue-100 bg-blue-50 p-4">
										<h3 className="text-lg font-bold text-blue-700">
											Test Block
										</h3>
										<p className="mt-2 text-blue-600">
											{node.text || node.content || "Test block content"}
										</p>
									</div>);
                        }
                        // Check for Bunny Video block
                        if (node.type === "bunny-video" ||
                            (node.fields && node.fields.blockType === "bunny-video") ||
                            node.blockType === "bunny-video") {
                            console.log("Found Bunny Video block:", node);
                            // Try to extract the HTML content from various locations
                            const htmlContent = findHtmlContent(node);
                            if (htmlContent) {
                                console.log("Using HTML content for Bunny Video:", `${htmlContent.substring(0, 100)}...`);
                                return (<div key={i} dangerouslySetInnerHTML={{ __html: htmlContent }}/>);
                            }
                            // Extract video data with defaults
                            const videoId = node.videoId || ((_a = node.fields) === null || _a === void 0 ? void 0 : _a.videoId) || "";
                            const libraryId = node.libraryId || ((_b = node.fields) === null || _b === void 0 ? void 0 : _b.libraryId) || "1234";
                            const title = node.title || ((_c = node.fields) === null || _c === void 0 ? void 0 : _c.title) || "Video";
                            const aspectRatio = node.aspectRatio || ((_d = node.fields) === null || _d === void 0 ? void 0 : _d.aspectRatio) || "16:9";
                            // Calculate padding based on aspect ratio
                            const getPaddingBottom = () => {
                                if (aspectRatio === "16:9")
                                    return "56.25%"; // 9/16 = 0.5625 = 56.25%
                                if (aspectRatio === "4:3")
                                    return "75%"; // 3/4 = 0.75 = 75%
                                if (aspectRatio === "1:1")
                                    return "100%"; // Square
                                return "56.25%"; // Default to 16:9
                            };
                            // If no videoId is provided, show a placeholder
                            if (!videoId) {
                                return (<div key={i} className="my-6 rounded-md border border-gray-200 bg-gray-50 p-4">
											<h3 className="text-lg font-bold text-gray-700">
												{title}
											</h3>
											<div className="flex items-center justify-center rounded bg-gray-100 p-8">
												<p className="text-gray-500">
													Bunny.net Video (ID not provided)
												</p>
											</div>
										</div>);
                            }
                            // Render the Bunny.net video player
                            return (<div key={i} className="my-6">
										<h3 className="mb-2 text-lg font-bold">{title}</h3>
										<div className="relative" style={{ paddingBottom: getPaddingBottom() }}>
											<iframe src={`https://iframe.mediadelivery.net/embed/${libraryId}/${videoId}`} loading="lazy" style={{
                                    border: "none",
                                    position: "absolute",
                                    top: 0,
                                    left: 0,
                                    height: "100%",
                                    width: "100%",
                                }} allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;" allowFullScreen={true} title={title}/>
										</div>
									</div>);
                        }
                        // Check for YouTube Video block
                        if (node.type === "youtube-video" ||
                            (node.fields && node.fields.blockType === "youtube-video") ||
                            node.blockType === "youtube-video") {
                            console.log("Found YouTube Video block:", node);
                            // Try to extract the HTML content from various locations
                            const htmlContent = findHtmlContent(node);
                            if (htmlContent) {
                                console.log("Using HTML content for YouTube Video:", `${htmlContent.substring(0, 100)}...`);
                                return (<div key={i} dangerouslySetInnerHTML={{ __html: htmlContent }}/>);
                            }
                            // Helper function to extract YouTube ID from URL or ID
                            const extractYouTubeId = (input) => {
                                // Return if input is empty
                                if (!input)
                                    return "";
                                // Regular expression to match YouTube video ID from various URL formats
                                const regExp = /^.*(?:(?:youtu\.be\/|v\/|vi\/|u\/\w\/|embed\/|shorts\/)|(?:(?:watch)?\?v(?:i)?=|\&v(?:i)?=))([^#\&\?]*).*/;
                                const match = input.match(regExp);
                                if (match === null || match === void 0 ? void 0 : match[1]) {
                                    // If it's a URL, return the extracted ID
                                    return match[1];
                                }
                                // If it's not a URL, assume it's already an ID
                                return input;
                            };
                            // Extract video data with defaults
                            const rawVideoId = node.videoId || ((_e = node.fields) === null || _e === void 0 ? void 0 : _e.videoId) || "";
                            const youtubeId = extractYouTubeId(rawVideoId);
                            const title = node.title || ((_f = node.fields) === null || _f === void 0 ? void 0 : _f.title) || "YouTube Video";
                            const aspectRatio = node.aspectRatio || ((_g = node.fields) === null || _g === void 0 ? void 0 : _g.aspectRatio) || "16:9";
                            // Calculate padding based on aspect ratio
                            const getPaddingBottom = () => {
                                if (aspectRatio === "16:9")
                                    return "56.25%"; // 9/16 = 0.5625 = 56.25%
                                if (aspectRatio === "4:3")
                                    return "75%"; // 3/4 = 0.75 = 75%
                                if (aspectRatio === "1:1")
                                    return "100%"; // Square
                                return "56.25%"; // Default to 16:9
                            };
                            // If no videoId is provided, show a placeholder
                            if (!youtubeId) {
                                return (<div key={i} className="my-6 rounded-md border border-gray-200 bg-gray-50 p-4">
											<h3 className="text-lg font-bold text-gray-700">
												{title}
											</h3>
											<div className="flex items-center justify-center rounded bg-gray-100 p-8">
												<p className="text-gray-500">
													YouTube Video (ID not provided)
												</p>
											</div>
										</div>);
                            }
                            // Render the YouTube video player
                            return (<div key={i} className="my-6">
										<h3 className="mb-2 text-lg font-bold">{title}</h3>
										<div className="relative" style={{ paddingBottom: getPaddingBottom() }}>
											<iframe src={`https://www.youtube.com/embed/${youtubeId}`} loading="lazy" style={{
                                    border: "none",
                                    position: "absolute",
                                    top: 0,
                                    left: 0,
                                    height: "100%",
                                    width: "100%",
                                }} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen={true} title={title}/>
										</div>
									</div>);
                        }
                        // Handle standard node types
                        if (node.type === "paragraph") {
                            // Check if node.children exists and is an array
                            if (Array.isArray(node.children)) {
                                return (<p key={i}>
											{node.children.map((textNode, j) => (<span key={j}>{textNode.text || ""}</span>))}
										</p>);
                            }
                            // Fallback for when children is not an array
                            return <p key={i}>{node.text || ""}</p>;
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
                                        return <h1 key={i}>{node.text || ""}</h1>;
                                    case "h2":
                                        return <h2 key={i}>{node.text || ""}</h2>;
                                    case "h3":
                                        return <h3 key={i}>{node.text || ""}</h3>;
                                    case "h4":
                                        return <h4 key={i}>{node.text || ""}</h4>;
                                    case "h5":
                                        return <h5 key={i}>{node.text || ""}</h5>;
                                    case "h6":
                                        return <h6 key={i}>{node.text || ""}</h6>;
                                    default:
                                        return <h2 key={i}>{node.text || ""}</h2>;
                                }
                            }
                            // Render the appropriate heading with children
                            const headingContent = node.children.map((textNode, j) => (<span key={j}>{textNode.text || ""}</span>));
                            switch (tag) {
                                case "h1":
                                    return <h1 key={i}>{headingContent}</h1>;
                                case "h2":
                                    return <h2 key={i}>{headingContent}</h2>;
                                case "h3":
                                    return <h3 key={i}>{headingContent}</h3>;
                                case "h4":
                                    return <h4 key={i}>{headingContent}</h4>;
                                case "h5":
                                    return <h5 key={i}>{headingContent}</h5>;
                                case "h6":
                                    return <h6 key={i}>{headingContent}</h6>;
                                default:
                                    return <h2 key={i}>{headingContent}</h2>;
                            }
                        }
                        // Handle block type nodes
                        if (node.type === "block") {
                            console.log("Found block type node:", node);
                            // Check for Call To Action block in fields
                            if (node.fields && node.fields.blockType === "call-to-action") {
                                console.log("Found Call To Action block in fields:", node.fields);
                                return (<div key={i} className="my-6 rounded-md border border-blue-200 bg-blue-50 p-4">
											<h3 className="text-lg font-bold text-blue-700">
												{node.fields.headline || "Call To Action"}
											</h3>
											<p className="mt-2 text-blue-600">
												{node.fields.subheadline ||
                                        node.fields.text ||
                                        node.fields.content ||
                                        "Call to action content"}
											</p>
											<div className="mt-4 flex flex-wrap gap-4">
												{node.fields.leftButtonLabel && (<a href={node.fields.leftButtonUrl || "#"} className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600">
														{node.fields.leftButtonLabel}
													</a>)}
												{node.fields.rightButtonLabel && (<a href={node.fields.rightButtonUrl || "#"} className="rounded border border-blue-500 bg-white px-4 py-2 text-blue-500 hover:bg-blue-50">
														{node.fields.rightButtonLabel}
													</a>)}
											</div>
										</div>);
                            }
                            // Check for Test Block in fields
                            if (node.fields && node.fields.blockType === "test-block") {
                                console.log("Found Test Block in fields:", node.fields);
                                return (<div key={i} className="my-6 rounded-md border border-blue-100 bg-blue-50 p-4">
											<h3 className="text-lg font-bold text-blue-700">
												{node.fields.headline || "Test Block"}
											</h3>
											<p className="mt-2 text-blue-600">
												{node.fields.text ||
                                        node.fields.content ||
                                        "Test block content"}
											</p>
										</div>);
                            }
                            // Check for Bunny Video block in fields
                            if (node.fields && node.fields.blockType === "bunny-video") {
                                console.log("Found Bunny Video block in fields:", node.fields);
                                // Extract video data with defaults
                                const videoId = node.fields.videoId || "";
                                const libraryId = node.fields.libraryId || "1234";
                                const title = node.fields.title || "Video";
                                const aspectRatio = node.fields.aspectRatio || "16:9";
                                // Calculate padding based on aspect ratio
                                const getPaddingBottom = () => {
                                    if (aspectRatio === "16:9")
                                        return "56.25%"; // 9/16 = 0.5625 = 56.25%
                                    if (aspectRatio === "4:3")
                                        return "75%"; // 3/4 = 0.75 = 75%
                                    if (aspectRatio === "1:1")
                                        return "100%"; // Square
                                    return "56.25%"; // Default to 16:9
                                };
                                // If no videoId is provided, show a placeholder
                                if (!videoId) {
                                    return (<div key={i} className="my-6 rounded-md border border-gray-200 bg-gray-50 p-4">
												<h3 className="text-lg font-bold text-gray-700">
													{title}
												</h3>
												<div className="flex items-center justify-center rounded bg-gray-100 p-8">
													<p className="text-gray-500">
														Bunny.net Video (ID not provided)
													</p>
												</div>
											</div>);
                                }
                                // Render the Bunny.net video player
                                return (<div key={i} className="my-6">
											<h3 className="mb-2 text-lg font-bold">{title}</h3>
											<div className="relative" style={{ paddingBottom: getPaddingBottom() }}>
												<iframe src={`https://iframe.mediadelivery.net/embed/${libraryId}/${videoId}`} loading="lazy" style={{
                                        border: "none",
                                        position: "absolute",
                                        top: 0,
                                        left: 0,
                                        height: "100%",
                                        width: "100%",
                                    }} allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;" allowFullScreen={true} title={title}/>
											</div>
										</div>);
                            }
                            // Check for YouTube Video block in fields
                            if (node.fields && node.fields.blockType === "youtube-video") {
                                console.log("Found YouTube Video block in fields:", node.fields);
                                // Helper function to extract YouTube ID from URL or ID
                                const extractYouTubeId = (input) => {
                                    // Return if input is empty
                                    if (!input)
                                        return "";
                                    // Regular expression to match YouTube video ID from various URL formats
                                    const regExp = /^.*(?:(?:youtu\.be\/|v\/|vi\/|u\/\w\/|embed\/|shorts\/)|(?:(?:watch)?\?v(?:i)?=|\&v(?:i)?=))([^#\&\?]*).*/;
                                    const match = input.match(regExp);
                                    if (match === null || match === void 0 ? void 0 : match[1]) {
                                        // If it's a URL, return the extracted ID
                                        return match[1];
                                    }
                                    // If it's not a URL, assume it's already an ID
                                    return input;
                                };
                                // Extract video data with defaults
                                const rawVideoId = node.fields.videoId || "";
                                const youtubeId = extractYouTubeId(rawVideoId);
                                const title = node.fields.title || "YouTube Video";
                                const aspectRatio = node.fields.aspectRatio || "16:9";
                                // Calculate padding based on aspect ratio
                                const getPaddingBottom = () => {
                                    if (aspectRatio === "16:9")
                                        return "56.25%"; // 9/16 = 0.5625 = 56.25%
                                    if (aspectRatio === "4:3")
                                        return "75%"; // 3/4 = 0.75 = 75%
                                    if (aspectRatio === "1:1")
                                        return "100%"; // Square
                                    return "56.25%"; // Default to 16:9
                                };
                                // If no videoId is provided, show a placeholder
                                if (!youtubeId) {
                                    return (<div key={i} className="my-6 rounded-md border border-gray-200 bg-gray-50 p-4">
												<h3 className="text-lg font-bold text-gray-700">
													{title}
												</h3>
												<div className="flex items-center justify-center rounded bg-gray-100 p-8">
													<p className="text-gray-500">
														YouTube Video (ID not provided)
													</p>
												</div>
											</div>);
                                }
                                // Render the YouTube video player
                                return (<div key={i} className="my-6">
											<h3 className="mb-2 text-lg font-bold">{title}</h3>
											<div className="relative" style={{ paddingBottom: getPaddingBottom() }}>
												<iframe src={`https://www.youtube.com/embed/${youtubeId}`} loading="lazy" style={{
                                        border: "none",
                                        position: "absolute",
                                        top: 0,
                                        left: 0,
                                        height: "100%",
                                        width: "100%",
                                    }} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen={true} title={title}/>
											</div>
										</div>);
                            }
                        }
                        // For any unhandled node types, log them for debugging
                        console.log("Unhandled node type:", node.type, node);
                        return null;
                    })}
					</div>);
            }
            // If root exists but children is not an array, try to render the root directly
            console.log("Root exists but children is not an array:", lexicalContent.root);
            return (<div className="payload-content">
					<p>
						{lexicalContent.root.text || JSON.stringify(lexicalContent.root)}
					</p>
				</div>);
        }
    }
    catch (error) {
        console.error("Error rendering Lexical content:", error);
    }
    // Fallback for non-Lexical content
    return <div dangerouslySetInnerHTML={{ __html: String(content) }}/>;
}
