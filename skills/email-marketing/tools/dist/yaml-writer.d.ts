import type { ExportedEmail, ExportResult } from "./types.js";
/**
 * Options for YAML output formatting
 */
interface YamlWriterOptions {
    outputDir: string;
    includeEmptyAnnotations?: boolean;
}
/**
 * Write a single email to YAML file
 */
export declare function writeEmailToYaml(email: ExportedEmail, options: YamlWriterOptions): Promise<string>;
/**
 * Write multiple emails to YAML files
 */
export declare function writeEmailsToYaml(emails: ExportedEmail[], options: YamlWriterOptions, onProgress?: (current: number, total: number, filepath: string) => void): Promise<ExportResult>;
/**
 * Write export summary to file
 */
export declare function writeExportSummary(result: ExportResult, outputDir: string): Promise<void>;
export {};
//# sourceMappingURL=yaml-writer.d.ts.map