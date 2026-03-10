"use server";

import { randomUUID } from "node:crypto";

import { enhanceAction } from "@kit/next/actions";
import { getLogger } from "@kit/shared/logger";
import { getSupabaseServerClient } from "@kit/supabase/server-client";
import { z } from "zod";

import type { Database } from "~/lib/database.types";
import { createMaterial } from "../../../_lib/server/materials.service";

const BUCKET_NAME = "deck_uploads";
const ALLOWED_MIME_TYPES = [
	"application/vnd.openxmlformats-officedocument.presentationml.presentation",
	"application/pdf",
];
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

const UploadDeckSchema = z.object({
	file: z.instanceof(File),
	presentationId: z.string().min(1),
});

export const uploadDeckAction = enhanceAction(
	async (data, user) => {
		const client = getSupabaseServerClient<Database>();
		const logger = await getLogger();
		const ctx = {
			name: "uploadDeckAction",
			presentationId: data.presentationId,
			userId: user.id,
		};

		// Validate file type
		if (!ALLOWED_MIME_TYPES.includes(data.file.type)) {
			throw new Error(
				"Invalid file type. Only PPTX and PDF files are allowed.",
			);
		}

		// Validate file size
		if (data.file.size > MAX_FILE_SIZE) {
			throw new Error("File size too large. Maximum size is 50MB.");
		}

		// Get presentation to verify access and fetch account_id
		const { data: presentation, error: presentationError } = await client
			.from("presentations")
			.select("id, account_id, user_id")
			.eq("id", data.presentationId)
			.maybeSingle();

		if (presentationError) {
			logger.error(ctx, "Failed to load presentation: %o", presentationError);
			throw presentationError;
		}

		if (!presentation) {
			throw new Error("Presentation not found");
		}

		const accountId = presentation.account_id;

		// Generate file path: {userId}/{presentationId}/{uuid}.{ext}
		const fileExt = data.file.name.split(".").pop() ?? "pptx";
		const fileName = `${user.id}/${data.presentationId}/${randomUUID()}.${fileExt}`;

		// Upload to storage
		const { error: uploadError } = await client.storage
			.from(BUCKET_NAME)
			.upload(fileName, data.file, {
				upsert: false,
				contentType: data.file.type,
			});

		if (uploadError) {
			logger.error(ctx, "Failed to upload deck: %o", uploadError);
			throw new Error("Failed to upload file");
		}

		// Create signed URL for the file (bucket is private)
		const { data: signedData, error: signedError } = await client.storage
			.from(BUCKET_NAME)
			.createSignedUrl(fileName, 60 * 60 * 24 * 7); // 7 days TTL

		if (signedError || !signedData) {
			logger.error(ctx, "Failed to create signed URL: %o", signedError);
			throw new Error("Failed to create signed URL");
		}

		// Create material record
		const material = await createMaterial(client, {
			presentationId: data.presentationId,
			userId: user.id,
			accountId,
			type: "upload",
			name: data.file.name,
			mimeType: data.file.type,
			fileUrl: signedData.signedUrl,
		});

		logger.info(ctx, "Deck uploaded successfully: %s", material.id);

		return {
			success: true,
			materialId: material.id,
			storageUrl: signedData.signedUrl,
			fileName: data.file.name,
		};
	},
	{
		schema: UploadDeckSchema,
		auth: true,
	},
);
