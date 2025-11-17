/**
 * Mock implementation for next/cache
 * Used during testing to handle server-only Next.js modules
 */

import { vi } from "vitest";

export const revalidatePath = vi.fn();
export const revalidateTag = vi.fn();
export const unstable_cache = vi.fn();
