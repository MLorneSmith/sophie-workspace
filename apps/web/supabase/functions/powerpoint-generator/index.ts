/**
 * Supabase Edge Function for PowerPoint generation
 * Handles heavy file processing with optimized memory management
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// CORS headers for cross-origin requests
const corsHeaders = {
	"Access-Control-Allow-Origin": "*",
	"Access-Control-Allow-Headers":
		"authorization, x-client-info, apikey, content-type",
	"Access-Control-Allow-Methods": "POST, GET, OPTIONS, PUT, DELETE",
};

interface StoryboardData {
	title: string;
	slides: Array<{
		order: number;
		title: string;
		layoutId: string;
		content: Array<{
			type: string;
			text?: string;
			columnIndex: number;
			chartType?: string;
			chartData?: unknown;
			imageUrl?: string;
			tableData?: unknown;
			formatting?: unknown;
		}>;
	}>;
}

interface PowerPointRequest {
	storyboard: StoryboardData;
	userId: string;
}

// Authentication helper
async function getAuthenticatedClient(req: Request) {
	const authHeader = req.headers.get("Authorization");
	if (!authHeader) {
		throw new Error("Missing authorization header");
	}

	const supabaseUrl = Deno.env.get("SUPABASE_URL");
	const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY");

	if (!supabaseUrl || !supabaseKey) {
		throw new Error("Missing Supabase environment variables");
	}

	const supabase = createClient(supabaseUrl, supabaseKey, {
		global: {
			headers: { Authorization: authHeader },
		},
	});

	// Verify the user is authenticated
	const {
		data: { user },
		error,
	} = await supabase.auth.getUser();
	if (error || !user) {
		throw new Error("Invalid authentication");
	}

	return { supabase, user };
}

// Simplified PowerPoint generation for edge environment
async function generatePowerPointBuffer(
	storyboard: StoryboardData,
): Promise<Uint8Array> {
	// NOTE: This is a simplified implementation for demonstration
	// In production, you would need to implement the full PowerPoint generation logic
	// using a Deno-compatible library or port the existing PPTXGenJS logic

	// For now, create a simple JSON representation that could be processed
	const powerPointData = {
		title: storyboard.title,
		slideCount: storyboard.slides.length,
		slides: storyboard.slides.map((slide) => ({
			title: slide.title,
			layout: slide.layoutId,
			contentItems: slide.content.length,
		})),
		generatedAt: new Date().toISOString(),
		platform: "supabase-edge-function",
	};

	// Convert to buffer (in production, this would be actual PPTX binary data)
	const jsonString = JSON.stringify(powerPointData, null, 2);
	return new TextEncoder().encode(jsonString);
}

serve(async (req) => {
	// Handle CORS preflight requests
	if (req.method === "OPTIONS") {
		return new Response("ok", { headers: corsHeaders });
	}

	try {
		const startTime = performance.now();

		// Authenticate the request
		const { supabase, user } = await getAuthenticatedClient(req);

		// Parse request body
		const requestData: PowerPointRequest = await req.json();
		const { storyboard, userId } = requestData;

		// Verify user ID matches authenticated user
		if (userId !== user.id) {
			return new Response(JSON.stringify({ error: "User ID mismatch" }), {
				status: 403,
				headers: { ...corsHeaders, "Content-Type": "application/json" },
			});
		}

		// PowerPoint generation started

		// Generate PowerPoint buffer
		const buffer = await generatePowerPointBuffer(storyboard);

		// Create unique filename
		const timestamp = Date.now();
		const fileName = `presentations/${userId}/${timestamp}-${storyboard.title.replace(/[^a-zA-Z0-9]/g, "-")}.json`;

		// PowerPoint buffer generated

		// Upload to Supabase Storage
		const { data: uploadData, error: uploadError } = await supabase.storage
			.from("presentations")
			.upload(fileName, buffer, {
				contentType: "application/json", // In production: 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
				upsert: true,
			});

		if (uploadError) {
			// Upload failed
			return new Response(
				JSON.stringify({ error: `Upload failed: ${uploadError.message}` }),
				{
					status: 500,
					headers: { ...corsHeaders, "Content-Type": "application/json" },
				},
			);
		}

		// Get public URL
		const { data: urlData } = supabase.storage
			.from("presentations")
			.getPublicUrl(fileName);

		// Record generation in database
		const { data: record, error: dbError } = await supabase
			.from("generated_presentations")
			.insert({
				user_id: userId,
				file_path: uploadData.path,
				storyboard_title: storyboard.title,
				slide_count: storyboard.slides.length,
				status: "completed",
				generated_at: new Date().toISOString(),
			})
			.select()
			.single();

		if (dbError) {
			// Database record creation failed
			// Continue anyway since file was uploaded successfully
		}

		const duration = performance.now() - startTime;

		// PowerPoint generation completed

		return new Response(
			JSON.stringify({
				success: true,
				fileUrl: urlData.publicUrl,
				fileName: uploadData.path,
				recordId: record?.id,
				metadata: {
					duration,
					runtime: "supabase-edge-function",
					slideCount: storyboard.slides.length,
				},
			}),
			{
				headers: {
					...corsHeaders,
					"Content-Type": "application/json",
				},
			},
		);
	} catch (error) {
		// PowerPoint generation error

		return new Response(
			JSON.stringify({
				error: error instanceof Error ? error.message : "Unknown error",
				success: false,
			}),
			{
				status: 500,
				headers: {
					...corsHeaders,
					"Content-Type": "application/json",
				},
			},
		);
	}
});
