import type { InitOptions } from "i18next";

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
		missingInterpolationHandler: (_text, _value, _options) => {
			// TODO: Async logger needed
			// (await getLogger()).debug(`Missing interpolation value for key: ${_text}`, { value: _value, options: _options });
		},
		ns,
		react: {
			useSuspense: true,
		},
	};
}
