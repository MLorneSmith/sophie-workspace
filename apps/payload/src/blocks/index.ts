/**
 * Centralized exports for all block components
 *
 * This file directly imports block configurations from their config files
 * to ensure proper structure for the Lexical editor's BlocksFeature.
 */

// Import directly from config files to bypass any export transformation issues
import { BunnyVideo } from './BunnyVideo/config'
import { CallToAction } from './CallToAction/config'
import { DebugBlock } from './DebugBlock/config'
import { TestBlock } from './TestBlock/config'
import { YouTubeVideo } from './YouTubeVideo/config'

// Export all block components for easy import in collection files
export { BunnyVideo, CallToAction, DebugBlock, TestBlock, YouTubeVideo }

// Export a default array of all blocks for global configuration
export const allBlocks = [BunnyVideo, CallToAction, DebugBlock, TestBlock, YouTubeVideo]

export default allBlocks
