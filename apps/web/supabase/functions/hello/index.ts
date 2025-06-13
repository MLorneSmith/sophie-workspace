/**
 * Basic Edge Function to keep Edge Runtime container healthy
 * This serves as a foundation for future Edge Function development
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (req) => {
	const { method } = req;

	// Handle CORS preflight requests
	if (method === "OPTIONS") {
		return new Response("ok", {
			headers: {
				"Access-Control-Allow-Origin": "*",
				"Access-Control-Allow-Headers":
					"authorization, x-client-info, apikey, content-type",
				"Access-Control-Allow-Methods": "POST, GET, OPTIONS, PUT, DELETE",
			},
		});
	}

	try {
		const data = {
			message: "Hello from Supabase Edge Functions!",
			timestamp: new Date().toISOString(),
			method,
			url: req.url,
		};

		return new Response(JSON.stringify(data), {
			headers: {
				"Content-Type": "application/json",
				"Access-Control-Allow-Origin": "*",
				"Access-Control-Allow-Headers":
					"authorization, x-client-info, apikey, content-type",
			},
		});
	} catch (error) {
		return new Response(JSON.stringify({ error: error.message }), {
			status: 500,
			headers: {
				"Content-Type": "application/json",
				"Access-Control-Allow-Origin": "*",
			},
		});
	}
});
