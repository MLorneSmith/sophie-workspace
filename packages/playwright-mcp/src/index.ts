import { env } from "cloudflare:workers";
import { createMcpAgent } from "@cloudflare/playwright-mcp";

// Type import from @cloudflare/playwright causes build issues in CI
// Using any for now as the runtime behavior is correct
// biome-ignore lint/suspicious/noExplicitAny: Temporary workaround for CI build issues
export const PlaywrightMCP = createMcpAgent(env.BROWSER as any);

export default PlaywrightMCP.mount("/sse");
