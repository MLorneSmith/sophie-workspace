import { createServiceLogger } from "@kit/shared/logger";
import { getSupabaseServerClient } from "@kit/supabase/server-client";

interface GenerateCertificateParams {
	userId: string;
	courseId: string;
	fullName: string;
}

// Initialize service logger for certificate generation
const { getLogger } = createServiceLogger("CERTIFICATE-SERVICE");

// UUID format validation regex
const UUID_REGEX =
	/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isValidUUID(value: string): boolean {
	return UUID_REGEX.test(value);
}

/**
 * Upload a PDF template to PDF.co and get a temporary URL for subsequent operations.
 *
 * PDF.co deprecated the inline `file` parameter for base64 data and now requires
 * a two-step process: upload first, then use the returned URL for API operations.
 *
 * @param templateBase64 - Base64-encoded PDF template
 * @param pdfCoApiKey - PDF.co API key
 * @returns Temporary URL for the uploaded file
 */
async function uploadPdfTemplate(
	templateBase64: string,
	pdfCoApiKey: string,
): Promise<string> {
	const { getLogger } = createServiceLogger("CERTIFICATE-SERVICE");
	const logger = await getLogger();

	logger.info("Uploading PDF template to PDF.co", {
		operation: "upload_template",
		templateSize: templateBase64.length,
	});

	const uploadResponse = await fetch(
		"https://api.pdf.co/v1/file/upload/base64",
		{
			method: "POST",
			headers: {
				"x-api-key": pdfCoApiKey,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				file: templateBase64,
			}),
		},
	);

	const uploadResult = await uploadResponse.json();

	if (uploadResult.error) {
		const errorMessage = `Failed to upload template: ${uploadResult.message || "Unknown error"}`;
		logger.error("PDF.co upload failed", {
			operation: "upload_template",
			error: errorMessage,
			status: uploadResponse.status,
		});
		throw new Error(errorMessage);
	}

	if (!uploadResult.url) {
		const errorMessage = "Upload succeeded but no URL returned from PDF.co API";
		logger.error("PDF.co upload response missing URL", {
			operation: "upload_template",
			response: uploadResult,
		});
		throw new Error(errorMessage);
	}

	logger.info("PDF template uploaded successfully", {
		operation: "upload_template",
		// Note: URL is temporary and safe to log
		urlReceived: true,
	});

	return uploadResult.url;
}

