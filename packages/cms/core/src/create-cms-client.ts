import type { CmsClient, CmsType } from "@kit/cms-types";
import { createRegistry } from "@kit/shared/registry";

/**
 * The type of CMS client to use.
 */
const CMS_CLIENT = process.env.CMS_CLIENT as CmsType;

// Create a registry for CMS client implementations
const cmsRegistry = createRegistry<CmsClient, CmsType>();

// Register the Payload CMS client implementation
cmsRegistry.register("payload", async () => {
	const { createPayloadClient } = await import("@kit/payload");
	return createPayloadClient();
});

/**
 * Creates a CMS client based on the specified type.
 *
 * @param {CmsType} type - The type of CMS client to create. Defaults to the value of the CMS_CLIENT environment variable.
 * @returns {Promise<CmsClient>} A Promise that resolves to the created CMS client.
 * @throws {Error} If the specified CMS type is unknown.
 */
export async function createCmsClient(type: CmsType = CMS_CLIENT) {
	return cmsRegistry.get(type);
}
