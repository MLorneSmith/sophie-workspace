export type LogLevel = "debug" | "info" | "warn" | "error";
export interface LoggerConfig {
    enableLogging: boolean;
    logLevel: LogLevel;
    environment: string;
    serviceName: string;
}
export declare function getLogLevel(): LogLevel;
export declare function createEnvironmentLogger(serviceName: string): EnvironmentLogger;
export declare class EnvironmentLogger {
    private config;
    private levels;
    constructor(config: LoggerConfig);
    debug(message: string, data?: unknown): void;
    info(message: string, data?: unknown): void;
    warn(message: string, data?: unknown): void;
    error(message: string, data?: unknown): void;
    private log;
    private sanitizeData;
}
//# sourceMappingURL=environment-logger.d.ts.map