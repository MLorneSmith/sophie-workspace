
import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@kit/shared/logger';

/**
 * API route to log frontend errors for monitoring
 */
export async function POST(request: NextRequest) {
  try {
    const errorData = await request.json();
    
    // Create logging context
    const ctx = {
      service: 'frontend',
      type: errorData.type || 'unknown',
      url: errorData.url || 'unknown',
      relationshipType: errorData.relationshipType || 'unknown',
    };
    
    // Log the error
    logger.error(ctx, `Frontend error: ${errorData.error}`, {
      stack: errorData.stack,
      componentStack: errorData.componentStack,
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error({ service: 'api' }, 'Error logging frontend error', { error });
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
