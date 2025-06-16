import { initializeServerI18n } from "@kit/i18n/server";

import { createServiceLogger } from "@kit/shared/logger";

// Initialize service logger
const { getLogger } = createServiceLogger("I18N");

export function initializeEmailI18n(params: {
	language: string | undefined;
	namespace: string;
}) {
	const language = params.language ?? "en";

	return initializeServerI18n(
		{
			supportedLngs: [language],
			lng: language,
			ns: params.namespace,
		},
		async (language, namespace) => {
			try {
				const data = await import(`../locales/${language}/${namespace}.json`);

				return data as Record<string, string>;
			} catch (error) {
				/* TODO: Async logger needed */ logger.info(`Error loading i18n file: locales/${language}/${namespace}.json`, { arg1: error, arg2:  });

				return {};
			}
		},
	);
}
