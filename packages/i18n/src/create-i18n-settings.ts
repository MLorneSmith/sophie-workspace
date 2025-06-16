import type { InitOptions } from "i18next";

import { createServiceLogger } from "@kit/shared/logger";

// Initialize service logger
const { getLogger } = createServiceLogger("CREATE_I18N_SETTINGS");

/**
 * Get i18n settings for i18next.
 * @param languages
 * @param language
 * @param namespaces
 */
export function createI18nSettings({
	languages,
	language,
	namespaces,
}: {
	languages: string[];
	language: string;
	namespaces?: string | string[];
}): InitOptions {
	const lng = language;
	const ns = namespaces;

	return {
		supportedLngs: languages,
		fallbackLng: languages[0],
		detection: undefined,
		lng,
		preload: false as const,
		lowerCaseLng: true as const,
		fallbackNS: ns,
		missingInterpolationHandler: (text, value, options) => {
			/* TODO: Async logger needed */ logger.debug(`Missing interpolation value for key: ${text}`, { arg1: value, arg2: options, arg3:  });
		},
		ns,
		react: {
			useSuspense: true,
		},
	};
}
