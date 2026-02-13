export type DailyMessageCategory =
	| "holiday"
	| "factoid"
	| "national-day"
	| "history"
	| "seasonal";

export interface DailyMessage {
	text: string;
	emoji?: string;
	category: DailyMessageCategory;
	/** ISO 3166-1 alpha-2 country codes. Omit for universal messages. */
	locales?: string[];
}
