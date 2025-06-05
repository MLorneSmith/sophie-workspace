import type { Logger } from "./logger";
/**
 * @name getLogger
 * @description Retrieves the logger implementation based on the LOGGER environment variable using the registry API.
 */
export declare function getLogger(): Promise<Logger>;
export type { Logger };
export {
	createEnvironmentLogger,
	EnvironmentLogger,
	getLogLevel,
	type LoggerConfig,
	type LogLevel,
} from "./utils/environment-logger";
//# sourceMappingURL=index.d.ts.map