export async function generateCertificate({
	userId,
	courseId,
	fullName,
}: GenerateCertificateParams) {
	const logger = await getLogger();

	logger.info("Starting certificate generation", {
		operation: "generate_certificate",
		userId,
		courseId,
		fullName: `${fullName.substring(0, 10)}...`, // Partial name for privacy
	});

	// Validate that courseId is a valid UUID (not a slug)
	if (!isValidUUID(courseId)) {
		const error = new Error(
			`Invalid courseId format: expected UUID but received "${courseId}". This may indicate a slug was passed instead of a UUID.`,
		);
		logger.error("Invalid courseId format - expected UUID", {
			operation: "validate_courseId",
			courseId,
			userId,
			error,
		});
		throw error;
	}

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
	// In Next.js dev mode, process.cwd() is already apps/web, so we don't need to add it again
	const fs = require("node:fs");
	const path = require("node:path");
	const templatePath = path.join(
		process.cwd(),
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

	// Step 1: Upload the template to PDF.co to get a temporary URL
	// PDF.co deprecated inline base64 `file` parameter - now requires upload-first workflow
	const templateUrl = await uploadPdfTemplate(
		certificateTemplateBase64,
		pdfCoApiKey,
	);

	logger.info("Template uploaded, fetching field info", {
		operation: "field_info",
		userId,
		courseId,
	});

	// Step 2: Get field info using the uploaded template URL
	const fieldInfoResponse = await fetch(
		"https://api.pdf.co/v1/pdf/info/fields",
		{
			method: "POST",
			headers: {
				"x-api-key": pdfCoApiKey,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				// Use the uploaded template URL instead of inline base64
				url: templateUrl,
				async: false,
			}),
		},
	);

	const fieldInfo = await fieldInfoResponse.json();

	if (fieldInfo.error) {
		logger.error("Failed to get field info from PDF.co", {
			operation: "field_info",
			error: fieldInfo.message,
			status: fieldInfoResponse.status,
		});
		throw new Error(`Failed to get field info: ${fieldInfo.message}`);
	}

	logger.info("Field info retrieved successfully", {
		operation: "field_info",
		fieldsCount: fieldInfo.info?.FieldsInfo?.Fields?.length || 0,
	});

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

	// Step 3: Fill the form with the user's name using the uploaded template URL
	logger.info("Filling certificate form", {
		operation: "fill_form",
		userId,
		courseId,
		nameFieldName,
	});

	const fillFormResponse = await fetch("https://api.pdf.co/v1/pdf/edit/add", {
		method: "POST",
		headers: {
			"x-api-key": pdfCoApiKey,
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			// Use the uploaded template URL instead of inline base64
			url: templateUrl,
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
		logger.error("Failed to fill certificate form", {
			operation: "fill_form",
			error: fillFormResult.message,
			status: fillFormResponse.status,
		});
		throw new Error(`Failed to fill form: ${fillFormResult.message}`);
	}

	logger.info("Certificate form filled successfully", {
		operation: "fill_form",
		userId,
		courseId,
	});

	// 4. Download the filled form
	const certificateUrl = fillFormResult.url;
	const certificateResponse = await fetch(certificateUrl);
	const certificateBuffer = await certificateResponse.arrayBuffer();

	// 5. Store the certificate in Supabase Storage
	logger.info("Storing certificate in Supabase Storage", {
		operation: "store_certificate",
		userId,
		courseId,
	});

	const supabase = getSupabaseServerClient();
	const { data: buckets, error: bucketsError } =
		await supabase.storage.listBuckets();

	if (bucketsError) {
		logger.error("Failed to list storage buckets", {
			operation: "list_buckets",
			error: bucketsError,
		});
		throw new Error(`Failed to list buckets: ${bucketsError.message}`);
	}

	logger.info("Listed storage buckets", {
		operation: "list_buckets",
		bucketCount: buckets?.length || 0,
	});

	// Log all bucket names for debugging
	if (buckets && buckets.length > 0) {
		logger.debug("Available buckets", {
			operation: "list_buckets",
			buckets: buckets.map((b) => b.name),
		});
		for (const _bucket of buckets) {
			// Bucket processing would go here if needed
		}
	}

	const certificatesBucket = buckets?.find(
		(bucket) => bucket.name === "certificates",
	);

	if (!certificatesBucket) {
		logger.info("Certificates bucket not found, creating new bucket", {
			operation: "create_bucket",
		});

		// Try to create the bucket with multiple attempts if needed
		let createBucketError = null;
		let retryCount = 0;
		const maxRetries = 3;

		while (retryCount < maxRetries) {
			try {
				const { error } = await supabase.storage.createBucket("certificates", {
					public: true, // Make it public so we can access the files
					allowedMimeTypes: ["application/pdf"],
					fileSizeLimit: 10485760, // 10MB
				});

				if (error) {
					createBucketError = error;
					logger.error("Failed to create certificates bucket", {
						operation: "create_bucket",
						error,
						retryCount,
						maxRetries,
					});
					retryCount++;
					// Wait a bit before retrying
					await new Promise((resolve) => setTimeout(resolve, 1000));
				} else {
					logger.info("Certificates bucket created successfully", {
						operation: "create_bucket",
					});
					createBucketError = null;
					break;
				}
			} catch (error) {
				createBucketError = error;
				logger.error("Exception creating certificates bucket", {
					operation: "create_bucket",
					error,
					retryCount,
					maxRetries,
				});
				retryCount++;
				// Wait a bit before retrying
				await new Promise((resolve) => setTimeout(resolve, 1000));
			}
		}

		if (createBucketError) {
			logger.error("Failed to create certificates bucket after retries", {
				operation: "create_bucket",
				error: createBucketError,
				retries: maxRetries,
			});
			throw new Error(
				`Failed to create certificates bucket: ${(createBucketError as Error)?.message || String(createBucketError)}`,
			);
		}
	} else {
		logger.info("Using existing certificates bucket", {
			operation: "use_bucket",
		});
	}

	// Create a unique filename for the certificate
	const timestamp = Date.now();
	const fileName = `${userId}/${courseId}/${timestamp}.pdf`;
	logger.info("Uploading certificate file", {
		operation: "upload_certificate",
		fileName,
		userId,
		courseId,
	});
	const { error: uploadError } = await supabase.storage
		.from("certificates")
		.upload(fileName, certificateBuffer, {
			contentType: "application/pdf",
			upsert: true,
		});

	if (uploadError) {
		logger.error("Failed to upload certificate", {
			operation: "upload_certificate",
			error: uploadError,
			fileName,
		});
		throw new Error(`Failed to upload certificate: ${uploadError.message}`);
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
