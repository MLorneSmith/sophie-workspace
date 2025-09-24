import { join } from "node:path";
import { cwd } from "node:process";

export const AUTH_STATES = {
	TEST_USER: join(cwd(), ".auth/test@slideheroes.com.json"),
	OWNER_USER: join(cwd(), ".auth/owner@slideheroes.com.json"),
	SUPER_ADMIN: join(cwd(), ".auth/super-admin@slideheroes.com.json"),
} as const;

export type AuthState = keyof typeof AUTH_STATES;
