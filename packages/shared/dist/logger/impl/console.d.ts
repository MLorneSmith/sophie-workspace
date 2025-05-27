declare const Logger: {
    info: {
        (...data: any[]): void;
        (message?: any, ...optionalParams: any[]): void;
    };
    error: {
        (...data: any[]): void;
        (message?: any, ...optionalParams: any[]): void;
    };
    warn: {
        (...data: any[]): void;
        (message?: any, ...optionalParams: any[]): void;
    };
    debug: {
        (...data: any[]): void;
        (message?: any, ...optionalParams: any[]): void;
    };
    fatal: {
        (...data: any[]): void;
        (message?: any, ...optionalParams: any[]): void;
    };
};
export { Logger };
//# sourceMappingURL=console.d.ts.map