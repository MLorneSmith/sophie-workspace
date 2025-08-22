import withBundleAnalyzer from "@next/bundle-analyzer";

const IS_PRODUCTION = process.env.NODE_ENV === "production";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ENABLE_REACT_COMPILER = process.env.ENABLE_REACT_COMPILER === "true";

// New Relic configuration - conditionally load based on environment
let nrExternals;

// Skip NewRelic in test environments to avoid compilation errors
const isTestEnvironment = process.env.NODE_ENV === "test" || process.env.CI === "true";

if (!isTestEnvironment) {
	try {
		nrExternals = require("newrelic/load-externals");
	} catch (_err) {
		// New Relic not available (e.g., in build without agent)
		nrExternals = () => {};
	}
} else {
	// In test environments, use noop function to avoid loading NewRelic
	nrExternals = () => {};
}

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
	/** Enables hot reloading for local packages without a build step */
	transpilePackages: INTERNAL_PACKAGES,
	images: {
		remotePatterns: [
			...getRemotePatterns(),
			{
				protocol: "https",
				hostname: "*.supabase.co",
			},
			{
				protocol: "https",
				hostname: "*.r2.cloudflarestorage.com",
			},
			{
				protocol: "https",
				hostname: "images.slideheroes.com",
			},
		],
	},
	logging: {
		fetches: {
			fullUrl: true,
		},
	},
	serverExternalPackages: isTestEnvironment ? [] : ["newrelic"],
	webpack: (config) => {
		// Configure New Relic externals for proper agent loading
		nrExternals(config);
		return config;
	},
	// needed for supporting dynamic imports for local content
	outputFileTracingIncludes: {
		"/*": ["./content/**/*"],
	},
	redirects: getRedirects,
	turbopack: {
		resolveExtensions: [".ts", ".tsx", ".js", ".jsx"],
		resolveAlias: getModulesAliases(),
	},
	devIndicators: {
		position: "bottom-right",
	},
	experimental: {
		mdxRs: true,
		reactCompiler: ENABLE_REACT_COMPILER,
		clientSegmentCache: true,
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
	eslint: { ignoreDuringBuilds: true },
	typescript: { ignoreBuildErrors: true },
	skipTrailingSlashRedirect: true,
	async rewrites() {
		// NOTE: change `eu` to `us` if applicable
		return [
			{
				source: "/ingest/static/:path*",
				destination: "https://eu-assets.i.posthog.com/static/:path*",
			},
			{
				source: "/ingest/:path*",
				destination: "https://eu.i.posthog.com/:path*",
			},
		];
	},
	async headers() {
		return [
			{
				// Apply security headers to all routes
				source: "/:path*",
				headers: [
					{
						key: "X-Frame-Options",
						value: "DENY",
					},
					{
						key: "X-Content-Type-Options",
						value: "nosniff",
					},
				],
			},
		];
	},
};

export default withBundleAnalyzer({
	enabled: process.env.ANALYZE === "true",
})(config);

function getRemotePatterns() {
	if (!SUPABASE_URL) {
		return [];
	}

	const { hostname } = new URL(SUPABASE_URL);

	return [
		{
			protocol: "https",
			hostname,
		},
	];
}

async function getRedirects() {
	// Add your redirects here
	return [];
}

function getModulesAliases() {
	if (!IS_PRODUCTION) {
		return {
			"@kit/ui": {
				"@kit/ui/*": "../../../packages/ui/src/*",
			},
			"@kit/shared": {
				"@kit/shared/*": "../../../packages/shared/src/*",
			},
			"@kit/cms": {
				"@kit/cms/*": "../../../packages/cms/src/*",
			},
			"@kit/auth": {
				"@kit/auth/*": "../../../packages/features/auth/src/*",
			},
			"@kit/admin": {
				"@kit/admin/*": "../../../packages/features/admin/src/*",
			},
			"@kit/accounts": {
				"@kit/accounts/*": "../../../packages/features/accounts/src/*",
			},
			"@kit/team-accounts": {
				"@kit/team-accounts/*":
					"../../../packages/features/team-accounts/src/*",
			},
			"@kit/notifications": {
				"@kit/notifications/*":
					"../../../packages/features/notifications/src/*",
			},
			"@kit/billing-gateway": {
				"@kit/billing-gateway/*": "../../../packages/billing/gateway/src/*",
			},
			"@kit/database-webhooks": {
				"@kit/database-webhooks/*": "../../../packages/database-webhooks/src/*",
			},
			"@kit/email-templates": {
				"@kit/email-templates/*": "../../../packages/email-templates/src/*",
			},
			"@kit/supabase": {
				"@kit/supabase/*": "../../../packages/supabase/src/*",
			},
			"@kit/mailers": {
				"@kit/mailers/*": "../../../packages/mailers/src/*",
			},
			"@kit/i18n": {
				"@kit/i18n/*": "../../../packages/i18n/src/*",
			},
			"@kit/monitoring": {
				"@kit/monitoring/*": "../../../packages/monitoring/src/*",
			},
			"@kit/next": {
				"@kit/next/*": "../../../packages/next/src/*",
			},
		};
	}

	return {};
}
