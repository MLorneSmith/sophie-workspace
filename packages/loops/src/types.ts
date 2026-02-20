import type { z } from "zod";

import type {
	LoopsEventSchema,
	TransactionalEmailSchema,
} from "./schemas/loops.schema";

export type TransactionalEmailParams = z.infer<typeof TransactionalEmailSchema>;

export type LoopsEventParams = z.infer<typeof LoopsEventSchema>;

export interface LoopsServiceResult {
	success: boolean;
	error?: string;
}
