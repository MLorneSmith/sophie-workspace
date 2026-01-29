import withBundleAnalyzer from "@next/bundle-analyzer";
import { withPostHogConfig } from "@posthog/nextjs-config";

const IS_PRODUCTION = process.env.NODE_ENV === "production";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ENABLE_REACT_COMPILER = process.env.ENABLE_REACT_COMPILER === "true";

// PostHog source map uploads require credentials (CI/CD only)
const POSTHOG_SOURCEMAPS_ENABLED =
	IS_PRODUCTION &&
	Boolean(process.env.POSTHOG_PERSONAL_API_KEY) &&
	Boolean(process.env.POSTHOG_ENV_ID);

const INTERNAL_PACKAGES = [
	"@kit/ui",
	"@kit/auth",
	"@kit/accounts",
	"@kit/admin",
	"@kit/team-accounts",
	"@kit/shared",
	"@kit/supabase",
	"@kit/i18n",
	"@kit/mailers",
	"@kit/billing-gateway",
	"@kit/email-templates",
	"@kit/database-webhooks",
	"@kit/cms",
	"@kit/monitoring",
	"@kit/next",
	"@kit/notifications",
];

/** @type {import('next').NextConfig} */
const config = {
	reactStrictMode: true,
	// Required for PostHog reverse proxy to work correctly
	skipTrailingSlashRedirect: true,
	/** Enables hot reloading for local packages without a build step */
	transpilePackages: INTERNAL_PACKAGES,
	images: getImagesConfig(),
	logging: {
		fetches: {
			fullUrl: true,
		},
	},
	serverExternalPackages: ["pino", "pino-pretty", "thread-stream"],
	// Bundle OpenTelemetry instrumentation packages instead of externalizing
	webpack: (config, { isServer }) => {
		if (isServer) {
			config.externals = config.externals || [];
			// Ensure these packages are bundled, not externalized
			if (Array.isArray(config.externals)) {
				config.externals = config.externals.filter(
					(external) =>
						typeof external !== "string" ||
						(!external.includes("import-in-the-middle") &&
							!external.includes("require-in-the-middle")),
				);
			}
		}
		return config;
	},
	// needed for supporting dynamic imports for local content
	outputFileTracingIncludes: {
		"/*": ["./content/**/*"],
	},
	redirects: getRedirects,
	rewrites: getPostHogRewrites,
	turbopack: {
		resolveExtensions: [".ts", ".tsx", ".js", ".jsx"],
		resolveAlias: getModulesAliases(),
	},
	devIndicators:
		process.env.NEXT_PUBLIC_CI === "true"
			? false
			: {
					position: "bottom-left",
				},
	reactCompiler: ENABLE_REACT_COMPILER,
	experimental: {
		mdxRs: true,
		// DISABLED: turbopackFileSystemCacheForDev causes Turbopack panics in Next.js 16.0.7
		// See diagnosis #933 for details. Re-enable when Vercel fixes the upstream bug.
		turbopackFileSystemCacheForDev: false,
		optimizePackageImports: [
			"recharts",
			"lucide-react",
			"@radix-ui/react-icons",
			"@radix-ui/react-avatar",
			"@radix-ui/react-select",
			"date-fns",
			...INTERNAL_PACKAGES,
		],
	},
	modularizeImports: {
		lodash: {
			transform: "lodash/{{member}}",
		},
	},
	/** We already do linting and typechecking as separate tasks in CI */
	typescript: { ignoreBuildErrors: true },
};

const configWithBundleAnalyzer = withBundleAnalyzer({
	enabled: process.env.ANALYZE === "true",
})(config);

export default withPostHogConfig(configWithBundleAnalyzer, {
	personalApiKey: process.env.POSTHOG_PERSONAL_API_KEY,
	envId: process.env.POSTHOG_ENV_ID,
	host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
	sourcemaps: {
		enabled: POSTHOG_SOURCEMAPS_ENABLED,
		project: "slideheroes",
		deleteAfterUpload: true,
	},
});

/** @returns {import('next').NextConfig['images']} */
function getImagesConfig() {
	const remotePatterns = [];

	if (SUPABASE_URL) {
		const hostname = new URL(SUPABASE_URL).hostname;

		remotePatterns.push({
			protocol: "https",
			hostname,
		});
	}

	// Add media.slideheroes.com for course lesson thumbnail images
	remotePatterns.push({
		protocol: "https",
		hostname: "media.slideheroes.com",
	});

	if (IS_PRODUCTION) {
		return {
			remotePatterns,
			qualities: [75, 85],
		};
	}

	remotePatterns.push(
		...[
			{
				protocol: "http",
				hostname: "127.0.0.1",
			},
			{
				protocol: "http",
				hostname: "localhost",
			},
		],
	);

	return {
		remotePatterns,
		qualities: [75, 85],
	};
}

async function getRedirects() {
	return [
		{
			source: "/server-sitemap.xml",
			destination: "/sitemap.xml",
			permanent: true,
		},
	];
}

/**
 * PostHog reverse proxy rewrites to bypass ad blockers.
 * Routes /ingest/* requests to PostHog's EU ingestion servers.
 * @see https://posthog.com/docs/advanced/proxy/nextjs
 */
async function getPostHogRewrites() {
	return [
		{
			source: "/ingest/static/:path*",
			destination: "https://eu-assets.i.posthog.com/static/:path*",
		},
		{
			source: "/ingest/:path*",
			destination: "https://eu.i.posthog.com/:path*",
		},
		{
			source: "/ingest/decide",
			destination: "https://eu.i.posthog.com/decide",
		},
	];
}

/**
 * @description Aliases modules based on the environment variables
 * This will speed up the development server by not loading the modules that are not needed
 * @returns {Record<string, string>}
 */
function getModulesAliases() {
	if (process.env.NODE_ENV !== "development") {
		return {};
	}

	const monitoringProvider = process.env.NEXT_PUBLIC_MONITORING_PROVIDER;
	const billingProvider = process.env.NEXT_PUBLIC_BILLING_PROVIDER;
	const mailerProvider = process.env.MAILER_PROVIDER;
	const captchaProvider = process.env.NEXT_PUBLIC_CAPTCHA_SITE_KEY;

	// exclude the modules that are not needed
	const excludeSentry = monitoringProvider !== "sentry";
	const excludeStripe = billingProvider !== "stripe";
	const excludeNodemailer = mailerProvider !== "nodemailer";
	const excludeTurnstile = !captchaProvider;

	/** @type {Record<string, string>} */
	const aliases = {};

	// the path to the noop module
	const noopPath = "~/lib/dev-mock-modules";

	if (excludeSentry) {
		aliases["@sentry/nextjs"] = noopPath;
	}

	if (excludeStripe) {
		aliases.stripe = noopPath;
		aliases["@stripe/stripe-js"] = noopPath;
	}

	if (excludeNodemailer) {
		aliases.nodemailer = noopPath;
	}

	if (excludeTurnstile) {
		aliases["@marsidev/react-turnstile"] = noopPath;
	}

	return aliases;
}
