declare module "officeparser" {
	// biome-ignore lint/complexity/noStaticOnlyClass: Third-party module type declaration matches actual API
	export class OfficeParser {
		static parseOffice(buffer: Buffer): Promise<{
			toText?: () => string;
			content?: unknown[];
			metadata?: Record<string, unknown>;
		}>;
	}
}

declare module "pdf.js-extract" {
	export class PDFExtract {
		extractBuffer(buffer: Buffer): Promise<{
			pages: unknown[];
		}>;
	}
}
