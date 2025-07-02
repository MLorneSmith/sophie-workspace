declare module "cloudflare:workers" {
	export interface Env {
		BROWSER: unknown; // Browser instance type from Cloudflare Workers
	}

	export const env: Env;
}
