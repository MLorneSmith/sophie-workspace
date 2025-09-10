import { vi } from "vitest";

export const revalidatePath = vi.fn();
export const revalidateTag = vi.fn();
export const unstable_cache = vi.fn(
	(fn: (...args: unknown[]) => unknown) => fn,
);
export const unstable_noStore = vi.fn();
