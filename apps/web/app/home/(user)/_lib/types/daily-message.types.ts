export type DailyMessageCategory =
	| "holiday"
	| "factoid"
	| "national-day"
	| "history"
	| "seasonal"
	| "pop-culture"
	| "shower-thought"
	| "plot-twist";

export interface DailyMessage {
	text: string;
	emoji?: string;
	category: DailyMessageCategory;
	/** ISO 3166-1 alpha-2 country codes. Omit for universal messages. */
	locales?: string[];
}
