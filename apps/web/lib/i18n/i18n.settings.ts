import { createI18nSettings } from "@kit/i18n";
import { createServiceLogger } from "@kit/shared/logger";

const { getLogger } = createServiceLogger("I18N-SETTINGS");

/**
 * The default language of the application.
 * This is used as a fallback language when the selected language is not supported.
 *
 */
const defaultLanguage = process.env.NEXT_PUBLIC_DEFAULT_LOCALE ?? "en";

/**
 * The list of supported languages.
 * By default, only the default language is supported.
 * Add more languages here if needed.
 */
export const languages: string[] = [defaultLanguage];

/**
 * The name of the cookie that stores the selected language.
 */
export const I18N_COOKIE_NAME = "lang";

/**
 * The default array of Internationalization (i18n) namespaces.
 * These namespaces are commonly used in the application for translation purposes.
 *
 * Add your own namespaces here
 **/
export const defaultI18nNamespaces = [
	"common",
	"auth",
	"account",
	"teams",
	"billing",
	"marketing",
	"testimonials",
	"kanban",
	"assessment",
	"editor",
];

/**
 * Get the i18n settings for the given language and namespaces.
 * If the language is not supported, it will fall back to the default language.
 * @param language
 * @param ns
 */
export function getI18nSettings(
	language: string | undefined,
	ns: string | string[] = defaultI18nNamespaces,
) {
	let lng = language ?? defaultLanguage;

	if (!languages.includes(lng)) {
		// Log warning asynchronously without blocking in client context
		if (typeof window === "undefined") {
			// Server-side: use async logger
			Promise.resolve(getLogger())
				.then((logger) => {
					logger.warn(
						"Unsupported language requested, falling back to default",
						{
							operation: "get_i18n_settings",
							requestedLanguage: lng,
							defaultLanguage,
							supportedLanguages: languages,
						},
					);
				})
				.catch(() => {
					// Silent fail for logging
				});
		} else {
			// Log unsupported language fallback
			getLogger().warn(
				"Unsupported language requested, falling back to default",
				{
					requestedLanguage: lng,
					defaultLanguage,
					supportedLanguages: languages,
				},
			);
		}

		lng = defaultLanguage;
	}

	return createI18nSettings({
		language: lng,
		namespaces: ns,
		languages,
	});
}
