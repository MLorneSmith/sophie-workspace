import { DAILY_MESSAGES, FALLBACK_MESSAGES } from "../data/daily-messages";
import type { DailyMessage } from "../types/daily-message.types";
import { getLocalDateKey } from "./detect-country";

/** djb2-style string hash → non-negative integer. */
function hashString(str: string): number {
	let hash = 5381;
	for (let i = 0; i < str.length; i++) {
		hash = (hash << 5) + hash + str.charCodeAt(i);
		hash = hash & hash; // convert to 32-bit int
	}
	return Math.abs(hash);
}

/**
 * Pick the best message for today from a list of entries,
 * preferring a locale-specific match, then universal, then first available.
 */
function pickForLocale(
	entries: DailyMessage[],
	countryCode: string,
): DailyMessage {
	// Prefer locale-specific match
	const localeMatch = entries.find((e) => e.locales?.includes(countryCode));
	if (localeMatch) return localeMatch;

	// Fall back to universal entry (no locales field)
	const universal = entries.find((e) => !e.locales);
	if (universal) return universal;

	// All entries are locale-specific and none match — use first
	return entries[0]!;
}

/**
 * Get today's daily message based on the current date and user's country.
 * Deterministic: same date + country always returns the same message.
 */
export function getDailyMessage(countryCode: string): DailyMessage {
	const dateKey = getLocalDateKey();
	const entries = DAILY_MESSAGES[dateKey];

	if (entries && entries.length > 0) {
		return pickForLocale(entries, countryCode);
	}

	// No date-specific entry — pick from fallback pool deterministically
	const now = new Date();
	const fullDate = `${now.getFullYear()}-${dateKey}`;
	const index = hashString(fullDate) % FALLBACK_MESSAGES.length;
	return FALLBACK_MESSAGES[index]!;
}
