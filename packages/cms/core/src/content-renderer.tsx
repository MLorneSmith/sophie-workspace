import type { CmsType } from "@kit/cms-types";

import { createServiceLogger } from "@kit/shared/logger";

// Initialize service logger
const { getLogger } = createServiceLogger("CMS-PAYLOAD");

const CMS_CLIENT = process.env.CMS_CLIENT as CmsType;

interface ContentRendererProps {
	content: unknown;
	type?: CmsType;
}

export async function ContentRenderer({
	content,
	type = CMS_CLIENT,
}: ContentRendererProps) {
	const Renderer = await getContentRenderer(type);

	return Renderer ? <Renderer content={content} /> : null;
}

/**
 * Gets the content renderer for the specified CMS client.
 *
 * @param {CmsType} type - The type of CMS client.
 */
async function getContentRenderer(type: CmsType) {
	switch (type) {
		case "payload": {
			const { PayloadContentRenderer } = await import("@kit/payload/renderer");

			return PayloadContentRenderer;
		}

		default: {
			(await getLogger()).error(`Unknown CMS client: ${type as string}`);

			return null;
		}
	}
}
