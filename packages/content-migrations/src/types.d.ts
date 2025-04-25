// Type declarations for third-party libraries and modules

// For drizzle-orm
declare module 'drizzle-orm' {
  export const sql: any;
  export type SQL = any;
}

// For @kit/shared/logger
declare module '@kit/shared/logger' {
  export const logger: {
    info: (
      context: Record<string, any>,
      message: string,
      ...args: any[]
    ) => void;
    error: (
      context: Record<string, any>,
      message: string,
      ...args: any[]
    ) => void;
    warn: (
      context: Record<string, any>,
      message: string,
      ...args: any[]
    ) => void;
  };
}
