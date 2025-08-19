import { env } from "cloudflare:workers";
import type { BrowserEndpoint } from "@cloudflare/playwright";
import { createMcpAgent } from "@cloudflare/playwright-mcp";

// Note: This package is built with wrangler, not tsc
// The cloudflare:workers import is resolved at runtime by Cloudflare
export const PlaywrightMCP = createMcpAgent(env.BROWSER as BrowserEndpoint);

export default PlaywrightMCP.mount("/sse");
