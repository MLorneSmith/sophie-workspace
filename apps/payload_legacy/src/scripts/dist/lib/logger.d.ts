/**
 * Simple logger utility for consistent logging across scripts
 */
export declare enum LogLevel {
    DEBUG = 0,
    INFO = 1,
    WARN = 2,
    ERROR = 3
}
export declare function setLogLevel(level: LogLevel): void;
export declare const logger: {
    debug: (message: string, ...args: any[]) => void;
    info: (message: string, ...args: any[]) => void;
    warn: (message: string, ...args: any[]) => void;
    error: (message: string, ...args: any[]) => void;
    section: (title: string) => void;
    success: (message: string, ...args: any[]) => void;
};
