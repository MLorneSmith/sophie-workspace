import "server-only";

import { LoopsClient } from "loops";
import { z } from "zod";

const LOOPS_API_KEY = z
	.string()
	.min(1, "LOOPS_API_KEY environment variable is required")
	.parse(process.env.LOOPS_API_KEY);

let client: LoopsClient | undefined;

export function getLoopsClient() {
	if (!client) {
		client = new LoopsClient(LOOPS_API_KEY);
	}

	return client;
}
