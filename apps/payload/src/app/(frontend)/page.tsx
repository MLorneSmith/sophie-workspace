import { fileURLToPath } from "node:url";
import config from "@payload-config";
import { headers as getHeaders } from "next/headers.js";
import Image from "next/image";
import { getPayload } from "payload";
import "./styles.css";

import { createServiceLogger } from "@kit/shared/logger";

// Initialize service logger
const { getLogger } = createServiceLogger("PAGE");

export default async function HomePage() {
	const headers = await getHeaders();

	try {
		// Initialize payload with config
		const payload = await getPayload({ config });
		const { user } = await payload.auth({ headers });

		const fileURL = `vscode://file/${fileURLToPath(import.meta.url)}`;

		// Get admin route from payload configuration with defensive access
		// payload.config might not have routes defined, so we need to check carefully
		const adminRoute = payload?.config?.routes?.admin || "/admin";

		// Debug logging in development
		if (process.env.NODE_ENV === "development") {
			// TODO: Async logger needed
		// (await getLogger()).info("[PAYLOAD-FRONTEND] Payload initialized successfully");
			// TODO: Async logger needed
		// (await getLogger()).info("[PAYLOAD-FRONTEND] Config routes:", { data: payload?.config?.routes });
			// TODO: Async logger needed
		// (await getLogger()).info("[PAYLOAD-FRONTEND] Admin route:", { data: adminRoute });
		}

		return (
			<div className="home">
				<div className="content">
					<picture>
						<source srcSet="https://raw.githubusercontent.com/payloadcms/payload/main/packages/ui/src/assets/payload-favicon.svg" />
						<Image
							alt="Payload Logo"
							height={65}
							src="https://raw.githubusercontent.com/payloadcms/payload/main/packages/ui/src/assets/payload-favicon.svg"
							width={65}
						/>
					</picture>
					{!user && <h1>Welcome to your new project.</h1>}
					{user && <h1>Welcome back, {user.email}</h1>}
					<div className="links">
						<a
							className="admin"
							href={adminRoute}
							rel="noopener noreferrer"
							target="_blank"
						>
							Go to admin panel
						</a>
						<a
							className="docs"
							href="https://payloadcms.com/docs"
							rel="noopener noreferrer"
							target="_blank"
						>
							Documentation
						</a>
					</div>
				</div>
				<div className="footer">
					<p>Update this page by editing</p>
					<a className="codeLink" href={fileURL}>
						<code>app/(frontend)/page.tsx</code>
					</a>
				</div>
			</div>
		);
	} catch (error) {
		// TODO: Async logger needed
		// (await getLogger()).error("[PAYLOAD-FRONTEND] Error initializing Payload:", { data: error });

		const fileURL = `vscode://file/${fileURLToPath(import.meta.url)}`;

		// Fallback UI with minimal functionality
		return (
			<div className="home">
				<div className="content">
					<picture>
						<source srcSet="https://raw.githubusercontent.com/payloadcms/payload/main/packages/ui/src/assets/payload-favicon.svg" />
						<Image
							alt="Payload Logo"
							height={65}
							src="https://raw.githubusercontent.com/payloadcms/payload/main/packages/ui/src/assets/payload-favicon.svg"
							width={65}
						/>
					</picture>
					<h1>Payload CMS</h1>
					<p>
						There was an error initializing the CMS. Please check the console
						for details.
					</p>
					<div className="links">
						<a
							className="admin"
							href="/admin"
							rel="noopener noreferrer"
							target="_blank"
						>
							Go to admin panel
						</a>
						<a
							className="docs"
							href="https://payloadcms.com/docs"
							rel="noopener noreferrer"
							target="_blank"
						>
							Documentation
						</a>
					</div>
				</div>
				<div className="footer">
					<p>Error details available in console</p>
					<a className="codeLink" href={fileURL}>
						<code>app/(frontend)/page.tsx</code>
					</a>
				</div>
			</div>
		);
	}
}
