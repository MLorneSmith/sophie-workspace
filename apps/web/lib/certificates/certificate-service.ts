import { getSupabaseServerClient } from "@kit/supabase/server-client";
import { createServiceLogger } from "@kit/shared/logger";

interface GenerateCertificateParams {
	userId: string;
	courseId: string;
	fullName: string;
}

// Initialize service logger for certificate generation
const { getLogger, getRequestLogger } = createServiceLogger(
	"CERTIFICATE-SERVICE",
);

export async function generateCertificate({
	userId,
	courseId,
	fullName,
}: GenerateCertificateParams) {
	const logger = await getLogger();

	logger.info("Starting certificate generation", { arg1: {
		operation: "generate_certificate", arg2: userId, arg3: courseId, arg4: fullName: fullName.substring(0, arg5: 10 }) + "...", // Partial name for privacy
	});

	// 1. Get PDF.co API key from environment variables
	const pdfCoApiKey = process.env.PDF_CO_API_KEY;

	if (!pdfCoApiKey) {
		const error = new Error(
			"PDF_CO_API_KEY is not defined in environment variables",
		);
		logger.error("Missing PDF.co API key configuration", {
			operation: "config_check",
			error,
		});
		throw error;
	}

	// 2. Get the field names from the certificate form
	logger.debug("Getting field names from certificate form");

	// Use the correct path to the certificate template
	const fs = require("node:fs");
	const path = require("node:path");
	const appDir = path.join(process.cwd(), "apps", "web");
	const templatePath = path.join(
		appDir,
		"lib",
		"certificates",
		"templates",
		"ddm_certificate_form.pdf",
	);

	logger.debug("Certificate template path resolved", {
		operation: "template_path",
		templatePath,
	});

	// Check if the file exists
	if (!fs.existsSync(templatePath)) {
		const error = new Error(
			`Certificate template file not found at path: ${templatePath}`,
		);
		logger.error("Certificate template file not found", {
			operation: "template_check",
			templatePath,
			error,
		});
		throw error;
	}

	// Read the certificate template
	const certificateTemplate = fs.readFileSync(templatePath);
	const certificateTemplateBase64 =
		Buffer.from(certificateTemplate).toString("base64");

	const fieldInfoResponse = await fetch(
		"https://api.pdf.co/v1/pdf/info/fields",
		{
			method: "POST",
			headers: {
				"x-api-key": pdfCoApiKey,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				// Use the base64-encoded template
				file: certificateTemplateBase64,
				async: false,
			}),
		},
	);

	const fieldInfo = await fieldInfoResponse.json();

	if (fieldInfo.error) {
		throw new Error(`Failed to get field info: ${fieldInfo.message}`);
	}

	// Extract the field name for the name field
	// This assumes the field name is something like "name" or "fullName"
	// We'll need to inspect the actual field name from the response
	let nameFieldName = "";
	if (fieldInfo.info?.FieldsInfo?.Fields) {
		const fields = fieldInfo.info.FieldsInfo.Fields;
		// Look for a field that might be for the name
		type FieldInfo = {
			FieldName: string;
			Type: string;
		};
		const nameField = fields.find(
			(field: FieldInfo) =>
				field.FieldName.toLowerCase().includes("name") ||
				field.Type === "EditBox",
		);

		if (nameField) {
			nameFieldName = nameField.FieldName;
		} else if (fields.length > 0) {
			// If we can't find a name field, use the first field
			nameFieldName = fields[0].FieldName;
		} else {
			throw new Error("No fields found in the certificate form");
		}
	} else {
		throw new Error("Failed to get field info: Invalid response format");
	}

	// 3. Fill the form with the user's name
	/* TODO: Async logger needed */ logger.info("Filling form with user name:", { data: fullName });
	/* TODO: Async logger needed */ logger.info("Using field name:", { data: nameFieldName });

	const fillFormResponse = await fetch("https://api.pdf.co/v1/pdf/edit/add", {
		method: "POST",
		headers: {
			"x-api-key": pdfCoApiKey,
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			// Use the same base64-encoded template
			file: certificateTemplateBase64,
			name: `certificate-${userId}-${courseId}.pdf`,
			async: false,
			fields: [
				{
					fieldName: nameFieldName,
					pages: "0",
					text: fullName,
				},
			],
		}),
	});

	const fillFormResult = await fillFormResponse.json();

	if (fillFormResult.error) {
		throw new Error(`Failed to fill form: ${fillFormResult.message}`);
	}

	// 4. Download the filled form
	const certificateUrl = fillFormResult.url;
	const certificateResponse = await fetch(certificateUrl);
	const certificateBuffer = await certificateResponse.arrayBuffer();

	// 5. Store the certificate in Supabase Storage
	/* TODO: Async logger needed */ logger.info("Starting certificate storage process");
	/* TODO: Async logger needed */ logger.info("User ID:", { data: userId });
	/* TODO: Async logger needed */ logger.info("Course ID:", { data: courseId });

	const supabase = getSupabaseServerClient();

	// Check if the certificates bucket exists, create it if it doesn't
	/* TODO: Async logger needed */ logger.info("Checking if certificates bucket exists");

	try {
		const { data: buckets, error: bucketsError } =
			await supabase.storage.listBuckets();

		if (bucketsError) {
			/* TODO: Async logger needed */ logger.error("Failed to list buckets:", { data: bucketsError.message });
			throw new Error(`Failed to list buckets: ${bucketsError.message}`);
		}

		/* TODO: Async logger needed */ logger.info(`Found ${buckets?.length || 0} buckets`);

		// Log all bucket names for debugging
		if (buckets && buckets.length > 0) {
			/* TODO: Async logger needed */ logger.info("Existing buckets:");
			for (const bucket of buckets) {
				/* TODO: Async logger needed */ logger.info(`- ${bucket.name}`);
			}
		}

		const certificatesBucket = buckets?.find(
			(bucket) => bucket.name === "certificates",
		);

		if (!certificatesBucket) {
			/* TODO: Async logger needed */ logger.info("Certificates bucket does not exist, { data: creating it" });

			// Try to create the bucket with multiple attempts if needed
			let createBucketError = null;
			let retryCount = 0;
			const maxRetries = 3;

			while (retryCount < maxRetries) {
				try {
					const { error } = await supabase.storage.createBucket(
						"certificates",
						{
							public: true, // Make it public so we can access the files
							allowedMimeTypes: ["application/pdf"],
							fileSizeLimit: 10485760, // 10MB
						},
					);

					if (error) {
						createBucketError = error;
						/* TODO: Async logger needed */ logger.error(`Attempt ${retryCount + 1}: Failed to create certificates bucket:`, { arg1: error.message, arg2:  });
						retryCount++;
						// Wait a bit before retrying
						await new Promise((resolve) => setTimeout(resolve, 1000));
					} else {
						/* TODO: Async logger needed */ logger.info("Created certificates bucket successfully");
						createBucketError = null;
						break;
					}
				} catch (error) {
					createBucketError = error;
					/* TODO: Async logger needed */ logger.error(`Attempt ${retryCount + 1}: Exception creating certificates bucket:`, { arg1: error, arg2:  });
					retryCount++;
					// Wait a bit before retrying
					await new Promise((resolve) => setTimeout(resolve, 1000));
				}
			}

			if (createBucketError) {
				/* TODO: Async logger needed */ logger.error("Failed to create certificates bucket after multiple attempts:", { arg1: createBucketError, arg2:  });
				throw new Error(
					`Failed to create certificates bucket: ${(createBucketError as Error)?.message || String(createBucketError)}`,
				);
			}
		} else {
			/* TODO: Async logger needed */ logger.info("Certificates bucket already exists");
		}
	} catch (error) {
		/* TODO: Async logger needed */ logger.error("Error in bucket creation process:", { data: error });
		throw error;
	}

	// Create a unique filename for the certificate
	const timestamp = Date.now();
	const fileName = `${userId}/${courseId}/${timestamp}.pdf`;
	/* TODO: Async logger needed */ logger.info("Certificate file path:", { data: fileName });

	try {
		/* TODO: Async logger needed */ logger.info("Uploading certificate to Supabase Storage");
		const { error: uploadError } = await supabase.storage
			.from("certificates")
			.upload(fileName, certificateBuffer, {
				contentType: "application/pdf",
				upsert: true,
			});

		if (uploadError) {
			/* TODO: Async logger needed */ logger.error("Failed to upload certificate:", { data: uploadError.message });
			throw new Error(`Failed to upload certificate: ${uploadError.message}`);
		}

		/* TODO: Async logger needed */ logger.info("Certificate uploaded successfully");
	} catch (error) {
		/* TODO: Async logger needed */ logger.error("Error in certificate upload process:", { data: error });
		throw error;
	}

	// 6. Get the public URL for the certificate
	const { data: urlData } = await supabase.storage
		.from("certificates")
		.getPublicUrl(fileName);

	// 7. Store the certificate information in the database
	// Using raw SQL query since the certificates table might not be in the TypeScript types yet
	const { data: certificateData, error: certificateError } = await supabase.rpc(
		"insert_certificate",
		{
			p_user_id: userId,
			p_course_id: courseId,
			p_file_path: fileName,
		},
	);

	if (certificateError) {
		throw new Error(
			`Failed to store certificate information: ${certificateError.message}`,
		);
	}

	// Get the certificate ID from the returned data
	const certificateId =
		Array.isArray(certificateData) && certificateData.length > 0
			? certificateData[0]?.id
			: null;

	// 8. Update the course_progress table to mark the certificate as generated
	const { error: updateError } = await supabase
		.from("course_progress")
		.update({ certificate_generated: true })
		.eq("user_id", userId)
		.eq("course_id", courseId);

	if (updateError) {
		throw new Error(`Failed to update course progress: ${updateError.message}`);
	}

	return {
		certificateId: certificateId,
		certificateUrl: urlData.publicUrl,
	};
}
