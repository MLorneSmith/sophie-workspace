"use server";

import { enhanceAction } from "@kit/next/actions";
import { getLogger } from "@kit/shared/logger";
import { getSupabaseServerClient } from "@kit/supabase/server-client";
import { z } from "zod";

import type { Database } from "~/lib/database.types";
import { deleteMaterial } from "../../../_lib/server/materials.service";

const DeleteMaterialSchema = z.object({
	materialId: z.string().min(1),
});

const BUCKET_NAME = "deck_uploads";

export const deleteMaterialAction = enhanceAction(
	async (data, user) => {
		const client = getSupabaseServerClient<Database>();
		const logger = await getLogger();
		const ctx = {
			name: "deleteMaterialAction",
			materialId: data.materialId,
			userId: user.id,
		};

		// Delete the material record first
		const result = await deleteMaterial(client, data.materialId, user.id);

		if (!result.success || !result.material) {
			return { success: false, error: "Material not found" };
		}

		const { file_url: fileUrl, type } = result.material;

		// If it's an upload type and has a file URL, clean up storage
		if (type === "upload" && fileUrl) {
			try {
				// Extract the storage path from the signed URL
				const url = new URL(fileUrl);
				const pathParts = url.pathname.split("/");
				// Remove the bucket name (first part) and get the rest
				const storagePath = pathParts.slice(1).join("/");

				const { error: storageError } = await client.storage
					.from(BUCKET_NAME)
					.remove([storagePath]);

				if (storageError) {
					// Log but don't fail - DB record is already deleted
					logger.warn(ctx, "Failed to delete storage file: %o", storageError);
				}
			} catch (error) {
				// Log but don't fail - DB record is already deleted
				logger.warn(ctx, "Error parsing file URL for deletion: %o", error);
			}
		}

		logger.info(ctx, "Material deleted successfully");

		return { success: true };
	},
	{
		schema: DeleteMaterialSchema,
		auth: true,
	},
);
