import { join } from "node:path";
import { cwd } from "node:process";

export const AUTH_STATES = {
	TEST_USER: join(cwd(), ".auth/test1@slideheroes.com.json"),
	OWNER_USER: join(cwd(), ".auth/test2@slideheroes.com.json"),
	SUPER_ADMIN: join(cwd(), ".auth/michael@slideheroes.com.json"),
} as const;

export type AuthState = keyof typeof AUTH_STATES;
