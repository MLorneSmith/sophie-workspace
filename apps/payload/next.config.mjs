import { withPayload } from "@payloadcms/next/withPayload";

/** @type {import('next').NextConfig} */
const nextConfig = {
	// Your Next.js config here
	// Next.js 16 uses Turbopack by default - add empty config to acknowledge
	turbopack: {},
	typescript: {
		// Warning: This allows production builds to successfully complete even if
		// your project has type errors.
		ignoreBuildErrors: process.env.NODE_ENV === "production",
	},
	// Exclude esbuild and drizzle-kit from bundling (they use native binaries)
	serverExternalPackages: ["esbuild", "drizzle-kit"],
};

export default withPayload(nextConfig, {
	devBundleServerPackages: false,
});
