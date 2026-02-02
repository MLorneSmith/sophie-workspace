import { Toaster } from "@kit/ui/sonner";
import { headers } from "next/headers";

import { AgentationWrapper } from "~/components/agentation-wrapper";
import { RootProviders } from "~/components/root-providers";
import { getFontsClassName } from "~/lib/fonts";
import { createI18nServerInstance } from "~/lib/i18n/i18n.server";
import { generateRootMetadata } from "~/lib/root-metadata";
import { getRootTheme } from "~/lib/root-theme";

import "../styles/globals.css";

export const generateMetadata = () => {
	return generateRootMetadata();
};

export default async function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const { language } = await createI18nServerInstance();
	const theme = await getRootTheme();
	const className = getFontsClassName(theme);
	const nonce = await getCspNonce();

	return (
		<html lang={language} className={className}>
			<body>
				<RootProviders theme={theme} lang={language} nonce={nonce}>
					{children}
				</RootProviders>

				<Toaster theme={theme} position="bottom-right" />
				<AgentationWrapper />
			</body>
		</html>
	);
}

async function getCspNonce() {
	const headersStore = await headers();

	return headersStore.get("x-nonce") ?? undefined;
}
