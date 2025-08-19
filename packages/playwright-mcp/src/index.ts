import { env } from "cloudflare:workers";
import type { BrowserEndpoint } from "@cloudflare/playwright";
import { createMcpAgent } from "@cloudflare/playwright-mcp";

export const PlaywrightMCP = createMcpAgent(env.BROWSER as BrowserEndpoint);

export default PlaywrightMCP.mount("/sse");
