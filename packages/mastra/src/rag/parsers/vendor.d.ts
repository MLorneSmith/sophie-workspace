declare module "officeparser" {
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
