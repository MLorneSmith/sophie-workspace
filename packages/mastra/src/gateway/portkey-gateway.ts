/**
 * Portkey Gateway integration plan.
 *
 * Phase 3A establishes the Mastra foundation with native model routing.
 * Portkey integration (#503) will add a custom MastraModelGateway that
 * routes all LLM calls through Portkey's proxy for:
 * - Cost tracking and observability
 * - Provider fallbacks
 * - Virtual key management
 *
 * For now, agents use Mastra's native model format ("openai/gpt-4o")
 * which reads API keys from environment variables.
 *
 * TODO(#503): Implement PortkeyGateway extending MastraModelGateway
 */

export const PORTKEY_GATEWAY_URL = "https://api.portkey.ai/v1";
