/**
 * Enhanced API Route for Payload CMS with Request Deduplication
 * 
 * This file replaces the auto-generated Payload API route with enhanced functionality:
 * - Request deduplication to prevent form submission loops
 * - Comprehensive error handling and logging
 * - Performance metrics and monitoring
 * - Maintains full compatibility with Payload CMS
 * 
 * To enable, rename this file to 'route.ts' and backup the original
 */

import config from '@payload-config'
import '@payloadcms/next/css'
import { createEnhancedPayloadHandlers } from '../../../../lib/enhanced-api-wrapper'

// Create enhanced handlers with deduplication and logging
const enhancedHandlers = createEnhancedPayloadHandlers(config)

// Export the enhanced handlers
export const GET = enhancedHandlers.GET
export const POST = enhancedHandlers.POST
export const DELETE = enhancedHandlers.DELETE
export const PATCH = enhancedHandlers.PATCH
export const PUT = enhancedHandlers.PUT
export const OPTIONS = enhancedHandlers.OPTIONS