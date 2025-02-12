'use server';

import { cookies } from 'next/headers';

const CANVAS_ID_COOKIE = 'canvas_id';

/**
 * Server action to set the canvas ID cookie
 */
export async function setCanvasIdCookie(canvasId: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set({
    name: CANVAS_ID_COOKIE,
    value: canvasId,
    path: '/',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 7, // 1 week
  });
}
