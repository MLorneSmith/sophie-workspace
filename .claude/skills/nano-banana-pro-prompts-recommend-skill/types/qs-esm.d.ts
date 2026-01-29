declare module "qs-esm" {
	export interface StringifyOptions {
		addQueryPrefix?: boolean;
	}
	export function stringify(obj: object, options?: StringifyOptions): string;
}
