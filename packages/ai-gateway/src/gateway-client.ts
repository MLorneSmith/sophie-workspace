import OpenAI from "openai";

let openai: OpenAI;

if (process.env.BIFROST_GATEWAY_URL) {
	// Route through Bifrost gateway with Cloudflare Access authentication
	openai = new OpenAI({
		apiKey: "",
		baseURL: process.env.BIFROST_GATEWAY_URL,
		defaultHeaders: {
			"CF-Access-Client-Id": process.env.BIFROST_CF_ACCESS_CLIENT_ID || "",
			"CF-Access-Client-Secret":
				process.env.BIFROST_CF_ACCESS_CLIENT_SECRET || "",
		},
	});
} else if (process.env.OPENAI_API_KEY) {
	// Direct OpenAI fallback
	openai = new OpenAI({
		apiKey: process.env.OPENAI_API_KEY,
	});
} else {
	throw new Error("BIFROST_GATEWAY_URL or OPENAI_API_KEY must be set");
}

export default openai;
